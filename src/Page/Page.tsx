import { ChatListener } from 'src/Page/Runtime/ChatListener';
import { DataStructure } from '@typings/typings/DataStructure';
import { EmoteStore } from 'src/Page/Util/EmoteStore';
import { TabCompletion } from 'src/Page/Runtime/TabCompletion';
import { Twitch } from 'src/Page/Util/Twitch';
import { Logger } from 'src/Logger';

export const Page = {
	EmoteSet: [] as DataStructure.Emote[],
	EmoteStore: new EmoteStore(),
	TabCompletion: new TabCompletion()
};

Page.TabCompletion.listen().subscribe();

// window.addEventListener('7TV#BackgroundExtMessage', event => {
// 	if (!(event instanceof CustomEvent)) return undefined;
// 	const ev = event as CustomEvent;
//
// 	if (ev.detail.tag === 'LoadChannel') { // Handle LoadChannel
// 		// Unload all non-global emotes from the current set
// 		Page.EmoteSet
// 			.filter(emote => !emote.global)
// 			.map(emote => Page.EmoteSet.splice(Page.EmoteSet.indexOf(emote), 1));
//
// 		// Append new channel emote
// 		Page.EmoteSet.push(...ev.detail.emotes);
// 		Page.ChatListener.sendSystemMessage(`Loaded ${ev.detail.emotes.length} emotes in $currentChannel: ${ev.detail.emotes.map((e: DataStructure.Emote) => e.name).join(', ')}`);
// 	} else if (ev.detail.tag === 'MapGlobalEmotes') {
// 		// Unload previous global emotes from the current set
// 		Page.EmoteSet
// 			.filter(emote => emote.global)
// 			.map(emote => Page.EmoteSet.splice(Page.EmoteSet.indexOf(emote), 1));
//
// 		Page.EmoteSet.push(...ev.detail.emotes);
// 	} else if (ev.detail.tag === 'OutdatedVersion') {
// 		Page.ChatListener.sendSystemMessage(`7TV is outdated! Your version is ${ev.detail.clientVersion}, while the latest is ${ev.detail.latestVersion}`);
// 	}
// });

export class PageScript {
	twitch = new Twitch();
	chatListener = new ChatListener(this);

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
		this.chatListener.subscribe();

		this.handleChannelSwitch();
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

			Logger.Get().info(`Changing channel from ${this.currentChannel} to ${channelName}`);
			switched(this.currentChannel = channelName);
		});
		switched(this.currentChannel);
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

(() => {
	new PageScript();
})();
