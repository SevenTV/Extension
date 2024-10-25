import { decodeJWT } from "@/common/Jwt";
import { useConfig } from "@/composable/useSettings";
import { ApolloClient, ApolloLink, InMemoryCache, createHttpLink } from "@apollo/client/core";

export const httpLink = createHttpLink({
	uri: import.meta.env.VITE_APP_API_GQL,
});

const token = useConfig<string>("app.7tv.token");
const authLink = new ApolloLink((op, next) => {
	const jwt = decodeJWT(token.value);
	if (!jwt || jwt.exp * 1000 < Date.now() || !jwt.sub) {
		token.value = "";
		return next(op);
	}
	op.setContext({
		headers: {
			Authorization: `Bearer ${token.value}`,
		},
	});
	return next(op);
});

const link = ApolloLink.from([authLink, httpLink]);

const cache = new InMemoryCache();

export const apolloClient = new ApolloClient({
	link,
	cache,
});
