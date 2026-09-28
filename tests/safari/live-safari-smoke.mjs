#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { startSafariDriver, waitForCondition } from "./support/webdriver-client.mjs";

const installedApp = "/Applications/7TV for Safari.app";

export function parseLiveArgs(argv) {
	const options = {
		check: false,
		url: process.env.SEVENTV_TWITCH_URL ?? "https://www.twitch.tv/illojuan",
		reloads: Number(process.env.SEVENTV_RELOADS ?? 2),
		timeoutSeconds: Number(process.env.SEVENTV_TIMEOUT_SECONDS ?? 45),
		artifacts: process.env.SEVENTV_ARTIFACTS ?? "test-results/safari-live",
	};
	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (arg === "--check") options.check = true;
		else if (arg === "--url") options.url = argv[++i];
		else if (arg === "--reloads") options.reloads = Number(argv[++i]);
		else if (arg === "--timeout") options.timeoutSeconds = Number(argv[++i]);
		else if (arg === "--artifacts") options.artifacts = argv[++i];
		else throw new Error(`Unknown argument: ${arg}`);
	}
	const url = new URL(options.url);
	assert.equal(url.protocol, "https:", "The live test requires HTTPS");
	assert.ok(
		["twitch.tv", "kick.com"].some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`)),
		"The emote-menu test supports only Twitch or Kick URLs",
	);
	assert.ok(Number.isInteger(options.reloads) && options.reloads >= 0 && options.reloads <= 100);
	assert.ok(Number.isFinite(options.timeoutSeconds) && options.timeoutSeconds >= 5);
	return options;
}

export function checkLivePrerequisites() {
	assert.equal(process.platform, "darwin", "The real Safari test must run on macOS");
	assert.ok(existsSync("/usr/bin/safaridriver"), "safaridriver is missing");
	assert.ok(existsSync(installedApp), `${installedApp} is not installed`);
	execFileSync("codesign", ["--verify", "--deep", "--strict", installedApp], { stdio: "pipe" });
	return {
		platform: process.platform,
		safaridriver: execFileSync("/usr/bin/safaridriver", ["--version"], { encoding: "utf8" }).trim(),
		installedApp,
		codeSignature: "valid",
	};
}

const readinessScript = `
const root = document.querySelector('#seventv-root');
const injected = document.querySelector('script#seventv-extension');
const buttons = [...document.querySelectorAll('.seventv-emote-menu-button')];
return {
  url: location.href,
  marker: document.documentElement.dataset.seventvExtension || null,
  rootCount: document.querySelectorAll('#seventv-root').length,
  injectedScript: injected?.src || null,
  buttonCount: buttons.length,
  now: performance.now(),
  platform: document.body.hasAttribute('seventv-kick') ? 'KICK' : (location.hostname.endsWith('twitch.tv') ? 'TWITCH' : 'UNKNOWN')
};`;

const openMenuScript = `
const buttons = [...document.querySelectorAll('.seventv-emote-menu-button')];
const button = buttons.find((item) => item.getClientRects().length > 0);
if (!button) return false;
button.click();
return true;`;

const emoteMenuScript = `
const menu = document.querySelector('.seventv-emote-menu');
const selected = menu?.querySelector('.seventv-emote-menu-provider-icon[selected] span')?.textContent?.trim() || null;
const images = [...(menu?.querySelectorAll('img.seventv-chat-emote') || [])]
  .filter((image) => image.complete && image.naturalWidth > 0 && image.naturalHeight > 0)
  .map((image) => ({ alt: image.alt, src: image.currentSrc || image.src }))
  .filter((image) => {
    try { const host = new URL(image.src).hostname; return host === '7tv.app' || host.endsWith('.7tv.app'); }
    catch { return false; }
  });
const resources = performance.getEntriesByType('resource')
  .map((entry) => {
    try {
      const host = new URL(entry.name).hostname;
      if (!(host === '7tv.app' || host.endsWith('.7tv.app') || host === '7tv.io' || host.endsWith('.7tv.io'))) return null;
      return { name: entry.name, startTime: entry.startTime, duration: entry.duration, initiatorType: entry.initiatorType };
    } catch { return null; }
  })
  .filter(Boolean);
const marks = performance.getEntriesByType('mark')
  .filter((entry) => entry.name.startsWith('seventv:'))
  .map((entry) => ({ name: entry.name, startTime: entry.startTime }));
return { now: performance.now(), menuOpen: !!menu, selectedProvider: selected, loaded7TVImages: images.length, sample: images.slice(0, 5), resources, marks };`;

const select7TVProviderScript = `
const menu = document.querySelector('.seventv-emote-menu');
if (!menu) return false;
const providers = [...menu.querySelectorAll('.seventv-emote-menu-provider-icon')];
const sevenTV = providers.find((item) => item.textContent?.trim() === '7TV');
if (!sevenTV) return false;
if (!sevenTV.hasAttribute('selected')) sevenTV.click();
return true;`;

async function capture(client, artifacts, name) {
	const base64 = await client.screenshot();
	writeFileSync(resolve(artifacts, `${name}.png`), Buffer.from(base64, "base64"));
}

async function verifyPage(client, options, iteration) {
	const timeoutMs = options.timeoutSeconds * 1_000;
	const injected = await waitForCondition(
		async () => await client.execute(readinessScript),
		(state) =>
			state?.marker === "legacy" &&
			state.rootCount === 1 &&
			state.injectedScript?.startsWith("safari-web-extension:"),
		{ timeoutMs, intervalMs: 500, label: `7TV injection after load ${iteration}` },
	);
	const ready = await waitForCondition(
		async () => await client.execute(readinessScript),
		(state) => state?.buttonCount > 0,
		{ timeoutMs, intervalMs: 500, label: `7TV emote-menu button after load ${iteration}` },
	);
	assert.equal(await client.execute(openMenuScript), true, "The visible 7TV emote-menu button was not clickable");
	await waitForCondition(
		async () => await client.execute(select7TVProviderScript),
		(selected) => selected === true,
		{ timeoutMs, intervalMs: 250, label: `7TV provider tab after load ${iteration}` },
	);
	const menuOpenedAt = await client.execute("return performance.now();");
	const emotes = await waitForCondition(
		async () => await client.execute(emoteMenuScript),
		(state) => state?.menuOpen && state.selectedProvider === "7TV" && state.loaded7TVImages > 0,
		{ timeoutMs, intervalMs: 500, label: `real 7TV emotes after load ${iteration}` },
	);
	await capture(client, options.artifacts, `load-${iteration}`);
	const durations = emotes.resources.map((resource) => resource.duration).sort((a, b) => a - b);
	const percentile = (fraction) => durations[Math.max(0, Math.ceil(durations.length * fraction) - 1)] ?? null;
	return {
		iteration,
		platform: ready.platform,
		timingsMs: {
			navigationToInjection: injected.now,
			navigationToMenuButton: ready.now,
			navigationToFirst7TVImage: emotes.now,
			menuOpenToFirst7TVImage: emotes.now - menuOpenedAt,
			sevenTVResourceP50: percentile(0.5),
			sevenTVResourceP95: percentile(0.95),
		},
		pipelineMarks: emotes.marks,
		ready,
		emotes,
	};
}

export async function runLiveSmoke(options) {
	const prerequisites = checkLivePrerequisites();
	mkdirSync(resolve(options.artifacts), { recursive: true });
	const driver = await startSafariDriver();
	const observations = [];
	try {
		try {
			await driver.client.createSession();
		} catch (error) {
			throw new Error(
				`${error.message}\nEnable Safari > Develop > Developer Settings > Allow remote automation, then rerun.`,
			);
		}
		await driver.client.navigate(options.url);
		observations.push(await verifyPage(driver.client, options, 0));
		for (let iteration = 1; iteration <= options.reloads; iteration++) {
			await driver.client.refresh();
			observations.push(await verifyPage(driver.client, options, iteration));
		}
		const report = {
			status: "passed",
			createdAt: new Date().toISOString(),
			url: options.url,
			reloads: options.reloads,
			prerequisites,
			observations,
		};
		writeFileSync(resolve(options.artifacts, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
		return report;
	} catch (error) {
		if (driver.client.sessionId) {
			await capture(driver.client, options.artifacts, "failure").catch(() => {});
		}
		throw error;
	} finally {
		await driver.client.close().catch(() => {});
		await driver.stop();
	}
}

async function main() {
	const options = parseLiveArgs(process.argv.slice(2));
	if (options.check) {
		console.log(JSON.stringify({ status: "ready", ...checkLivePrerequisites() }, null, 2));
		return;
	}
	const report = await runLiveSmoke(options);
	console.log(JSON.stringify(report, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
	main().catch((error) => {
		console.error(error.stack ?? error.message);
		process.exitCode = 1;
	});
}
