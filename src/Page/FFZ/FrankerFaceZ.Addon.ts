import { Config } from 'src/Config';
import { version } from 'public/manifest.json';

class SevenTVEmotes extends FrankerFaceZ.utilities.addon.Addon {
	constructor(...args: any[]) {
		super(...args);

		this.inject('settings');
		this.inject('chat');
		this.inject('chat.emotes');
		this.inject('chat.badges');
		this.inject('site');

		this.siteChat = this.resolve('site.chat');

		this.settings.add('addon.7tv_emotes.global_emotes', {
			default: true,
			ui: {
				path: 'Add-Ons > 7TV Emotes >> Emotes',
				title: 'Global Emotes',
				description: 'Enables global emotes from 7TV.',
				component: 'setting-check-box',
			}
		});

		this.settings.add('addon.7tv_emotes.channel_emotes', {
			default: true,
			ui: {
				path: 'Add-Ons > 7TV Emotes >> Emotes',
				title: 'Channel Emotes',
				description: 'Enables channel specific emotes from 7TV.',
				component: 'setting-check-box',
			}
		});

		this.settings.add('addon.7tv_emotes.socket', {
			default: true,
			ui: {
				path: 'Add-Ons > 7TV Emotes >> Socket',
				title: 'Web Socket',
				description: 'Enables live 7TV emote updates via Web Socket.',
				component: 'setting-check-box',
			}
		});

		this.settings.add('addon.7tv_emotes.update_messages', {
			default: true,
			ui: {
				path: 'Add-Ons > 7TV Emotes >> Socket',
				title: 'Emote update messages',
				description: 'Show messages in chat when emotes are updated in the current channel.',
				component: 'setting-check-box',
			}
		});

		this.enable();
	}

	async onEnable() {
		try {
			await this.setupSocket();
		} catch (e) { }

		this.chat.context.on('changed:addon.7tv_emotes.global_emotes', () => this.updateGlobalEmotes());
		this.chat.context.on('changed:addon.7tv_emotes.channel_emotes', () => this.updateChannels());
		this.chat.context.on('changed:addon.7tv_emotes.socket', async () => {
			try {
				await this.setupSocket();
			}
			catch (e) {
				return;
			}
			await this.updateChannels();
		});

		this.addBadges();

		this.on('chat:room-add', this.addChannel, this);
		this.on('chat:room-remove', this.removeChannel, this);

		this.updateGlobalEmotes();
		this.updateChannels();
	}

	async addChannel(channel: any) {
		await this.addChannelSet(channel);
		this.subscribeChannel(channel);
	}

	removeChannel(channel: any) {
		this.removeChannelSet(channel);
	}

	async updateGlobalEmotes() {
		this.emotes.removeDefaultSet('addon.7tv_emotes', 'addon.7tv_emotes.global');
		this.emotes.unloadSet('addon.7tv_emotes.global');

		if (!this.chat.context.get('addon.7tv_emotes.global_emotes')) return;

		const response = await fetch(`${apiBase}/v2/emotes/global`);
		if (response.ok) {
			const json = await response.json();

			const emotes = [];
			for (const emote of json) {
				emotes.push(this.convertEmote(emote));
			}

			this.emotes.addDefaultSet('addon.7tv_emotes', 'addon.7tv_emotes.global', {
				title: 'Global Emotes',
				source: '7TV',
				icon: 'https://7tv.app/assets/favicon.png',
				emotes: emotes
			});
		}
	}

	async fetchChannelEmotes(channelLogin: string) {
		const response = await fetch(`${apiBase}/v2/users/${channelLogin}/emotes`);
		if (response.ok) {
			const json = await response.json();

			const emotes = [];
			for (const emote of json) {
				emotes.push(this.convertEmote(emote));
			}

			return emotes;
		}
	}

	getChannelSetID(channel: any) {
		return `addon.7tv_emotes.channel-${channel.login}`;
	}

	async addChannelSet(channel: any, emotes?: any[]) {
		this.removeChannelSet(channel);

		if (emotes === undefined) {
			emotes = await this.fetchChannelEmotes(channel.login);
		}

		channel.addSet('addon.7tv_emotes', this.getChannelSetID(channel), {
			title: 'Channel Emotes',
			source: '7TV',
			icon: 'https://7tv.app/assets/favicon.png',
			emotes: emotes
		});
	}

	removeChannelSet(channel: any) {
		const setID = this.getChannelSetID(channel);
		channel.removeSet('addon.7tv_emotes', setID);
		this.emotes.unloadSet(setID);
	}

	getChannelSet(channel: any) {
		return this.emotes.emote_sets[this.getChannelSetID(channel)];
	}

	async updateChannels() {
		const promises = [];
		const enabled = this.chat.context.get('addon.7tv_emotes.channel_emotes');
		for (const channel of this.chat.iterateRooms()) {
			if (enabled) {
				promises.push(this.addChannel(channel));
			}
			else {
				this.removeChannelSet(channel);
			}
		}
		return Promise.all(promises);
	}

