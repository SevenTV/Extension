import DOMPurify from "dompurify";

/**
 * Inserts the emoji vectors into the DOM.
 */
export async function insertEmojiVectors(): Promise<void> {
	const container = document.createElement("div");
	container.id = "seventv-emoji-container";
	container.style.display = "none";
	container.style.position = "fixed";
	container.style.top = "-1px";
	container.style.left = "-1px";

	// Get path to emoji blocks in assets
	const base = chrome.runtime.getURL("assets/emoji");
	const blocks = 11;

	for (let i = 0; i < blocks; i++) {
		const data = (await fetch(base + "/emojis" + i + ".svg")).text();

		const element = document.createElement("div");
		element.id = "emojis" + i;
		// These SVG sprites are packaged with the extension. Sanitize them anyway
		// so a compromised or accidentally modified asset cannot inject active
		// content into Twitch through this HTML sink.
		element.innerHTML = DOMPurify.sanitize(await data, {
			USE_PROFILES: { svg: true, svgFilters: true },
			FORBID_TAGS: ["script", "foreignObject"],
		});

		container.appendChild(element);
	}

	document.head.appendChild(container);
}
