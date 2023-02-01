import { description, displayName, name, version } from "./package.json";
import type { Manifest } from "webextension-polyfill-ts";

interface MV3HostPermissions {
	host_permissions?: string[];
	optional_host_permissions?: string[];
}

interface ManifestOptions {
	mv2?: boolean;
	branch?: BranchName;
	dev?: boolean;
}

export type BranchName = "beta" | "dev";

export async function getManifest(
	opt: ManifestOptions,
	chunkResources?: string[],
): Promise<Manifest.WebExtensionManifest> {
	const iconName = "".concat(opt.branch ? opt.branch + "-" : "", "icon-512.png");

	const manifest = {
		manifest_version: 3,
		name: (displayName || name) + (opt.branch ? ` ${opt.branch.toUpperCase()}` : ""),
		version: version,
		version_name: version + (opt.branch ? ` ${opt.branch}` : ""),
		description: description,
		action: {
			default_icon: `./icon/${iconName}`,
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
		icons: {
			16: `./icon/${iconName}`,
			48: `./icon/${iconName}`,
			128: `./icon/${iconName}`,
		},

		// By default the extension is enabled only on Twitch
		host_permissions: ["*://*.twitch.tv/*"],

		// Declare YouTube as an optional host permission
		optional_host_permissions: ["*://*.youtube.com/*", "*://*.7tv.app/*", "*://*.7tv.io/*"],

		web_accessible_resources: [
			{
				resources: [
					"site.js",
					"site.js.map",
					"content.js.map",
					"worker.js",
					"assets/style.css",
					...new Array(20).fill(20).map((_, i) => `assets/emojis${i}.js`),
					...(chunkResources ?? []),
				],
				matches: ["*://*.twitch.tv/*"],
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
