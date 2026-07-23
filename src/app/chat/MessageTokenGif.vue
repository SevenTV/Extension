<template>
	<span class="seventv-chat-gif-container">
		<img
			class="seventv-chat-gif"
			:src="token.content.url"
			:alt="token.content.title || 'GIF'"
			decoding="async"
			draggable="false"
		/>
		<button
			v-if="token.content.report"
			class="seventv-chat-gif-report"
			type="button"
			aria-label="Report GIF"
			@click.stop="token.content.report"
		>
			<ReportIcon aria-hidden="true" />
		</button>
	</span>
</template>

<script setup lang="ts">
import type { GifToken } from "@/common/chat/ChatMessage";
import ReportIcon from "@/assets/svg/icons/ReportIcon.vue";

defineProps<{
	token: GifToken;
}>();
</script>

<style scoped lang="scss">
.seventv-chat-gif-report {
	position: absolute;
	top: 0.5rem;
	right: 0.5rem;
	display: grid;
	width: 3.2rem;
	height: 3.2rem;
	place-items: center;
	padding: 0;
	border: 0;
	border-radius: 0.4rem;
	opacity: 0;
	color: white;
	font-size: 1.8rem;
	background-color: rgba(0, 0, 0, 70%);
	cursor: pointer;
	pointer-events: none;
	transition: opacity 100ms ease-out;

	&::after {
		content: "";
		position: absolute;
		inset: -0.4rem;
	}

	&:focus-visible {
		outline: 0.2rem solid currentcolor;
		outline-offset: 0.2rem;
	}
}

.seventv-chat-gif-container {
	position: relative;
	display: block;
	width: fit-content;
	max-width: 100%;
	margin-top: 0.4rem;

	&:hover,
	&:focus-within {
		.seventv-chat-gif-report {
			opacity: 1;
			pointer-events: auto;
		}
	}
}

.seventv-chat-gif {
	display: block;
	max-width: 100%;
	max-height: 24rem;
	border-radius: 0.4rem;
}
</style>
