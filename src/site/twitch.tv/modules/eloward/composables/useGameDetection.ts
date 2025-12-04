import { computed, onMounted, onUnmounted, ref, watch } from "vue";

const LEAGUE_OF_LEGENDS_ID = "21779";
const LEAGUE_OF_LEGENDS_NAME = "League of Legends";
const DEV_MODE = import.meta.env.DEV;
// Temporarily enable logging in production for debugging
const ENABLE_LOGGING = true;

function perfLog(message: string, data?: unknown) {
	if (DEV_MODE || ENABLE_LOGGING) {
		console.log(`[EloWard GameDetect] ${message}`, data || "");
	}
}

const currentGame = ref<string>("");
const currentGameId = ref<string>("");
const lastPathname = ref<string>("");
const hasCheckedForCurrentPage = ref<boolean>(false);
let checkTimeout: number | null = null;
let isInitialized = false;

export function useGameDetection() {

	/**
	 * Extract game name from Twitch directory URL
	 * Turns /directory/category/league-of-legends into "League of Legends"
	 */
	function extractGameFromHref(href: string | null | undefined): string | null {
		if (!href) return null;

		const match = href.match(/\/directory\/category\/([^/?#]+)/i);
		if (!match) return null;

		// Convert slug to title case (league-of-legends -> League of Legends)
		return match[1]
			.split("-")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" ");
	}

	/**
	 * Get game from VOD page
	 */
	function getVodGameFromDom(): string | null {
		// Primary VOD selector
		const vodGame = document.querySelector('a[data-a-target="video-info-game-boxart-link"] p');
		const text = vodGame?.textContent?.trim();
		if (text) {
			return text;
		}

		// Fallback selectors for carousels or metadata
		const previewGameLink = document.querySelector(
			'a[data-test-selector="preview-card-game-link"], a[data-a-target="preview-card-game-link"]',
		);
		const text2 = previewGameLink?.textContent?.trim();
		if (text2) {
			return text2;
		}

		return null;
	}

	/**
	 * Get game from channel page DOM
	 */
	function getChannelGameFromDom(): string | null {
		// Priority 1: canonical Twitch selector in channel header
		const header = document.querySelector("#live-channel-stream-information, .channel-info-content");
		const link = header?.querySelector('a[data-a-target="stream-game-link"]');
		const text = link?.textContent?.trim();
		if (text) {
			return text;
		}

		// Priority 2: any visible category link in the header/content
		const anyCat = header?.querySelector('a[href^="/directory/category/"]');
		const text2 = anyCat?.textContent?.trim();
		if (text2) {
			return text2;
		}

		// Priority 3: derive from href slug if text is empty
		const byHref = extractGameFromHref(link?.getAttribute("href") || anyCat?.getAttribute("href") || null);
		if (byHref) {
			return byHref;
		}

		// Priority 4: broader search (late-loading layouts)
		const globalCat = document.querySelector(
			'a[data-a-target="stream-game-link"], a[href^="/directory/category/"]',
		);
		const globalText = globalCat?.textContent?.trim();
		if (globalText) {
			return globalText;
		}

		const byHrefGlobal = extractGameFromHref(globalCat?.getAttribute("href") || null);
		if (byHrefGlobal) {
			return byHrefGlobal;
		}

		return null;
	}

	/**
	 * Check if current page is a VOD
	 */
	function isVodPage(): boolean {
		return window.location.pathname.includes("/videos/") || window.location.pathname.includes("/video/");
	}

	function updateGame() {
		const startTime = performance.now();

		// Only skip if we already have a valid game detected (not null)
		// This allows retries when DOM wasn't ready
		if (
			hasCheckedForCurrentPage.value &&
			window.location.pathname === lastPathname.value &&
			currentGame.value !== ""
		) {
			perfLog("updateGame() - SKIPPED (already checked with valid result)");
			return;
		}

		let detectedGame: string | null = null;

		if (isVodPage()) {
			detectedGame = getVodGameFromDom();
		} else {
			detectedGame = getChannelGameFromDom();
		}

		if (detectedGame !== currentGame.value) {
			currentGame.value = detectedGame || "";

			if (detectedGame === LEAGUE_OF_LEGENDS_NAME) {
				currentGameId.value = LEAGUE_OF_LEGENDS_ID;
				perfLog("updateGame() - League of Legends DETECTED", {
					duration: `${(performance.now() - startTime).toFixed(2)}ms`,
				});
			} else {
				currentGameId.value = "";
				if (detectedGame === null) {
					perfLog("updateGame() - No game detected (DOM not ready?)", {
						duration: `${(performance.now() - startTime).toFixed(2)}ms`,
					});
				} else {
					perfLog("updateGame() - Different game detected", {
						game: detectedGame,
						duration: `${(performance.now() - startTime).toFixed(2)}ms`,
					});
				}
			}
		} else {
			perfLog("updateGame() - No change", {
				game: currentGame.value,
				duration: `${(performance.now() - startTime).toFixed(2)}ms`,
			});
		}

		// Only mark as checked if we got a valid result
		if (detectedGame !== null) {
			hasCheckedForCurrentPage.value = true;
		}
		lastPathname.value = window.location.pathname;
	}

	function startObserving() {
		perfLog("startObserving() - START");

		if (checkTimeout) {
			clearTimeout(checkTimeout);
			checkTimeout = null;
		}

		hasCheckedForCurrentPage.value = false;
		updateGame();

		// Retry multiple times with increasing delays to ensure DOM is ready
		const retryDelays = [500, 1500, 3000];
		retryDelays.forEach((delay, index) => {
			window.setTimeout(() => {
				perfLog(`startObserving() - Retry ${index + 1} (${delay}ms delay)`);
				updateGame();
			}, delay);
		});
	}

	/**
	 * Stop observing
	 */
	function stopObserving() {
		if (checkTimeout) {
			clearTimeout(checkTimeout);
			checkTimeout = null;
		}
	}

	// Watch for navigation changes
	watch(
		() => window.location.pathname,
		(newPath, oldPath) => {
			if (newPath !== oldPath) {
				// Reset and check again on navigation
				startObserving();
			}
		},
	);

	// Computed property to check if it's a League stream
	const isLeagueStream = computed(() => {
		const isLeague =
			currentGameId.value === LEAGUE_OF_LEGENDS_ID ||
			currentGame.value === LEAGUE_OF_LEGENDS_NAME ||
			currentGame.value.toLowerCase().includes("league of legends");

		return isLeague;
	});

	if (!isInitialized) {
		isInitialized = true;
		perfLog("useGameDetection() - FIRST INITIALIZATION");
		setTimeout(() => {
			startObserving();
		}, 100);
	} else {
		perfLog("useGameDetection() - reusing existing instance");
	}

	return {
		currentGame,
		currentGameId,
		isLeagueStream,
		updateGame,
		startObserving,
		stopObserving,
	};
}
