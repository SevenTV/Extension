<template>
	<ChatModule />
	<ChatInputModule />
	<EmoteMenuModule />
	<SettingsModule />
</template>

<script setup lang="ts">
import { getRouter, getUser } from "@/site/twitch.tv";
import { useStore } from "@/store/main";
import ChatModule from "./modules/chat/ChatModule.vue";
import ChatInputModule from "./modules/chat-input/ChatInputModule.vue";
import EmoteMenuModule from "./modules/emote-menu/EmoteMenuModule.vue";
import SettingsModule from "./modules/settings/SettingsModule.vue";

const store = useStore();

// Retrieve the current user from twitch internals
const user = getUser()?.props.user ?? null;

// Retrieve twitch's internal router
const router = getRouter();

// Define the current platform identtiy
store.setIdentity(
	"TWITCH",
	user
		? {
				id: user.id,
				login: user.login,
				displayName: user.displayName,
		  }
		: null,
);

//
if (router) {
	// router may be undefined in certain places, such as popout chat
	const route = router.props.location;

	router.props.history.listen((loc) => {
		store.setLocation(loc);
	});

	store.setLocation(route);
}
</script>