	convertEmote(emote: any) {
		const ffzEmote = {
			id: emote.id,
			name: emote.name,
			urls: {
				1: emote.urls[0][1],
				2: emote.urls[1][1],
				3: emote.urls[2][1],
				4: emote.urls[3][1]
			},
			width: emote.width[0],
			height: emote.height[0],
			click_url: `https://7tv.app/emotes/${emote.id}`,
			owner: {} as any
		};

		if (emote.owner) {
			ffzEmote.owner = {
				display_name: emote.owner.display_name,
				name: emote.owner.login
			};
		}

		return ffzEmote;
	}

	async addBadges() {
		const response = await fetch(`${apiBase}/v2/badges?user_identifier=twitch_id`);
		if (response.ok) {
			const json = await response.json();
			if (typeof json == 'object' && json != null && json.badges) {
				for (const badge of json.badges) {
					const id = `addon.7tv_emotes.badge-${badge.id}`;
					this.badges.loadBadgeData(id, {
						id: badge.id,
						title: badge.tooltip,
						slot: 22,
						image: badge.urls[1][1],
						urls: {
							1: badge.urls[2][1]
						},
						svg: false
					});

					for (const userID of badge.users) {
						this.chat.getUser(String(userID)).addBadge('addon.7tv_emotes', id);
					}
				}
			}
		}
	}

	setupSocket(): Promise<void> {
		return new Promise((resolve, reject) => {
			this.closeSocket();

			if (this.chat.context.get('addon.7tv_emotes.socket')) {
				this.socket = new WebSocket(`${wsBase}/v2/ws`);

				this.socket.addEventListener('message', (event: any) => {
					this.onSocketMessage(event.data);
				});

				this.socket.addEventListener('close', () => {
					this.closeSocket();

					this.socketReconnectTimeout = setTimeout(() => {
						this.socketReconnectTimeout = undefined;
						this.setupSocket();
					}, 500);
				});

				this.socket.addEventListener('open', () => {
					resolve();
				});

				this.socket.addEventListener('error', () => {
					this.closeSocket();
					reject();
				});
			}
			else {
				resolve();
			}
		});
	}

	closeSocket() {
		if (this.socket) this.socket.close();
		if (this.socketHeartbeat) clearInterval(this.socketHeartbeat);
		if (this.socketReconnectTimeout) clearTimeout(this.socketReconnectTimeout);
		this.socket = undefined;
		this.socketHeartbeat = undefined;
		this.socketReconnectTimeout = undefined;
	}

	sendSocketHeartbeat() {
		if (this.socket) {
			this.socket.send(JSON.stringify({
				op: 2
			}));
		}
	}

	subscribeChannel(channel: any) {
		if (this.socket) {
			this.socket.send(JSON.stringify({
				op: 6,
				d: {
					type: 1,
					params: {
						channel: channel.login
					}
				}
			}));
		}
	}

	handleChannelEmoteUpdate(data: any) {
		if (this.chat.context.get('addon.7tv_emotes.update_messages')) {
			for (const chat of this.siteChat.ChatService.instances) {
				if (chat.props.channelLogin == data.channel) {
					chat.addMessage({
						type: this.siteChat.chat_types.Notice,
						message: `[7TV] ${data.actor} ${data.removed ? 'removed' : 'added'} the emote "${data.emote.name}"`
					});
				}
			}
		}

		for (const channel of this.chat.iterateRooms()) {
			if (channel.login == data.channel) {
				const emoteSet = this.getChannelSet(channel);
				if (emoteSet) {
					const emotes = emoteSet.emotes || {};
					if (data.removed) {
						delete emotes[data.emote.id];
					}
					else {
						emotes[data.emote.id] = this.convertEmote(data.emote);
					}
					this.addChannelSet(channel, Object.values(emotes));
				}
			}
		}
	}

	onSocketMessage(messageString: any) {
		const message = JSON.parse(messageString);

		const data = message.d;

		switch (message.op) {
			case 0: {
				switch (message.t) {
					case 'CHANNEL_EMOTES_UPDATE': {
						this.handleChannelEmoteUpdate(data);
						break;
					}
				}
				break;
			}
			case 1: {
				if (this.socketHeartbeat) clearInterval(this.socketHeartbeat);
				this.socketHeartbeat = setInterval(this.sendSocketHeartbeat.bind(this), data.heartbeat_interval);
				break;
			}
		}
	}
}

SevenTVEmotes.register({
	'name': '7TV Emotes',
	'author': 'Melonify',
	'description': 'Adds 7TV badges, channel and global emotes as well as live emote update support.',
	'version': version,
	'website': 'https://7tv.app',
	'settings': 'add_ons.7tv_emotes',
	'icon': 'https://7tv.app/assets/icons/icon-96x96.png'
});

const apiBase = `${Config.secure ? 'https' : 'http'}:${Config.apiUrl}`;
const wsBase = `${Config.secure ? 'wss' : 'ws'}:${Config.apiUrl}`;
