<template>
	<Teleport :to="emoteMenuButtonContainer">
		<button ref="emoteMenuButton" class="seventv-emote-menu-button" @click="emoteMenu.open = !emoteMenu.open">
			<Logo7TV provider="7TV" class="icon" />
		</button>
	</Teleport>

	<template v-if="emoteMenu.open && emoteMenuAnchor">
		<EmoteMenu
			:anchor-el="emoteMenuAnchor"
			width="20.5rem"
			scale="0.62rem"
			@emote-click="emit('pick-emote', $event)"
			@close="close"
		/>
	</template>
</template>

<script setup lang="ts">
import { onUnmounted, watchEffect } from "vue";
import Logo7TV from "@/assets/svg/logos/Logo7TV.vue";
import EmoteMenu from "@/app/emote-menu/EmoteMenu.vue";
import { useEmoteMenuContext } from "@/app/emote-menu/EmoteMenuContext";

const emit = defineEmits<{
	(e: "pick-emote", emote: SevenTV.ActiveEmote): void;
}>();

const emoteMenu = useEmoteMenuContext();
const emoteMenuAnchor = document.getElementById("chatroom-footer");

const emoteMenuButtonContainer = document.createElement("seventv-container");

function close(ev: MouseEvent): void {
	if (!(ev.target instanceof HTMLElement)) return;
	if (emoteMenuAnchor?.contains(ev.target) || emoteMenuButtonContainer.contains(ev.target)) return;

	emoteMenu.open = false;
}

watchEffect(() => {
	const parent = document.getElementById("chatroom");
	if (!parent) return;

	const inputRow = parent.querySelector(".chat-message-row");
	if (!inputRow) return;

	inputRow.lastElementChild?.insertAdjacentElement("beforebegin", emoteMenuButtonContainer);
});

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
	height: 2.25rem;
	border-radius: 0.25rem;
	padding: 0 0.5rem;

	&:hover {
		background: rgba(255, 255, 255, 10%);
	}

	.icon {
		font-size: 1.25rem;
	}
}
</style>
