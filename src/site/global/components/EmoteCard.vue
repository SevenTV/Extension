<template>
	<main class="seventv-emote-card-container">
		<div class="seventv-emote-card">
			<div class="seventv-emote-card-image">
				<img :srcset="srcset" :style="{}" />
			</div>
			<div class="seventv-emote-card-display">
				<div>
					<h3 class="seventv-emote-card-title">{{ emote.name }}</h3>
					<p class="seventv-emote-card-subtitle">{{ subtitle }}</p>
					<a v-if="owner.id" class="seventv-emote-card-owner" :href="owner.url" target="_blank">
						<img :src="owner.avatarURL" />
						<span>{{ owner.displayName }}</span>
					</a>
				</div>
			</div>
		</div>
	</main>
</template>

<script setup lang="ts">
import { reactive, ref, watch, watchEffect } from "vue";
import { imageHostToSrcsetWithsize } from "@/common/Image";
import { log } from "@/common/Logger";
import { convertTwitchEmote } from "@/common/Transform";
import { useApollo } from "@/composable/useApollo";
import { emoteCardQuery } from "@/assets/gql/tw.emote-card.gql";

const props = defineProps<{
	emote: SevenTV.ActiveEmote;
	size: [width: number, height: number];
}>();

const host = ref<SevenTV.ImageHost | null>(props.emote.data?.host ?? null);
const srcset = ref("");
const owner = reactive({
	id: "",
	username: "",
	displayName: "",
	avatarURL: "",
	url: "",
});
const subtitle = ref("");

watchEffect(async () => {
	// for twitch emotes we
	if (props.emote.provider === "TWITCH") {
		const apollo = useApollo();
		if (!apollo) return;

		const res = await apollo
			.query<emoteCardQuery.Result, emoteCardQuery.Variables>({
				query: emoteCardQuery,
				variables: {
					emoteID: props.emote.id,
					artistEnabled: true,
					octaneEnabled: true,
				},
			})
			.catch((err) => log.error("failed to fetch emote card", err));
		if (!res) return;

		const { emote } = res.data;
		if (!emote) return;

		// extract displayable data
		const e = convertTwitchEmote(emote as unknown as Twitch.TwitchEmote);
		host.value = e.host;

		if (emote.owner) {
			owner.id = emote.owner.id;
			owner.username = emote.owner.login;
			owner.displayName = emote.owner.displayName;
			owner.avatarURL = emote.owner.profileImageURL;
			owner.url = `https://twitch.tv/${emote.owner?.login}`;
		}

		subtitle.value = emote.subscriptionTier?.split("_").join(" ") ?? emote.type;
	}
});

watch(
	host,
	(host) => {
		if (!host || !host.files.length) return;

		srcset.value = imageHostToSrcsetWithsize(props.size[0], props.size[1], host, props.emote.provider);
	},
	{ immediate: true },
);
</script>

<style scoped lang="scss">
main.seventv-emote-card-container {
	display: block;
	width: 100%;
	height: 100%;

	.seventv-emote-card {
		display: grid;
		column-gap: 0.25em;
		place-content: center;
		grid-template-columns: 8rem 1fr;
		width: 32rem;
		height: 9rem;
		background-color: var(--seventv-background-transparent-1);
		outline: 0.1em solid var(--seventv-border-transparent-1);
		backdrop-filter: blur(0.5rem);
		border-radius: 0.25rem;

		.seventv-emote-card-image {
			display: grid;
			place-items: center;
			padding: 0.5em;
		}

		.seventv-emote-card-display {
			display: grid;
			padding: 0.5em 0;

			h3 {
				font-size: 2rem;
				font-weight: 600;
				color: var(--seventv-text-primary);
			}
		}

		.seventv-emote-card-subtitle {
			font-size: 0.88rem;
			font-weight: 800;
			color: var(--seventv-text-primary);
		}

		.seventv-emote-card-owner {
			display: grid;
			grid-template-columns: 2rem 1fr;
			align-items: center;
			gap: 0.5rem;
			margin-top: 0.5rem;

			> img {
				width: 100%;
				height: 100%;
				clip-path: circle(50% at 50% 50%);
			}

			> span {
				font-size: 1.25rem;
				font-weight: 600;
				color: var(--seventv-text-primary);
			}
		}
	}
}
</style>
