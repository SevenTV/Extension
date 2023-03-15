import UiButton from '@/ui/UiButton.vue';

<template>
	<main class="seventv-popup-inner">
		<h1>
			Coming Soon

			<p>You'll be able to see all the various chats you're connected to from here!</p>
		</h1>

		<div class="onboarding-button">
			<UiButton class="ui-button-important" @click="openOnboarding">
				<span>Onboarding</span>
				<ChevronIcon direction="right" />
			</UiButton>
		</div>
	</main>
</template>

<script setup lang="ts">
import ChevronIcon from "@/assets/svg/icons/ChevronIcon.vue";
import UiButton from "@/ui/UiButton.vue";

function openOnboarding() {
	chrome.tabs.create({
		url: chrome.runtime.getURL("index.html#/onboarding/start"),
	});
}
</script>

<style scoped lang="scss">
main {
	padding: 1rem;

	p {
		font-size: 1rem;
	}

	.onboarding-button {
		margin-top: 1rem;
		font-size: 2rem;

		button {
			display: flex;
			align-items: center;
		}
	}
}
</style>
