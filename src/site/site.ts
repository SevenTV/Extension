import { log } from "@/common/Logger";
import { semanticVersionToNumber } from "@/common/Transform";
import { loadSite } from "./site.normal";

(async () => {
	const host: string = import.meta.env.VITE_APP_HOST;
	const versionBranch: string = import.meta.env.VITE_APP_VERSION_BRANCH;

	const manifestURL = `${host}/manifest${versionBranch ? "." + versionBranch.toLowerCase() : ""}.json`;

	const manifest = await fetch(manifestURL)
		.then((res) => res.json())
		.catch((err) => log.error("<Site>", "Failed to fetch host manifest", err.message));

	const localVersion = semanticVersionToNumber(import.meta.env.VITE_APP_VERSION);
	const hostedVersion = manifest ? semanticVersionToNumber(manifest.version) : 0;

	(window as Window & { seventv?: SeventvGlobalScope }).seventv = {
		host_manifest: manifest ?? null,
	};

	if (!manifest || hostedVersion <= localVersion) {
		log.info("<Site>", "Using Local Mode,", "v" + import.meta.env.VITE_APP_VERSION);
		loadSite();
	} else {
		seventv.hosted = true;

		const v1 = document.createElement("script");
		v1.id = "seventv-site-hosted";
		v1.src = manifest.index_file;
		v1.type = "module";

		const v2 = document.createElement("link");
		v2.rel = "stylesheet";
		v2.type = "text/css";
		v2.href = manifest.stylesheet_file;
		v2.setAttribute("charset", "utf-8");
		v2.setAttribute("content", "text/html");
		v2.setAttribute("http-equiv", "content-type");
		v2.id = "seventv-stylesheet";

		document.head.appendChild(v2);
		document.head.appendChild(v1);

		log.info("<Site>", "Using Hosted Mode,", "v" + manifest.version);
	}
})();
