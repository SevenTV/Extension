import { ChatListener } from 'src/Page/Runtime/ChatListener';
import { InputManager } from 'src/Page/Runtime/InputManager';
import { Twitch } from 'src/Page/Util/Twitch';
import { Logger } from 'src/Logger';
import { PageScriptListener } from 'src/Global/Decorators';
import { EmoteStore } from 'src/Global/EmoteStore';
import { SettingValue } from 'src/Global/Util';
import 'src/Style/Style.scss';

export class PageScript {
	twitch = new Twitch();
	emoteStore = emoteStore = new EmoteStore();
	chatListener = chatListener = new ChatListener(this);
	inputManager = inputManager = new InputManager(this);

	currentChannel = '';
	currentChannelSet: EmoteStore.EmoteSet | null = null;
	isActorModerator = false;
	isActorVIP = false;

	channelRegex = /(https:\/\/[a-z]*.twitch.tv\/)(?:(u|popout|moderator)\/)?([a-zA-Z0-9_]{3,25})/;

	config = config;

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
		const controller = this.twitch.getChatController();
		if (!controller) {
			setTimeout(() => this.handleChannelSwitch(), 1000);
			return undefined;
		}
		let channelName = this.getCurrentChannelFromURL(); // Set current channel

		// Begin listening for joined events, meaning the end user has switched to another channel
		setInterval(() => {
			channelName = this.getCurrentChannelFromURL();
			if (channelName !== this.currentChannel) {
				Logger.Get().info(`Changing channel from ${this.currentChannel} to ${channelName}`);
				this.eIndex = null;
				this.currentChannelSet = null;
				this.isActorVIP = controller.props.isCurrentUserVIP;
				this.isActorModerator = controller.props.isCurrentUserModerator;
				switched(this.currentChannel = channelName, controller.props.channelLogin);
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
			inputManager.listen();
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
		const currentValue = inputManager.getInput().value ?? '';
		const spacing = currentValue.length > 0 ? ' ' : '';

		inputManager.setInputValue(currentValue + `${spacing}${emoteName}${spacing}`);
	}

	@PageScriptListener('SetChatInput')
	whenUserTabCompletesAndTheChatInputBoxShouldBeChanged(value: { message: string, cursorPosition: number }): void {
		inputManager.setInputValue(value.message);
		inputManager.setInputCursorPosition(value.cursorPosition);
	}

	@PageScriptListener('SendSystemMessage')
	whenUpperLayerSendsSystemMessage(message: string): void {
		chatListener.sendSystemMessage(message);
	}

	@PageScriptListener('Cease')
	whenUpperLayerRequestsThePageScriptStopsSendingChatLinesUpstream(): void {
		stopped = true;
		Logger.Get().info('Received Cease Signal -- pagescript will stop.');
	}

	@PageScriptListener('ConfigChange')
	whenAppConfigChangeds(cfg: { [x: string]: any; }): void {
		for (const k of Object.keys(cfg)) {
			config.set(k, new SettingValue(cfg[k]));
		}
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
let inputManager: InputManager;
const config = new Map<string, SettingValue>();

let page: PageScript;
let stopped = false;
(() => {
	const { } = page = new PageScript();
})();
