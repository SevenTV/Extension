/* eslint-disable no-console */
import nfq from "./emoji-unqualified.json";
import { existsSync, mkdirSync, readFile, readdirSync, writeFile } from "fs";
import { join } from "path";

const NFQ = {} as Record<string, object>;

for (const e of nfq) {
	NFQ[e.codes] = {};
}

const TWEMOJI_REPO_DIR = join(__dirname, "../../", "twemoji");
const TWEMOJI_ASSETS_DIR = join(TWEMOJI_REPO_DIR, "assets", "svg");
const OUT_DIR = join(__dirname, "out");
const SVG_PARSE_REGEXP = new RegExp("<(/?)svg[^>]*>", "g");

const assetFiles = [] as string[];
const objectList = [] as [string, string][];

// Main
(async function main() {
	// Get all the emoji files
	const files = readdirSync(TWEMOJI_ASSETS_DIR, "utf-8");
	for (const fi of files) {
		if (fi.endsWith(".svg")) {
			assetFiles.push(fi);
		}
	}

	const promises = [] as Promise<void>[];
	for (const file of assetFiles) {
		promises.push(
			new Promise((resolve) => {
				readFile(join(TWEMOJI_ASSETS_DIR, file), "utf-8", (err, data) => {
					if (err) {
						throw err;
					}

					const content = data.replace(SVG_PARSE_REGEXP, "");

					let id = file.replace(".svg", "");
					if (NFQ[id]) {
						id += "-fe0f";
					}

					objectList.push([id, content]);

					resolve();
				});
			}),
		);
	}

	Promise.all(promises).then(() => {
		writeFinal();
	});
})();

function writeFinal(): void {
	// create out dir
	if (!existsSync(OUT_DIR)) {
		mkdirSync(OUT_DIR);
	}

	console.log("Writing final file...", OUT_DIR + "/" + "emojis.svg");

	const splitObjects = [] as [string, string][][];

	while (objectList.length > 0) {
		splitObjects.push(objectList.splice(0, 350));
	}

	for (let i = 0; i < splitObjects.length; i++) {
		const ary = splitObjects[i];

		writeFile(
			OUT_DIR + "/" + `emojis${i}.svg`,
			`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="1em" height="1em">
			<defs>
				${ary.map(([id, objects]) => `<g id="${id}">${objects}</g>`).join("")}
			</defs>
			</svg>
		`.replace(/\t/g, ""),
			(err) => console.log("write: ", err ? err : "no error"),
		);
	}
}
