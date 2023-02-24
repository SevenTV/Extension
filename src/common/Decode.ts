export function decodeYoutubeParams(v: string): string {
	return (
		atob(decodeURIComponent(atob(v)))
			.split("*'\n\u0018")?.[1]
			.split("\u0012\u000b")?.[0] ?? ""
	);
}
