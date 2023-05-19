<template>
	<UiFloating v-if="anchor && currentMatch.item" :anchor="anchor" placement="top">
		<div class="seventv-autocomplete-floater">
			<!-- Backwards Matches -->
			<div v-if="back.size" class="seventv-autocomplete-floater-list" direction="backwards">
				<CaretIcon />

				<template v-for="tok of back" :key="tok.token">
					<Emote v-if="tok.item" :emote="tok.item" />
				</template>
			</div>

			<!-- Current Match -->
			<div class="seventv-autocomplete-floater-list" direction="current">
				<template v-for="tok of cur" :key="tok.token">
					<Emote v-if="tok.item" :emote="tok.item" />
				</template>
			</div>

			<!-- Forwards Match -->
			<div v-if="forward.size" class="seventv-autocomplete-floater-list" direction="forwards">
				<template v-for="tok of forward" :key="tok.token">
					<Emote v-if="tok.item" :emote="tok.item" />
				</template>

				<CaretIcon />
			</div>
		</div>
	</UiFloating>
</template>

<script setup lang="ts">
import { ref, watchEffect } from "vue";
import { useEventListener } from "@vueuse/core";
import { HookedInstance } from "@/common/ReactHooks";
import { useConfig } from "@/composable/useSettings";
import CaretIcon from "@/assets/svg/icons/CaretIcon.vue";
import { TabToken } from "./ChatInput.vue";
import UiFloating from "@/ui/UiFloating.vue";
import Emote from "../chat/components/message/Emote.vue";

const props = defineProps<{
	instance: HookedInstance<Twitch.ChatAutocompleteComponent>;
	currentMatch: TabToken;
	backwardsMatches: TabToken[];
	forwardsMatches: TabToken[];
}>();

const emit = defineEmits<{
	(e: "back", ev: KeyboardEvent): void;
	(e: "forward", ev: KeyboardEvent): void;
}>();

const shouldListenToArrowPresses = useConfig("chat_input.autocomplete.carousel_arrow_keys");
const anchor = ref<Element | null>(null);

const back = ref(new Set<TabToken>());
const forward = ref(new Set<TabToken>());
const cur = ref(new Set<TabToken>());

watchEffect(() => {
	back.value = new Set(props.backwardsMatches);
	forward.value = new Set(props.forwardsMatches);
	cur.value = new Set([props.currentMatch]);

	const n = props.instance.domNodes.root;
	if (!n) return;

	anchor.value = n;
});

useEventListener(
	"keydown",
	(ev) => {
		if (!shouldListenToArrowPresses.value) return;

		if (ev.key === "ArrowLeft") {
			emit("back", ev);
		} else if (ev.key === "ArrowRight") {
			emit("forward", ev);
		}
	},
	{ capture: true },
);
</script>

<style scoped lang="scss">
.seventv-autocomplete-floater {
	z-index: 10;
	display: grid;
	grid-template-columns: repeat(3, auto);
}

.seventv-autocomplete-floater-list {
	display: flex;
	align-items: center;
	column-gap: 0.5rem;
	min-height: 5rem;
	padding: 1rem;
	background: var(--seventv-background-transparent-1);
	outline: 0.1rem solid var(--seventv-border-transparent-1);
	border-radius: 0.25rem;
	backdrop-filter: blur(1.5rem);

	:deep(.seventv-chat-emote) {
		max-height: 3rem;
		max-width: 3rem;
	}

	> svg {
		margin: 0 -0.25rem;
		font-size: 2rem;
	}

	&[direction="backwards"] > svg {
		transform: rotate(90deg);
		margin-left: -0.5rem;
		border-right: 0;
		border-top-right-radius: 0;
		border-bottom-right-radius: 0;
	}

	&[direction="current"] {
		z-index: 1;
		background-color: var(--seventv-background-transparent-2);
		border-radius: 0;
	}

	&[direction="forwards"] {
		justify-content: flex-end;
		border-top-left-radius: 0;
		border-bottom-left-radius: 0;

		> svg {
			margin-right: -0.5rem;
			transform: rotate(-90deg);
		}
	}
}
</style>
