import { ref } from "vue";
import { useConfig } from "@/composable/useSettings";

const API_BASE_URL = "https://eloward-ranks.unleashai.workers.dev/api/ranks/lol";
const CDN_BASE_URL = "https://eloward-cdn.unleashai.workers.dev/lol";
const DEFAULT_CACHE_DURATION = 60 * 60 * 1000; // 1 hour for positive cache
const NEGATIVE_CACHE_DURATION = 15 * 60 * 1000; // 15 minutes for negative cache
const MAX_CACHE_SIZE = 500;
const BADGE_CACHE_VERSION = "3";

interface CacheEntry {
	data: EloWardRankData | null; // null for negative cache
	timestamp: number;
}

class LRUCache {
	private cache: Map<string, CacheEntry>;
	private maxSize: number;

	constructor(maxSize = 500) {
		this.cache = new Map();
		this.maxSize = maxSize;
	}

	get(username: string): EloWardRankData | null | undefined {
		const key = username.toLowerCase();
		const entry = this.cache.get(key);

		if (!entry) return undefined; // Not in cache

		// Check if cache is expired
		const now = Date.now();
		const cacheDuration =
			entry.data === null
				? NEGATIVE_CACHE_DURATION // Shorter duration for negative cache
				: DEFAULT_CACHE_DURATION;

		if (now - entry.timestamp > cacheDuration) {
			this.cache.delete(key);
			return undefined;
		}

		// Move to end (most recently used)
		this.cache.delete(key);
		this.cache.set(key, entry);

		return entry.data; // Can be null (negative cache) or data
	}

	set(username: string, data: EloWardRankData | null) {
		const key = username.toLowerCase();

		// Remove oldest entry if at max size
		if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
			const firstKey = this.cache.keys().next().value;
			if (firstKey) this.cache.delete(firstKey);
		}

		this.cache.set(key, {
			data,
			timestamp: Date.now(),
		});
	}

	clear() {
		this.cache.clear();
	}

	size(): number {
		return this.cache.size;
	}
}

// Global cache instance
const rankCache = new LRUCache(MAX_CACHE_SIZE);

// Track pending requests to avoid duplicate API calls
const pendingRequests = new Map<string, Promise<EloWardRankData | null>>();

// Valid rank tiers
const RANK_TIERS = new Set([
	"iron",
	"bronze",
	"silver",
	"gold",
	"platinum",
	"emerald",
	"diamond",
	"master",
	"grandmaster",
	"challenger",
	"unranked",
]);
const HIGH_RANKS = new Set(["MASTER", "GRANDMASTER", "CHALLENGER"]);

// Simple image URL generator - no complex caching needed
function getImageUrl(tier: string, isAnimated: boolean): string {
	const extension = isAnimated ? ".webp" : ".png";
	const suffix = isAnimated ? "_premium" : "";
	return `${CDN_BASE_URL}/${tier}${suffix}${extension}?v=${BADGE_CACHE_VERSION}`;
}

export interface EloWardRankData {
	tier: string;
	division?: string;
	leaguePoints?: number;
	summonerName?: string;
	region?: string;
	animate_badge?: boolean;
}

export interface EloWardBadge {
	id: string;
	tier: string;
	division?: string;
	imageUrl: string;
	animated: boolean;
	summonerName?: string;
	region?: string;
	leaguePoints?: number;
}

