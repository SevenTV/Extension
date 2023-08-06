<template>
	<div class="seventv-chat-message-rich-embed">
		<a :href="richEmbed.request_url" target="_blank" class="seventv-chat-message-rich-embed-link">
			<div class="seventv-chat-message-rich-embed-layout">
				<div class="seventv-chat-message-rich-embed-layout-thumbnail">
					<img :src="richEmbed.thumbnail_url" alt="thumbnail" />
				</div>
				<div class="seventv-chat-message-rich-embed-layout-description">
					<div>
						<p class="seventv-chat-message-rich-embed-layout-description-title">{{ richEmbed.title }}</p>
					</div>
					<div v-if="richEmbed.twitch_metadata.clip_metadata.id">
						<p class="seventv-chat-message-rich-embed-layout-description-author">
							Clipped by {{ richEmbed.author_name }}
						</p>
					</div>
				</div>
			</div>
		</a>
	</div>
</template>

<script setup lang="ts">
import type { RichEmbed } from "@/common/chat/ChatMessage";

defineProps<{
	richEmbed: RichEmbed;
}>();
</script>

<style scoped lang="scss">
.seventv-chat-message-rich-embed {
	border-radius: 0.25rem;
	box-shadow:
		0 0.25rem 0.5rem var(--seventv-embed-border),
		0 0 0.5rem var(--seventv-embed-border);
	background-color: var(--seventv-embed-background);

	&:hover {
		background-color: var(--seventv-embed-background-highlight);
	}

	.seventv-chat-message-rich-embed-link {
		color: inherit;
		text-decoration: none;
	}

	.seventv-chat-message-rich-embed-layout {
		display: flex;
		flex-wrap: nowrap;
		padding: 0.5rem;

		.seventv-chat-message-rich-embed-layout-thumbnail {
			height: 4.5rem;
			width: 8rem;
			flex-shrink: 0;
		}

		.seventv-chat-message-rich-embed-layout-description {
			display: flex;
			flex-direction: column;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
			padding-left: 1rem;

			.seventv-chat-message-rich-embed-layout-description-title {
				font-weight: bold;
			}

			.seventv-chat-message-rich-embed-layout-description-author {
				color: var(--seventv-text-color-secondary);
			}
		}
	}
}
</style>
