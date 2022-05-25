import { BitField } from '@typings/src/BitField';
import { Constants } from '@typings/src/Constants';
import { DataStructure } from '@typings/typings/DataStructure';
import EmojiData from 'src/Content/Util/Emoji.json';
import twemoji from 'twemoji';
import { Logger } from 'src/Logger';
import { Twitch } from 'src/Sites/twitch.tv/Util/Twitch';
import { getProviderLogo, getRunningContext } from 'src/Global/Util';
import { MainComponent } from 'src/Sites/app/MainComponent';
import React from 'react';

const TWITCH_SET_NAME = 'twitch';
const EMOJI_SET_NAME = 'emoji';
export class EmoteStore {
	ctx = getRunningContext();

	size = 0;
	private cachedElements = new Map<string, JSX.Element>();
	sets = new Map<string, EmoteStore.EmoteSet>();

	addElement(id: string, jsx: JSX.Element): JSX.Element {
		this.cachedElements.set(id, jsx);

		return jsx;
	}

	getElement(id: string): JSX.Element | undefined {
		return this.cachedElements.get(id);
	}

	getEmote(nameOrID: string): EmoteStore.Emote | null {
		for (const set of this.sets.values()) {
			for (const emote of set.getEmotes()) {
				if (emote.name === nameOrID || emote.id === nameOrID) {
					return emote;
				}
			}
		}

		return null;
	}

	/**
	 * @returns all amotes, across all sets
	 */
	getAllEmotes(providers?: DataStructure.Emote.Provider[]): EmoteStore.Emote[] {
		const emotes = [] as EmoteStore.Emote[];
		for (const set of this.sets.values()) {
			emotes.push(...set.getEmotes().filter(e => !Array.isArray(providers) || providers.includes(e.provider)));
		}

		return emotes;
	}

	fromTwitchEmote(data: Twitch.ChatMessage.EmoteRef): EmoteStore.Emote {
		if (!this.sets.has(TWITCH_SET_NAME)) {
			this.sets.set(TWITCH_SET_NAME, new EmoteStore.EmoteSet(TWITCH_SET_NAME));
		}

		const urls = [
			['1', data.images?.dark['1x'] ?? ''],
			['2', data.images?.dark['2x'] ?? ''],
			['3', data.images?.dark['4x'] ?? ''],
			['4', data.images?.dark['4x'] ?? '']
		] as [string, string][];
		const set = this.sets.get(TWITCH_SET_NAME) as EmoteStore.EmoteSet;
		const currentEmote = set.getEmoteByID(data.emoteID ?? '');
		if (!!currentEmote) {
			if (currentEmote.urls.length === 0) {
				currentEmote.urls.push(...urls);
			}

			return currentEmote;
		}

		set.push([{
			id: data.emoteID ?? '',
			name: data.alt,
			provider: 'TWITCH',
			visibility: 0,
			mime: '',
			urls: urls,
			width: [28, 56, 112, 112],
			height: [28, 56, 112, 112],
			status: Constants.Emotes.Status.LIVE,
			tags: []
		}], false);

		return set.getEmoteByName(data.alt) as EmoteStore.Emote;
	}

	fromEmoji(data: HTMLImageElement): EmoteStore.Emote {
		if (!this.sets.has(EMOJI_SET_NAME)) {
			this.sets.set(EMOJI_SET_NAME, new EmoteStore.EmoteSet(EMOJI_SET_NAME));
		}

		const set = this.sets.get(EMOJI_SET_NAME) as EmoteStore.EmoteSet;

		const codePoint = twemoji.convert.toCodePoint(data.alt).toUpperCase();
		const emoteji = set.getEmoteByID(codePoint);
		if (!!emoteji) {
			return emoteji;
		}

		const index = EmojiData.index[twemoji.convert.toCodePoint(data.alt).toUpperCase() as keyof typeof EmojiData.index] as number;
		const emoji = EmojiData.list[index];

		const urls = [] as [string, string][];
		for (let i = 1; i <= 4; i++) {
			urls.push([`${i}`, data.src]);
		}
		set.push([{
			id: codePoint,
			name: emoji?.short_name.toLowerCase() ?? '',
			visibility: DataStructure.Emote.Visibility.GLOBAL,
			tags: [],
			mime: '',
			status: Constants.Emotes.Status.LIVE,
			provider: 'EMOJI',
			width: [19.5],
			height: [19.5],
			urls
		}]);

		return set.getEmoteByID(codePoint) as EmoteStore.Emote;
	}

