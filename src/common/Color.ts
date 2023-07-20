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

export const DecimalToHex = (num: number, alpha?: boolean): string => {
	const r = (num >>> 24) & 0xff;
	const g = (num >>> 16) & 0xff;
	const b = (num >>> 8) & 0xff;
	const a = num & 0xff;

	return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1) + (alpha ? SetHexAlpha(a / 255) : "");
};
export const SetHexAlpha = (alpha: number): string => {
	if (alpha > 1 || alpha < 0 || isNaN(alpha)) {
		throw Error("alpha must be between 0 and 1");
	}

	return Math.ceil(255 * alpha)
		.toString(16)
		.toUpperCase();
};

export const HexToDecimal = (hex: string, alpha = 1): number => {
	const t = parseInt(hex?.slice(1) ?? "0", 16);
	const r = (t >> 16) & 255;
	const g = (t >> 8) & 255;
	const b = t & 255;

	return RGBAToDecimal(r, g, b, 255 * Math.min(alpha, 1));
};

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
