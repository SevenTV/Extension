import ChatModuleVue from "@/site/kick.com/modules/chat/ChatModule.vue";

declare type KickModuleID = keyof KickModuleComponentMap;

declare type KickModuleComponentMap = {
	chat: typeof ChatModuleVue;
};
