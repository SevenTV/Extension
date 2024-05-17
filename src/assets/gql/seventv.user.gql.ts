import { gql } from "graphql-tag";

export const actorQuery = gql`
	query GetActor {
		user: actor {
			id
			username
			display_name
			avatar_url
			style {
				color
				paint_id
			}
			connections {
				id
				username
				display_name
			}
		}
	}
`;

export const userQuery = gql`
	query GetUser($id: ObjectID!) {
		user: user(id: $id) {
			id
			username
			display_name
			avatar_url
			style {
				color
				paint_id
			}
		}
	}
`;

export const userByConnectionQuery = gql`
	query GetUserByConnection($platform: ConnectionPlatform!, $id: String!) {
		user: userByConnection(platform: $platform, id: $id) {
			id
			username
			display_name
			avatar_url
			style {
				color
				paint_id
			}
			connections {
				platform
				emote_set_id
			}
			editors {
				id
			}
		}
	}
`;

export const changeEmoteInSetMutation = gql`
	mutation ChangeEmoteInSet($id: ObjectID!, $action: ListItemAction!, $emote_id: ObjectID!, $name: String) {
		emoteSet(id: $id) {
			id
			emotes(id: $emote_id, action: $action, name: $name) {
				id
				name
			}
		}
	}
`;

export const searchQuery = gql`
	query SearchEmotes($query: String!, $page: Int, $sort: Sort, $limit: Int, $filter: EmoteSearchFilter) {
		emotes(query: $query, page: $page, sort: $sort, limit: $limit, filter: $filter) {
			count
			items {
				id
				name
				state
				trending
				owner {
					id
					username
					display_name
					style {
						color
						paint_id
					}
				}
				flags
				host {
					url
					files {
						name
						format
						width
						height
					}
				}
			}
		}
	}
`;

export namespace userQuery {
	export interface Result {
		user: SevenTV.User;
	}
	export interface Variables {
		id: string;
	}
}

export namespace actorQuery {
	export interface Result {
		user: SevenTV.User;
	}
}
