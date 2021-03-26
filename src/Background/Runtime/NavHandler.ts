import { DataStructure } from "@typings/typings/DataStructure";
import { asyncScheduler, BehaviorSubject, iif, Observable, of, scheduled, Subject, timer } from "rxjs";
import {
	catchError,
	concatAll,
	delay,
	filter,
	map,
	mapTo,
	mergeAll,
	mergeMap,
	switchMap,
	take,
	takeUntil,
	tap,
	toArray,
} from "rxjs/operators";
import { Background } from "src/Background/Background";
import { Config } from "src/Config";
import { Logger } from "src/Logger";
import { version as extVersion } from "../../../package.json";

export class NavHandler {
	private versionChecked = false;
	private channelURL = /(https:\/\/www.twitch.tv\/)(?:(popout|moderator)\/)?([a-zA-Z0-9_]{4,25})/;
	private channels = new Subject<NavHandler.CurrentChannelUpdate>();

	private loadedTabs = new Map<number, chrome.tabs.Tab>();
	private globalEmoteCache = new BehaviorSubject<DataStructure.Emote[]>([]).pipe(
		mergeMap((emotes) =>
			scheduled([of(emotes), timer(60 * 1000).pipe(takeUntil(this.globalEmoteCache), mapTo([]))], asyncScheduler).pipe(mergeAll())
		)
	) as BehaviorSubject<DataStructure.Emote[]>;

	constructor() {
		chrome.tabs.onUpdated.addListener((id, change, tab) => this.onUpdate(id, change, tab));

		chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
			const tabId = sender.tab?.id ?? 0;
			if (tabId === 0) return undefined;

			// Listen for tabs being unloaded
			if (msg.tag === "Unload") {
				this.loadedTabs.delete(tabId);
				Logger.Get().info(`Unloaded tab ${tabId}`);
				sendResponse("goodbye");
			}
		});

		this.channels
			.pipe(
				// Listen for changes to loaded channels
				tap((change) => Logger.Get().info(`Loading Channel ${change.channelName}:${change.tab.id}`)),
				filter((change) => !this.loadedTabs.has(change.tab.id as number)), // Make sure this tab isn't already loaded

				// Load content script
				tap((change) =>
					chrome.tabs.executeScript(
						change.tab.id as number,
						{
							file: "content.js",
							runAt: "document_start",
						},
						() => {
							if (!change.tab) return Logger.Get().error(`Tried to start content script but tab no longer exists`);

							this.loadedTabs.set(change.tab.id as number, change.tab); // Add to loaded tabs so it's not loaded again
							scheduled(
								[
									this.getGlobalEmotes(change.tab).pipe(
										// Retrieve global emotes
										toArray(),
										tap((emotes) =>
											Background.Messaging.send(
												{
													tag: "MapGlobalEmotes",
													emotes,
												},
												change.tab.id as number
											)
										)
									),

									this.checkVersion().pipe(
										tap((res) =>
											Logger.Get().warn(
												`Extension is Outdated! Latest release is ${res.version} but this is ${extVersion}`
											)
										),
										filter((res) => res.version !== extVersion),
										map((res) => {
											Background.Messaging.send(
												{
													tag: "OutdatedVersion",
													latestVersion: res.version,
													clientVersion: extVersion,
												},
												change.tab.id as number
											);
										})
									),

									this.getEmotes(change.channelName).pipe(
										// Then get the channel's emotes
										toArray(),
										catchError((err) =>
											of(undefined).pipe(
												tap(() =>
													Logger.Get().error(`Error getting channel emotes of ${change.channelName}, ${err}`)
												),
												mapTo([])
											)
										),
										map((emotes) =>
											Background.Messaging.send(
												{
													tag: "LoadChannel",
													emotes,
													channelName: change.channelName,
												},
												change.tab.id as number
											)
										)
									),
								],
								asyncScheduler
							)
								.pipe(concatAll())
								.subscribe();
						}
					)
				),
				delay(50)
			)
			.subscribe();
	}

	getGlobalEmotes(tab: chrome.tabs.Tab): Observable<DataStructure.Emote> {
		if (!tab.id) throw new Error("tab id is undefined or null");

		// Make one time request to fetch global emotes
		return this.globalEmoteCache.pipe(
			take(1),
			switchMap((emotes) =>
				iif(
					() => emotes.length > 0,
					of(emotes).pipe(
						tap((emotes) => Logger.Get().info(`Retrieved ${emotes.length} global emotes from cache`)),
						mergeAll()
					),
					this.getEmotes("@global").pipe(
						toArray(),
						tap((emotes) => this.globalEmoteCache.next(emotes)),
						mergeAll()
					)
				)
			)
		);
	}

	private onUpdate(id: number, change: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab): void {
		if (!tab.url) return undefined;
		if (!this.channelURL.test(tab.url)) return undefined;
		if (change.status !== "complete") return undefined;

		// const url = new URL(tab.url.replace('/popout', ''));
		const parsedURL = tab.url.match(this.channelURL);
		if (!parsedURL) return undefined;

		const channelName = parsedURL[3]; // Index 3 of regex-matched string will always be the channel name
		Logger.Get().info("Navigation to channel", channelName);

		// Emit channels update
		this.channels.next({
			channelName,
			tab,
		});
	}

	getEmotes(channelName: string | "@global"): Observable<DataStructure.Emote> {
		return new Observable<DataStructure.Emote>((observer) => {
			const xhr = new XMLHttpRequest();

			xhr.addEventListener("load", () => {
				const data = JSON.parse(xhr.responseText);
				if (xhr.status >= 400 && xhr.status <= 599) {
					return observer.error(Error(data.error.message));
				}

				for (const e of data.emotes) {
					observer.next(e as DataStructure.Emote);
				}

				Logger.Get().info(`Loaded ${data.count ?? data.total_estimated_size ?? 0} emotes in ${channelName}`);
				observer.complete();
			});

			xhr.open(
				"GET",
				Config.apiUrl + (channelName === "@global" ? `/emotes?globalEmotes=only&pageSize=150` : `/channels/${channelName}/emotes`)
			);
			xhr.send();
		});
	}

	checkVersion(): Observable<NavHandler.CheckVersionResult> {
		return new Observable<NavHandler.CheckVersionResult>((observer) => {
			const xhr = new XMLHttpRequest();

			xhr.addEventListener("load", () => {
				const data = JSON.parse(xhr.responseText);
				if (typeof data.version === "string") {
					observer.next({
						version: data.version,
						releaseUrl: data.release_url,
					});
				}

				observer.complete();
			});
			xhr.open("GET", `${Config.apiUrl}/extension?type=chrome`);
			xhr.send();
		});
	}
}

export namespace NavHandler {
	export interface CheckVersionResult {
		version: string;
		releaseUrl: string;
	}

	export interface CurrentChannelUpdate {
		channelName: string;
		tab: chrome.tabs.Tab;
	}
}
