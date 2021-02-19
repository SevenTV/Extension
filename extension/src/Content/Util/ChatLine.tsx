import { defer, EMPTY, from, iif, Observable, of, range } from "rxjs";
import { bufferCount, concatMap, delay, filter, map, mapTo, mergeMap, switchMap, takeLast, tap, toArray, windowCount } from 'rxjs/operators';
import * as React from 'react';
import * as ReactDOM from 'react-dom/server';
import { Emote } from '../Components/EmoteComponent';
import { ChatListener } from './ChatListener';

export class ChatLine {
	/**
	 * A wrapper around the Twitch chat line elements
	 */
	constructor(public listener: ChatListener, private readonly el: HTMLDivElement) {

	}

	private getSubElements(className: string): HTMLCollectionOf<HTMLSpanElement> {
		return this.el.getElementsByClassName(`chat-line__${className}`) as HTMLCollectionOf<HTMLSpanElement>;
	}

	/**
	 * Render an emote, replacing the given text with an Emote component
	 * 
	 * @param emoteName 
	 */
	renderEmote(emoteName: string): void {
		// const emote = this.listener.cachedEmotes.get(emoteName) ?? this.listener.cachedEmotes.set(emoteName, ReactDOM.renderToString(<Emote />)).get(emoteName);

		this.getFragments().pipe(
			filter(el => el?.innerText?.includes(emoteName)), // Search for the presence of emote
			// Emote found: find matches and render emotes
			mergeMap(span => this.replaceFragmentKeyword(span, emoteName).pipe(
				map(newMarkup => ({ newMarkup, span })),
				takeLast(1)
			)),

			// Re-render message with added emotes
			tap(({ span, newMarkup }) => {
				const newEl = document.createElement('span');
				newEl.innerHTML = newMarkup;

				span.replaceWith(newEl);
			})
		).subscribe();
	}

	/**
	 * Find and replace text inside a given text fragment element and render an Emote component
	 */
	private replaceFragmentKeyword(el: HTMLSpanElement, emoteName: string): Observable<string> {
		return new Observable<string>(observer => {
			const parts = el.innerText.split(' ').filter(s => s.length > 0).map(s => s.trim());
			const newMarkup = [] as string[];

			from(parts).pipe( // Iterate thru message parts (word by word, separated by space)
				mergeMap(part => iif(() => part === emoteName, // Part is emote?
					iif(() => this.listener.cachedEmotes.has(emoteName), // Check if emote was already rendered and cached before
						of(undefined).pipe(
							map(() => this.listener.cachedEmotes.get(emoteName)) // If cached then return the cached emote rendition
						),
						of(undefined).pipe( // Otherwise render the emote now														Test URL (is PagMan), waiting for backend to be written
							map(() => this.listener.cachedEmotes.set(emoteName, ReactDOM.renderToString(<Emote name={emoteName} url="https://cdn.discordapp.com/emojis/732824111788851222.png?v=1&size=32" />)).get(emoteName))
						)
					),
					of(` ${part} `)
				)),
				tap(el => {
					newMarkup.push(el); // Add to markup string
				}),
			).subscribe({
				complete() { observer.next(newMarkup.join('')); observer.complete(); },
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
				.getElementsByTagName('span').item(0)
				.getElementsByClassName('chat-author__display-name').item(0) as HTMLSpanElement;

			observer.next(el);
			observer.complete();
		})
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
			})
		});
	}

	getFragments(): Observable<HTMLSpanElement> {
		return new Observable<HTMLSpanElement>(observer => {
			const fragments = this.el.getElementsByClassName('text-fragment');

			from(Array.from(fragments)).subscribe({
				next(el: HTMLSpanElement) { observer.next(el); },
				complete() { observer.complete(); },
				error(err) { observer.error(err); }
			});
		});
	}
}