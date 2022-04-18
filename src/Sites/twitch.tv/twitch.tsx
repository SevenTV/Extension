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
import { TwitchVideoChatListener } from 'src/Sites/twitch.tv/Runtime/VideoChatListener';
import { BaseTwitchChatListener } from 'src/Sites/twitch.tv/Runtime/BaseChatListener';

export class TwitchPageScript {
	site = new SiteApp();
	chatListener?: BaseTwitchChatListener;
	inputManager = inputManager = new InputManager(this);
	avatarManager = new AvatarManager(this);
	banSliderManager = new BanSliderManager(this);

	currentChannel = '';
	currentVideo = '';
	isActorModerator = false;
	isActorVIP = false;
	retryLoadCount = 0;

	channelRegex = /(?:videos\/(?<videoid>[0-9]{3,100})|[a-zA-Z0-9_]{3,25}\/clip\/(?<clipid>[a-zA-Z0-9-]{3,100})|(?:(u|popout|moderator)\/)?(?<channelname>[a-zA-Z0-9_]{3,25}))/;
	emoteRegex = /$^/;

	get ffzMode(): boolean {
		return ffzMode;
	}
	get twitch(): Twitch {
		return twitch;
	}

	constructor() {
		(window as any).seventv = this;
		this.handlePageSwitch();
		this.avatarManager.check();

		// Create Overlay
		const overlayContainer = document.getElementById('root');
		if (!!overlayContainer) {
			this.site.createOverlay(overlayContainer);
			setTimeout(() => this.site.embeddedUI.embedNavButton(document.querySelector(Twitch.Selectors.NAV) as HTMLElement), 500);
		}
		this.site.menuPickEmote.pipe(
			map(emote => {
				const value = this.inputManager.getInput()?.value ?? this.twitch.getChatInput()?.props.value ?? '';
				this.inputManager.setInputValue(`${value} ${emote.name} `);
			})
		).subscribe();
	}

	/**
	 * Listen for page switch events, sending them back to the content script.
	 *
	 * This allows the extension to load and unload emote sets depending on which channel,
	 * video, or clip the user is currently watching.
	 */
	private handlePageSwitch(): void {

		// Get chat service
		let channelName, channelID;

		const switchHandler = async (
			location: Twitch.Location,
			_action: string
		) => {
			// Get the currently available IDs from the page URL.
			let [ urlChannelName, urlVideoID ] = this.getIDsFromRoute(location.pathname);
			let channelInfo: Twitch.ChatControllerComponent | Twitch.VideoChannelComponent | undefined;

			// Is the page the landing/livestream?
			if (urlChannelName && !urlVideoID) {
				this.currentVideo = '';

				channelInfo = await this.awaitChannelInfo();

				if (urlChannelName !== this.currentChannel) {
					Logger.Get().info(`Changing channel from ${this.currentChannel} to ${urlChannelName}.`);
				}
				Logger.Get().info('Watching live chat.');
			} else if (urlVideoID !== this.currentVideo) { // Or is it a VOD or clip?
				this.currentVideo = urlVideoID;

				channelInfo = await this.awaitChannelInfo(true);
				const currentChannel = channelInfo.props.channelLogin;
				Logger.Get().info(`Watching video/clip '${this.currentVideo}' on ${currentChannel}.${(this.currentChannel && this.currentChannel !== currentChannel ? ` Changed channel from ${this.currentChannel}.` : '')}`);
			}

			if (channelInfo) {
				channelName = channelInfo.props.channelLogin;
				channelID = channelInfo.props.channelID;
				// Reload cosmetics
				this.site.loadCosmetics();

				// Different channel? Update emote events.
				let channelSwitchHandler = undefined;
				if (channelName !== this.currentChannel) {
					// Unsubscribe from events in previous channel
					this.site.sendMessageUp('EventAPI:RemoveChannel', {});

					// Sub events for the new channel.
					this.site.sendMessageUp('EventAPI:AddChannel', channelName);

					// Load all emotes available to this channel.
					channelSwitchHandler = this.site.switchChannel({
							channelID,
							channelName,
							as: (channelInfo as Twitch.ChatControllerComponent)?.props?.userID ?? ''
						})
						.toPromise();
				}
				// Update current channel.
				this.currentChannel = channelName;
				if (channelName && channelID) {
					// Unload resources for the previous listener.
					this.chatListener?.kill();

					// Load the appropriate chat listener depending on what kind of
					// chat is available: live or VOD/clip.
					this.chatListener = chatListener = (channelInfo as Twitch.ChatControllerComponent)?.props.chatConnectionAPI
						? new TwitchChatListener(this)
						: new TwitchVideoChatListener(this);

					// Complete setup and start listening for new chat lines once emotes are loaded (if they haven't been already).
					const continueListening = () => {
						// Ensure a chat listener is available.
						if (!this.chatListener) {
							Logger.Get().warn('No appropriate chat listener loaded. Nothing to do.');
							return;
						}

						// Apply 7TV rendering existing chat items.
						this.chatListener.start();

						// Load live chat related items.
						if ((channelInfo as Twitch.ChatControllerComponent)?.props.chatConnectionAPI) {
							const controller = channelInfo as Twitch.ChatControllerComponent;

							this.eIndex = null;
							this.avatarManager.check();
							this.isActorModerator = controller.props.isCurrentUserModerator ?? false;
							this.banSliderManager.initialize();

							this.site.tabCompleteDetector.updateEmotes();
							this.site.tabCompleteDetector.start();
							this.site.embeddedUI.embedChatButton(document.querySelector(Twitch.Selectors.ChatInputButtonsContainer) as HTMLElement);
							inputManager.listen();
							this.isActorVIP = controller.props.isCurrentUserVIP ?? false;
							setTimeout(() => {
								this.insertEmotesIntoAutocomplete();
							}, 2500); // TODO: find a solution to avoid arbitrary delay
						}

						// Begin handling new messages.
						this.chatListener.listen();
					};

					// Are we waiting for emotes to be loaded? Yes? Then hold off on listening for new chat lines.
					if (channelSwitchHandler) {
						channelSwitchHandler.finally(continueListening);
					} else { // Emotes already loaded? Start listening for more chat.
						continueListening();
					}
				}
			}
		};

		// Track routing using the page's router.
		const router = this.twitch.getRouter();
		if (!!router) {
			const history = router.props.history;

			// Run handler once on first page load.
			switchHandler.apply(this, [history.location, history.action]);

			// Begin listening for page change events.
			router.props.history.listen(switchHandler);
			Logger.Get().debug('Now listening for router changes');
		} else if (this.retryLoadCount < 32) { // Router not found, we will retry
			setTimeout(() => this.handlePageSwitch(), this.retryLoadCount*250);
			this.retryLoadCount++;
			Logger.Get().debug(`Couldn't find router (try #${this.retryLoadCount})`);
		} else {
			Logger.Get().error(`Failed to find router in ${this.retryLoadCount} tries`);
		}
	}

