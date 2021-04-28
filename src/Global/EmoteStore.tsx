import { BitField } from '@typings/src/BitField';
import { DataStructure } from '@typings/typings/DataStructure';
import React from 'react';
import { Config } from 'src/Config';
import { EmoteComponent } from 'src/Content/Components/EmoteComponent';
import { Logger } from 'src/Logger';

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
		push(emotes: DataStructure.Emote[]): EmoteSet {
			this.emotes = [];

			const arr = emotes.map(e => new Emote(e));
			this.emotes.push(...arr);

			return this;
		}

		getEmotes(): Emote[] {
			return this.emotes;
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
		provider: Emote.Provider = '7TV';

		constructor(private data: DataStructure.Emote) {
			this.id = data.id;
			this.name = data.name;
			this.mime = data.mime ?? '';
			this.visibility = data.visibility ?? 0;
			if (!!data.owner) {
				this.owner = data.owner;
			}
		}

		cdn(size: '1x' | '2x' | '3x' | '4x'): string {
			return `${Config.cdnUrl}/emote/${this.id}/${size}`;
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
			/>;
		}

		resolve(): DataStructure.Emote {
			return this.data;
		}
	}
	export namespace Emote {
		export type Provider = '7TV' | 'Twitch' | 'BTTV' | 'FFZ';
	}
}
