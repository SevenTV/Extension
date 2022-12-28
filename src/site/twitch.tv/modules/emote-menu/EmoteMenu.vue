<template>
	<Teleport :to="containerEl">
		<div class="emote-menu-container" :visible="isVisible">
			<div class="emote-menu">
				<div class="header">
					<div
						v-for="provider of emoteMaps.keys()"
						:key="provider"
						class="provider-icon"
						:selected="provider == selected"
						@click="selected = provider"
					>
						{{ provider }}
					</div>
				</div>
				<template v-for="[provider, emoteSet] of emoteMaps" :key="provider">
					<div class="body" :selected="provider == selected">
						<UiScrollable class="scroll-area">
							<div class="emote-area">
								<template v-for="emote in emoteSet" :key="emote.name">
									<div
										class="emote-container"
										:class="`ratio-${determineRatio(emote)}`"
										@click="insertText(emote.name)"
									>
										<ChatEmote :emote="emote" />
									</div>
								</template>
							</div>
						</UiScrollable>
						<div class="sidebar"></div>
					</div>
				</template>
			</div>
		</div>
	</Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import { HookedInstance } from "@/common/ReactHooks";
import { defineFunctionHook, unsetPropertyHook } from "@/common/Reflection";
import { useChatAPI } from "../../ChatAPI";
import ChatEmote from "../chat/components/ChatEmote.vue";
import UiScrollable from "@/ui/UiScrollable.vue";

const props = defineProps<{
	instance: HookedInstance<Twitch.ChatInputController>;
}>();

const containerEl = ref<Element>();
containerEl.value = document.querySelector(".chat-input__textarea") ?? undefined;

const isVisible = ref(false);
const selected = ref("TWITCH" as SevenTV.Provider);

const emoteMaps = ref(new Map<SevenTV.Provider, SevenTV.ActiveEmote[]>());

emoteMaps.value.set("TWITCH", []);
emoteMaps.value.set("7TV", []);
emoteMaps.value.set("FFZ", []);
emoteMaps.value.set("BTTV", []);

function sortEmotes(a: SevenTV.ActiveEmote, b: SevenTV.ActiveEmote) {
	const ra = determineRatio(a);
	const rb = determineRatio(b);
	return ra == rb ? a.name.localeCompare(b.name) : ra > rb ? 1 : -1;
}

function insertText(text: string) {
	const inputRef = props.instance.component.autocompleteInputRef;
	const current = inputRef.getValue();

	inputRef.setValue(current + (current.endsWith(" ") ? "" : " ") + text + " ");
}

watch(useChatAPI().emoteMap, (emoteMap) => {
	const temp = {} as Record<SevenTV.Provider, Record<string, SevenTV.ActiveEmote>>;
	for (const emote of Object.values(emoteMap)) {
		const provider = emote.provider ?? "7TV";

		if (!temp[provider]) temp[provider] = {};

		temp[provider][emote.name] = emote;
	}

	Object.entries(temp).forEach(([p, set]) => {
		emoteMaps.value.set(p as SevenTV.Provider, Object.values(set).sort(sortEmotes));
	});
});

function determineRatio(emote: SevenTV.ActiveEmote) {
	const { width, height } = emote.data?.host.files.at(-1) ?? {};

	if (!width || !height) return 1;

	const ratio = width / height;

	if (ratio <= 1) return 1;
	else if (ratio <= 1.5625) return 2;
	else if (ratio <= 2.125) return 3;
	return 4;
}

onMounted(() => {
	const component = props.instance.component;

	defineFunctionHook(component, "onEmotePickerToggle", function () {
		isVisible.value = !isVisible.value;
	});
});

onUnmounted(() => {
	const component = props.instance.component;

	unsetPropertyHook(component, "onEmotePickerToggle");
});
</script>

<style scoped lang="scss">
.emote-menu-container {
	position: absolute;
	inset: auto 0 100% auto;
	max-width: 100%;

	&[visible="false"] {
		display: none;
	}
}

.emote-menu {
	width: 32rem;
	border-radius: 0.6rem !important;
	background-color: #18181b;
	box-shadow: var(--shadow-elevation-2) !important;
}

.header {
	display: flex;
	justify-content: space-evenly;
	box-shadow: 0 1px 2px black;
	background: rgba(217, 217, 217, 3%);
	border-radius: 0.6rem 0.6rem 0 0;
}

.provider-icon {
	margin: 0.5rem;
	padding: 1rem;
	cursor: pointer;
	user-select: none;
	box-shadow: inset 0 1px 1px black;

	&[selected="true"] {
		background: hsla(0deg, 0%, 100%, 16%);
		box-shadow: 1px 1px 4px black;
		border-radius: 0.2rem;
	}
}

.body {
	display: flex;
	height: 40rem;

	&[selected="false"] {
		display: none;
	}
}

.scroll-area {
	width: 28rem;
}

.emote-area {
	display: inline-flex;
	flex-wrap: wrap;
	margin: 0.5rem;
}

.emote-container {
	display: grid;
	background: #252528;
	border-radius: 0.5rem;
	height: 4rem;
	margin: 0.25rem;
	cursor: pointer;

	&:hover {
		background: hsla(0deg, 0%, 100%, 16%);
	}
}

.ratio-1 {
	width: 4rem;
}

.ratio-2 {
	width: 6.25rem;
}

.ratio-3 {
	width: 8.5rem;
}

.ratio-4 {
	width: 13rem;
}

.sidebar {
	width: 4rem;
	height: 100%;
	background: rgba(217, 217, 217, 3%);
	border-left: 1px solid black;
}
</style>
