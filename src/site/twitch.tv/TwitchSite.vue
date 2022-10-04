<template>
	<ChatController />
</template>

<script setup lang="ts">
import { getRouter, getUser } from "@/site/twitch.tv";
import { useStore } from "@/store/main";
import ChatController from "./modules/chat/ChatController.vue";

const props = defineProps<{
	netWorker: Worker;
	transformWorker: Worker;
}>();

const store = useStore();
store.setWorker("net", props.netWorker);
store.setWorker("transform", props.transformWorker);

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

	router.props.history.listen((loc, act) => {
		store.setLocation(route);
	});

	store.setLocation(route);
}
</script>
