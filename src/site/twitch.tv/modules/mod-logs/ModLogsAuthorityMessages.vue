<template>
	<main class="seventv-mod-log-authority-messages">
		<template v-for="item of localStore.modMessages" :key="item.id">
			<UserMessage :msg="item" :force-timestamp="true" />
		</template>
	</main>
</template>

<script setup lang="ts">
import { useModLogsStore } from "./ModLogsStore";
import UserMessage from "../chat/components/message/UserMessage.vue";

const localStore = useModLogsStore();
</script>

<style scoped lang="scss">
.seventv-mod-log-authority-messages {
	display: flex;
	flex-direction: column;
	row-gap: 1em;
	padding: 0.5rem 0.35rem;
}
</style>
