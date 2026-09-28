#!/bin/zsh

set -euo pipefail

repo_dir="${0:A:h:h}"
project_dir="$repo_dir/safari-project/7TV for Safari"
resources_dir="$project_dir/7TV for Safari Extension/Resources"
derived_data_dir=$(mktemp -d "${TMPDIR%/}/seven-tv-safari-build.XXXXXX")
app_path="$derived_data_dir/Build/Products/Release/7TV for Safari.app"

cd "$repo_dir"

if ! npx --no-install yarn@1.22.22 --version >/dev/null 2>&1; then
	print -u2 -- "Pinned Yarn 1.22.22 is not available locally. Refusing to download build tools implicitly."
	exit 1
fi

if [[ ! -x node_modules/.bin/vite || ! -x node_modules/.bin/vue-tsc ]]; then
	print -u2 -- "Dependencies are missing. Install the reviewed lockfile before building."
	exit 1
fi

npx --no-install yarn@1.22.22 check --integrity --ignore-scripts
npx --no-install yarn@1.22.22 audit --groups dependencies
npx --no-install yarn@1.22.22 build:safari
rsync -a --delete "$repo_dir/dist/" "$resources_dir/"
xattr -cr "$project_dir"

identity_line=$(security find-identity -v -p codesigning | awk '/Apple Development/ {print; exit}')
signing_identity="${SEVENTV_SIGNING_IDENTITY:-$(print -r -- "$identity_line" | awk '{print $2}')}"
team_id="${SEVENTV_TEAM_ID:-$(print -r -- "$identity_line" | sed -E 's/.*\(([A-Z0-9]+)\)".*/\1/')}"

if [[ -z "$signing_identity" || -z "$team_id" || "$team_id" == "$identity_line" ]]; then
	print -u2 -- "An Apple Development identity and team are required for a persistent Safari extension build."
	exit 1
fi

DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer \
	xcodebuild \
	-project "$project_dir/7TV for Safari.xcodeproj" \
	-scheme "7TV for Safari" \
	-configuration Release \
	-derivedDataPath "$derived_data_dir" \
	DEVELOPMENT_TEAM="$team_id" \
	CODE_SIGN_STYLE=Manual \
	CODE_SIGN_IDENTITY="$signing_identity" \
	PROVISIONING_PROFILE_SPECIFIER= \
	CODE_SIGN_INJECT_BASE_ENTITLEMENTS=NO \
	REGISTER_WITH_LAUNCH_SERVICES=NO \
	build

codesign --verify --deep --strict --verbose=4 "$app_path"

manifest="$app_path/Contents/PlugIns/7TV for Safari Extension.appex/Contents/Resources/manifest.json"
node -e '
const fs = require("fs");
const manifest = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
const expected = JSON.stringify(["storage"]);
const hosts = JSON.stringify(["*://*.twitch.tv/*", "*://*.kick.com/*", "*://*.youtube.com/*"]);
if (JSON.stringify(manifest.permissions) !== expected || JSON.stringify(manifest.host_permissions) !== hosts) {
  throw new Error("Unexpected Safari extension permissions");
}
' "$manifest"

print -r -- "$app_path"
