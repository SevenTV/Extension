import React from 'react';
import ReactDOM from 'react-dom';
import { asapScheduler, iif, Observable, of, scheduled, Subject, throwError } from 'rxjs';
import { catchError, map, mergeAll, switchMap, tap, toArray } from 'rxjs/operators';
import { SettingNode } from 'src/Content/Runtime/Settings';
import { API } from 'src/Global/API';
import { Badge } from 'src/Global/Badge';
import { PageScriptListener } from 'src/Global/Decorators';
import { EmoteStore } from 'src/Global/EmoteStore';
import { decimalColorToRGBA, SettingValue } from 'src/Global/Util';
import { Logger } from 'src/Logger';
import { EmbeddedUI } from 'src/Sites/app/EmbeddedUI';
import { MainComponent } from 'src/Sites/app/MainComponent';
import { TabCompleteDetection } from 'src/Sites/app/Runtime/TabCompleteDetection';

export class SiteApp {
	api = new API();
	mainComponent: MainComponent | null = null;
	emoteStore = emoteStore;
	embeddedUI = new EmbeddedUI(this);
	badges = [] as Badge[];
	paints = [] as API.Paint[];
	badgeMap = new Map<number, number[]>();
	paintMap = new Map<number, number>();
	currentChannel = '';
	tabCompleteDetector = new TabCompleteDetection(this);
	config = config;

	menuPickEmote = new Subject<EmoteStore.Emote>();

	constructor() {
		// Fetch Badges
		this.api.GetCosmetics().pipe(
			map(cosmetics => {
				for (let i = 0; i < cosmetics.badges.length; i++) {
					const badge = cosmetics.badges[i];
					this.badges[i] = badge;

					for (const u of badge.users) {
						let id: number | string = parseInt(u);
						if (isNaN(id)) {
							id = u;
						}

						if (this.badgeMap.has(id as number)) {
							this.badgeMap.set(id as number, [...this.badgeMap.get(id as number) as number[], i]);
						} else {
							this.badgeMap.set(id as number, [i]);
						}
					}
				}
				for (let i = 0; i < cosmetics.paints.length; i++) {
					const paint = cosmetics.paints[i];
					this.paints[i] = paint;

					for (const u of paint.users) {
						let id: number | string = parseInt(u);
						if (isNaN(id)) {
							id = u;
						}

						this.paintMap.set(id as number, i);
					}
				}

				this.buildCosmeticPaintStyles();
				return cosmetics;
			}),

			tap(x => {
				const appliedCount = x.badges.filter(b => b.users.length > 0).map(b => b.users.length).reduce((a, b) => a + b)
					+ x.paints.filter(p => p.users.length > 0).map(p => p.users.length).reduce((a, b) => a + b);
				Logger.Get().info(`Loaded ${x.badges?.length ?? 0} badges and ${x.paints?.length ?? 0} paints. Cosmetics applied to ${appliedCount} users`);
			})
		).subscribe();
	}

	switchChannel(data: {
		channelID: string;
		platform?: 'twitch' | 'youtube';
		channelName?: string;
		as?: string;
	}): Observable<EmoteStore.EmoteSet> {
		if (data.channelID == '') {
			throw new Error('channelID cannot be empty');
		}

		this.emoteStore.disableSet(this.currentChannel);
		if (!!data.as) this.emoteStore.disableSet(data.as);
		this.mainComponent?.toggleEmoteMenu(undefined, false);

		const emoteGetter = [
			this.api.GetGlobalEmotes().pipe(catchError(_ => of([]))),
			this.api.GetFrankerFaceZGlobalEmotes().pipe(
				catchError(() => of([]))
			),
			this.api.GetBTTVGlobalEmotes().pipe(
				catchError(() => of([]))
			),
			this.api.GetChannelEmotes(data.channelID).pipe(catchError(_ => of([]))),
			this.api.GetFrankerFaceZChannelEmotes(data.channelID, data.platform).pipe(
				catchError(() => of([]))
			),
			this.api.GetBTTVChannelEmotes(data.channelID, data.platform).pipe(
				catchError(() => of([]))
			)
		];

		return scheduled(emoteGetter, asapScheduler).pipe(
			mergeAll(),
			toArray(),
			map(a => a.reduce((a, b) => a.concat(b as any))),
			switchMap(e => iif(() => e.length === 0,
				throwError(Error(`7TV failed to load (perhaps service is down?)`)),
				of(e)
			)),
			map(e => emoteStore.enableSet(data.channelID, e)),
			tap(_ => {
				this.eIndex = null;
				this.currentChannel = data.channelID;
			})
		);
	}

