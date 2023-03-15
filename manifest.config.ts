import { description, displayName, name } from "./package.json";
import type { Manifest } from "webextension-polyfill-ts";

interface MV3HostPermissions {
	host_permissions?: string[];
	optional_host_permissions?: string[];
}

interface ManifestOptions {
	mv2?: boolean;
	branch?: BranchName;
	dev?: boolean;
	version: string;
}

export type BranchName = "nightly" | "dev";

export async function getManifest(opt: ManifestOptions): Promise<Manifest.WebExtensionManifest> {
	const iconName = "".concat(opt.branch ? opt.branch + "-" : "", "icon-%s.png");

	const manifest = {
		manifest_version: 3,
		name:
			(displayName || name) + (opt.branch ? ` ${opt.branch.charAt(0).toUpperCase() + opt.branch.slice(1)}` : ""),
		version: opt.version,
		version_name: opt.version + (opt.branch ? ` ${opt.branch}` : ""),
		description: description,
		browser_action: {
			default_icon: `./icon/${iconName.replace("%s", "128")}`,
			default_popup: "index.html#/popup?noheader=1",
			default_area: "navbar",
		},

		background: {
			service_worker: "background.js",
		},
		content_scripts: [
			{
				matches: ["*://*.twitch.tv/*"],
				js: ["content.js"],
			},
		],
		options_ui: {
			page: "index.html",
			open_in_tab: true,
		},

		icons: {
			16: `./icon/${iconName.replace("%s", "16")}`,
			48: `./icon/${iconName.replace("%s", "48")}`,
			128: `./icon/${iconName.replace("%s", "128")}`,
		},

		// By default the extension is enabled only on Twitch
		host_permissions: ["*://*.twitch.tv/*"],
		permissions: ["scripting", "storage"],
		optional_permissions: ["management"],

		// Declare YouTube as an optional host permission
		optional_host_permissions: ["*://*.youtube.com/*", "*://*.7tv.app/*", "*://*.7tv.io/*"],

		web_accessible_resources: [
			{
				resources: ["site.js", "site.js.map", "content.js.map", "worker.js", "index.html", "assets/*"],
				matches: ["*://*.twitch.tv/*", "*://*.youtube.com/*"],
			},
		],
	} as Manifest.WebExtensionManifest & MV3HostPermissions;

	if (opt.mv2) {
		// if dev set manifest to version 2
		manifest.manifest_version = 2;

		manifest.background = {
			scripts: ["background.js"],
		};

		// Host permissions -> permissions
		manifest.permissions = [...(manifest.permissions ?? []), ...(manifest.host_permissions ?? [])];
		manifest.optional_permissions = [
			...(manifest.optional_permissions ?? []),
			...(manifest.optional_host_permissions ?? []),
		];

		// web accessible resources
		manifest.web_accessible_resources = (
			manifest.web_accessible_resources as Manifest.WebExtensionManifestWebAccessibleResourcesC2ItemType[]
		)
			.map((v) => v.resources)
			.reduce((a, b) => [...(a ?? []), ...(b ?? [])]);

		// this is required on dev for Vite script to load
		if (opt.dev) {
			manifest.content_security_policy = `script-src-elem 'self' 'unsafe-eval' http://localhost:${4777}; object-src 'self'`;
		}

		delete manifest.host_permissions;
		delete manifest.optional_host_permissions;
		delete manifest.action;
	}

	return manifest;
}
