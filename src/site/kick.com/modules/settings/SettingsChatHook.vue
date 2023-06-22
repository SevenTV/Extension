<template>
	<template v-for="btn of buttons" :key="btn.label">
		<Teleport v-if="btn.container" :to="btn.container">
			<div class="seventv-chat-settings-button" @click="btn.action()">
				<div :style="{ color: btn.color }">
					<Logo :provider="'7TV'" />
					<span>{{ btn.label }}</span>
				</div>
				<component :is="btn.icon" v-if="btn.icon" />
			</div>
		</Teleport>
	</template>
</template>

<script setup lang="ts">
import { onUnmounted, watchEffect } from "vue";
import { useEventListener } from "@vueuse/core";
import { useActor } from "@/composable/useActor";
import GearsIcon from "@/assets/svg/icons/GearsIcon.vue";
import OpenLinkIcon from "@/assets/svg/icons/OpenLinkIcon.vue";
import Logo from "@/assets/svg/logos/Logo.vue";

interface ChatSettingsButton {
	label: string;
	action: () => void;
	condition?: () => boolean;
	icon?: AnyInstanceType;
	color?: string;
	container?: HTMLElement;
}

const props = defineProps<{
	el: HTMLElement;
}>();

const emit = defineEmits<{
	(e: "open-settings"): void;
}>();

const actor = useActor();

const buttons: ChatSettingsButton[] = [
	{
		label: "Get Chat Badges & Colors",
		color: "var(--seventv-subscriber-color)",
		icon: OpenLinkIcon,
		condition: () => !!actor.sub,
		action: () => window.open(import.meta.env.VITE_APP_SITE + "/store", "_blank"),
	},
	{
		label: "7TV Settings",
		icon: GearsIcon,
		action: () => emit("open-settings"),
	},
].map((b) => ({
	...b,
	container: (() => {
		const el = document.createElement("div");
		el.classList.add("cursor-pointer", "hover:bg-secondary-lightest", "active:bg-secondary-lightest/60");
		el.style.borderRadius = "0.25rem";

		return el;
	})(),
}));

function renderButtons(): void {
	const list = props.el.querySelector(".chat-actions-menu-list");
	if (!list || !list.children.length) return;

	for (const button of buttons) {
		if (!button.container) continue;
		if (list.contains(button.container)) continue;

		list.children[0].insertAdjacentElement("afterend", button.container);
	}
}

watchEffect(renderButtons);
useEventListener(props.el, "click", renderButtons);

onUnmounted(() => {
	for (const button of buttons) {
		if (!button.container) continue;
		button.container.remove();
	}
});
</script>

<style scoped lang="scss">
.seventv-chat-settings-button {
	display: flex;
	justify-content: space-between;
	border-radius: 0.5em;
	padding: 0.5em;

	> div > * {
		display: inline-block;
		vertical-align: middle;
	}

	> div:nth-child(1) {
		font-weight: 500;
		font-size: 0.875rem;
		display: grid;
		grid-template-columns: 0.5em 1fr;
		align-items: center;
		column-gap: 1rem;

		> svg {
			font-size: 1rem;
		}
	}
}
</style>