	createOverlay(container: HTMLElement, emoteMenuOffset = 0): void {		// Once the extension injected itself into Twitch
		const app = document.createElement('div');
		app.classList.add('seventv-overlay');
		app.style.position = 'absolute';
		app.id = 'seventv';

		this.mainComponent = ReactDOM.render(<MainComponent emoteStore={emoteStore} emoteMenuOffset={emoteMenuOffset} />, app) as unknown as MainComponent;
		this.mainComponent.app = this;
		container.appendChild(app);
	}

	getAppStylesheet(): CSSStyleSheet | null {
		const stylesheetURL = assetStore.get('stylesheet');

		// Firefox fix - Create new stylesheet
		if (stylesheetURL?.startsWith('moz')) {
			const style = document.createElement('style');
			style.title = '7TV Paints';
			style.appendChild(document.createTextNode(''));
			document.head.appendChild(style);

			return style.sheet;
		}

		let stylesheet: CSSStyleSheet | null = null;

		// Find our stylesheet
		for (const s of document.styleSheets) {
			if (s.href !== stylesheetURL) {
				continue;
			}

			stylesheet = s;
			break;
		}
		if (!stylesheet) {
			Logger.Get().warn('Could not find 7TV global stylesheet');
			return null;
		}
		return stylesheet;
	}

	/**
	 * Insert paint styles into our global stylesheet
	 */
	buildCosmeticPaintStyles(): void {
		const stylesheet = this.getAppStylesheet();
		if (!stylesheet) {
			return undefined;
		}

		// Turn the paint data into css rule
		for (let i = 0; i < this.paints.length; i++) {
			const paint = this.paints[i];
			// define the css function to use
			const funcName = ''.concat(
				paint.repeat ? 'repeating-' : '',
				paint.function
			);
			const args = [] as string[];
			switch (paint.function) {
				case 'linear-gradient': // paint is linear gradient
					args.push(`${paint.angle}deg`);
					break;
				case 'radial-gradient': // paint is radial gradient
					args.push(paint.shape ?? 'circle');
					break;
				case 'url': // paint is an image
					args.push(paint.image_url ?? '');
					break;
			}

			// Parse stops
			if (Array.isArray(paint.stops)) {
				for (const stop of paint.stops) {
					const color = decimalColorToRGBA(stop.color);
					args.push(`${color} ${stop.at * 100}%`);
				}
			}
			// Handle drop shadow
			const dropShadow = [] as string[];
			if (paint.drop_shadow) {
				const { x_offset, y_offset, color, radius } = paint.drop_shadow;
				dropShadow.push(`${x_offset}px`, `${y_offset}px`, `${radius}px`, decimalColorToRGBA(color));
			}

			// Insert new css rule for the paint
			stylesheet.insertRule(`
				body:not(.seventv-no-paints) [data-seventv-paint="${i}"] {
					${paint.color === null ? '' : `color: ${decimalColorToRGBA(paint.color)};`}
					filter: ${dropShadow ? `drop-shadow(${dropShadow.join(' ')})` : 'inherit'};
					background-clip: text !important;
					background-size: cover !important;
					-webkit-background-clip: text !important;
					-webkit-text-fill-color: transparent;
					background-image: ${funcName}(${args.join(', ')});
					background-color: currentColor;
				}
			`.replace(/(\r\n|\n|\r)/gm, ''), stylesheet.cssRules.length);

			Logger.Get().debug(`Loaded cosmetic paint: '${paint.name}' (index: ${i}, id: ${paint.id})`);
		}
	}

	public eIndex: {
		[x: string]: EmoteStore.Emote;
	} | null = null;
	getEmoteIndex() {
		if (!!this.eIndex) {
			return this.eIndex;
		}

		const emotes = this.getAllEmotes();
		return emotes.length > 0 ? this.eIndex = emotes.map(e => ({ [e.name]: e })).reduce((a, b) => ({ ...a, ...b })) : {};
	}

	getAllEmotes(): EmoteStore.Emote[] {
		const emotes = [] as EmoteStore.Emote[];
		for (const set of emoteStore.sets.values()) {
			emotes.push(...set.getEmotes().sort((a, b) => a.weight - b.weight));
		}

		return emotes;
	}

	@PageScriptListener('OnAssets')
	onExtensionAssets(assetMap: [string, string][]) {
		assetStore = new Map(assetMap);
	}

	@PageScriptListener('ConfigNodes')
	whenConfigNodes(nodes: SettingNode[]): void {
		settingNodes = nodes;
	}

	@PageScriptListener('ConfigChange')
	whenAppConfigChangeds(cfg: { [x: string]: any; }): void {
		for (const k of Object.keys(cfg)) {
			config.set(k, new SettingValue(cfg[k]));
		}
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

export const emoteStore = new EmoteStore();
export let assetStore = new Map<string, string>();
export let settingNodes = [] as SettingNode[];
const config = new Map<string, SettingValue>();
export const configMap = config;

