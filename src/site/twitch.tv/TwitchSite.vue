<template>
	<ChatModule />
	<ChatInputModule />
	<EmoteMenuModule />
	<SettingsModule />
</template>

<script setup lang="ts">
import { useStore } from "@/store/main";
import { useComponentHook } from "@/common/ReactHooks";
import { getRouter } from "@/site/twitch.tv";
import { useChatAPI } from "./ChatAPI";
import ChatInputModule from "./modules/chat-input/ChatInputModule.vue";
import ChatModule from "./modules/chat/ChatModule.vue";
import EmoteMenuModule from "./modules/emote-menu/EmoteMenuModule.vue";
import SettingsModule from "./modules/settings/SettingsModule.vue";

const store = useStore();
const { imageFormat } = useChatAPI();
imageFormat.value = store.avifSupported ? "AVIF" : "WEBP";

// Retrieve twitch's internal router
const router = getRouter();

// Session User
useComponentHook<Twitch.SessionUserComponent>(
	{
		predicate: (n) => {
			return n.props?.sessionUser;
		},
	},
	{
		hooks: {
			update: (inst) => {
				if (inst.component && inst.component.props && inst.component.props.sessionUser) {
					store.setIdentity("TWITCH", {
						id: inst.component.props.sessionUser.id,
						login: inst.component.props.sessionUser.displayName,
						displayName: inst.component.props.sessionUser.displayName,
					});
				}
			},
		},
	},
);

if (router) {
	// router may be undefined in certain places, such as popout chat
	const route = router.props.location;

	router.props.history.listen((loc) => {
		store.setLocation(loc);
	});

	store.setLocation(route);
}
</script>
