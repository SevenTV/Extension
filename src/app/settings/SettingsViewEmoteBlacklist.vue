<template>
	<div class="seventv-settings-emote-blacklist">
		<p class="seventv-settings-emote-blacklist-intro">
			Hidden 7TV emotes, per channel. Click an emote's hover card in chat and choose
			<em>"Hide in this channel"</em> to add one here — the message stays visible, only the emote is swapped for
			plain text.
		</p>

		<div v-if="entries.length === 0" class="seventv-settings-emote-blacklist-empty">
			<p>Nothing hidden yet.</p>
		</div>

		<section v-for="entry in entries" :key="entry.channel" class="seventv-settings-emote-blacklist-channel">
			<header>
				<h4>
					#{{ entry.channel }}
					<span class="seventv-settings-emote-blacklist-count">{{ entry.emotes.length }}</span>
				</h4>
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
						<span>Show again</span>
					</button>
				</li>
			</ul>
		</section>

		<div v-if="entries.length > 0" class="seventv-settings-emote-blacklist-footer">
			<UiButton class="danger" @click="clearAll">Reset everything</UiButton>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useConfig } from "@/composable/useSettings";
import TwClose from "@/assets/svg/twitch/TwClose.vue";
import UiButton from "@/ui/UiButton.vue";

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

function clearChannel(channel: string) {
	const current = { ...(blacklist.value ?? {}) };
	delete current[channel];
	writeMap(current);
}

function clearAll() {
	writeMap({});
}
</script>

<style scoped lang="scss">
.seventv-settings-emote-blacklist {
	display: flex;
	flex-direction: column;
	gap: 1rem;
	margin: 0.5rem 1rem 1rem;
	color: var(--seventv-text-color-normal);

	&-intro {
		color: var(--seventv-text-color-secondary);
		line-height: 1.5;
		margin: 0;

		em {
			color: var(--seventv-text-color-normal);
			font-style: normal;
			font-weight: 400;
		}
	}

	&-empty {
		padding: 1rem 1.25rem;
		background: var(--seventv-background-transparent-1);
		border: 0.1em dashed var(--seventv-border-transparent-1);
		border-radius: 0.4rem;

		p {
			margin: 0;
			color: var(--seventv-text-color-secondary);
			font-weight: 600;
		}
	}

	&-channel {
		background: var(--seventv-background-transparent-1);
		outline: 0.1em solid var(--seventv-border-transparent-1);
		border-radius: 0.5rem;
		padding: 0.75rem 1rem;

		header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 1rem;
			margin-bottom: 0.65rem;

			h4 {
				display: flex;
				align-items: center;
				gap: 0.5rem;
				margin: 0;
				font-size: 1.05rem;
				font-weight: 700;
			}
		}
	}

	&-count {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1.35rem;
		height: 1.35rem;
		padding: 0 0.4rem;
		border-radius: 999px;
		background: var(--seventv-input-background);
		outline: 0.08em solid var(--seventv-input-border);
		color: var(--seventv-text-color-secondary);
		font-size: 0.75rem;
		font-weight: 700;
	}

	&-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;

		li {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 0.75rem;
			padding: 0.65rem 0.65rem 0.65rem 1rem;
			background: var(--seventv-input-background);
			outline: 0.08em solid var(--seventv-input-border);
			border-radius: 0.35rem;
			transition: outline-color 120ms ease-in-out;

			&:hover {
				outline-color: var(--seventv-warning);
			}

			.emote-name {
				font-family: var(--seventv-font-monospace, monospace);
				font-size: 1.2rem;
				font-weight: 700;
				color: var(--seventv-text-color-normal);
				word-break: break-all;
			}

			.remove {
				all: unset;
				flex-shrink: 0;
				cursor: pointer;
				display: inline-flex;
				align-items: center;
				gap: 0.35rem;
				padding: 0.3rem 0.6rem;
				border-radius: 999px;
				font-size: 0.75rem;
				font-weight: 700;
				text-transform: uppercase;
				color: var(--seventv-text-color-secondary);
				transition:
					color 120ms ease-in-out,
					background 120ms ease-in-out;

				svg {
					width: 0.7rem;
					height: 0.7rem;
				}

				&:hover {
					color: var(--seventv-background-shade-1);
					background: var(--seventv-warning);
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
