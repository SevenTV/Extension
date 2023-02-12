import type AutoclaimModuleVue from "@/site/twitch.tv/modules/avatars/AutoclaimModuleVue.vue";
import type AvatarsModuleVue from "@/site/twitch.tv/modules/avatars/AvatarsModule.vue";
import type ChatInputControllerComponent from "@/site/twitch.tv/modules/chat-input-controller/ChatInputControllerModule.vue";
import type ChatInputModuleVue from "@/site/twitch.tv/modules/chat-input/ChatInputModule.vue";
import type ChatVodModuleVue from "@/site/twitch.tv/modules/chat-vod/ChatVodModule.vue";
import type ChatModuleVue from "@/site/twitch.tv/modules/chat/ChatModule.vue";
import type EmoteMenuModuleVue from "@/site/twitch.tv/modules/emote-menu/EmoteMenuModule.vue";
import type ModLogsModule from "@/site/twitch.tv/modules/mod-logs/ModLogsModule.vue";
import type SettingsModuleVue from "@/site/twitch.tv/modules/settings/SettingsModule.vue";

declare type ModuleID = keyof ModuleComponentMap;

declare type ModuleComponentMap = {
	"chat-input-controller": typeof ChatInputControllerComponent;
	"chat-input": typeof ChatInputModuleVue;
	"chat-vod": typeof ChatVodModuleVue;
	"emote-menu": typeof EmoteMenuModuleVue;
	"mod-logs": typeof ModLogsModule;
	autoclaim: typeof AutoclaimModuleVue;
	avatars: typeof AvatarsModuleVue;
	chat: typeof ChatModuleVue;
	settings: typeof SettingsModuleVue;
};
