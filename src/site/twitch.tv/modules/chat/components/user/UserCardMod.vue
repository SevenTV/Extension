<template>
	<div class="seventv-user-card-mod">
		<div class="seventv-user-card-mod-side seventv-user-card-mod-ban" :is-banned="isBanned ? '1' : '0'">
			<GavelIcon
				v-tooltip="isBanned ? t('user_card.unban_button') : t('user_card.ban_button')"
				:slashed="isBanned"
			/>
		</div>

		<div class="seventv-user-card-mod-timeout-options">
			<button
				v-for="opt of timeoutOptions"
				:key="opt"
				v-tooltip="t('user_card.timeout_button', { duration: opt })"
				@click="banUser(opt)"
			>
				{{ opt }}
			</button>
		</div>

		<div
			v-if="isBroadcaster"
			class="seventv-user-card-mod-side seventv-user-card-mod-moderator"
			:is-mod="isModerator ? '1' : '0'"
		>
			<ShieldIcon v-tooltip="isModerator" :slashed="isModerator" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useChatModeration } from "@/composable/chat/useChatModeration";
import GavelIcon from "@/assets/svg/icons/GavelIcon.vue";
import ShieldIcon from "@/assets/svg/icons/ShieldIcon.vue";
import type { UserCardData } from "./UserCard.vue";

const props = defineProps<{
	target: UserCardData["targetUser"];
	isBanned?: boolean;
	isModerator?: boolean;
	isBroadcaster?: boolean;
}>();

const { t } = useI18n();

const ctx = useChannelContext();
const mod = useChatModeration(ctx, props.target.username);

async function banUser(duration: string): Promise<void> {
	const resp = await mod.banUserFromChat(duration)?.catch(() => void 0);
	if (!resp || resp.errors?.length) return;
}

const timeoutOptions = ["1s", "30s", "1m", "10m", "30m", "1h", "4h", "12h", "1d", "7d", "14d"];
</script>

<style scoped lang="scss">
.seventv-user-card-mod {
	display: grid;
	grid-template-columns: 3em 1fr 3em;
	grid-template-rows: 1fr;
	grid-template-areas: ". . .";
	height: 3rem;
	align-items: center;
	border-top: 0.1rem solid hsla(0deg, 0%, 100%, 10%);

	.seventv-user-card-mod-timeout-options {
		display: grid;
		grid-template-columns: repeat(11, 1fr);
		grid-template-rows: 1fr;
		grid-template-areas: ". . . . . . . . . . .";
		gap: 0 0.5rem;
		font-size: 1rem;
		color: var(--seventv-muted);
	}

	.seventv-user-card-mod-side {
		display: grid;
		justify-content: center;
	}

	.seventv-user-card-mod-timeout-options > button,
	.seventv-user-card-mod-side {
		cursor: pointer;
		transition: color 0.1s ease-in-out;

		svg {
			font-size: 1.5rem;
		}

		&:hover {
			color: var(--seventv-warning);
		}
	}

	.seventv-user-card-mod-moderator[is-mod="0"]:hover,
	.seventv-user-card-mod-ban[is-banned="1"]:hover {
		color: var(--seventv-accent);
	}
}
</style>
