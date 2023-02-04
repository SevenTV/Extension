import { reactive } from "vue";
import { ChatMessage } from "@/common/chat/ChatMessage";

const data = reactive({
	modMessages: [] as ChatMessage[],
});

export function useModLogsStore() {
	return data;
}