	defineSets(data: EmoteStore.EmoteSet.Resolved[]): void {
		this.sets.clear();
		for (const s of data) {
			const set = new EmoteStore.EmoteSet(s.name).push(s.emotes);

			this.sets.set(set.name, set);
		}

		return undefined;
	}

	/**
	 * Enable an emote set
	 *
	 * @param name the name of the set to enable
	 * @param emotes the emotes that the set contains
	 * @returns the emote set that was created
	 */
	enableSet(name: string, emotes: DataStructure.Emote[]): EmoteStore.EmoteSet {
		if (this.sets.has(name)) {
			return (this.sets.get(name) as EmoteStore.EmoteSet).push(emotes);
		}
		const set = new EmoteStore.EmoteSet(name).push(emotes);

		this.sets.set(set.name, set);
		Logger.Get().debug(`Enabled emote set: ${name} (${emotes.length} emotes)`);
		return set;
	}

	/**
	 * Disable an emote set
	 *
	 * @param name the name of the set to disable
	 * @returns nothing LULW
	 */
	disableSet(name: string): void {
		if (!this.sets.has(name)) {
			return undefined;
		}

		this.sets.delete(name);
		return undefined;
	}

	resolve(): EmoteStore.EmoteSet.Resolved[] {
		const result = [] as EmoteStore.EmoteSet.Resolved[];

		for (const set of this.sets.values()) {
			result.push(set.resolve());
		}

		Logger.Get().debug(`Disabled emote set: ${name}`);
		return result;
	}
}

export namespace EmoteStore {
	export class EmoteSet {
		private emotes = new Map<string, Emote>();
		get size(): number {
			return this.emotes.size;
		}

		/**
		 * A set of emotes, such as that of a channel or global
		 *
		 * @param name the name of the set
		 */
		constructor(
			public name: string
		) {

		}

		/**
		 * Push emotes to this set, overwriting any data present beforehand
		 *
		 * @param emotes the emotes that will be in this set
		 * @returns this
		 */
		push(emotes: DataStructure.Emote[], override = true): EmoteSet {
			if (override) {
				this.emotes.clear();
			}

			const arr = emotes.map(e => new Emote(e));
			for (const e of arr) {
				this.emotes.set(e.id, e);
			}

			return this;
		}

		getEmotes(): Emote[] {
			const emotes = [] as Emote[];
			for (const [_, emote] of this.emotes) {
				emotes.push(emote);
			}
			return emotes;
		}

		getEmoteByID(id: string): Emote | null {
			return this.emotes.get(id) ?? null;
		}

		getEmoteByName(name: string): Emote | null {
			for (const emote of this.emotes.values()) {
				if (emote.name === name) {
					return emote;
				}
			}
			return null;
		}

		deleteEmote(id: string): void {
			this.emotes.delete(id);
		}

		/**
		 * Resolve this set into its data form
		 *
		 * @returns An object matching the EmoteSet.Resolved interface
		 */
		resolve(): EmoteSet.Resolved {
			return {
				name: this.name,
				emotes: this.getEmotes().map(e => e.resolve())
			};
		}
	}
	export namespace EmoteSet {
		export interface Resolved {
			name: string;
			emotes: DataStructure.Emote[];
		}
	}

	export class Emote {
		id = '';
		name = '';
		mime = '';
		tags = [] as string[];
		width = [] as number[];
		height = [] as number[];
		visibility: DataStructure.Emote.Visibility = 0;
		owner: Partial<DataStructure.TwitchUser> | null = null;
		provider: DataStructure.Emote.Provider = '7TV';
		urls = [] as [string, string][];
		element: HTMLSpanElement | null = null;

		weight = 0;

