<template>
	<main class="seventv-mod-log-recent-actions">
		<template v-for="item of messages.moderated" :key="item.id">
			<template v-if="item.mod">
				<ModLogsRecentActionsItem
					:messages="item.messages"
					:victim="item.victim"
					:mod="item.mod"
					:emotes="emotes.active"
				/>
			</template>
		</template>
	</main>
</template>

<script setup lang="ts">
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useChatEmotes } from "@/composable/chat/useChatEmotes";
import { useChatMessages } from "@/composable/chat/useChatMessages";
import ModLogsRecentActionsItem from "./ModLogsRecentActionsItem.vue";

const ctx = useChannelContext();
const messages = useChatMessages(ctx);
const emotes = useChatEmotes(ctx);
</script>

<style scoped lang="scss">
.seventv-mod-log-recent-actions {
	display: flex;
	flex-direction: column;
	row-gap: 1em;
	padding: 0.5rem 0.35rem;
}
</style>
