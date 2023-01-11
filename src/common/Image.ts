export function imageHostToSrcset(host: SevenTV.ImageHost, imageFormat?: SevenTV.ImageFormat): string {
	const format = host.files.some((fi) => fi.format === imageFormat) ? imageFormat : host.files[0]?.format;
	return host.files
		.filter((f) => f.format === format)
		.map((f, i) => `https:${host.url}/${f.name} ${i + 1}x`)
		.join(", ");
}
