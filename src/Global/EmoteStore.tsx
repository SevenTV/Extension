import { BitField } from '@typings/src/BitField';
import { Constants } from '@typings/src/Constants';
import { DataStructure } from '@typings/typings/DataStructure';
import React from 'react';
import { Config } from 'src/Config';
import { EmoteComponent } from 'src/Content/Components/EmoteComponent';
import { Logger } from 'src/Logger';
import { Twitch } from 'src/Page/Util/Twitch';

const TWITCH_SET_NAME = 'twitch';
export class EmoteStore {
	size = 0;
	private cachedElements = new Map<string, JSX.Element>();
	sets = new Map<string, EmoteStore.EmoteSet>();

	addElement(name: string, jsx: JSX.Element): JSX.Element {
		this.cachedElements.set(name, jsx);

		return jsx;
	}

	getElement(name: string): JSX.Element | undefined {
		return this.cachedElements.get(name);
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

	fromTwitchEmote(data: Twitch.ChatMessage.EmoteRef): EmoteStore.Emote {
		if (!this.sets.has(TWITCH_SET_NAME)) {
			this.sets.set(TWITCH_SET_NAME, new EmoteStore.EmoteSet(TWITCH_SET_NAME));
		}

		const set = this.sets.get(TWITCH_SET_NAME) as EmoteStore.EmoteSet;
		set.push([{
			id: data.emoteID ?? '',
			name: data.alt,
			provider: 'TWITCH',
			visibility: 0,
			mime: '',
			status: Constants.Emotes.Status.LIVE,
			tags: []
		}], false);

		return set.getEmoteByName(data.alt) as EmoteStore.Emote;
	}

	enableSet(name: string, emotes: DataStructure.Emote[]): EmoteStore.EmoteSet {
		const set = new EmoteStore.EmoteSet(name).push(emotes);

		this.sets.set(set.name, set);
		Logger.Get().debug(`Enabled emote set: ${name} (${emotes.length} emotes)`);
		return set;
	}
}

export namespace EmoteStore {
	export class EmoteSet {
		private emotes = [] as Emote[];
		get size(): number {
			return this.emotes.length;
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
				this.emotes = [];
			}

			const arr = emotes.map(e => new Emote(e));
			this.emotes.push(...arr);

			return this;
		}

		getEmotes(): Emote[] {
			return this.emotes;
		}

		getEmoteByName(name: string): Emote | null {
			return this.emotes.filter(e => e.name === name)[0];
		}

		/**
		 * Resolve this set into its data form
		 *
		 * @returns An object matching the EmoteSet.Resolved interface
		 */
		resolve(): EmoteSet.Resolved {
			return {
				name: this.name,
				emotes: this.emotes.map(e => e.resolve())
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
		visibility: DataStructure.Emote.Visibility = 0;
		owner: Partial<DataStructure.TwitchUser> | null = null;
		provider: DataStructure.Emote.Provider = '7TV';
		urls = [] as [string, string][];

		constructor(private data: DataStructure.Emote) {
			this.id = data.id ?? '';
			this.name = data.name ?? '';
			this.mime = data.mime ?? '';
			this.visibility = data.visibility ?? 0;
			this.provider = data.provider ?? '7TV';
			if (!!data.owner) {
				this.owner = data.owner;
			}
			if (Array.isArray(data.urls)) {
				this.urls = data.urls;
			}
		}

		/**
		 * Get the URL to this emote
		 *
		 * @param size the size of the emote to return
		 */
		cdn(size: '1' | '2' | '3' | '4'): string {
			const url = this.urls.filter(([s]) => s === size)?.[0] ?? ['', ''];

			switch (this.provider) {
				case 'FFZ':
					url[0] = url[0] === '3' ? '4' : url[0];
					return url[1];
				case 'TWITCH':
					return `https://static-cdn.jtvnw.net/emoticons/v2/${this.id}/default/dark/${size}.0`;
				default:
					return url[1];
			}
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

		toJSX(): JSX.Element {
			return <EmoteComponent
				emote={this}
				provider={this.provider}
			/>;
		}

		resolve(): DataStructure.Emote {
			return this.data;
		}
	}
}
