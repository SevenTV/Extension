import { ref } from "vue";
import type { ApolloClient } from "@apollo/client";

const client = ref<ApolloClient<object> | null>(null);

export function useApollo() {
	return client;
}
