import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client/core";

export const httpLink = createHttpLink({
	uri: import.meta.env.VITE_APP_API_GQL,
	credentials: "include",
});

const cache = new InMemoryCache();

export const apolloClient = new ApolloClient({
	link: httpLink,
	cache,
});
