<template>
	<span class="seventv-emote-set-update-message-container">
		<div class="container-header">
			<span class="seventv-logo">
				<Logo provider="7TV" />
			</span>
			<span class="seventv-message-title"> Emote Set Update </span>
			<span v-if="appUser" class="seventv-author">
				<UserTag :user="user" />
			</span>
		</div>

		<div class="container-body">
			<!-- Whole Set -->
			<div v-if="wholeSet && wholeSet.length === 2" class="change-row">
				<span>switched the active emote set from </span>
				<strong>{{ wholeSet[0].name }}</strong>
				<span> to </span>
				<strong>{{ wholeSet[1].name }}</strong>
			</div>

			<template v-if="add.length">
				<div v-for="ae of add" :key="ae.id" class="change-row">
					<span class="change-emote">
						<Emote :emote="ae" />
					</span>
					<div class="change-content">
						<p class="emote-name" :title="ae.name">{{ ae.name }}</p>
						<template v-if="ae.data?.owner">
							<p class="emote-owner">By: {{ ae.data.owner.display_name }}</p>
						</template>
					</div>

					<span class="change-action" :type="'add'"> Added </span>
				</div>
			</template>

			<template v-if="remove.length">
				<div v-for="ae of remove" :key="ae.id" class="change-row">
					<span class="change-emote">
						<Emote :emote="ae" />
					</span>
					<div class="change-content">
						<p class="emote-name" :title="ae.name">{{ ae.name }}</p>
						<template v-if="ae.data?.owner">
							<p class="emote-owner">By: {{ ae.data.owner.display_name }}</p>
						</template>
					</div>

					<span class="change-action" :type="'remove'"> Removed </span>
				</div>
			</template>

			<template v-if="update.length">
				<div v-for="[o, n] of update" :key="o.id" class="change-row">
					<span class="change-emote">
						<Emote :emote="n" />
					</span>
					<div class="change-content">
						<p class="emote-name" :title="n.name">{{ n.name }}</p>
						<p class="emote-owner" :title="o.name">From: {{ o.name }}</p>
					</div>
					<span class="change-action" :type="'update'"> Rename </span>
				</div>
			</template>
		</div>
	</span>
</template>

<script setup lang="ts">
import { DecimalToStringRGBA } from "@/common/Color";
import type { ChatUser } from "@/common/chat/ChatMessage";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useChatMessages } from "@/composable/chat/useChatMessages";
import Logo from "@/assets/svg/logos/Logo.vue";
import Emote from "../Emote.vue";
import UserTag from "../UserTag.vue";

const props = defineProps<{
	appUser: SevenTV.User;
	add: SevenTV.ActiveEmote[];
	remove: SevenTV.ActiveEmote[];
	update: [SevenTV.ActiveEmote, SevenTV.ActiveEmote][];
	wholeSet?: [SevenTV.EmoteSet, SevenTV.EmoteSet];
}>();

const ctx = useChannelContext();
const { chatters } = useChatMessages(ctx);

const uc = props.appUser.connections?.find((c) => c.platform === "TWITCH");
const user =
	(uc ? chatters[uc.id] : null) ??
	({
		id: uc?.id ?? props.appUser.id,
		displayName: uc?.display_name ?? props.appUser.display_name,
		username: uc?.username ?? props.appUser.username,
		color: props.appUser.style?.color ? DecimalToStringRGBA(props.appUser.style.color) : "inherit",
	} as ChatUser);
</script>

<style scoped lang="scss">
.seventv-emote-set-update-message-container {
	display: block;
	background-color: rgba(41, 181, 246, 5%);
	margin: 0.5rem 0;
	border-left: 0.5rem solid var(--seventv-primary);
	border-right: 0.5rem solid var(--seventv-primary);

	.container-header {
		display: flex;
		padding: 0.5rem 0.5rem 0.5rem 1rem;
		vertical-align: middle;
		gap: 1em;
		background-color: rgba(41, 181, 246, 10%);

		.seventv-logo {
			vertical-align: middle;
			font-size: 2.5rem;
			color: var(--seventv-primary);
		}

		.seventv-message-title {
			font-weight: 600;
			font-size: 1.5rem;
			flex-grow: 1;
			margin: auto;
		}

		.seventv-author {
			font-weight: 700;
			font-size: 1.5rem;
			margin: auto;
		}
	}

	.change-row {
		display: flex;
		gap: 1rem;
		padding: 0.5rem 1rem;

		.change-action {
			flex-shrink: 0;
			font-weight: bold;
			text-shadow: 1px 1px 2px rgba(0, 0, 0, 50%);

			&[type="add"] {
				color: var(--seventv-accent);
			}

			&[type="remove"] {
				color: var(--seventv-warning);
			}

			&[type="update"] {
				color: var(--seventv-info);
			}
		}

		.change-emote {
			flex-shrink: 0;
		}

		.change-content {
			width: 100%;
			overflow: hidden;

			> p {
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}

			.emote-name {
				font-weight: bold;
				text-overflow: ellipsis;
				white-space: nowrap;
				overflow: hidden;
			}

			.emote-owner {
				color: var(--seventv-text-color-secondary);
				font-size: 1rem;
				line-height: 1rem;
			}
		}
	}
}
</style>
