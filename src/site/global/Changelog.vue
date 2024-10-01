<!-- eslint-disable vue/no-v-html -->
<template>
	<div class="seventv-changelog-inner">
		<div v-if="!noHeader" class="seventv-changelog-heading">
			<h3>
				<Logo provider="7TV" />
				<span>Changelog - 7TV</span>
			</h3>
		</div>

		<div ref="contentRef" class="seventv-change-notes">
			<span v-html="content" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { inject, nextTick, ref, watchEffect } from "vue";
import { SITE_ASSETS_URL } from "@/common/Constant";
import Logo from "@/assets/svg/logos/Logo.vue";
import { marked } from "marked";

defineProps<{
	noHeader?: boolean;
}>();

const Changelog = import.meta.env.VITE_APP_CHANGELOG;
const changelogRaw = ref(Changelog);
const content = ref("");

const assetsBase = inject(SITE_ASSETS_URL, "");

const contentRef = ref<HTMLElement>();
watchEffect(() => {
	content.value = marked.parse(changelogRaw.value, {
		walkTokens: (tok) => {
			if (tok.type === "image" && tok.href.charAt(0) === "~" && assetsBase) {
				tok.href = updateMediaHref(tok.href);
			}
		},
		gfm: true,
		breaks: true,
	});

	nextTick(() => {
		if (!contentRef.value) return;

		// Update video sources
		const videos = contentRef.value.querySelectorAll("video");
		videos.forEach((vid) => {
			const src = vid.getElementsByTagName("source")[0] as HTMLSourceElement;
			if (!src) return;

			src.src = updateMediaHref(src.getAttribute("x-src") ?? src.src);
		});
	});
});

function updateMediaHref(value: string): string {
	if (value.charAt(0) === "~" && assetsBase) {
		return assetsBase + value.slice(1);
	}

	return value;
}
</script>

<style scoped lang="scss">
.seventv-changelog-inner {
	> .seventv-changelog-heading {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background-color: var(--seventv-background-shade-3);
		padding: 0.5rem;
		margin-bottom: -1.5rem;
		border-bottom: 0.1rem solid var(--seventv-primary);

		> .close-button {
			cursor: pointer;
			margin: 0.5em;
			font-size: 2rem;
			fill: currentcolor;
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

	:deep(img) {
		padding: 0.5rem;
		background-color: var(--seventv-background-shade-3);
		border-radius: 0.25rem;
		max-width: 36rem;
		max-height: 28rem;
	}

	:deep(a) {
		color: var(--seventv-primary);
		text-decoration: none;

		&:hover {
			text-decoration: underline;
		}
	}

	:deep(video) {
		max-width: 36rem;
		max-height: 28rem;
	}

	:deep(ul) {
		display: grid;
		row-gap: 0.5rem;
		list-style: square;
		margin: 0.5rem 1rem;
	}

	:deep(li) {
		color: var(--seventv-text-color-secondary);
	}

	:deep(h3) {
		margin-bottom: 1rem;
		margin-top: 1.5rem;
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
