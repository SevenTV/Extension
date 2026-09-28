import assert from "node:assert/strict";
import test from "node:test";
import { compareReports, parseSafariProcesses, percentile, summarizeSamples } from "./performance/safari-resource-benchmark.mjs";
import { parseLiveArgs } from "./live-safari-smoke.mjs";

test("live Safari options accept Twitch and Kick but reject unrelated navigation", () => {
	assert.throws(() => parseLiveArgs(["--url", "https://example.com"]), /supports only Twitch or Kick/);
	assert.equal(parseLiveArgs(["--url", "https://kick.com/xqc"]).url, "https://kick.com/xqc");
	assert.throws(() => parseLiveArgs(["--reloads", "101"]));
	assert.equal(parseLiveArgs(["--reloads", "20"]).reloads, 20);
});

test("Safari process samples include Safari and WebKit only", () => {
	const processes = parseSafariProcesses(`
101 1 12.5 102400 /Applications/Safari.app/Contents/MacOS/Safari
102 101 4.0 51200 /System/Library/Frameworks/WebKit.framework/com.apple.WebKit.WebContent
999 1 99.0 99999 /Applications/Other.app/Contents/MacOS/Other
`, new Set([102]));
	assert.equal(processes.length, 2);
	assert.equal(processes.reduce((sum, process) => sum + process.cpuPercent, 0), 16.5);
});

test("resource summary and percentiles are deterministic", () => {
	const samples = [
		{ timestampMs: 0, cpuPercent: 1, rssMB: 100, processCount: 2 },
		{ timestampMs: 1_800_000, cpuPercent: 3, rssMB: 110, processCount: 3 },
		{ timestampMs: 3_600_000, cpuPercent: 8, rssMB: 120, processCount: 4 },
	];
	assert.equal(percentile([8, 1, 3], 0.95), 8);
	assert.deepEqual(summarizeSamples(samples), {
		sampleCount: 3,
		cpuMeanPercent: 4,
		cpuP95Percent: 8,
		rssMeanMB: 110,
		rssP95MB: 120,
		rssStartMB: 100,
		rssEndMB: 120,
		rssSlopeMBPerHour: 20,
		processCountMax: 4,
	});
});

test("A/B comparison refuses different test conditions", () => {
	const base = {
		label: "disabled",
		conditions: { url: "https://www.twitch.tv/illojuan", videoQuality: "1080p", brightness: "50", durationSeconds: 900, intervalSeconds: 5 },
		battery: { start: { percent: 90 }, end: { percent: 85 } },
		summary: { cpuMeanPercent: 10, cpuP95Percent: 20, rssMeanMB: 500, rssP95MB: 600, rssSlopeMBPerHour: 5 },
	};
	const enabled = structuredClone(base);
	enabled.label = "enabled";
	enabled.conditions.videoQuality = "720p";
	assert.throws(() => compareReports(base, enabled), /Condition differs: videoQuality/);
});
