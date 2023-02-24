import type ChatModuleVue from "@/site/youtube.com/modules/chat/ChatModule.vue";

declare type YtModuleID = keyof YtModuleComponentMap;

declare type YtModuleComponentMap = {
	chat: typeof ChatModuleVue;
};
