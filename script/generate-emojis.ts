/*
import fs from "fs";
import https from "https";
import path from "path";

const EMOJI_VERSION = "14.0";

main();

async function main() {
	const text: string = await getTestFile(EMOJI_VERSION);

	console.log(`Format text to json...`);
	const collected = text
		.trim()
		.split("\n")
		.reduce(
			(accu, line) => {
				if (line.startsWith("# group: ")) {
					console.log(`  Processing ${line.substr(2)}...`);
					accu.group = line.substr(9);
				} else if (line.startsWith("# subgroup: ")) {
					accu.subgroup = line.substr(12);
				} else if (line.startsWith("#")) {
					accu.comments = accu.comments + line + "\n";
				} else {
					const qualification = line.substr(57).substr(0, 20).trim();

					const meta = parseLine(line);
					if (meta) {
						meta.category = `${accu.group} (${accu.subgroup})`;
						meta.group = accu.group;
						meta.subgroup = accu.subgroup;

						if (qualification === "fully-qualified") {
							accu.full.push(meta);
							accu.compact.push(meta.char);
						} else {
							accu.unqualified.push(meta);
						}
					} else {
						accu.comments = accu.comments.trim() + "\n\n";
					}
				}
				return accu;
			},
			{ comments: "", full: [], unqualified: [], compact: [], group: "", subgroup: "", category: "" },
		);

	console.log(`Processed emojis: ${collected.full.length}`);

	console.log("Write file: emoji.json, emoji-compact.json \n");
	await writeFiles(collected);

	console.log(collected.comments);
}

async function getTestFile(ver: string): Promise<string> {
	const url = `https://unicode.org/Public/emoji/${ver}/emoji-test.txt`;

	process.stdout.write(`Fetch emoji-test.txt (v${EMOJI_VERSION})`);
	return new Promise<string>((resolve, reject) => {
		https.get(url, (res) => {
			let text = "";
			res.setEncoding("utf8");
			res.on("data", (chunk) => {
				process.stdout.write(".");
				text += chunk;
			});
			res.on("end", () => {
				process.stdout.write("\n");
				resolve(text);
			});
			res.on("error", reject);
		});
	});
}

function parseLine(line) {
	const data = line.trim().split(/\s+[;#] /);

	if (data.length !== 3) {
		return null;
	}

	const [codes, , charAndName] = data;
	const [, char, name] = charAndName.match(/^(\S+) E\d+\.\d+ (.+)$/);

	return { codes: codes.toLowerCase().replace(/ /g, "-"), char, name: name.toLowerCase().replace(/ /g, "-") };
}

const rel = (...args) => path.resolve(__dirname, ...args);

function writeFiles({ full, compact, unqualified }) {
	fs.writeFileSync(rel("./emoji.json"), JSON.stringify(full), "utf8");
	fs.writeFileSync(rel("./emoji-compact.json"), JSON.stringify(compact), "utf8");
	fs.writeFileSync(rel("./emoji-unqualified.json"), JSON.stringify(unqualified), "utf8");
}
*/
