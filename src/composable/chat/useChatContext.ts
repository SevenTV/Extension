import { reactive, toRefs } from "vue";

const data = reactive({
	channel: null as CurrentChannel | null,
});

export function useChatContext() {
	const { channel } = toRefs(data);

	return {
		channel: channel,
	};
}
