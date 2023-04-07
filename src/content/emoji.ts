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
		element.innerHTML = await data;

		container.appendChild(element);
	}

	document.head.appendChild(container);
}
