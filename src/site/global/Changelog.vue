<!-- eslint-disable vue/no-v-html -->
<template>
	<div ref="changelogContainer" class="seventv-changelog">
		<div class="seventv-changelog-inner">
			<div class="seventv-changelog-heading">
				<h3>
					<Logo provider="7TV" />
					<span>Changelog - 7TV Beta</span>
				</h3>

				<Close class="close-button" @click="emit('close')" />
			</div>

			<div class="seventv-change-notes">
				<span v-html="content" />
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, watchEffect } from "vue";
import { onClickOutside } from "@vueuse/core";
import Close from "@/assets/svg/Icons/Close.vue";
import Logo from "@/assets/svg/logos/Logo.vue";
import Changelog from "@/../CHANGELOG.md?raw";
import DOMPurify from "dompurify";
import { marked } from "marked";

const emit = defineEmits<{
	(e: "close"): void;
}>();

const changelogContainer = ref<HTMLElement>();
const changelogRaw = ref(Changelog);
const content = ref("");

onClickOutside(changelogContainer, () => {
	emit("close");
});

watchEffect(() => {
	content.value = marked.parse(
		DOMPurify.sanitize(changelogRaw.value, {
			ALLOWED_TAGS: [],
		}),
		{
			gfm: true,
			breaks: true,
			sanitize: true,
		},
	);
});
</script>

<style scoped lang="scss">
.seventv-changelog {
	position: fixed;
	display: flex;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	justify-content: center;
	align-items: center;
	z-index: 9999;
	pointer-events: none;
}

.seventv-changelog-inner {
	position: relative;
	width: 50%;
	height: 50%;
	max-width: 64rem;
	background-color: var(--seventv-background-transparent-2);
	backdrop-filter: blur(2em);
	outline: 0.1em solid var(--seventv-border-transparent-1);
	border-radius: 0.25em;
	overflow: auto;
	pointer-events: all;

	> .seventv-changelog-heading {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background-color: var(--seventv-background-transparent-1);

		> .close-button {
			cursor: pointer;
			margin: 0.5em;
			font-size: 2rem;
		}

		> h3 {
			padding: 0.5em;

			> svg {
				color: var(--seventv-primary);
			}
			> svg,
			span {
				margin: 0 0.1em;
				display: inline-block;
				vertical-align: middle;
			}
		}
	}
}

.seventv-change-notes {
	padding: 0.85em;
	line-height: 1.5em;

	:deep(ul) {
		list-style: square;
	}
}
</style>
