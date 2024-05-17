<template>
	<div v-if="emote" class="emote-link-embed">
		<div class="emote-link-container" :blurred="blurred">
			<a :href="link" target="_blank" class="link">
				<div class="emote-preview">
					<img :srcSet="srcSet" alt="emote preview" />
				</div>
			</a>
			<div class="description">
				<div>
					<p class="emote-name">{{ emote.name }}</p>
				</div>
				<div v-if="emote.owner">
					<p class="emote-owner">Created by {{ emote.owner.username }}</p>
				</div>
			</div>
			<div v-if="canEditSet" class="action-button" :type="isEmoteInSet ? 'remove' : 'add'" @click="onClick">
				{{ isEmoteInSet ? "-" : "+" }}
			</div>
		</div>
		<div v-if="blurred" class="emote-unlisted-warning" @click="blurred = false">
			Emote is unlisted! Click to view.
		</div>
	</div>
	<div v-else />
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { imageHostToSrcset } from "@/common/Image";
import { useSetMutation } from "@/composable/useSetMutation";

const props = defineProps<{
	emoteID: string;
}>();

const link = import.meta.env.VITE_APP_SITE + `/emotes/${props.emoteID}`;
const srcSet = ref("");
const emote = ref<SevenTV.Emote>();
const blurred = ref(true);

const { add, remove, set, canEditSet } = useSetMutation();

const isEmoteInSet = computed(() => {
	return !!set?.emotes.find((emote) => emote.id === props.emoteID);
});

async function onClick() {
	if (isEmoteInSet.value) {
		remove(props.emoteID);
	} else {
		add(props.emoteID);
	}
}

async function fetchEmote() {
	const emoteDataRaw = await fetch(import.meta.env.VITE_APP_API + `/emotes/${props.emoteID}`);
	if (!emoteDataRaw.ok) return;
	const emoteData = (await emoteDataRaw.json()) as SevenTV.Emote;
	if (emoteData.lifecycle === 2) return;

	emote.value = emoteData;
	srcSet.value = imageHostToSrcset(emoteData.host, "7TV");

	if (emote.value.listed) {
		blurred.value = false;
	}
}

onMounted(fetchEmote);
</script>

<style scoped lang="scss">
.emote-link-embed {
	border-radius: 0.25rem;
	margin: 0.5rem 0;
	box-shadow:
		0 0.25rem 0.5rem var(--seventv-embed-border),
		0 0 0.5rem var(--seventv-embed-border);
	background-color: var(--seventv-embed-background);
	position: relative;

	&:hover {
		background-color: var(--seventv-embed-background-highlight);
	}

	.emote-unlisted-warning {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(128, 0, 0, 0.5);
		border-radius: 0.25rem;
		color: white;
		display: flex;
		justify-content: center;
		align-items: center;
		cursor: pointer;
	}

	.emote-link-container {
		display: flex;
		flex-wrap: nowrap;
		padding: 0.5rem;

		&[blurred="true"] {
			filter: blur(0.5rem);
			pointer-events: none;
		}

		.link {
			color: inherit;
			text-decoration: none;
			display: flex;
			flex-shrink: 0;
			vertical-align: middle;
			align-items: center;
			.emote-preview {
			}
		}

		.description {
			display: flex;
			flex-direction: column;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
			padding-left: 1rem;
			flex-grow: 1;

			.emote-name {
				font-weight: bold;
			}

			.emote-owner {
				color: var(--seventv-text-color-secondary);
			}
		}

		.action-button {
			padding: 0.5rem;
			border: 0.1rem solid black;
			border-radius: 0.25rem;
			width: 4rem;
			text-align: center;
			vertical-align: middle;
			flex-shrink: 0;
			font-weight: 1200;
			font-size: 4rem;
			cursor: pointer;

			&[type="add"] {
				background-color: green;
			}
			&[type="remove"] {
				background-color: red;
			}
			&[type="disabled"] {
				background-color: grey;
			}
		}
	}
}
</style>
