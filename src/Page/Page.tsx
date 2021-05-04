import { ChatListener } from 'src/Page/Runtime/ChatListener';
import { TabCompletion } from 'src/Page/Runtime/TabCompletion';
import { Twitch } from 'src/Page/Util/Twitch';
import { Logger } from 'src/Logger';
import { PageScriptListener } from 'src/Global/Decorators';
import { EmoteStore } from 'src/Global/EmoteStore';
import 'src/Style/Style.scss';

export const Page = {
	EmoteStore: new EmoteStore()
};

export class PageScript {
	twitch = new Twitch();
	emoteStore = emoteStore = new EmoteStore();
	chatListener = chatListener = new ChatListener(this);
	tabCompletion = new TabCompletion(this);

	currentChannel = '';

	/**
	 * The PageScript is the lower layer of the extension, it nests itself directly into the page
	 * in order to gain access to Twitch's react instance and components.
	 *
	 * The purpose of PageScript is primarily to relay info and events back to the content script,
	 * no rendering should be done at this layer as it may conflict with Twitch itself, and can easily
	 * cause major memory leak problems.
	 */
	constructor() {
		this.handleChannelSwitch();

		const scroller = this.twitch.getChatScroller();
		if (!!scroller) {
			const x = scroller.onScroll;
			scroller.onScroll = e => {
				this.sendMessageUp('ScrollChat', e);

				if (typeof x === 'function') {
					x(e);
				}
			};
		}
	}

	/**
	 * Listen for channel switch events, sending them back to the content script.
	 *
	 * This allows the extension to load and unload emote sets depending on which channel
	 * the user is currently watching.
	 */
	private handleChannelSwitch(): void {
		if (this.currentChannel != '') throw new Error('Already listening for channel switches');

		const switched = (ch: string) => this.sendMessageUp('SwitchChannel', { channelName: ch });

		// Get chat service
		const service = this.twitch.getChatService();
		this.currentChannel = service.props.channelLogin; // Set current channel

		// Begin listening for joined events, meaning the end user has switched to another channel
		service.service.client.events.joined(({ channel }) => {
			const channelName = channel.replace('#', '');
			if (channelName === this.currentChannel) return undefined;

			Logger.Get().info(`Changing channel from ${this.currentChannel} to ${channelName}`);
			this.eIndex = null;
			switched(this.currentChannel = channelName);
		});
		switched(this.currentChannel);
	}

	@PageScriptListener('EnableEmoteSet')
	whenEmoteSetIsAdded(data: EmoteStore.EmoteSet.Resolved): void {
		const set = emoteStore.enableSet(data.name, data.emotes);

		chatListener.sendSystemMessage(`Enabled set '${set.name}' (${set.size} emotes)`);
		chatListener.sendSystemMessage(`${set.getEmotes().map(e => e.name).join(', ')}`);
		chatListener.listen();
	}

	private eIndex: {
		[x: string]: EmoteStore.Emote;
	} | null = null;
	getEmoteIndex() {
		if (!!this.eIndex) {
			return this.eIndex;
		}

		const emotes = this.getAllEmotes();
		return emotes.length > 0 ? this.eIndex = emotes.map(e => ({ [e.name]: e })).reduce((a, b) => ({ ...a, ...b })) : {};
	}

	getAllEmotes(): EmoteStore.Emote[] {
		const emotes = [] as EmoteStore.Emote[];
		for (const set of this.emoteStore.sets.values()) {
			emotes.push(...set.getEmotes());
		}

		return emotes;
	}

	/**
	 * Send a message to the content script layer
	 *
	 * @param tag the event tag
	 * @param data the event data
	 */
	sendMessageUp(tag: string, data: any): void {
		window.dispatchEvent(new CustomEvent(`7TV#${tag}`, { detail: JSON.stringify(data) }));
	}
}

let emoteStore: EmoteStore;
let chatListener: ChatListener;

(() => {
	const {} = new PageScript();
})();
