import { computed, watch } from "vue";
import { useConfig } from "@/composable/useSettings";

const API_BASE_URL = "https://api.eloward.com/ranks/lol";
const CDN_BASE_URL = "https://cdn.eloward.com/ranks";
const DEFAULT_CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
const MAX_CACHE_SIZE = 1000;
const HIGH_RANKS = new Set(["MASTER", "GRANDMASTER", "CHALLENGER"]);

interface CacheEntry {
	data: EloWardRankData;
	timestamp: number;
	accessCount: number;
}

class LRUCache {
	private cache = new Map<string, CacheEntry>();
	private enabled = false;
	private cacheDuration = DEFAULT_CACHE_DURATION;

	setEnabled(enabled: boolean) {
		this.enabled = enabled;
		if (!enabled) this.clear();
	}

	setCacheDuration(duration: number) {
		this.cacheDuration = duration;
	}

	get(username: string): EloWardRankData | null {
		if (!this.enabled) return null;
		
		const key = username.toLowerCase();
		const cached = this.cache.get(key);
		if (!cached) return null;

		// Check if cache is expired
		if (Date.now() - cached.timestamp > this.cacheDuration) {
			this.cache.delete(key);
			return null;
		}

		// Update access count for LRU
		cached.accessCount++;
		return cached.data;
	}

	set(username: string, data: EloWardRankData) {
		if (!this.enabled) return;

		// Evict least recently used entries if cache is full
		if (this.cache.size >= MAX_CACHE_SIZE) {
			let oldestKey = "";
			let oldestAccess = Infinity;
			
			for (const [key, entry] of this.cache) {
				if (entry.accessCount < oldestAccess) {
					oldestKey = key;
					oldestAccess = entry.accessCount;
				}
			}
			
			if (oldestKey) this.cache.delete(oldestKey);
		}

		this.cache.set(username.toLowerCase(), {
			data,
			timestamp: Date.now(),
			accessCount: 1
		});
	}

	clear() {
		this.cache.clear();
	}

	has(username: string): boolean {
		return this.get(username) !== null;
	}
}

const rankCache = new LRUCache();
const pendingRequests = new Map<string, Promise<EloWardRankData | null>>();

export interface EloWardRankData {
	tier: string;
	division: string;
	leaguePoints: number;
	summonerName: string;
	region: string;
	animate_badge: boolean;
}

export interface EloWardBadge {
	id: string;
	tier: string;
	division: string;
	leaguePoints: number;
	summonerName: string;
	region: string;
	imageUrl: string;
	tooltip: string;
	animate: boolean;
}

export function useEloWardRanks() {
	const enabled = useConfig<boolean>("eloward.enabled");
	const leagueOnly = useConfig<boolean>("eloward.league_only");
	const animatedBadges = useConfig<boolean>("eloward.animated_badges");
	const showTooltips = useConfig<boolean>("eloward.show_tooltips");
	const cacheDuration = useConfig<number>("eloward.cache_duration");

	// Update cache duration when setting changes
	watch(cacheDuration, (newDuration) => {
		rankCache.setCacheDuration(newDuration * 60 * 1000);
	});

	async function fetchRankData(username: string): Promise<EloWardRankData | null> {
		if (!enabled.value) return null;

		// Check cache first
		const cached = rankCache.get(username);
		if (cached) return cached;

		// Check for pending request to avoid duplicate API calls
		const pendingKey = username.toLowerCase();
		if (pendingRequests.has(pendingKey)) {
			return pendingRequests.get(pendingKey)!;
		}

		const requestPromise = (async () => {
			try {
				const response = await fetch(`${API_BASE_URL}/${username.toLowerCase()}`);
				
				if (response.status === 404) return null;
				if (!response.ok) throw new Error(`HTTP ${response.status}`);

				const data = await response.json();
				const rankData: EloWardRankData = {
					tier: data.rank_tier,
					division: data.rank_division,
					leaguePoints: data.lp,
					summonerName: data.riot_id,
					region: data.region,
					animate_badge: data.animate_badge || false
				};

				// Cache the result
				rankCache.set(username, rankData);
				return rankData;
			} catch (error) {
				// Only log errors in development
				if (process.env.NODE_ENV === 'development') {
					console.error(`[EloWard] Failed to fetch rank data for ${username}:`, error);
				}
				return null;
			} finally {
				// Clean up pending request
				pendingRequests.delete(pendingKey);
			}
		})();

		pendingRequests.set(pendingKey, requestPromise);
		return requestPromise;
	}

	function getRankBadge(rankData: EloWardRankData): EloWardBadge {
		const tier = rankData.tier.toUpperCase();
		const division = rankData.division || "";
		const lp = rankData.leaguePoints || 0;
		
		// Determine if badge should be animated
		const shouldAnimate = animatedBadges.value && 
			rankData.animate_badge && 
			HIGH_RANKS.has(tier);

		// Get badge image URL
		const imageUrl = `${CDN_BASE_URL}/${tier.toLowerCase()}.${shouldAnimate ? 'gif' : 'png'}`;
		
		// Create tooltip text
		const tooltip = formatRankTooltip(rankData);

		return {
			id: `eloward-${tier}-${division}`,
			tier,
			division,
			leaguePoints: lp,
			summonerName: rankData.summonerName,
			region: rankData.region,
			imageUrl,
			tooltip,
			animate: shouldAnimate
		};
	}

	function formatRankTooltip(rankData: EloWardRankData): string {
		const { tier, division, leaguePoints, summonerName, region } = rankData;
		
		let tooltip = tier;
		if (division) tooltip += ` ${division}`;
		if (leaguePoints > 0) tooltip += ` - ${leaguePoints} LP`;
		if (summonerName) tooltip += `\n${summonerName}`;
		if (region) tooltip += `\n${region}`;
		
		return tooltip;
	}

	function enable() {
		rankCache.setEnabled(true);
	}

	function disable() {
		rankCache.setEnabled(false);
	}

	function clearCache() {
		rankCache.clear();
		pendingRequests.clear();
	}

	return {
		isEnabled: enabled,
		isLeagueOnly: leagueOnly,
		useAnimatedBadges: animatedBadges,
		showRankTooltips: showTooltips,
		fetchRankData,
		getRankBadge,
		enable,
		disable,
		clearCache
	};
}
