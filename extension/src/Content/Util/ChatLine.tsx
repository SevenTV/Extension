import { from, iif, Observable, of, range } from 'rxjs';
import { filter, map, mergeMap, takeLast, tap, toArray } from 'rxjs/operators';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ChatListener } from 'src/Content/Util/ChatListener';
import { Emote } from 'src/Content/Components/EmoteComponent';

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
				toArray(),
				map(newMarkup => ({ newMarkup, span })),
				takeLast(1)
			)),

			// Re-render message with added emotes
			tap(({ span, newMarkup }) => {
				const newEl = document.createElement('span');
				// newEl.innerHTML = newMarkup;

				ReactDOM.render(newMarkup, newEl);
				span.replaceWith(newEl);
			})
		).subscribe();
	}

	/**
	 * Find and replace text inside a given text fragment element and render an Emote component
	 */
	private replaceFragmentKeyword(el: HTMLSpanElement, emoteName: string): Observable<JSX.Element> {
		return new Observable<JSX.Element>(observer => {
			const parts = el.innerText.split(' ').filter(s => s.length > 0).map(s => s.trim());
			const newMarkup = [] as JSX.Element[];

			from(parts).pipe( // Iterate thru message parts (word by word, separated by space)
				mergeMap(part => iif(() => part === emoteName, // Part is emote?
					iif(() => this.listener.cachedEmotes.has(emoteName), // Check if emote was already rendered and cached before
						of(undefined).pipe(
							map(() => this.listener.cachedEmotes.get(emoteName)) // If cached then return the cached emote rendition
						),
						of(undefined).pipe( // Otherwise render the emote now														Test URL (is PagMan), waiting for backend to be written
							map(() => this.listener.cachedEmotes.set(emoteName, <Emote name={emoteName} url='https://cdn.discordapp.com/emojis/797197297675010071.gif?v=1&size=32' />).get(emoteName))
						)
					),
					of((<span> { part } </span>))
				)),
				tap(el => {
					newMarkup.push(el); // Add to markup string
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
				.getElementsByTagName('span').item(0)
				.getElementsByClassName('chat-author__display-name').item(0) as HTMLSpanElement;

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
			const fragments = this.el.getElementsByClassName('text-fragment');

			from(Array.from(fragments)).subscribe({
				next(el: HTMLSpanElement) { observer.next(el); },
				complete() { observer.complete(); },
				error(err) { observer.error(err); }
			});
		});
	}
}
