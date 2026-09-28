#!/bin/zsh

set -euo pipefail

app_path="${1:-}"
mode="${2:-development}"

if [[ -z "$app_path" || ! -d "$app_path" || "$app_path" != *.app ]]; then
	print -u2 -- "Usage: $0 /absolute/path/to/7TV\\ for\\ Safari.app [development|distribution]"
	exit 64
fi

app_path="${app_path:A}"
extension_path="$app_path/Contents/PlugIns/7TV for Safari Extension.appex"
resources_path="$extension_path/Contents/Resources"
entitlements_dir=$(mktemp -d "${TMPDIR%/}/seventv-entitlements.XXXXXX")
host_entitlements="$entitlements_dir/host.plist"
extension_entitlements="$entitlements_dir/extension.plist"
trap '/bin/rm -rf -- "$entitlements_dir"' EXIT

[[ -d "$extension_path" ]] || { print -u2 -- "Safari extension bundle is missing"; exit 1; }
[[ -f "$resources_path/manifest.json" ]] || { print -u2 -- "Safari manifest is missing"; exit 1; }

codesign --verify --deep --strict --verbose=4 "$app_path"
codesign -d --entitlements :- "$app_path" >"$host_entitlements" 2>/dev/null
codesign -d --entitlements :- "$extension_path" >"$extension_entitlements" 2>/dev/null

node - "$resources_path/manifest.json" <<'NODE'
const fs = require("fs");
const manifest = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
if (JSON.stringify(manifest.permissions) !== JSON.stringify(["storage"])) throw new Error("Unexpected permissions");
const hosts = ["*://*.twitch.tv/*", "*://*.kick.com/*", "*://*.youtube.com/*"];
if (JSON.stringify(manifest.host_permissions) !== JSON.stringify(hosts)) throw new Error("Unexpected hosts");
if (manifest.optional_permissions || manifest.optional_host_permissions) throw new Error("Optional permissions are forbidden");
NODE

for entitlement_file in "$host_entitlements" "$extension_entitlements"; do
	/usr/libexec/PlistBuddy -c 'Print :com.apple.security.app-sandbox' "$entitlement_file" | grep -qx true
	if /usr/libexec/PlistBuddy -c 'Print :com.apple.security.network.client' "$entitlement_file" >/dev/null 2>&1; then
		print -u2 -- "Unexpected outgoing-network entitlement in $entitlement_file"
		exit 1
	fi
done

if [[ "$mode" == "distribution" ]]; then
	spctl --assess --type execute --verbose=4 "$app_path"
	xcrun stapler validate "$app_path"
elif [[ "$mode" != "development" ]]; then
	print -u2 -- "Mode must be development or distribution"
	exit 64
fi

print -r -- "Safari release verification passed for $app_path ($mode)"
