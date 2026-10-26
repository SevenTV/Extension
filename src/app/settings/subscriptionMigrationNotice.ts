import { reactive } from "vue";
import { log } from "@/common/Logger";
import { updatePaintStyle } from "@/composable/useCosmetics";

export const REWARD_PAINT_ID = "01JJQVMG5NY64NT4EY1M2CTS1G";
export const REWARD_BADGE_ID = "01M3Q4RTMNFHTT58VNTFH8152G";

const GQL_V4_ENDPOINT = "https://api.7tv.app/v4/gql";
const SUBSCRIPTION_PRODUCT_ID = "01FEVKBBTGRAT7FCY276TNTJ4A";
const STORAGE_KEY_PREFIX = "seventv.subscription-migration-notice:";
const PROMPTABLE_TTL_MS = 8 * 60 * 60 * 1_000;
const NOT_PROMPTABLE_TTL_MS = 7 * 24 * 60 * 60 * 1_000;
const DISMISS_INTERVAL_MS = 7 * 24 * 60 * 60 * 1_000;

const PROMPT_QUERY = `
	query GetSubscriptionMigrationPrompt($platform: Platform!, $platformId: String!, $productId: Id!) {
		users {
			userByConnection(platform: $platform, platformId: $platformId) {
				billing(productId: $productId) {
					subscriptionMigrationPromptable
				}
			}
		}
	}
`;

const PAINT_QUERY = `
	query GetPaint($list: [ObjectID!]) {
		cosmetics(list: $list) {
			paints {
				id
				name
				color
				function
				angle
				shape
				image_url
				repeat
				stops {
					at
					color
				}
				shadows {
					x_offset
					y_offset
					radius
					color
				}
			}
		}
	}
`;

interface NoticeState {
	promptable: boolean | null;
	checkedAt: number;
	dismissedAt: number | null;
	dotSeenAt: number | null;
}

const EMPTY_STATE: NoticeState = { promptable: null, checkedAt: 0, dismissedAt: null, dotSeenAt: null };

function isNullableNumber(value: unknown): value is number | null {
	return value === null || typeof value === "number";
}

function readState(platformId: string): NoticeState {
	try {
		const raw = JSON.parse(localStorage.getItem(STORAGE_KEY_PREFIX + platformId) ?? "null");
		if (
			raw &&
			(raw.promptable === null || typeof raw.promptable === "boolean") &&
			typeof raw.checkedAt === "number" &&
			isNullableNumber(raw.dismissedAt) &&
			isNullableNumber(raw.dotSeenAt ?? null)
		) {
			return {
				promptable: raw.promptable,
				checkedAt: raw.checkedAt,
				dismissedAt: raw.dismissedAt,
				dotSeenAt: raw.dotSeenAt ?? null,
			};
		}
	} catch {
		return EMPTY_STATE;
	}
	return EMPTY_STATE;
}

async function fetchPromptable(platform: "TWITCH" | "KICK", platformId: string): Promise<boolean | null> {
	try {
		const response = await fetch(GQL_V4_ENDPOINT, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				query: PROMPT_QUERY,
				variables: { platform, platformId, productId: SUBSCRIPTION_PRODUCT_ID },
			}),
		});
		if (!response.ok) return null;

		const body = await response.json();
		const user = body?.data?.users?.userByConnection;
		if (user === null) return false;

		const promptable = user?.billing?.subscriptionMigrationPromptable;
		if (typeof promptable !== "boolean") {
			log.warn("<SubscriptionMigrationNotice>", "Unexpected prompt response");
			return null;
		}
		return promptable;
	} catch {
		return null;
	}
}

async function fetchPaint(id: string): Promise<SevenTV.Cosmetic<"PAINT"> | null> {
	try {
		const response = await fetch(import.meta.env.VITE_APP_API_GQL, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ query: PAINT_QUERY, variables: { list: [id] } }),
		});
		if (!response.ok) return null;

		const paint = (await response.json())?.data?.cosmetics?.paints?.[0];
		if (!paint || paint.id !== id) return null;

		return { id, kind: "PAINT", provider: "7TV", data: { ...paint, gradients: [] } } as SevenTV.Cosmetic<"PAINT">;
	} catch {
		return null;
	}
}

class SubscriptionMigrationNotice {
	visible = false;
	dot = false;
	rewardPaintLoaded = false;

	private platform: Platform | null = null;
	private platformId: string | null = null;
	private state: NoticeState = EMPTY_STATE;
	private requestId = 0;
	private rewardPaintRequested = false;

	async load(platform: Platform | null, platformId: string | null): Promise<void> {
		if (platform === this.platform && platformId === this.platformId) return;

		const requestId = ++this.requestId;
		this.platform = platform;
		this.platformId = platformId;
		this.state = EMPTY_STATE;
		this.apply();

		if (!platformId || (platform !== "TWITCH" && platform !== "KICK")) return;

		this.state = readState(platformId);

		const now = Date.now();
		const dismissed = this.state.dismissedAt !== null && now - this.state.dismissedAt < DISMISS_INTERVAL_MS;
		const ttl = this.state.promptable ? PROMPTABLE_TTL_MS : NOT_PROMPTABLE_TTL_MS;
		if (!dismissed && (this.state.promptable === null || now - this.state.checkedAt >= ttl)) {
			const promptable = await fetchPromptable(platform, platformId);
			if (requestId !== this.requestId) return;
			if (promptable !== null) {
				this.persist({ ...this.state, promptable, checkedAt: Date.now() });
				return;
			}
		}
		this.apply();
	}

	markSettingsOpened(): void {
		if (this.dot) this.persist({ ...this.state, dotSeenAt: Date.now() });
	}

	dismiss(): void {
		this.persist({ ...this.state, dismissedAt: Date.now() });
	}

	startMigration(): void {
		this.persist({ ...this.state, promptable: null, checkedAt: 0 });
	}

	loadRewardPaint(): void {
		if (this.rewardPaintRequested) return;
		this.rewardPaintRequested = true;
		fetchPaint(REWARD_PAINT_ID).then((paint) => {
			if (!paint) {
				this.rewardPaintRequested = false;
				return;
			}
			updatePaintStyle(paint);
			this.rewardPaintLoaded = true;
		});
	}

	private persist(next: NoticeState): void {
		this.state = next;
		this.apply();
		if (!this.platformId) return;
		try {
			localStorage.setItem(STORAGE_KEY_PREFIX + this.platformId, JSON.stringify(next));
		} catch {
			return;
		}
	}

	private apply(): void {
		const { promptable, dismissedAt, dotSeenAt } = this.state;
		this.visible = promptable === true && (dismissedAt === null || Date.now() - dismissedAt >= DISMISS_INTERVAL_MS);
		this.dot = this.visible && dotSeenAt === null;
	}
}

export const subscriptionMigrationNotice = reactive(new SubscriptionMigrationNotice());
