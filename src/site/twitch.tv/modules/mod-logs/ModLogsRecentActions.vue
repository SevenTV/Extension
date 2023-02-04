<template>
	<main class="seventv-mod-log-recent-actions">
		<template v-for="(item, index) of messages.moderated" :key="index">
			<template v-if="item.mod">
				<ModLogsRecentActionsItem :messages="item.messages" :victim="item.victim" :mod="item.mod" />
			</template>
		</template>
	</main>
</template>

<script setup lang="ts">
import { useChatMessages } from "@/composable/chat/useChatMessages";
import ModLogsRecentActionsItem from "./ModLogsRecentActionsItem.vue";

const messages = useChatMessages();
</script>

<style scoped lang="scss">
.seventv-mod-log-recent-actions {
	display: flex;
	flex-direction: column;
	row-gap: 1em;
	padding: 0.5rem 0.35rem;
}
</style>