		constructor(private data: DataStructure.Emote) {
			this.id = data?.id ?? '';
			this.name = data?.name ?? '';
			this.mime = data?.mime ?? '';
			this.visibility = data?.visibility ?? 0;
			this.provider = data?.provider ?? '7TV';
			this.width = data?.width ?? [];
			this.height = data?.height ?? [];
			if (!!data.owner) {
				this.owner = data?.owner;
			}
			if (Array.isArray(data?.urls)) {
				this.urls = data.urls;
			}
			this.defineWeight();
		}

		/**
		 * Get the URL to this emote
		 *
		 * @param size the size of the emote to return
		 */
		cdn(size: '1' | '2' | '3' | '4'): string {
			const url = this.urls.filter(([s]) => s === size)?.[0] ?? this.urls[this.urls.length - 1];

			// Return from urls if available
			if (url?.length === 2) {
				return url[1];
			}

			// Otherwise fallback on hardcoded provider CDNs
			switch (this.provider) {
				case 'TWITCH':
					return `https://static-cdn.jtvnw.net/emoticons/v2/${this.id}/default/dark/${size}.0`;
				default:
					return '';
			}
		}

		setName(name: string): void {
			this.name = this.data.name = name;
		}

		/**
		 * Define the wseight of the emote according to its global state and provider
		 */
		private defineWeight(): number {
			if (this.isGlobal()) {
				this.weight = 0.5;
			} else {
				this.weight = 1;
				if (this.provider === '7TV') {
					this.weight += 0.5;
				} else if (this.provider === 'TWITCH') {
					this.weight += 1;
				}
			}

			return this.weight;
		}

		/**
		 * @returns whether the emote is global
		 */
		isGlobal(): boolean {
			return BitField.HasBits(this.visibility, DataStructure.Emote.Visibility.GLOBAL);
		}

		/**
		 * @returns whether the emote is private
		 */
		isPrivate(): boolean {
			return BitField.HasBits(this.visibility, DataStructure.Emote.Visibility.PRIVATE);
		}

		isZeroWidth(): boolean {
			return BitField.HasBits(this.visibility, DataStructure.Emote.Visibility.ZERO_WIDTH);
		}

		isUnlisted(): boolean {
			return BitField.HasBits(this.visibility, DataStructure.Emote.Visibility.HIDDEN);
		}

		toElement(shouldBlurHidden = false): HTMLSpanElement {
			const container = document.createElement('span');
			container.classList.add('seventv-emote');
			if (this.isZeroWidth()) {
				container.classList.add('seventv-zerowidth');
			}

			const inner = document.createElement('span');
			inner.style.minWidth = `${this.width[0]}px`;
			inner.style.minHeight = `${this.height[0]}px`;

			const tooltipExtra = [] as JSX.Element[];
			if (this.isGlobal()) {
				tooltipExtra.push(<p key='global-state' className='is-7tv-global'>Global Emote</p>);
			}
			if (this.isZeroWidth()) {
				tooltipExtra.push(<p key='zerowidth-state' style={{ color: '#e14bb4' }}>Zero-Width Emote</p>);
			}
			if (this.isUnlisted()) {
				tooltipExtra.push(<p key='unlisted-state' style={{ color: '#f23333' }}>Unlisted Emote</p>);
				if (shouldBlurHidden) {
					container.classList.add('seventv-emote-unlisted');
				}
			}

			inner.addEventListener('mouseenter', event => {
				MainComponent.ShowTooltip.next({ event, hover: true, fields: {
					name: this.name,
					hint: !!this.owner && this.owner.login !== '*deleteduser'
						? `by ${this.owner.display_name ?? this.owner.login ?? 'Unknown User'}`
						: '',
					imageURL: this.cdn('3'),
					providerIconURL: getProviderLogo(this.provider),
					extra: tooltipExtra
				}});
			});
			inner.addEventListener('mouseleave', event => {
				MainComponent.ShowTooltip.next({ event, hover: false });
			});

			const img = document.createElement('img');
			img.alt = ` ${this.name} `;
			img.classList.add('chat-image');
			img.classList.add('chat-line__message--emote');
			img.src = this.cdn('1');
			// Filter out 3x
			img.srcset = this.urls.filter(([size]) => size != '3').map(([size, url]) => `${url} ${size}x`).join(', ');
			inner.appendChild(img);
			container.appendChild(inner);
			return this.element = container;
		}

		resolve(): DataStructure.Emote {
			return this.data;
		}
	}
}
