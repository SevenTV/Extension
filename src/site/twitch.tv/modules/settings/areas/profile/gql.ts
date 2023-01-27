// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function sendRequest(token: string, query: string, variables?: any) {
	return fetch("https://7tv.io/v3/gql", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: "Bearer " + token,
		},
		body: JSON.stringify({
			query: query,
			variables: variables ?? {},
		}),
	});
}

export const GetCurrentUser = `
	query GetCurrentUser {
		user: actor {
			id
			username
			display_name
			created_at
			avatar_url
			style {
				color
				paint_id
			}
			biography
			inbox_unread_count
			editor_of {
				id
				permissions
				user {
					emote_sets {
						id
					}
					connections {
						id
						display_name
						platform
						emote_capacity
						emote_set_id
					}
				}
			}
			roles
			emote_sets {
				id
				name
				capacity
				emotes {
					id
					name
					data {
						name
					}
				}
				owner {
					id
					display_name
					style {
						color
					}
					avatar_url
				}
			}
			connections {
				id
				display_name
				platform
				linked_at
				emote_capacity
				emote_set_id
			}
		}
	}
`;

export const GetUserCosmetics = `
	query GetUserCosmetics($id: ObjectID!) {
		user(id: $id) {
			id
			cosmetics {
				id
				kind
				selected
			}
		}
	}
`;
