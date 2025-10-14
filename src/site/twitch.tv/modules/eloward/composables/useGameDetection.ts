import { computed, onMounted, onUnmounted, ref } from "vue";

const LEAGUE_OF_LEGENDS_ID = "21779";
const LEAGUE_OF_LEGENDS_NAME = "League of Legends";

export function useGameDetection() {
	const currentGame = ref<string>("");
	const currentGameId = ref<string>("");

	let gameObserver: MutationObserver | null = null;

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
			console.log("[EloWard 7TV] VOD game detected from DOM:", text);
			return text;
		}

		// Fallback selectors for carousels or metadata
		const previewGameLink = document.querySelector(
			'a[data-test-selector="preview-card-game-link"], a[data-a-target="preview-card-game-link"]',
		);
		const text2 = previewGameLink?.textContent?.trim();
		if (text2) {
			console.log("[EloWard 7TV] VOD game detected from preview card:", text2);
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
			console.log("[EloWard 7TV] Game detected from stream-game-link:", text);
			return text;
		}

		// Priority 2: any visible category link in the header/content
		const anyCat = header?.querySelector('a[href^="/directory/category/"]');
		const text2 = anyCat?.textContent?.trim();
		if (text2) {
			console.log("[EloWard 7TV] Game detected from category link:", text2);
			return text2;
		}

		// Priority 3: derive from href slug if text is empty
		const byHref = extractGameFromHref(link?.getAttribute("href") || anyCat?.getAttribute("href") || null);
		if (byHref) {
			console.log("[EloWard 7TV] Game detected from href:", byHref);
			return byHref;
		}

		// Priority 4: broader search (late-loading layouts)
		const globalCat = document.querySelector(
			'a[data-a-target="stream-game-link"], a[href^="/directory/category/"]',
		);
		const globalText = globalCat?.textContent?.trim();
		if (globalText) {
			console.log("[EloWard 7TV] Game detected from global search:", globalText);
			return globalText;
		}

		const byHrefGlobal = extractGameFromHref(globalCat?.getAttribute("href") || null);
		if (byHrefGlobal) {
			console.log("[EloWard 7TV] Game detected from global href:", byHrefGlobal);
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
	 * Update the current game
	 */
	function updateGame() {
		let detectedGame: string | null = null;

		if (isVodPage()) {
			detectedGame = getVodGameFromDom();
		} else {
			detectedGame = getChannelGameFromDom();
		}

		if (detectedGame !== currentGame.value) {
			const previousGame = currentGame.value || "none";
			currentGame.value = detectedGame || "";

			// Set game ID if it's League of Legends
			if (detectedGame === LEAGUE_OF_LEGENDS_NAME) {
				currentGameId.value = LEAGUE_OF_LEGENDS_ID;
				console.log(`[EloWard 7TV] ✅ League of Legends stream detected! (was: ${previousGame})`);
			} else {
				currentGameId.value = "";
				if (detectedGame) {
					console.log(`[EloWard 7TV] Game changed to: ${detectedGame} (was: ${previousGame})`);
				} else {
					console.log(`[EloWard 7TV] No game detected (was: ${previousGame})`);
				}
			}
		}
	}

	/**
	 * Start observing DOM for game changes
	 */
	function startObserving() {
		if (gameObserver) return;

		console.log("[EloWard 7TV] Starting game detection observer...");

		// Initial check
		updateGame();

		// Set up mutation observer for game changes
		gameObserver = new MutationObserver(() => {
			updateGame();
		});

		// Observe the body for changes to game links
		gameObserver.observe(document.body, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ["href"],
		});

		// Also check periodically in case mutations are missed
		const interval = setInterval(() => {
			updateGame();
		}, 5000); // Check every 5 seconds

		// Store interval ID for cleanup
		(gameObserver as unknown as { _intervalId: number })._intervalId = interval;
	}

	/**
	 * Stop observing DOM
	 */
	function stopObserving() {
		if (gameObserver) {
			console.log("[EloWard 7TV] Stopping game detection observer");
			gameObserver.disconnect();

			// Clear the interval
			const intervalId = (gameObserver as unknown as { _intervalId?: number })._intervalId;
			if (intervalId) {
				clearInterval(intervalId);
			}

			gameObserver = null;
		}
	}

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
		}, 1000);
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
