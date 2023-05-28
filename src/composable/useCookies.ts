class CookieMap extends Map<string, string> {
	refresh(): void {
		super.clear();

		const cookies = document.cookie.split(";").map((cookie) => cookie.trim());

		for (const cookie of cookies) {
			const [key, value] = cookie.split("=");
			super.set(key, decodeURIComponent(value));
		}
	}

	get(key: string): string | undefined {
		this.refresh();

		return super.get(key);
	}
}

const cookieMap = new CookieMap();

export function useCookies() {
	cookieMap.refresh();

	return cookieMap;
}
