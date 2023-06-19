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
