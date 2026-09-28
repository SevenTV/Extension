#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { delay } from "../support/webdriver-client.mjs";

export function percentile(values, fraction) {
	assert.ok(values.length > 0);
	const sorted = [...values].sort((a, b) => a - b);
	return sorted[Math.ceil(fraction * sorted.length) - 1];
}

export function summarizeSamples(samples) {
	assert.ok(samples.length > 0, "At least one sample is required");
	const cpu = samples.map((sample) => sample.cpuPercent);
	const rss = samples.map((sample) => sample.rssMB);
	const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
	const hours = Math.max((samples.at(-1).timestampMs - samples[0].timestampMs) / 3_600_000, 1 / 3_600_000);
	return {
		sampleCount: samples.length,
		cpuMeanPercent: mean(cpu),
		cpuP95Percent: percentile(cpu, 0.95),
		rssMeanMB: mean(rss),
		rssP95MB: percentile(rss, 0.95),
		rssStartMB: rss[0],
		rssEndMB: rss.at(-1),
		rssSlopeMBPerHour: (rss.at(-1) - rss[0]) / hours,
		processCountMax: Math.max(...samples.map((sample) => sample.processCount)),
	};
}

export function parseSafariProcesses(text, attributedWebKitPids = new Set()) {
	return text
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean)
		.map((line) => {
			const match = line.match(/^(\d+)\s+(\d+)\s+([\d.]+)\s+(\d+)\s+(.+)$/);
			if (!match) return null;
			return {
				pid: Number(match[1]),
				ppid: Number(match[2]),
				cpuPercent: Number(match[3]),
				rssKB: Number(match[4]),
				command: match[5],
			};
		})
		.filter(
			(process) =>
				process &&
				(/Safari(?:\.app|Shared|SafeBrowsing|PlatformSupport)/.test(process.command) ||
					attributedWebKitPids.has(process.pid)),
		);
}

function attributedWebKitPids(text) {
	const candidates = text
		.split("\n")
		.map((line) => line.trim().match(/^(\d+)\s+\d+\s+[\d.]+\s+\d+\s+(.+)$/))
		.filter((match) => match && /com\.apple\.WebKit/.test(match[2]));
	const pids = new Set();
	for (const match of candidates) {
		const pid = Number(match[1]);
		try {
			const files = execFileSync("lsof", ["-p", String(pid), "-Fn"], {
				encoding: "utf8",
				stdio: ["ignore", "pipe", "ignore"],
			});
			if (/\/Library\/Containers\/com\.apple\.Safari\//.test(files)) pids.add(pid);
		} catch {
			// The process may exit between ps and lsof. The next sample will rediscover it.
		}
	}
	return pids;
}

function batterySnapshot() {
	const raw = execFileSync("pmset", ["-g", "batt"], { encoding: "utf8" });
	return {
		percent: Number(raw.match(/(\d+)%/)?.[1] ?? NaN),
		powerSource: raw.match(/Now drawing from '([^']+)'/)?.[1] ?? "unknown",
		raw: raw.trim(),
	};
}

function resourceSample() {
	const raw = execFileSync("ps", ["-axo", "pid=,ppid=,%cpu=,rss=,comm="], { encoding: "utf8" });
	const processes = parseSafariProcesses(raw, attributedWebKitPids(raw));
	return {
		timestampMs: Date.now(),
		cpuPercent: processes.reduce((sum, process) => sum + process.cpuPercent, 0),
		rssMB: processes.reduce((sum, process) => sum + process.rssKB, 0) / 1024,
		processCount: processes.length,
	};
}

function valueAfter(argv, name, fallback) {
	const index = argv.indexOf(name);
	return index === -1 ? fallback : argv[index + 1];
}

