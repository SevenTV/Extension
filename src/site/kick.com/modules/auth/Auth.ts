import { useCookies } from "@/composable/useCookies";

const tokenWrapRegexp = /\[7TV:[0-9a-fA-F]+\]/g;

export async function setBioCode(identity: KickIdentity, code: string, cookies: ReturnType<typeof useCookies>) {
	if (!identity) return;

	const tokenWrap = `[7TV:${code}]`;

	const auth = cookies.get("XSRF-TOKEN");
	if (!auth) return;

	const headers = new Headers();
	headers.set("x-xsrf-token", auth ?? "");
	headers.set("Content-Type", "application/json");

	const cleanBio = identity.bio?.replace(tokenWrapRegexp, "").trim() ?? "";
	const newBio = code ? (identity.bio ? `${cleanBio} ${tokenWrap}` : tokenWrap) : cleanBio;

	return fetch("https://kick.com/update_profile", {
		headers: {
			accept: "application/json, text/plain, */*",
			"accept-language": "en-US",
			"content-type": "application/json",
			"x-xsrf-token": auth,
		},
		referrer: "https://kick.com/dashboard/settings/profile",
		referrerPolicy: "strict-origin-when-cross-origin",
		body: JSON.stringify({
			id: identity.numID,
			email: identity.email,
			bio: newBio,
		}),
		method: "POST",
		mode: "cors",
	}).then((resp) => {
		if (!resp.ok) return;

		identity.bio = newBio;
	});
}
