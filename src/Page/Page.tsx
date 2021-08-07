import { ChatListener } from 'src/Page/Runtime/ChatListener';
import { TabCompletion } from 'src/Page/Runtime/TabCompletion';
import { Twitch } from 'src/Page/Util/Twitch';
import { Logger } from 'src/Logger';
import { PageScriptListener } from 'src/Global/Decorators';
import { EmoteStore } from 'src/Global/EmoteStore';
import 'src/Style/Style.scss';

export class PageScript {
	twitch = new Twitch();
	emoteStore = emoteStore = new EmoteStore();
	chatListener = chatListener = new ChatListener(this);
	tabCompletion = tabCompletion = new TabCompletion(this);

	currentChannel = '';
	currentChannelSet: EmoteStore.EmoteSet | null = null;

	channelRegex = /(https:\/\/[a-z]*.twitch.tv\/)(?:(u|popout|moderator)\/)?([a-zA-Z0-9_]{3,25})/;

	get stopped(): boolean {
		return stopped;
	}

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
		if (!this.channelRegex.test(window.location.href)) {
			setTimeout(() => this.handleChannelSwitch(), 1000);
			return undefined;
		}
		if (this.currentChannel != '') throw new Error('Already listening for channel switches');

		const switched = (ch: string, as: string) => this.sendMessageUp('SwitchChannel', { channelName: ch, as });

		// Get chat service
		const service = this.twitch.getChatService() ?? this.twitch.getChatController();
		if (!service) {
			setTimeout(() => this.handleChannelSwitch(), 1000);
			return undefined;
		}
		let channelName = this.getCurrentChannelFromURL(); // Set current channel

		// Begin listening for joined events, meaning the end user has switched to another channel
		const interval = setInterval(() => {
			if (stopped) {
				clearInterval(interval);
				return undefined;
			}

			channelName = this.getCurrentChannelFromURL();
			if (channelName !== this.currentChannel) {
				Logger.Get().info(`Changing channel from ${this.currentChannel} to ${channelName}`);
				this.eIndex = null;
				this.currentChannelSet = null;
				switched(this.currentChannel = channelName, service.props.currentUserLogin ?? service.props.channelLogin);
			}
		}, 500);

		this.chatListener.start();
	}

	getCurrentChannelFromURL(): string {
		return window.location.href.match(this.channelRegex)?.[3] ?? '';
	}

	@PageScriptListener('EnableEmoteSet')
	whenEmoteSetIsAdded(data: EmoteStore.EmoteSet.Resolved): void {
		if (stopped) {
			return undefined;
		}

		const set = emoteStore.enableSet(data.name, data.emotes);

		if (!page.currentChannelSet) {
			chatListener.sendSystemMessage(`Enabled set '${set.name}' (${set.size} emotes)`);
			chatListener.listen();
			tabCompletion.listen();
		}
		page.currentChannelSet = set;
		page.eIndex = null;
	}

	@PageScriptListener('DisableEmoteSet')
	whenEmoteSetIsRemoved(name: string): void {
		if (stopped) {
			return undefined;
		}

		emoteStore.disableSet(name);
	}

	@PageScriptListener('InsertEmoteInChatInput')
	whenUserInsertsEmoteFromEmoteMenu(emoteName: string): void {
		const currentValue = tabCompletion.getInput().value ?? '';
		const spacing = currentValue.length > 0 ? ' ' : '';

		tabCompletion.setInputValue(currentValue + `${spacing}${emoteName}${spacing}`);
	}

	@PageScriptListener('SetChatInput')
	whenUserTabCompletesAndTheChatInputBoxShouldBeChanged(value: string): void {
		tabCompletion.setInputValue(value);
	}

	@PageScriptListener('SendSystemMessage')
	whenUpperLayerSendsSystemMessage(message: string): void {
		if (stopped) {
			return undefined;
		}

		chatListener.sendSystemMessage(message);
	}

	@PageScriptListener('Cease')
	whenUpperLayerRequestsThePageScriptStopsSendingChatLinesUpstream(): void {
		stopped = true;
		chatListener.kill();
		Logger.Get().info('Received Cease Signal -- pagescript will stop.');
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
		for (const set of emoteStore.sets.values()) {
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
let tabCompletion: TabCompletion;

let page: PageScript;
let stopped = false;
(() => {
	const { } = page = new PageScript();
})();
