// import AuthModuleVue from "@/site/kick.com/modules/auth/AuthModule_disabled.vue";
import ChatInputModuleVue from "@/site/kick.com/modules/chat-input/ChatInputModule.vue";
import ChatModuleVue from "@/site/kick.com/modules/chat/ChatModule.vue";
import EmoteMenuModuleVue from "@/site/kick.com/modules/emote-menu/EmoteMenuModule.vue";
import SettingsModuleVue from "@/site/kick.com/modules/settings/SettingsModule.vue";

declare type KickModuleID = keyof KickModuleComponentMap;

declare type KickModuleComponentMap = {
	auth: typeof AuthModuleVue;
	chat: typeof ChatModuleVue;
	settings: typeof SettingsModuleVue;
	"chat-input": typeof ChatInputModuleVue;
	"emote-menu": typeof EmoteMenuModuleVue;
};
