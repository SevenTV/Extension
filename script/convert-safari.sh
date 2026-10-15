#!/usr/bin/env bash
#
# Wrap the built Safari web extension (dist/safari) into an Xcode project that
# can be built and run in Safari.
#
# Requires Xcode (provides `xcrun safari-web-extension-converter`).
#
# Usage:
#   yarn build:safari && yarn convert:safari
#
# Environment overrides:
#   SAFARI_APP_NAME           App name of the generated host app        (default: SevenTV)
#   SAFARI_BUNDLE_ID          Bundle identifier of the host app         (default: app.7tv.SevenTV)
#   SAFARI_PROJECT_DIR        Where to place the Xcode project           (default: <repo>/safari)
#   SAFARI_DEVELOPMENT_TEAM   Apple Developer team id to sign with. Setting this makes Xcode
#                             sign the extension with a real certificate instead of ad-hoc
#                             ("Sign to Run Locally"), so Safari no longer needs
#                             "Develop → Allow Unsigned Extensions" (which resets on quit).
#
# Note: Safari derives the extension's bundle id as "<bundle-id>.Extension" and
# requires it to be prefixed by the app's, so the last component of the bundle id
# must match the (bundle-identifier-safe) app name.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

SOURCE="${ROOT}/dist/safari"
PROJECT="${SAFARI_PROJECT_DIR:-${ROOT}/safari}"
APP_NAME="${SAFARI_APP_NAME:-SevenTV}"
BUNDLE_ID="${SAFARI_BUNDLE_ID:-app.7tv.SevenTV}"

if [ ! -f "${SOURCE}/manifest.json" ]; then
	echo "error: no Safari build found at ${SOURCE}" >&2
	echo "       run 'yarn build:safari' first." >&2
	exit 1
fi

# Safari refuses to load an extension when a file referenced by `icons`/`default_icon`
# is missing, reporting a confusing "invalid path" error in Safari's Extensions settings.
# Catch that here instead.
SOURCE="${SOURCE}" node <<'NODE'
const fs = require("fs");
const path = require("path");

const dir = process.env.SOURCE;
const manifest = JSON.parse(fs.readFileSync(path.join(dir, "manifest.json"), "utf8"));

const referenced = new Set();
const collect = (value) => {
	if (typeof value === "string") referenced.add(value);
	else if (value && typeof value === "object") Object.values(value).forEach(collect);
};
collect(manifest.icons);
collect(manifest.action?.default_icon);
collect(manifest.browser_action?.default_icon);
collect(manifest.page_action?.default_icon);

const missing = [...referenced].filter((p) => !fs.existsSync(path.join(dir, p.replace(/^\.?\//, ""))));
if (missing.length) {
	console.error("error: the manifest references icons that are missing from the build:");
	for (const p of missing) console.error(`       - ${p}`);
	console.error("       run 'yarn build:safari' to regenerate the bundle.");
	process.exit(1);
}
NODE

if ! command -v xcrun >/dev/null 2>&1; then
	echo "error: xcrun not found. Install Xcode from the App Store." >&2
	exit 1
fi

xcrun safari-web-extension-converter "${SOURCE}" \
	--project-location "${PROJECT}" \
	--app-name "${APP_NAME}" \
	--bundle-identifier "${BUNDLE_ID}" \
	--macos-only \
	--copy-resources \
	--no-open \
	--no-prompt \
	--force

# Optionally bake a signing team into the generated project. Without this, Xcode signs
# ad-hoc, which makes Safari depend on "Allow Unsigned Extensions" (cleared on every quit).
if [ -n "${SAFARI_DEVELOPMENT_TEAM:-}" ]; then
	PROJECT="${PROJECT}" SAFARI_DEVELOPMENT_TEAM="${SAFARI_DEVELOPMENT_TEAM}" node <<'NODE'
const fs = require("fs");
const path = require("path");

const root = process.env.PROJECT;
const team = process.env.SAFARI_DEVELOPMENT_TEAM;

function findPbxproj(dir) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		if (!entry.isDirectory()) continue;
		const full = path.join(dir, entry.name);
		if (entry.name.endsWith(".xcodeproj")) return path.join(full, "project.pbxproj");
		const nested = findPbxproj(full);
		if (nested) return nested;
	}
	return null;
}

const pbxproj = findPbxproj(root);
if (!pbxproj) {
	console.error(`error: could not find project.pbxproj under ${root}`);
	process.exit(1);
}

const source = fs.readFileSync(pbxproj, "utf8");
const updated = source.replace(
	/CODE_SIGN_STYLE = Automatic;/g,
	`CODE_SIGN_STYLE = Automatic;\n\t\t\t\tDEVELOPMENT_TEAM = ${team};`,
);
fs.writeFileSync(pbxproj, updated);
console.log(`Set DEVELOPMENT_TEAM = ${team} in the generated project`);
NODE
fi

echo
if [ -n "${SAFARI_DEVELOPMENT_TEAM:-}" ]; then
	echo "Xcode project created at: ${PROJECT} (signing team ${SAFARI_DEVELOPMENT_TEAM})"
else
	echo "Xcode project created at: ${PROJECT}"
	echo "Tip: pass SAFARI_DEVELOPMENT_TEAM=<team-id> to sign it (see README)."
fi
echo "Open it, run the target once, then enable the extension in Safari:"
echo "  Safari > Settings > Extensions"
