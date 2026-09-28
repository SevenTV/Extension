import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "../..");
const dist = join(root, "dist");
const installedApp = process.env.SEVENTV_INSTALLED_APP;
const installedExtensionID = process.env.SEVENTV_INSTALLED_EXTENSION_ID ?? "app.seventv.safari.Extension";
const installedResources = installedApp
	? join(installedApp, "Contents/PlugIns/7TV for Safari Extension.appex/Contents/Resources")
	: null;

function source(path) {
	return readFileSync(join(root, path), "utf8");
}

function digest(path) {
	return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function walkFiles(dir) {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const path = join(dir, entry.name);
		return entry.isDirectory() ? walkFiles(path) : [path];
	});
}

test("Safari manifest statically enables only the three upstream-supported sites", () => {
	const manifest = JSON.parse(readFileSync(join(dist, "manifest.json"), "utf8"));
	const supportedHosts = ["*://*.twitch.tv/*", "*://*.kick.com/*", "*://*.youtube.com/*"];

	assert.deepEqual(manifest.permissions, ["storage"]);
	assert.deepEqual(manifest.host_permissions, supportedHosts);
	assert.equal(manifest.optional_permissions, undefined);
	assert.equal(manifest.optional_host_permissions, undefined);
	assert.deepEqual(manifest.content_scripts, [
		{ matches: supportedHosts, js: ["content.js"] },
	]);
	assert.equal(
		manifest.content_security_policy.extension_pages,
		"script-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
	);
	assert.deepEqual(manifest.web_accessible_resources, [
		{
			resources: ["site.js", "worker.js", "index.html", "assets/*"],
			matches: supportedHosts,
		},
	]);
	assert.equal(walkFiles(dist).some((path) => path.endsWith(".map")), false);
});

test("Safari service worker cannot repeat optional platform registration", () => {
	const background = readFileSync(join(dist, "background.js"), "utf8");

	assert.doesNotMatch(background, /registerContentScripts/);
	assert.doesNotMatch(background, /seventv-youtube|seventv-kick/);
	assert.doesNotMatch(background, /permissions\.contains/);
});

test("closed-tab messaging is handled without aborting initialization", () => {
	assert.match(source("src/background/sync.ts"), /void chrome\.runtime\.lastError/);
	assert.match(source("src/background/messaging.ts"), /void chrome\.runtime\.lastError/);
});

test("Safari performance timing covers worker, provider set and full-set settlement", () => {
	const worker = source("src/composable/useWorker.ts");
	const workerHTTP = source("src/worker/worker.http.ts");

	assert.match(worker, /seventv:\$\{name\}/);
	assert.match(worker, /worker-init-start/);
	assert.match(worker, /PROVIDER_SET_FETCHED/);
	assert.match(worker, /all-sets-settled/);
	assert.match(workerHTTP, /postMessage\("PROVIDER_SET_FETCHED"/);
});

test("page-controlled storage cannot replace the packaged worker", () => {
	const worker = source("src/composable/useWorker.ts");

	assert.doesNotMatch(worker, /localStorage\s*\.(?:getItem|setItem|removeItem|clear)/);
	assert.match(worker, /url\.pathname === "\/worker\.js"/);
	assert.match(worker, /safari-web-extension:/);
	assert.match(worker, /url\.search === ""/);
	assert.match(worker, /url\.hash === ""/);
});

test("auth and HTML injection boundaries are guarded", () => {
	const profile = source("src/app/settings/SettingsViewProfile.vue");

	assert.match(profile, /ev\.origin !== authOrigin/);
	assert.match(profile, /ev\.source !== w/);
	assert.match(profile, /postMessage\("7tv-token-request", authOrigin\)/);
	assert.match(source("src/site/global/Changelog.vue"), /DOMPurify\.sanitize/);
	assert.match(source("src/content/emoji.ts"), /DOMPurify\.sanitize/);
});

test("native wrapper keeps only the sandbox entitlement", () => {
	const project = source("safari-project/7TV for Safari/7TV for Safari.xcodeproj/project.pbxproj");
	const buildScript = source("script/build-safari-local.sh");

	assert.doesNotMatch(project, /ENABLE_USER_SELECTED_FILES/);
	assert.doesNotMatch(project, /ENABLE_OUTGOING_NETWORK_CONNECTIONS/);
	assert.match(
		source("safari-project/7TV for Safari/7TV for Safari/7TV for Safari.entitlements"),
		/com\.apple\.security\.app-sandbox/,
	);
	assert.match(
		source(
			"safari-project/7TV for Safari/7TV for Safari Extension/7TV for Safari Extension.entitlements",
		),
		/com\.apple\.security\.app-sandbox/,
	);
	assert.match(buildScript, /REGISTER_WITH_LAUNCH_SERVICES=NO/);
});

test(
	"installed app is signed, uniquely registered from Applications, and matches the build",
	{
		skip:
			process.env.SEVENTV_SKIP_INSTALLED_CHECK === "1" ||
			process.platform !== "darwin" ||
			!installedApp ||
			!existsSync(installedApp),
	},
	() => {
		assert.ok(installedApp);
		assert.ok(installedResources);
		execFileSync("codesign", ["--verify", "--deep", "--strict", installedApp], { stdio: "pipe" });

		const registration = execFileSync(
			"pluginkit",
			["-mAvvv", "-i", installedExtensionID],
			{ encoding: "utf8" },
		);
		assert.match(registration, /Path = \/Applications\/7TV for Safari\.app\//);
		assert.match(registration, /\(1 plug-in\)/);
		assert.doesNotMatch(registration, /\/private\/var\/folders|\/tmp\//);

		for (const name of ["manifest.json", "background.js", "content.js", "site.js", "worker.js"]) {
			assert.equal(digest(join(dist, name)), digest(join(installedResources, name)), `${name} differs`);
		}
	},
);
