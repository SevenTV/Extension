export function getSearchRange(text: string, position: number): [number, number] {
	let start = 0;
	let end = 0;

	for (let i = position; ; i--) {
		if (i < 1 || (text.charAt(i - 1) === " " && i !== position)) {
			start = i;
			break;
		}
	}

	for (let i = position + 1; ; i++) {
		if (i > text.length || text.charAt(i - 1) === " ") {
			end = i - 1;
			break;
		}
	}

	return [start, end];
}

export interface TabToken {
	token: string;
	priority: number;
	item?: SevenTV.ActiveEmote;
}
