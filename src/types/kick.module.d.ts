import AuthModuleVue from "@/site/kick.com/modules/auth/AuthModule.vue";
import ChatModuleVue from "@/site/kick.com/modules/chat/ChatModule.vue";

declare type KickModuleID = keyof KickModuleComponentMap;

declare type KickModuleComponentMap = {
	auth: typeof AuthModuleVue;
	chat: typeof ChatModuleVue;
};