export function useEloWardRanks() {
	const enabled = useConfig<boolean>("eloward.enabled");

	const isLoading = ref(false);

	/**
	 * Fetch rank data for a username with caching
	 */
	async function fetchRankData(username: string): Promise<EloWardRankData | null> {
		if (!enabled.value || !username) return null;

		const normalizedUsername = username.toLowerCase();

		// Check cache first (returns undefined if not cached, null if negative cached, or data)
		const cached = rankCache.get(normalizedUsername);
		if (cached !== undefined) {
			return cached; // Return cached result (can be null for negative cache)
		}

		// Check if there's already a pending request for this user
		if (pendingRequests.has(normalizedUsername)) {
			return pendingRequests.get(normalizedUsername)!;
		}

		// Create new request
		const requestPromise = (async () => {
			try {
				isLoading.value = true;
				const response = await fetch(`${API_BASE_URL}/${normalizedUsername}`, {
					method: "GET",
					headers: {
						Accept: "application/json",
					},
					signal: AbortSignal.timeout(5000), // 5 second timeout
				});

				if (response.status === 404) {
					// User not found - cache negative result
					rankCache.set(normalizedUsername, null);
					return null;
				}

				if (!response.ok) {
					// Don't cache other errors - they might be temporary
					return null;
				}

				const data = await response.json();

				// Validate the response
				if (!data.rank_tier || !RANK_TIERS.has(data.rank_tier.toLowerCase())) {
					// Invalid data - cache as negative
					rankCache.set(normalizedUsername, null);
					return null;
				}

				const rankData: EloWardRankData = {
					tier: data.rank_tier,
					division: data.rank_division,
					leaguePoints: data.lp,
					summonerName: data.riot_id,
					region: data.region,
					animate_badge: data.animate_badge === true,
				};

				// Cache successful result
				rankCache.set(normalizedUsername, rankData);
				return rankData;
			} catch (error) {
				// Network or parsing error - don't cache
				return null;
			} finally {
				isLoading.value = false;
				// Clean up pending request
				pendingRequests.delete(normalizedUsername);
			}
		})();

		pendingRequests.set(normalizedUsername, requestPromise);
		return requestPromise;
	}

	/**
	 * Get badge data from rank data with cached image URLs
	 */
	function getRankBadge(rankData: EloWardRankData): EloWardBadge | null {
		if (!rankData?.tier) return null;

		const tier = rankData.tier.toLowerCase();
		if (!RANK_TIERS.has(tier)) return null;

		const tierUpper = rankData.tier.toUpperCase();
		const shouldAnimate = rankData.animate_badge === true && HIGH_RANKS.has(tierUpper);

		// Get image URL directly
		const imageUrl = getImageUrl(tier, shouldAnimate);

		return {
			id: `eloward-${tier}${rankData.division ? `-${rankData.division}` : ""}`,
			tier: tierUpper,
			division: rankData.division,
			imageUrl,
			animated: shouldAnimate,
			summonerName: rankData.summonerName,
			region: rankData.region,
			leaguePoints: rankData.leaguePoints,
		};
	}

	/**
	 * Format rank text for display
	 */
	function formatRankText(rankData: EloWardRankData): string {
		if (!rankData?.tier) return "UNRANKED";

		const tierUpper = rankData.tier.toUpperCase();
		if (tierUpper === "UNRANKED") return "UNRANKED";

		let rankText = tierUpper;

		if (rankData.division && !HIGH_RANKS.has(tierUpper)) {
			rankText += ` ${rankData.division}`;
		}

		if (rankData.leaguePoints !== undefined && rankData.leaguePoints !== null) {
			rankText += ` - ${rankData.leaguePoints} LP`;
		}

		return rankText;
	}

	/**
	 * Get region display name
	 */
	function getRegionDisplay(region?: string): string {
		if (!region) return "";

		const regionMap: Record<string, string> = {
			na1: "NA",
			euw1: "EUW",
			eun1: "EUNE",
			kr: "KR",
			br1: "BR",
			jp1: "JP",
			la1: "LAN",
			la2: "LAS",
			oc1: "OCE",
			tr1: "TR",
			ru: "RU",
			ph2: "PH",
			sg2: "SG",
			th2: "TH",
			tw2: "TW",
			vn2: "VN",
			me1: "ME",
			sea: "SEA",
		};

		return regionMap[region.toLowerCase()] || region.toUpperCase();
	}

	/**
	 * Build OP.GG URL for a player
	 */
	function getOpGGUrl(rankData: EloWardRankData): string | null {
		if (!rankData?.summonerName || !rankData?.region) return null;

		const regionMapping: Record<string, string> = {
			na1: "na",
			euw1: "euw",
			eun1: "eune",
			kr: "kr",
			br1: "br",
			jp1: "jp",
			la1: "lan",
			la2: "las",
			oc1: "oce",
			tr1: "tr",
			ru: "ru",
			ph2: "ph",
			sg2: "sg",
			th2: "th",
			tw2: "tw",
			vn2: "vn",
			me1: "me",
		};

		const opGGRegion = regionMapping[rankData.region.toLowerCase()];
		if (!opGGRegion) return null;

		const [summonerName, tagLine] = rankData.summonerName.split("#");
		const encodedName = encodeURIComponent(summonerName);
		const tag = tagLine || rankData.region.toUpperCase();

		return `https://op.gg/lol/summoners/${opGGRegion}/${encodedName}-${tag}`;
	}

	function clearCache() {
		rankCache.clear();
		pendingRequests.clear();
	}

	return {
		fetchRankData,
		getRankBadge,
		formatRankText,
		getRegionDisplay,
		getOpGGUrl,
		clearCache,
		isLoading,
		cacheSize: () => rankCache.size(),
	};
}
