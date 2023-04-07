import { log } from "@/common/Logger";
import { semanticVersionToNumber } from "@/common/Transform";

(async () => {
	const manifestURL = `${import.meta.env.VITE_APP_HOST}/manifest.json`;
	const manifest = await fetch(manifestURL)
		.then((res) => res.json())
		.catch(() => void 0);

	const localVersion = semanticVersionToNumber(import.meta.env.VITE_APP_VERSION);
	const hostedVersion = manifest ? semanticVersionToNumber(manifest.version) : 0;

	if (manifest && hostedVersion > localVersion) {
		const scr = document.createElement("script");
		scr.id = "seventv-site-hosted";
		scr.src = manifest.index_file;
		scr.type = "module";

		const style = document.createElement("link");
		style.rel = "stylesheet";
		style.type = "text/css";
		style.href = manifest.stylesheet_file;
		style.setAttribute("charset", "utf-8");
		style.setAttribute("content", "text/html");
		style.setAttribute("http-equiv", "content-type");
		style.id = "seventv-stylesheet";

		document.head.appendChild(style);
		document.head.appendChild(scr);

		log.info("<Site>", "Using Hosted Mode,", "v" + manifest.version);
	} else {
		import("./site.app");
		log.info("<Site>", "Using Local Mode,", "v" + import.meta.env.VITE_APP_VERSION);
	}
})();
