import type ChatInputModuleVue from "@/site/twitch.tv/modules/chat-input/ChatInputModule.vue";
import type ChatModuleVue from "@/site/twitch.tv/modules/chat/ChatModule.vue";
import type EmoteMenuModuleVue from "@/site/twitch.tv/modules/emote-menu/EmoteMenuModule.vue";
import type SettingsModuleVue from "@/site/twitch.tv/modules/settings/SettingsModule.vue";

declare type ModuleID = keyof ModuleComponentMap;

declare type ModuleComponentMap = {
	chat: typeof ChatModuleVue;
	"chat-input": typeof ChatInputModuleVue;
	settings: typeof SettingsModuleVue;
	"emote-menu": typeof EmoteMenuModuleVue;
};
