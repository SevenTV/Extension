import { reactive } from "vue";

const data = reactive({
	channel: null as CurrentChannel | null,
});

export function useChatContext() {
	return data;
}
