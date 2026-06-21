<template>
	<main class="seventv-settings-emote-blacklist">
		<h3>Per-Channel Emote Blacklist</h3>
		<p>
			Hide individual 7TV emotes in specific channels. The message stays readable — only the emote
			image is replaced by its plain text.
		</p>

		<div v-if="entries.length === 0" class="seventv-settings-emote-blacklist-empty">
			<p>
				No emotes hidden yet. Open an emote's hover card in chat and click
				<em>"Hide in this channel"</em> to add it here.
			</p>
		</div>

		<section v-for="entry in entries" :key="entry.channel" class="seventv-settings-emote-blacklist-channel">
			<header>
				<h4>#{{ entry.channel }}</h4>
				<UiButton class="danger" @click="clearChannel(entry.channel)">Clear all</UiButton>
			</header>

			<ul class="seventv-settings-emote-blacklist-list">
				<li v-for="name in entry.emotes" :key="name">
					<span class="emote-name">{{ name }}</span>
					<button
						class="remove"
						:title="`Show ${name} again in ${entry.channel}`"
						@click="removeEmote(entry.channel, name)"
					>
						<TwClose />
					</button>
				</li>
			</ul>
		</section>

		<div v-if="entries.length > 0" class="seventv-settings-emote-blacklist-footer">
			<UiButton class="danger" @click="clearAll">Reset everything</UiButton>
		</div>
	</main>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useConfig } from "@/composable/useSettings";
import UiButton from "@/ui/UiButton.vue";
import TwClose from "@/assets/svg/twitch/TwClose.vue";

type BlacklistMap = Record<string, string[]>;

const blacklist = useConfig<BlacklistMap>("chat.emote_blacklist_per_channel");

const entries = computed(() =>
	Object.entries(blacklist.value ?? {})
		.filter(([, list]) => Array.isArray(list) && list.length > 0)
		.map(([channel, emotes]) => ({
			channel,
			emotes: [...emotes].sort((a, b) => a.localeCompare(b)),
		}))
		.sort((a, b) => a.channel.localeCompare(b.channel)),
);

function writeMap(next: BlacklistMap) {
    blacklist.value = next; // reassign to trigger reactivity in settings store
}

function removeEmote(channel: string, name: string) {
    const current = { ...(blacklist.value ?? {}) };
    const list = (current[channel] ?? []).filter((n) => n !== name);
	if (list.length > 0) current[channel] = list;
	else delete current[channel];
	writeMap(current);
}

function clearAll() {
	writeMap({});
}
</script>

<style scoped lang="scss">
.seventv-settings-emote-blacklist {
	padding: 1rem 1.5rem;
	display: flex;
	flex-direction: column;
	gap: 1.25rem;

	h3 {
		margin: 0;
	}

	p {
		opacity: 0.8;
		margin: 0;
	}

	&-empty {
		padding: 1rem;
		border: 1px dashed hsla(0, 0%, 100%, 0.15);
		border-radius: 0.4rem;
	}

	&-channel {
		border: 1px solid hsla(0, 0%, 100%, 0.08);
		border-radius: 0.5rem;
		padding: 0.75rem 1rem;
		background: hsla(0, 0%, 100%, 0.02);

		header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 1rem;
			margin-bottom: 0.5rem;

			h4 {
				margin: 0;
				font-size: 1rem;
			}
		}
	}

	&-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;

		li {
			display: inline-flex;
			align-items: center;
			gap: 0.35rem;
			padding: 0.2rem 0.4rem 0.2rem 0.55rem;
			background: hsla(0, 0%, 100%, 0.06);
			border-radius: 999px;
			font-size: 0.85rem;

			.emote-name {
				font-family: var(--seventv-font-monospace, monospace);
			}

			.remove {
				all: unset;
				cursor: pointer;
				display: inline-flex;
				width: 1rem;
				height: 1rem;
				border-radius: 50%;
				opacity: 0.6;

				&:hover {
					opacity: 1;
					background: hsla(0, 100%, 60%, 0.25);
				}
			}
		}
	}

	&-footer {
		display: flex;
		justify-content: flex-end;
	}
}
</style>
