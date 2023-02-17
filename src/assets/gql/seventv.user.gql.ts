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
			}
			connections {
				id
				username
				display_name
			}
		}
	}
`;

export namespace actorQuery {
	export interface Result {
		user: SevenTV.User;
	}
}
