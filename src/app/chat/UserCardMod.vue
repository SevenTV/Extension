<template>
	<div class="seventv-user-card-mod">
		<div class="seventv-user-card-mod-side seventv-user-card-mod-ban" :is-banned="ban ? '1' : '0'">
			<GavelIcon
				v-tooltip="ban ? t('user_card.unban_button') : t('user_card.ban_button')"
				:slashed="!!ban"
				@click="ban ? unbanUser() : banUser('')"
			/>
		</div>

		<div class="seventv-user-card-mod-side seventv-user-card-mod-warn">
			<WarningIcon
				v-tooltip="t('user_card.warn_button')"
				@click="tools.openViewerWarnPopover(target.id, target.username, 0)"
			/>
		</div>

		<div v-show="!ban" class="seventv-user-card-mod-timeout-options">
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
			v-if="ctx.actor.roles.has('BROADCASTER')"
			class="seventv-user-card-mod-side seventv-user-card-mod-moderator"
			:is-mod="isModerator ? '1' : '0'"
		>
			<ShieldIcon
				v-tooltip="isModerator ? t('user_card.unmod_button') : t('user_card.mod_button')"
				:slashed="isModerator"
				@click="setMod(!!isModerator)"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { ChatUser } from "@/common/chat/ChatMessage";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useChatModeration } from "@/composable/chat/useChatModeration";
import { useChatTools } from "@/composable/chat/useChatTools";
import { TwTypeChatBanStatus } from "@/assets/gql/tw.gql";
import GavelIcon from "@/assets/svg/icons/GavelIcon.vue";
import ShieldIcon from "@/assets/svg/icons/ShieldIcon.vue";
import WarningIcon from "@/assets/svg/icons/WarningIcon.vue";

const props = defineProps<{
	target: ChatUser;
	ban?: TwTypeChatBanStatus | null;
	isModerator?: boolean;
}>();

const emit = defineEmits<{
	(e: "victim-banned", data: TwTypeChatBanStatus): void;
	(e: "victim-unbanned"): void;
	(e: "victim-modded"): void;
	(e: "victim-unmodded"): void;
}>();

const { t } = useI18n();

const ctx = useChannelContext();
const mod = useChatModeration(ctx, props.target.username);
const tools = useChatTools(ctx);

async function banUser(duration: string): Promise<void> {
	const resp = await mod.banUserFromChat(duration).catch(() => void 0);
	if (!resp || resp.errors?.length || !resp.data?.banUserFromChatRoom.ban) return;

	emit("victim-banned", resp.data?.banUserFromChatRoom.ban);
}

async function unbanUser(): Promise<void> {
	const resp = await mod.unbanUserFromChat().catch(() => void 0);
	if (!resp || resp.errors?.length) return;

	emit("victim-unbanned");
}

async function setMod(v: boolean): Promise<void> {
	const resp = await mod.setUserModerator(props.target.id, v).catch(() => void 0);
	if (!resp || resp.errors?.length) return;

	!v ? emit("victim-modded") : emit("victim-unmodded");
}

const timeoutOptions = ["1s", "30s", "1m", "10m", "30m", "1h", "4h", "12h", "1d", "7d", "14d"];
</script>

<style scoped lang="scss">
.seventv-user-card-mod {
	display: grid;
	grid-template-columns: 3em 3em 1fr 3em;
	grid-template-rows: 1fr;
	grid-template-areas: ". . . .";
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

	.seventv-user-card-mod-side,
	.seventv-user-card-mod-timeout-options > button {
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

	.seventv-user-card-mod-warn:hover {
		color: #fd0;
	}
}
</style>
