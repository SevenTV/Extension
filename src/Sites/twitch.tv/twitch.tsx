import { TwitchChatListener } from 'src/Sites/twitch.tv/Runtime/ChatListener';
import { InputManager } from 'src/Sites/twitch.tv/Runtime/InputManager';
import { Twitch } from 'src/Sites/twitch.tv/Util/Twitch';
import { Logger } from 'src/Logger';
import { PageScriptListener } from 'src/Global/Decorators';
import { EmoteStore } from 'src/Global/EmoteStore';
import 'src/Style/Style.scss';
import { AvatarManager } from 'src/Sites/twitch.tv/Runtime/Avatars';
import { BanSliderManager } from 'src/Sites/twitch.tv/Components/BanSliderManager';
import { SiteApp } from 'src/Sites/app/SiteApp';
import { map } from 'rxjs/operators';
import { MessagePatcher } from 'src/Sites/twitch.tv/Util/MessagePatcher';
import type { EventAPI } from 'src/Global/Events/EventAPI';

export class TwitchPageScript {
	site = new SiteApp();
	twitch = new Twitch();
	chatListener = chatListener = new TwitchChatListener(this);
	inputManager = inputManager = new InputManager(this);
	avatarManager = new AvatarManager(this);
	banSliderManager = new BanSliderManager(this);

	currentChannel = '';
	currentChannelSet: EmoteStore.EmoteSet | null = null;
	isActorModerator = false;
	isActorVIP = false;

	channelRegex = /(https:\/\/[a-z]*.twitch.tv\/)(?:(u|popout|moderator)\/)?([a-zA-Z0-9_]{3,25})/;
	emoteRegex = /$^/;

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

		// Create Overlay
		const overlayContainer = document.getElementById('root');
		if (!!overlayContainer) {
			this.site.createOverlay(overlayContainer);
			setTimeout(() => this.site.embeddedUI.embedNavButton(document.querySelector(Twitch.Selectors.NAV) as HTMLElement), 500);
		}
		this.site.menuPickEmote.pipe(
			map(emote => {
				const value = this.inputManager.getInput()?.value ?? '';
				this.inputManager.setInputValue(`${value} ${emote.name} `);
			})
		).subscribe();
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
			this.site.switchChannel({ channelID: id, channelName: login, as })
				.toPromise()
				.finally(() => {
					this.eIndex = null;
					this.avatarManager.check();
					this.isActorModerator = controller.props.isCurrentUserModerator;
					this.banSliderManager.initialize();
					this.chatListener.listen();

					this.site.tabCompleteDetector.updateEmotes();
					this.site.tabCompleteDetector.start();
					this.site.embeddedUI.embedChatButton(document.querySelector(Twitch.Selectors.ChatInputButtonsContainer) as HTMLElement);
					inputManager.listen();
					this.isActorVIP = controller.props.isCurrentUserVIP;
					this.site.sendMessageUp('EventAPI:AddChannel', login);
				});
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
				Logger.Get().info(`Changing channel from ${this.currentChannel} to ${channelName}`);
				this.currentChannel = channelName;
				controller = await this.awaitChatController();

				// Unsubscribe from events in previous channel
				this.site.sendMessageUp('EventAPI:RemoveChannel', {});

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

	get emoteStore() {
		return this.site.emoteStore;
	}

	getCurrentChannelFromURL(): string {
		return window.location.href.match(this.channelRegex)?.[3] ?? '';
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

	private eIndex: {
		[x: string]: EmoteStore.Emote;
	} | null = null;
	getEmoteIndex() {
		if (!!this.eIndex) {
			return this.eIndex;
		}

		const emotes = this.getAllEmotes();
		const ind = emotes.length > 0 ? this.eIndex = emotes.map(e => ({ [e.name]: e })).reduce((a, b) => ({ ...a, ...b })) : {};
		this.emoteRegex = MessagePatcher.getRegexp(Object.keys(ind));
		return ind;
	}

	getAllEmotes(): EmoteStore.Emote[] {
		const emotes = [] as EmoteStore.Emote[];
		for (const set of this.emoteStore.sets.values()) {
			emotes.push(...set.getEmotes().sort((a, b) => a.weight - b.weight));
		}

		return emotes;
	}

	@PageScriptListener('ConfigChange')
	whenAppConfigChangeds(cfg: { [x: string]: any; }): void {
		switch(cfg['general.app_avatars']) {
			case 'disabled':
				page?.avatarManager.revert();
				break;
			default:
				page?.avatarManager.resetAfterConfigChange(cfg['general.app_avatars']);
				page?.avatarManager.check();
		}
		page?.site.embeddedUI.refresh(document.querySelector(Twitch.Selectors.ChatInputButtonsContainer) as HTMLElement);
		switch(cfg['ui.show_moderation_slider']) {
			case undefined:
				break;
			default:
				page?.banSliderManager.check();
		}
		switch(cfg['general.paints']) {
			case false:
				document.body.classList.add('seventv-no-paints');
				break;
			case true:
				document.body.classList.remove('seventv-no-paints');
		}
	}

	@PageScriptListener('ChannelEmoteUpdate')
	whenEventAPISendsAnEventAboutChannelEmotesChanging(event: EventAPI.EmoteEventUpdate): void {
		const action = event.action;
		const set = page.site.emoteStore.sets.get(page.site.currentChannel);
		if (!set) {
			return;
		}
		if (event.channel !== page.currentChannel) {
			return;
		}

		switch (action) {
			case 'ADD':
				page.chatListener.sendSystemMessage(`${event.actor} added the emote "${event.emote.name}"`);
				set.push([{ ...event.emote, id: event.emote_id }], false);
				break;
			case 'REMOVE':
				page.chatListener.sendSystemMessage(`${event.actor} removed the emote "${event.name}"`);
				set.deleteEmote(event.emote_id);
				break;
			case 'UPDATE':
				const emote = set.getEmoteByID(event.emote_id);
				if (!emote) {
					break;
				}
				const oldName = String(emote.name);

				emote.setName(event.name);
				set.deleteEmote(event.emote_id);
				set.push([emote.resolve()], false);
				page.chatListener.sendSystemMessage(`${event.actor} renamed the emote "${oldName}" to "${event.name}"`);
				break;
			default:
				break;
		}

		page.eIndex = null;
		page.site.tabCompleteDetector?.updateEmotes();
	}

}

let page: TwitchPageScript;
let chatListener: TwitchChatListener;
let inputManager: InputManager;

let ffzMode = false;
(() => {
	page = new TwitchPageScript();
})();
