<template>
	<Teleport :to="emoteMenuButtonContainer">
		<button ref="emoteMenuButton" class="seventv-emote-menu-button" @click="emoteMenu.open = !emoteMenu.open">
			<Logo7TV provider="7TV" class="icon" />
		</button>
	</Teleport>

	<template v-if="emoteMenu.open && emoteMenuAnchor">
		<EmoteMenu
			:anchor-el="emoteMenuAnchor"
			width="20rem"
			scale="0.62rem"
			@emote-click="onEmoteClick($event)"
			@close="close"
		/>
	</template>
</template>

<script setup lang="ts">
import { onUnmounted, ref, watch } from "vue";
import Logo7TV from "@/assets/svg/logos/Logo7TV.vue";
import EmoteMenu from "@/app/emote-menu/EmoteMenu.vue";
import { useEmoteMenuContext } from "@/app/emote-menu/EmoteMenuContext";

const props = defineProps<{
	container: HTMLElement | null;
	onPickEmote: ((emote: SevenTV.ActiveEmote) => void) | null;
}>();

const emoteMenu = useEmoteMenuContext();

const emoteMenuAnchor = ref<HTMLDivElement | null>(null);

const emoteMenuButtonContainer = document.createElement("seventv-container");

function close(ev: MouseEvent): void {
	if (!(ev.target instanceof HTMLElement)) return;
	if (emoteMenuAnchor.value?.contains(ev.target) || emoteMenuButtonContainer.contains(ev.target)) return;

	emoteMenu.open = false;
}

watch(
	() => props.container,
	async (container) => {
		emoteMenuAnchor.value =
			document.querySelector<HTMLDivElement>("#channel-chatroom > div > div:has(#chat-input-wrapper)") ?? null;

		if (!container && emoteMenu.open) {
			emoteMenu.open = false;
		}

		if (!container) return;

		const input = container.querySelector("div:has(> .editor-input)");
		if (input) {
			input.after(emoteMenuButtonContainer);
		} else if (container.lastElementChild) {
			container.lastElementChild.insertAdjacentElement("beforebegin", emoteMenuButtonContainer);
		} else {
			container.appendChild(emoteMenuButtonContainer);
		}
	},
	{ immediate: true },
);

function onEmoteClick(emote: SevenTV.ActiveEmote) {
	props.onPickEmote?.(emote);
}

onUnmounted(() => {
	emoteMenuButtonContainer.remove();
});
</script>

<style scoped lang="scss">
.seventv-emote-menu-wrap {
	width: 21rem !important;
}

.seventv-emote-menu-button {
	display: grid;
	align-items: center;
	border: none;
	background: transparent;
	cursor: pointer;
	transition: background 0.2s ease-in-out;
	height: 1.875rem;
	border-radius: 0.25rem;
	padding: 0 0.5rem;

	&:hover {
		background: rgba(255, 255, 255, 15%);
	}

	.icon {
		font-size: 1rem;
	}
}
</style>
