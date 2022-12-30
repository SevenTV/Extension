<template>
	<UiScrollable class="scroll-area">
		<div class="emote-area">
			<template v-for="(emoteSet, i) of emoteSets.map(filterSet).filter((s) => s.emotes.length)" :key="i">
				<div :ref="'set-' + i.toString()" class="emote-set-container">
					<div class="set-header">
						<div class="set-header-icon">
							<img v-if="emoteSet.owner && emoteSet.owner.avatar_url" :src="emoteSet.owner.avatar_url" />
							<Logo v-else class="logo" :provider="emoteSet.provider" />
						</div>
						{{ emoteSet.name }}
					</div>
					<div class="emote-set">
						<template v-for="emote of emoteSet.emotes" :key="emote.id">
							<div
								class="emote-container"
								:class="`ratio-${determineRatio(emote)}`"
								@click="insertText(emote.name)"
							>
								<ChatEmote :emote="emote" />
							</div>
						</template>
					</div>
				</div>
			</template>
		</div>
	</UiScrollable>
	<div class="sidebar">
		<template v-for="(emoteSet, i) of emoteSets.filter((s) => s.emotes.some(filterEmote))" :key="i">
			<div
				v-if="emoteSet.emotes.length"
				class="set-sidebar-icon"
				:selected="selectedSet == i"
				@click="
					{
						selectedSet = i;
						($refs['set-' + i.toString()] as HTMLDivElement[])[0].scrollIntoView({ behavior: 'smooth' });
					}
				"
			>
				<img v-if="emoteSet.owner && emoteSet.owner.avatar_url" :src="emoteSet.owner.avatar_url" />
				<Logo v-else class="logo" :provider="emoteSet.provider" />
			</div>
		</template>
	</div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { determineRatio } from "./EmoteMenuBackend";
import Logo from "@/common/Logo.vue";
import ChatEmote from "../chat/components/ChatEmote.vue";
import UiScrollable from "@/ui/UiScrollable.vue";

const props = defineProps<{
	emoteSets: SevenTV.EmoteSet[];
	inputController: Twitch.ChatInputController;
	filter: string;
}>();

function filterSet(s: SevenTV.EmoteSet) {
	return {
		...s,
		emotes: s.emotes.filter(filterEmote),
	};
}

function filterEmote(e: SevenTV.ActiveEmote) {
	return e.name.toLowerCase().includes(props.filter.toLowerCase());
}

function insertText(text: string) {
	const inputRef = props.inputController.autocompleteInputRef;
	const current = inputRef.getValue();

	inputRef.setValue(current.slice(0, props.filter.length ? props.filter.length * -1 : Infinity) + text + " ");
	props.inputController.chatInputRef.focus();
}

const selectedSet = ref(0);
</script>
<style scoped lang="scss">
.scroll-area {
	width: 28rem;
}

.emote-set-container {
	position: relative;
}

.emote-set {
	display: inline-flex;
	flex-wrap: wrap;
	margin: 0.5rem;
}

.set-header {
	height: 3rem;
	padding: 0.5rem 1.25rem;
	position: sticky;
	top: 0;
	display: flex;
	background: #18181b;
	box-shadow: 0 1px 3px #000;
}

.set-header-icon {
	height: 2rem;
	width: 2rem;
	border-radius: 0.5rem;
	margin-right: 1rem;
	overflow: clip;
}

.emote-container {
	display: grid;
	background: rgba(217, 217, 217, 3%);
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
	overflow-y: scroll;
	scrollbar-width: none;

	&::-webkit-scrollbar {
		width: 0;
		height: 0;
	}
}

.set-sidebar-icon {
	width: 2.8rem;
	height: 2.8rem;
	margin: 0.5rem auto;
	border-radius: 0.5rem;
	overflow: clip;
	cursor: pointer;

	&[selected="true"] {
		background: hsla(0deg, 0%, 100%, 16%);
	}
}

.logo {
	width: 100%;
	height: 100%;
}
</style>
