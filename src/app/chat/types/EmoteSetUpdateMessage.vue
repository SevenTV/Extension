<template>
	<span class="seventv-emote-set-update-message-container">
		<span class="seventv-logo">
			<Logo provider="7TV" />
		</span>

		<span v-if="appUser" class="seventv-author">
			<UserTag :user="user" />
		</span>

		<span class="seventv-change-detail">
			<template v-if="wholeSet && wholeSet.length === 2">
				<span>switched the active emote set from </span>
				<strong>{{ wholeSet[0].name }}</strong>
				<span> to </span>
				<strong>{{ wholeSet[1].name }}</strong>
			</template>

			<!-- Add -->
			<template v-if="add.length > 1">
				<span>added {{ add.length }} emotes </span>
			</template>
			<template v-else-if="add.length">
				<span>added </span>
			</template>

			<template v-for="ae of add" :key="ae.id">
				<span class="referenced-emote">
					<Emote :emote="ae" />
					{{ ae.name }}
				</span>
			</template>

			<!-- Remove -->
			<template v-if="add.length && remove.length">
				<span> and </span>
			</template>
			<template v-if="remove.length > 1">
				<span>removed {{ remove.length }} emotes </span>
			</template>
			<template v-else-if="remove.length">
				<span>removed </span>
			</template>

			<template v-for="ae of remove" :key="ae.id">
				<span class="referenced-emote">
					<Emote :emote="ae" />
					<span>{{ ae.name }}</span>
				</span>
			</template>

			<!-- Update -->
			<template v-if="(add.length || remove.length) && update.length">
				<span> and </span>
			</template>

			<template v-for="[o, n] of update" :key="n.id + o.id">
				<template v-if="n.name !== o.name">
					<span>changed the name of </span>
					<span class="referenced-emote">
						<Emote :emote="n" />
						<span>{{ o.name }}</span>
					</span>
					<span>to </span>
					<span class="referenced-emote">
						<span>{{ n.name }}</span>
					</span>
				</template>
			</template>
		</span>
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
	display: inline-block;
	font-size: 1.25rem;
	padding: 0.25em 0.5rem;
	width: 100%;
	background-color: rgba(41, 181, 246, 5%);
	border-right: 0.1rem solid var(--seventv-primary);
	border-left: 0.1rem solid var(--seventv-primary);
	outline: 0.1rem solid var(--seventv-primary);

	.seventv-logo {
		vertical-align: middle;
		font-size: 2.5rem;
		color: var(--seventv-primary);
		margin-right: 0.25em;
	}

	.seventv-author {
		font-weight: 700;
		margin-right: 0.25em;
	}

	.seventv-change-detail {
		.referenced-emote {
			display: inline-grid;
			gap: 0.5em;
			align-items: center;
			vertical-align: middle;
			font-weight: 700;
			grid-template-columns: 3rem auto;
			margin-right: 0.5em;
		}
	}
}
</style>
