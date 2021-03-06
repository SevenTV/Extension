import { asyncScheduler, from, iif, Observable, of, range, scheduled } from 'rxjs';
import { filter, map, mergeAll, mergeMap, takeLast, tap, toArray } from 'rxjs/operators';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as ReactDOMS from 'react-dom/server';
import { ChatListener } from 'src/Content/Util/ChatListener';
import { Emote } from 'src/Content/Components/EmoteComponent';
import { DataStructure } from '@typings/typings/DataStructure';
import { Config } from 'src/Config';

export class ChatLine {
	/**
	 * A wrapper around the Twitch chat line elements
	 */
	constructor(public listener: ChatListener, private readonly el: HTMLDivElement) {}

	private getSubElements(className: string): HTMLCollectionOf<HTMLSpanElement> {
		return this.el.getElementsByClassName(`chat-line__${className}`) as HTMLCollectionOf<HTMLSpanElement>;
	}

	/**
	 * Render an emote, replacing the given text with an Emote component
	 *
	 * @param emoteName
	 */
	renderEmote(emotes: DataStructure.Emote[]): void {
		// const emote = this.listener.cachedEmotes.get(emoteName) ?? this.listener.cachedEmotes.set(emoteName, ReactDOM.renderToString(<Emote />)).get(emoteName);

		scheduled([
			this.getFragments(),
			this.getEmoteFragments().pipe(
				filter(el => emotes.map(e => e.name).includes(el.alt))
			)
		], asyncScheduler).pipe(
			mergeAll(),
			// filter(el => el?.innerText?.includes(emote.name)), // Search for the presence of emote
			// Emote found: find matches and render emotes
			mergeMap(frag => this.replaceFragmentKeyword(frag, emotes).pipe(
				toArray(),
				map(newMarkup => ({ newMarkup, frag })),
				takeLast(1)
			)),

			// Re-render message with added emotes
			tap(({ frag, newMarkup }) => {
				const newEl = document.createElement('span');
				// newEl.innerHTML = newMarkup;

				ReactDOM.render(newMarkup, newEl);
				frag.replaceWith(newEl);
			})
		).subscribe();
	}

	/**
	 * Find and replace text inside a given text fragment element and render an Emote component
	 */
	private replaceFragmentKeyword(el: HTMLSpanElement | HTMLImageElement, emotes: DataStructure.Emote[]): Observable<JSX.Element> {
		return new Observable<JSX.Element>(observer => {
			const parts = ((el.innerText || el.getAttribute('alt') as string) ?? '').split(' ').filter(s => s.length > 0).map(s => s.trim());
			const newMarkup = [] as JSX.Element[];

			// Index emotes by name
			const eIndex = emotes.map(e => ({ [e.name]: e })).reduce((a, b) => ({ ...a, ...b }));
			from(parts).pipe( // Iterate thru message parts (word by word, separated by space)
				map(part => ({
					part,
					emote: eIndex[part] ?? null // Get the emote this part corresponds to, if any
				})),
				mergeMap(({ emote, part }) => iif(() => part === emote?.name, // Part is emote?
					iif(() => this.listener.cachedEmotes.has(emote.name), // Check if emote was already rendered and cached before
						of(undefined).pipe(
							map(() => this.listener.cachedEmotes.get(emote.name)) // If cached then return the cached emote rendition
						),
						of(undefined).pipe( // Otherwise render the emote now														Test URL (is PagMan), waiting for backend to be written
							map(() => this.listener.cachedEmotes.set(emote.name, <Emote emote={emote} name={emote.name} url={Config.cdnUrl + `/emote/${emote._id}/`} />).get(emote.name))
						)
					),
					of((<span> { part } </span>))
				)),
				tap(el => {
					newMarkup.push(el as JSX.Element); // Add to markup string
				}),
			).subscribe({
				next(el) { observer.next(el); },
				complete() { observer.complete(); },
				error(err) { observer.error(err); }
			});
		});
	}

	/**
	 * Get the username element
	 */
	getUsername(): Observable<HTMLSpanElement> {
		return new Observable<HTMLSpanElement>(observer => {
			const el = this.getSubElements('username').item(0)
				?.getElementsByTagName('span').item(0)
				?.getElementsByClassName('chat-author__display-name').item(0) as HTMLSpanElement;

			if (!el) return observer.error(Error('Couldn\'t find elements for username'));
			observer.next(el);
			observer.complete();
		});
	}

	/**
	 * Emits all the badges LUL
	 */
	getBadges(): Observable<HTMLImageElement> {
		return new Observable<HTMLImageElement>(observer => {
			const badges = this.el.getElementsByClassName('chat-badge');

			range(0, badges.length).pipe(
				map(i => badges.item(i) as HTMLImageElement)
			).subscribe({
				next(el) { observer.next(el); },
				complete() { observer.complete(); },
				error(err) { observer.error(err); }
			});
		});
	}

	getFragments(): Observable<HTMLSpanElement> {
		return new Observable<HTMLSpanElement>(observer => {
			const fragments: HTMLCollectionOf<HTMLSpanElement> = this.el.getElementsByClassName('text-fragment') as HTMLCollectionOf<any>;

			from(Array.from(fragments)).subscribe({
				next(el) { observer.next(el); },
				complete() { observer.complete(); },
				error(err) { observer.error(err); }
			});
		});
	}

	getEmoteFragments(): Observable<HTMLImageElement> {
		const fragments: HTMLCollectionOf<HTMLImageElement> = this.el.getElementsByClassName('chat-line__message--emote') as HTMLCollectionOf<any>;

		return from(Array.from(fragments));
	}

	static postStatus(data: string): void {
		const message = document.createElement('span');
		message.innerHTML = data;

		const div = document.createElement('div');
		div.classList.add('chat-line__status');
		div.appendChild(message);

		const log = document.getElementsByClassName('chat-scrollable-area__message-container').item(0);
		if (log) {
			log.appendChild(div);
		}
	}
}
