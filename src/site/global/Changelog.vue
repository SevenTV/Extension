<!-- eslint-disable vue/no-v-html -->
<template>
	<div class="seventv-changelog-inner">
		<div class="seventv-changelog-heading">
			<h3>
				<Logo provider="7TV" />
				<span>Changelog - 7TV</span>
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
		background-color: var(--seventv-background-shade-3);
		padding: 0.5rem;
		border-bottom: 0.1rem solid var(--seventv-primary);

		> .close-button {
			cursor: pointer;
			margin: 0.5em;
			font-size: 2rem;
			fill: currentColor;
		}

		> h3 {
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
		display: grid;
		row-gap: 0.5rem;
		list-style: square;
		margin: 0.25rem 0.5rem;
	}

	:deep(li) {
		opacity: 0.75;
	}

	:deep(h3) {
		margin-bottom: 2rem;
		font-size: 2rem;
	}

	:deep(h4) {
		margin: 1rem 0;
		font-size: 1.5rem;
	}

	:deep(p) {
		margin: 0.5rem 0;
	}

	:deep(hr) {
		all: unset;
		display: block;
		margin: 1rem 0;
		border-top: 0.01rem solid var(--seventv-input-border);
	}
}
</style>
