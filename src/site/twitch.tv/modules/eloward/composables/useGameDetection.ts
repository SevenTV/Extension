import { computed, onMounted, onUnmounted, ref, watch } from "vue";

const LEAGUE_OF_LEGENDS_ID = "21779";
const LEAGUE_OF_LEGENDS_NAME = "League of Legends";

export function useGameDetection() {
	const currentGame = ref<string>("");
	const currentGameId = ref<string>("");
	const lastPathname = ref<string>("");
	const hasCheckedForCurrentPage = ref<boolean>(false);

	let checkTimeout: number | null = null;

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

	/**
	 * Update the current game - only check once or twice per page
	 */
	function updateGame() {
		// Don't check if we already checked for this page
		if (hasCheckedForCurrentPage.value && window.location.pathname === lastPathname.value) {
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

			// Set game ID if it's League of Legends
			if (detectedGame === LEAGUE_OF_LEGENDS_NAME) {
				currentGameId.value = LEAGUE_OF_LEGENDS_ID;
				// League of Legends detected
			} else {
				currentGameId.value = "";
				// Different game or no game detected
			}
		}

		// Mark as checked for current page
		hasCheckedForCurrentPage.value = true;
		lastPathname.value = window.location.pathname;
	}

	/**
	 * Start checking for game category
	 */
	function startObserving() {
		// Clear any existing timeout
		if (checkTimeout) {
			clearTimeout(checkTimeout);
			checkTimeout = null;
		}

		// Reset check flag for new page
		hasCheckedForCurrentPage.value = false;

		// Initial check
		updateGame();

		// Second check after 3 seconds to account for slow page load
		checkTimeout = window.setTimeout(() => {
			updateGame();
			checkTimeout = null;
		}, 3000);
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

	// Start observing when mounted
	onMounted(() => {
		// Small delay to ensure DOM is ready
		setTimeout(() => {
			startObserving();
		}, 500);
	});

	// Clean up when unmounted
	onUnmounted(() => {
		stopObserving();
	});

	return {
		currentGame,
		currentGameId,
		isLeagueStream,
		updateGame,
		startObserving,
		stopObserving,
	};
}
