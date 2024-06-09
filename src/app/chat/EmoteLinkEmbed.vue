<template>
	<div class="emote-link-embed">
		<div class="emote-link-container" :blurred="blurred">
			<template v-if="emote?.data">
				<a :href="link" target="_blank" class="link">
					<div class="emote-preview">
						<Emote v-if="emote" :emote="emote" />
					</div>
				</a>
				<div class="description">
					<p class="emote-name" :title="emote.name">{{ emote.name }}</p>
					<template v-if="emote.data.owner">
						<p class="emote-owner">
							{{ emote.data.owner.display_name }}
						</p>
					</template>
				</div>
				<div class="action-button" :type="buttonType" @click="onClick">
					<template v-if="buttonType === TYPE.LINK">
						<OpenLinkIcon />
					</template>
					<template v-else>
						{{ buttonType === TYPE.ADD ? "+" : "-" }}
					</template>
				</div>
			</template>
		</div>

		<div v-if="emote?.data && blurred" class="emote-unlisted-warning" @click="blurred = false">
			Emote is unlisted! Click to view.
		</div>
	</div>
	<div v-if="mut.needsLogin" class="login-required">
		<a href="#" @click="openAuthPage"> Authenticate extension to manage emotes </a>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useSetMutation } from "@/composable/useSetMutation";
import OpenLinkIcon from "@/assets/svg/icons/OpenLinkIcon.vue";
import Emote from "./Emote.vue";
import { useSettingsMenu } from "../settings/Settings";

const props = defineProps<{
	emoteId: string;
}>();

const link = import.meta.env.VITE_APP_SITE + `/emotes/${props.emoteId}`;
const emote = ref<SevenTV.ActiveEmote>();
const blurred = ref(true);

const mut = useSetMutation();
const sCtx = useSettingsMenu();

const isEmoteInSet = computed(() => {
	return !!mut.set?.emotes.find((emote) => emote.id === props.emoteId);
});

const TYPE = {
	ADD: "add",
	REMOVE: "remove",
	LINK: "link",
};

async function onClick() {
	switch (buttonType.value) {
		case TYPE.ADD:
			await mut.add(props.emoteId);
			break;
		case TYPE.REMOVE:
			await mut.remove(props.emoteId);
			break;
		case TYPE.LINK:
			window.open(link, "_blank");
			break;
	}
}

const openAuthPage = (e: MouseEvent) => {
	e.preventDefault();
	sCtx.open = true;
	sCtx.switchView("profile");
	return false;
};

const buttonType = computed(() => {
	if (!mut.canEditSet) return TYPE.LINK;
	return isEmoteInSet.value ? TYPE.REMOVE : TYPE.ADD;
});

async function fetchEmote() {
	const emoteDataRaw = await fetch(import.meta.env.VITE_APP_API + `/emotes/${props.emoteId}`);
	if (!emoteDataRaw.ok) return;
	const emoteData = (await emoteDataRaw.json()) as SevenTV.Emote;
	if (emoteData.lifecycle === 2) return;

	emote.value = {
		id: emoteData.id,
		name: emoteData.name,
		data: emoteData,
	};

	if (emoteData.listed !== false) {
		blurred.value = false;
	}
}

onMounted(fetchEmote);
</script>

<style scoped lang="scss">
.login-required {
	display: flex;
	justify-content: center;
	align-items: center;
	box-shadow:
		0 0.25rem 0.5rem var(--seventv-embed-border),
		0 0 0.5rem var(--seventv-embed-border);
	background-color: var(--seventv-embed-background);
	height: 3rem;
	margin-top: -0.5rem;
}

.emote-link-embed {
	border-radius: 0.25rem;
	margin: 0.5rem 0;
	height: 4.2rem;
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
		background-color: rgba(128, 0, 0, 50%);
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
		gap: 1rem;

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
				min-width: 3.2rem;
			}
		}

		.description {
			width: 100%;
			overflow: hidden;

			> p {
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}

			.emote-name {
				font-weight: bold;
			}

			.emote-owner {
				color: var(--seventv-text-color-secondary);
				font-size: 1rem;
				line-height: 1rem;
			}
		}

		.action-button {
			padding: 0.5rem;
			border: 0.1rem solid black;
			border-radius: 0.25rem;
			aspect-ratio: 1;
			width: 3.2rem;
			height: 3.2rem;

			text-align: center;
			vertical-align: middle;
			flex-shrink: 0;
			cursor: pointer;

			&[type="add"] {
				background-color: green;
				font-weight: 1200;
				font-size: 2rem;
			}

			&[type="remove"] {
				background-color: red;
				font-weight: 1200;
				font-size: 2rem;
			}

			&[type="link"] {
				background-color: hsla(0deg, 0%, 50%, 6%);
				display: flex;

				> svg {
					margin: auto;
					justify-content: middle;
					align-items: center;
				}
			}
		}
	}
}
</style>
