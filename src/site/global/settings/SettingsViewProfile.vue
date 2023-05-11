<template>
	<div v-if="actor.user">Hello {{ actor.user.display_name }}</div>
</template>
<script setup lang="ts">
import { useActor } from "@/composable/useActor";

const actor = useActor();
</script>
<style scoped lang="scss">
.profile-login {
	display: flex;
	justify-content: center;
	align-items: center;
	height: 100%;

	.login-button {
		text-align: center;
		height: 4rem;
		width: 10rem;
		border: 1px solid var(--seventv-border-transparent-1);
		border-radius: 0.4rem;
	}

	.seventv-website {
		width: 100%;
		height: 100%;
	}
}
</style>
