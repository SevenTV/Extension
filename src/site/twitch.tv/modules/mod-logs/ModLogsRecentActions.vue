<template>
	<main class="seventv-mod-log-recent-actions">
		<template v-for="(item, index) of messages.moderated" :key="index">
			<template v-if="item.mod">
				<UiLazyList :inst="listID" :incr="3">
					<ModLogsRecentActionsItem :messages="item.messages" :victim="item.victim" :mod="item.mod" />
				</UiLazyList>
			</template>
		</template>
	</main>
</template>

<script setup lang="ts">
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useChatMessages } from "@/composable/chat/useChatMessages";
import ModLogsRecentActionsItem from "./ModLogsRecentActionsItem.vue";
import UiLazyList from "@/ui/UiLazyList.vue";

const ctx = useChannelContext();
const messages = useChatMessages(ctx);
const listID = Symbol("mod-logs-recent-actions");
</script>

<style scoped lang="scss">
.seventv-mod-log-recent-actions {
	display: flex;
	flex-direction: column;
	row-gap: 1em;
	padding: 0.5rem 0.35rem;
}
</style>
