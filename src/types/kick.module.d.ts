import AuthModuleVue from "@/site/kick.com/modules/auth/AuthModule.vue";
import ChatModuleVue from "@/site/kick.com/modules/chat/ChatModule.vue";
import SettingsModuleVue from "@/site/kick.com/modules/settings/SettingsModule.vue";

declare type KickModuleID = keyof KickModuleComponentMap;

declare namespace Kick {
	namespace Message {
		interface DefaultProps {
			channelSlug: string;
			message: {
				id: string;
				chatroom_id: number;
				content: string;
				created_at: string;
				sender: {
					id: number;
					username: string;
					slug: string;
					type: string;
				};
			};
			sender: {
				id: number;
				slug: string;
				username: string;
			};
			messageId: string;
		}
		type MessageListProps = {
			children: ReactExtended.WritableComponent<DefaultProps>[];
		};
	}
}

declare type KickModuleComponentMap = {
	auth: typeof AuthModuleVue;
	chat: typeof ChatModuleVue;
	settings: typeof SettingsModuleVue;
};
