<template>
	<EmoteMenu :container="mod?.instance?.container ?? null" :on-pick-emote="onPickEmote" />
</template>

<script setup lang="ts">
import { watch } from "vue";
import { log } from "@/common/Logger";
import { convertKickEmoteSet } from "@/common/Transform";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useChatEmotes } from "@/composable/chat/useChatEmotes";
import { useCookies } from "@/composable/useCookies";
import { declareModule, getModuleRef } from "@/composable/useModule";
import EmoteMenu from "./EmoteMenu.vue";

const { markAsReady } = declareModule("emote-menu", {
	name: "Emote Menu",
	depends_on: [],
});

const mod = getModuleRef<"KICK", "chat-input">("chat-input");

const ctx = useChannelContext();
const emotes = useChatEmotes(ctx);

function onPickEmote(emote: SevenTV.ActiveEmote) {
	if (emote.provider === "EMOJI") {
		mod?.value?.instance?.appendText(emote.unicode ?? emote.name);
	} else {
		mod?.value?.instance?.appendText(emote.name);
	}
}

watch(
	() => ctx.id,
	async (id, oldID) => {
		if (!id || id === oldID) return;

		const cookies = useCookies();
		const sessionToken = cookies.get("session_token");
		const xsrfToken = cookies.get("XSRF-TOKEN");
		const headers: Record<string, string> = {};

		if (sessionToken) headers.Authorization = `Bearer ${sessionToken}`;
		if (xsrfToken) headers["X-XSRF-TOKEN"] = xsrfToken;

		const resp = await fetch(`https://kick.com/emotes/${ctx.username}`, {
			headers,
		}).catch((err) => {
			log.error("failed to fetch channel emote data", err);
		});
		if (!resp) throw new Error("failed to fetch channel emote data");

		const emoteSets = (await resp.json()) as Kick.KickEmoteSet[];

		for (const emoteSet of emoteSets) {
			emotes.providers.PLATFORM ??= {};
			emotes.providers.PLATFORM[emoteSet.id] = convertKickEmoteSet(emoteSet);
		}
	},
	{ immediate: true },
);

markAsReady();
</script>
