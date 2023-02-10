<!-- eslint-disable vue/no-v-html -->
<template>
	<div class="seventv-changelog-inner">
		<div class="seventv-changelog-heading">
			<h3>
				<Logo provider="7TV" />
				<span>Changelog - 7TV Beta</span>
			</h3>
		</div>

		<div class="seventv-change-notes">
			<span v-html="content" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, watchEffect } from "vue";
import Logo from "@/assets/svg/logos/Logo.vue";
import Changelog from "@/../CHANGELOG.md?raw";
import DOMPurify from "dompurify";
import { marked } from "marked";

const changelogRaw = ref(Changelog);
const content = ref("");

watchEffect(() => {
	content.value = marked.parse(
		DOMPurify.sanitize(changelogRaw.value, {
			ALLOWED_TAGS: ["img"],
		}),
		{
			gfm: true,
			breaks: true,
		},
	);
});
</script>

<style scoped lang="scss">
.seventv-changelog-inner {
	> .seventv-changelog-heading {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background-color: var(--seventv-background-transparent-1);
		border-radius: 0.4rem;

		> .close-button {
			cursor: pointer;
			margin: 0.5em;
			font-size: 2rem;
			fill: currentColor;
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

	:deep(hr) {
		margin: 1em 0;
		height: 0.1em;
		width: 100%;
		background-color: currentColor;
	}

	:deep(h3) {
		margin: 1rem 0 0.5rem;
	}

	:deep(p) {
		margin: 0.5rem 0;
	}
}
</style>
