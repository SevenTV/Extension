import { darken, hasBadContrast, parseToRgba } from "color2k";

export const DecimalToStringRGBA = (num: number): string => {
	const r = (num >>> 24) & 0xff;
	const g = (num >>> 16) & 0xff;
	const b = (num >>> 8) & 0xff;
	const a = num & 0xff;

	return `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`;
};

export const RGBAToDecimal = (r: number, g: number, b: number, a: number): number =>
	(r << 24) | (g << 16) | (b << 8) | a;

const calculated = { 0: {}, 1: {} } as Record<0 | 1, Record<string, string>>;

export function normalizeUsername(color: string, theme: 0 | 1): string {
	let temp = color.toLowerCase();
	const backgroundColor = theme ? "#0f0e11" : "#faf9fa";

	if (!hasBadContrast(temp, "aa", backgroundColor)) return temp;

	// See if we have calculated the value
	const stored = calculated[theme][color];
	if (stored) return stored;

	const rgb = parseToRgba(temp).slice(0, 3);

	if (theme && rgb.every((e) => e < 36)) {
		calculated[theme][color] = "#7a7a7a";
		return "#7a7a7a";
	}

	let i = 0;

	while (hasBadContrast(temp, "aa", backgroundColor) && i < 50) {
		temp = darken(temp, 0.1 * (theme ? -1 : 1));
		i++;
	}

	calculated[theme][color] = temp;

	return temp;
}
