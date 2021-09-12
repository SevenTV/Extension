import { ChatListener } from 'src/Page/Runtime/ChatListener';
import { InputManager } from 'src/Page/Runtime/InputManager';
import { Twitch } from 'src/Page/Util/Twitch';
import { Logger } from 'src/Logger';
import { PageScriptListener } from 'src/Global/Decorators';
import { EmoteStore } from 'src/Global/EmoteStore';
import { SettingValue } from 'src/Global/Util';
import 'src/Style/Style.scss';
import { AvatarManager } from 'src/Page/Runtime/Avatars';

export class PageScript {
	twitch = new Twitch();
	emoteStore = emoteStore = new EmoteStore();
	chatListener = chatListener = new ChatListener(this);
	inputManager = inputManager = new InputManager(this);
	avatarManager = avatarManager = new AvatarManager(this);

	currentChannel = '';
	currentChannelSet: EmoteStore.EmoteSet | null = null;
	isActorModerator = false;
	isActorVIP = false;

	channelRegex = /(https:\/\/[a-z]*.twitch.tv\/)(?:(u|popout|moderator)\/)?([a-zA-Z0-9_]{3,25})/;

	config = config;

	get ffzMode(): boolean {
		return ffzMode;
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

		this.avatarManager.check();
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

		const switched = (id: string, login: string, as: string) => {
			this.sendMessageUp('SwitchChannel', { channelID: id, channelLogin: login, as });
			this.avatarManager.check();
			setTimeout(() => {
				this.isActorVIP = controller.props.isCurrentUserVIP;
				this.isActorModerator = controller.props.isCurrentUserModerator;
			}, 2500);
			inputManager.listen();
		};

		// Get chat service
		let controller = this.twitch.getChatController();
		let channelName = controller?.props.channelLogin; // Set current channel
		let channelID = controller?.props.channelID;
		if (!channelName || !channelID) {
			setTimeout(() => this.handleChannelSwitch(), 1000);
			return undefined;
		}

		// Begin listening for joined events, meaning the end user has switched to another channel
		setInterval(async () => {
			let channelName = this.getCurrentChannelFromURL();
			if (channelName !== this.currentChannel) {
				this.currentChannel = channelName;
				Logger.Get().info(`Changing channel from ${this.currentChannel} to ${channelName}`);
				controller = await this.awaitChatController();
				this.eIndex = null;
				this.currentChannelSet = null;
				channelName = controller.props.channelLogin;
				channelID = controller.props.channelID;

				if (channelName && channelID) {
					switched(channelID, channelName, controller.props.userID ?? '');
				}
			}
		}, 500);

		this.chatListener.start();
	}

	async awaitChatController(): Promise<Twitch.ChatControllerComponent> {
		return new Promise(resolve => {
			const i = setInterval(() => {
				const c = this.twitch.getChatController();
				if (c && (c.props?.channelID && c.props?.channelLogin)) {
					clearInterval(i);
					resolve(c);
				}
			}, 500);
		});
	}

	getCurrentChannelFromURL(): string {
		return window.location.href.match(this.channelRegex)?.[3] ?? '';
	}

	@PageScriptListener('EnableEmoteSet')
	whenEmoteSetIsAdded(data: EmoteStore.EmoteSet.Resolved): void {
		const set = emoteStore.enableSet(data.name, data.emotes);

		if (!page.currentChannelSet) {
			chatListener.listen();
		}
		page.currentChannelSet = set;
		page.eIndex = null;
	}

	@PageScriptListener('DisableEmoteSet')
	whenEmoteSetIsRemoved(name: string): void {
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
		ffzMode = true;
		Logger.Get().info('Received Cease Signal -- pagescript will stop.');
	}

	@PageScriptListener('ConfigChange')
	whenAppConfigChangeds(cfg: { [x: string]: any; }): void {
		for (const k of Object.keys(cfg)) {
			config.set(k, new SettingValue(cfg[k]));
		}

		if (!config.get('general.app_avatars')?.asBoolean()) {
			avatarManager.revert();
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
			emotes.push(...set.getEmotes().sort((a, b) => a.weight - b.weight));
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
let avatarManager: AvatarManager;
const config = new Map<string, SettingValue>();

let page: PageScript;
let ffzMode = false;
(() => {
	const { } = page = new PageScript();
})();
