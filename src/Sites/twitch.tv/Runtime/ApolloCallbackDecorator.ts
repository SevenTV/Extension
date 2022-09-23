import { Twitch } from 'src/Sites/twitch.tv/Util/Twitch';
import { TwitchPageScript } from 'src/Sites/twitch.tv/twitch';

export class ApolloCallbackDecorator {
	DECORATED_OPERATION_CALLBACKS = new Map<string, Function>([
		[
			Twitch.ApolloOperationNames.CurrentUserBannedStatus,
			(data: any, originalCallback: Function) => {
				// banStatus is null if the user is not banned
				if (!data.result.channel.self.banStatus) {
					setTimeout(() => {
						const chatInputButtonsContainerElement =
							document.querySelector(
								Twitch.Selectors.ChatInputButtonsContainer
							) as HTMLElement;
						this.page.site.embeddedUI.embedChatButton(
							chatInputButtonsContainerElement
						);
					}, 100);
				}

				// Call the original callback to continue the Apollo operation
				originalCallback(data);
			},
		],
	]);

	constructor(private page: TwitchPageScript) {
		// IIFE which sets up an interval timer to check for the Apollo client
		// once found, the interval is cleared and the Apollo callbacks are decorated
		(function hooked(
			win: any,
			apolloCallbackDecorator: ApolloCallbackDecorator
		) {
			let detectionInterval: any;
			const findApolloClient = () => {
				if (win.__APOLLO_CLIENT__) {
					clearInterval(detectionInterval);
					// another IIFE which decorates the Apollo callbacks, tries
					// every 500ms for 5 seconds or until all callbacks are decorated
					(() => {
						let decoratorInterval: any;
						decoratorInterval = global.setInterval(() => {
							let allDecorated: boolean =
								apolloCallbackDecorator.decorateCallbacks();
							if (allDecorated) {
								clearInterval(decoratorInterval);
							}
						}, 500);
						setTimeout(
							() => clearInterval(decoratorInterval),
							5000
						);
					})();
				}
			};
			detectionInterval = global.setInterval(findApolloClient, 1000);
		})(window, this);
	}

	decorateCallbacks() {
		const watches = this.getWatches();
		let allDecorated = true;

		for (const [operationName, decoratedCallbackFunction] of this
			.DECORATED_OPERATION_CALLBACKS) {
			const watch: any = watches.find(
				(x: any) => x['query'][operationName]
			);

			if (!watch) {
				allDecorated = false;
				continue;
			}

			if (!watch['hasOverriddenCallback']) {
				// set a flag to make sure we dont override the callback more than once
				watch['hasOverriddenCallback'] = true;

				const originalCallback: any = watch.callback;
				watch.callback = (data: any) => {
					decoratedCallbackFunction(data, originalCallback);
				};
			}
		}

		return allDecorated;
	}

	private getWatches() {
		const apolloClient = (window as any).__APOLLO_CLIENT__;
		const watches: any[] = Array.from(apolloClient['cache']['watches']);
		return watches;
	}
}
