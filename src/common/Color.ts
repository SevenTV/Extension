export const DecimalToStringRGBA = (num: number): string => {
	const r = (num >>> 24) & 0xff;
	const g = (num >>> 16) & 0xff;
	const b = (num >>> 8) & 0xff;
	const a = num & 0xff;

	return `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`;
};

export const RGBAToDecimal = (r: number, g: number, b: number, a: number): number =>
	(r << 24) | (g << 16) | (b << 8) | a;
