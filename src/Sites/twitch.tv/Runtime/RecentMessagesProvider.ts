import { Twitch } from 'src/Sites/twitch.tv/Util/Twitch';

const RECENT_MESSAGES_API_URL = 'https://recent-messages.robotty.de/api/v2';

export class RecentMessagesProvider {
    private ircChatMessageRegex;
    
    constructor(private channelName: string) {
        this.channelName = channelName.toLowerCase();
        this.ircChatMessageRegex = new RegExp(`^@((?:[a-z\-]+=[A-Za-z0-9#!/:._'\\()/,\-]*;?)+) :.* PRIVMSG #${this.channelName} :?(.*)$`);
    }

    deserialize(rawMsg: string): Twitch.ChatMessage | undefined {
        const matches = rawMsg.match(this.ircChatMessageRegex);
        if (!matches) {
            return undefined;
        }

        const metadataStrings = matches[1].split(';');
        const metadata: { [key: string]: string } = {};
        for (const item of metadataStrings) {
            const [key, value] = item.split('=');
            metadata[key] = value;
        }
        const badges: { [key: string]: string } = {};
        const badgeDynamicData: { [key: string]: string } = {};
        if (metadata['badges']) {
            const badgesData = metadata['badges'].split(',');
            for (const badge of badgesData) {
                const [key, value] = badge.split('/');
                badges[key] = value;
            }
        }
        if (metadata['badge-info']) {
            const badgesInfoData = metadata['badge-info'].split(',');
            for (const badgeInfo of badgesInfoData) {
                const [key, value] = badgeInfo.split('/');
                badgeDynamicData[key] = value;
            }
        }
        const message = matches[2];

        return {
            badges,
            badgeDynamicData,
            bits: 0,
            user: {
                userDisplayName: metadata['display-name'],
                displayName: metadata['display-name'],
                isIntl: false,
                userLogin: metadata['display-name'].toLowerCase(),
                userID: metadata['user-id'],
                userType: metadata['user-type'],
                color: metadata['color'],
                isSubscriber: metadata['subscriber'] === '1'
            },
            messageParts: [
                {
                    type: 0,
                    content: message,
                }
            ],
            messageBody: message,
            message: message,
            deleted: false,
            banned: false,
            hidden: false,
            timestamp: parseInt(metadata['rm-received-ts']),
            type: 0,
            messageType: 0,
            id: metadata['id'],
            isFirstMsg: false,
            isReturningChatter: metadata['returning-chatter'] === '1',
            isHistorical: true,
            seventv: {
                patcher: null,
                words: [],
                parts: []
            },
        };
    }

    async getMessages(limit: number, after: Date): Promise<Twitch.ChatMessage[]> {
        const response = await fetch(`${RECENT_MESSAGES_API_URL}/recent-messages/${this.channelName}?limit=${limit}`);
        if (response.ok) {
			const json = await response.json();
            const validRecentMessages: Twitch.ChatMessage[] = [];
            for (const rawMsg of json['messages'] ?? []) {
                const message = this.deserialize(rawMsg);
                if (message && message.timestamp > after.getTime()) {
                    validRecentMessages.push(message);
                }
            }
            console.log(validRecentMessages);
            return validRecentMessages;
        }
        return Promise.reject(`Error fetching recent messages`);
    }
}
