<template>
	<Teleport :to="badgeContainer">
		<span v-if="cosmetics.badges.size" class="seventv-badge-list">
			<Badge
				v-for="[id, badge] of cosmetics.badges"
				:key="id"
				:badge="badge"
				type="app"
				:alt="badge.data.tooltip"
			/>
		</span>
	</Teleport>
</template>

<script setup lang="ts">
import { onUnmounted, watchEffect } from "vue";
import { useCosmetics } from "@/composable/useCosmetics";
import type { ChatMessageBinding } from "./ChatMessage.vue";
import Badge from "@/app/chat/Badge.vue";
import { updateElementStyles } from "@/directive/TextPaintDirective";

const props = defineProps<{
	el: HTMLDivElement;
	bind: ChatMessageBinding;
}>();

const cosmetics = useCosmetics(props.bind.authorID);

const badgeContainer = document.createElement("seventv-container");
badgeContainer.id = "seventv-badge-container";
badgeContainer.style.width = "100%";

watchEffect(() => {
	const infoBlock = props.el.querySelector<HTMLDivElement>(".information");
	const badgeBlock = props.el.querySelector<HTMLDivElement>(".badges-container");
	const username = props.el.querySelector<HTMLAnchorElement>("a.username");

	if (badgeBlock) {
		badgeBlock.appendChild(badgeContainer);
	} else if (infoBlock) {
		infoBlock.insertAdjacentElement("afterend", badgeContainer);
	}

	if (username && cosmetics.paints.size) {
		username.style.width = "fit-content";
		updateElementStyles(username, Array.from(cosmetics.paints.values())[0].id);
	}
});

onUnmounted(() => {
	badgeContainer.remove();
});
</script>