async function sampleCommand(argv) {
	assert.equal(process.platform, "darwin", "Safari benchmarks require macOS");
	const label = valueAfter(argv, "--label");
	const output = valueAfter(argv, "--output");
	const durationSeconds = Number(valueAfter(argv, "--duration", "900"));
	const intervalSeconds = Number(valueAfter(argv, "--interval", "5"));
	const url = valueAfter(argv, "--url", "https://www.twitch.tv/illojuan");
	const videoQuality = valueAfter(argv, "--video-quality", "document-me");
	const brightness = valueAfter(argv, "--brightness", "document-me");
	assert.ok(["disabled", "enabled"].includes(label), "--label must be disabled or enabled");
	assert.ok(output, "--output is required");
	assert.ok(durationSeconds >= intervalSeconds && intervalSeconds >= 1);
	const startedBattery = batterySnapshot();
	const samples = [];
	const deadline = Date.now() + durationSeconds * 1_000;
	while (Date.now() <= deadline) {
		samples.push(resourceSample());
		if (Date.now() + intervalSeconds * 1_000 > deadline) break;
		await delay(intervalSeconds * 1_000);
	}
	const endedBattery = batterySnapshot();
	const report = {
		schemaVersion: 1,
		label,
		createdAt: new Date().toISOString(),
		conditions: { url, videoQuality, brightness, durationSeconds, intervalSeconds },
		battery: { start: startedBattery, end: endedBattery },
		summary: summarizeSamples(samples),
		samples,
	};
	mkdirSync(dirname(resolve(output)), { recursive: true });
	writeFileSync(resolve(output), `${JSON.stringify(report, null, 2)}\n`);
	console.log(JSON.stringify(report.summary, null, 2));
}

export function compareReports(disabled, enabled) {
	for (const field of ["url", "videoQuality", "brightness", "durationSeconds", "intervalSeconds"]) {
		assert.deepEqual(enabled.conditions[field], disabled.conditions[field], `Condition differs: ${field}`);
	}
	const delta = (after, before) => after - before;
	return {
		cpuMeanDeltaPercentPoints: delta(enabled.summary.cpuMeanPercent, disabled.summary.cpuMeanPercent),
		cpuP95DeltaPercentPoints: delta(enabled.summary.cpuP95Percent, disabled.summary.cpuP95Percent),
		rssMeanDeltaMB: delta(enabled.summary.rssMeanMB, disabled.summary.rssMeanMB),
		rssP95DeltaMB: delta(enabled.summary.rssP95MB, disabled.summary.rssP95MB),
		rssSlopeDeltaMBPerHour: delta(
			enabled.summary.rssSlopeMBPerHour,
			disabled.summary.rssSlopeMBPerHour,
		),
		batteryDeltaPercentagePoints: delta(
			disabled.battery.start.percent - disabled.battery.end.percent,
			enabled.battery.start.percent - enabled.battery.end.percent,
		) * -1,
	};
}

function compareCommand(argv) {
	const disabledPath = valueAfter(argv, "--disabled");
	const enabledPath = valueAfter(argv, "--enabled");
	const output = valueAfter(argv, "--output", "test-results/safari-benchmark/comparison.json");
	assert.ok(disabledPath && enabledPath, "--disabled and --enabled are required");
	const disabled = JSON.parse(readFileSync(resolve(disabledPath), "utf8"));
	const enabled = JSON.parse(readFileSync(resolve(enabledPath), "utf8"));
	assert.equal(disabled.label, "disabled");
	assert.equal(enabled.label, "enabled");
	const comparison = compareReports(disabled, enabled);
	const limits = {
		cpuMeanDeltaPercentPoints: Number(valueAfter(argv, "--max-cpu-mean-delta", "Infinity")),
		rssMeanDeltaMB: Number(valueAfter(argv, "--max-rss-mean-delta", "Infinity")),
		rssSlopeDeltaMBPerHour: Number(valueAfter(argv, "--max-rss-slope-delta", "Infinity")),
	};
	const violations = Object.entries(limits)
		.filter(([, limit]) => Number.isFinite(limit))
		.filter(([metric, limit]) => comparison[metric] > limit)
		.map(([metric, limit]) => ({ metric, actual: comparison[metric], limit }));
	const report = { status: violations.length ? "failed" : "passed", comparison, limits, violations };
	mkdirSync(dirname(resolve(output)), { recursive: true });
	writeFileSync(resolve(output), `${JSON.stringify(report, null, 2)}\n`);
	console.log(JSON.stringify(report, null, 2));
	if (violations.length) process.exitCode = 2;
}

async function main() {
	const [command, ...argv] = process.argv.slice(2);
	if (command === "sample") await sampleCommand(argv);
	else if (command === "compare") compareCommand(argv);
	else {
		throw new Error(
			"Usage: safari-resource-benchmark.mjs sample --label disabled|enabled --output FILE [conditions]\n" +
				"   or: safari-resource-benchmark.mjs compare --disabled FILE --enabled FILE [limits]",
		);
	}
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
	main().catch((error) => {
		console.error(error.stack ?? error.message);
		process.exitCode = 1;
	});
}
