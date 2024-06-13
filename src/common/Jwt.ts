export function decodeJWT(token: string): SevenTV.JWT | undefined {
	try {
		return JSON.parse(atob(token.split(".")[1]));
	} catch {
		return;
	}
}
