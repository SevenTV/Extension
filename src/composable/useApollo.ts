import type { ApolloClient } from "@apollo/client";

declare const __APOLLO_CLIENT__: ApolloClient<object>;

export function useApollo(): ApolloClient<object> | null {
	if (!("__APOLLO_CLIENT__" in window)) {
		return null;
	}

	return __APOLLO_CLIENT__ ?? null;
}