	async awaitChannelInfo(
		isVideo?: boolean
	): Promise<Twitch.ChatControllerComponent | Twitch.VideoChannelComponent> {
		return new Promise(resolve => {
			const i = setInterval(() => {
				const c = isVideo
					? this.twitch.getVideoChannel()
					: this.twitch.getChatController();
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

	insertEmotesIntoAutocomplete() {
		if (this.ffzMode) return;

		const store = this.emoteStore;
		const emoteProvider = this.twitch.getAutocompleteHandler().providers[0];
		emoteProvider.props.emotes = emoteProvider.props.emotes.filter((s) => s.id !== '777');

		// Wait 500ms if twitch has not inserted its emotes.
		if (emoteProvider.props.emotes.length === 0) {
			setTimeout(() => this.insertEmotesIntoAutocomplete(), 500);
			return;
		}

		const x = emoteProvider.renderEmoteSuggestion;
		emoteProvider.renderEmoteSuggestion = function(e: Twitch.TwitchEmote) {
			if (e.__typename === 'SeventvEmote') {
				e.srcSet = store.getEmote(e.id)?.urls.reduce((prev, current) =>
					`${prev} ${current[1]} ${current[0]}x,`
				, '');
			}

			let provider = e.type;
			switch (provider) {
				case 'GLOBALS':
					provider = 'Twitch Global';
					break;
				case 'SUBSCRIPTIONS':
					provider = 'Twitch Sub';
					break;
				case 'TURBO':
					provider = 'Twitch Turbo';
				default:
					provider = e.type ? `${e._thirdPartyGlobal ? 'Global' : 'Channel'} ${e.type}` : 'Unknown';
					break;
			}
			const t = e.token.replace(`(${provider})`, '');
			return x.call(this, {...e, token: `${t} (${provider})` });
		};

		emoteProvider.props.emotes.push({
			emotes: this.emoteStore.getAllEmotes(['7TV', 'BTTV', 'EMOJI', 'FFZ']).map(emote => {
				return {
					id: emote.id.toString(),
					setID: '777',
					token: emote.name,
					type: emote.provider,
					_thirdPartyGlobal: emote.isGlobal(),
					__typename: 'SeventvEmote'
				};
			}),
			id: '777',
			__typename: 'SeventvEmoteSet'
		});
	}

	getIDsFromRoute(path: string): string[] {
		const match = path.match(this.channelRegex);
		const groups = match?.groups;

		return [
			groups?.['channelname'] ?? '',
			groups?.['videoid'] ?? groups?.['clipid'] ?? ''
		];
	}

	@PageScriptListener('InsertEmoteInChatInput')
	whenUserInsertsEmoteFromEmoteMenu(emoteName: string): void {
		const currentValue = inputManager.getInput().value ?? this.twitch.getChatInput().props.value ?? '';
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

		let sets = twitch?.getAutocompleteHandler()?.providers[0].props.emotes;
		if (sets) sets = sets.filter(s=>s.__typename !== 'SeventvEmoteSet');

		// Re-render button, sometimes FFZ will remove it if it loads late
		page.site.embeddedUI.embedChatButton(document.querySelector(Twitch.Selectors.ChatInputButtonsContainer) as HTMLElement);
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
		if (!page.chatListener) {
			Logger.Get().warn('No chat listener loaded. Cannot update emotes.');
			return;
		}

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
let chatListener: BaseTwitchChatListener;
let inputManager: InputManager;
let twitch = new Twitch();
let ffzMode = false;
(() => {
	page = new TwitchPageScript();
})();
