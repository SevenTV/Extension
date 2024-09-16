export async function useUserdata(auth: string): Promise<{
	id: number;
	username: string;
	bio: string;
	email: string;
	streamer_channel: {
		slug: string;
	};
	discord?: string;
	facebook?: string;
	twitter?: string;
	youtube?: string;
	tiktok?: string;
	instagram?: string;
}> {
	const data = await fetch("https://kick.com/api/v1/user", {
		headers: {
			"X-XSRF-TOKEN": auth,
		},
		method: "GET",
	});

	return await data.json();
}
