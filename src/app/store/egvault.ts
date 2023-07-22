import { defineStore } from "pinia";

export const EgVault = {
	api: import.meta.env.VITE_APP_API_EGVAULT,
};

export interface SubscriptionResponse {
	active: boolean;
	age: number;
	subscription: Subscription;
	end_at: string | Date;
	renew: boolean;
}

export interface Subscription {
	customer_id: string;
	cycle: SubscriptionCycle;
	ended_at: string | Date;
	id: string;
	plan: string;
	product_id: string;
	provider: string;
	seats: number;
	started_at: string | Date;
	subscriber_id: string;
}

export interface SubscriptionCycle {
	internal: boolean;
	pending: boolean;
	status: string;
	timestamp: string | Date;
	unit: string;
	value: number;
}

export type ProductType = "subscription";

export interface Product {
	name: string;
	plans: ProductPlan[];
	current_paints: string[];
}

export interface ProductPlan {
	interval_unit: string;
	interval: number;
	price: number;
	discount?: number;
}

export type SubPlan = "monthly" | "yearly";

export interface StoreState {
	subscription: SubscriptionResponse | null;
	products: Product[];
	currentProduct: Product | null;
	currentPlan: ProductPlan | null;
	gifter?: SevenTV.User;
}

export const useEgVault = defineStore("egvault", {
	state: () =>
		({
			subscription: null,
			products: [],
			currentProduct: null,
			currentPlan: null,
		}) as StoreState,
	getters: {
		subscribed: (state) => state.subscription?.active ?? false,
		subEndDate: (state) => (state.subscription?.end_at ? new Date(state.subscription.end_at) : new Date(0)),
		subProduct: (state) => state.products.find((p) => p.name === "subscription"),
	},
	actions: {
		async fetchSub(userID: string): Promise<SubscriptionResponse> {
			const resp = await fetch(`${EgVault.api}/subscriptions/${userID}`, {});
			const sub: SubscriptionResponse = await resp.json();

			this.subscription = sub;

			return sub;
		},
		async fetchProducts(): Promise<Product[]> {
			const response = await fetch(EgVault.api + "/products");
			const products = await response.json();

			this.products = products;
			return products;
		},
	},
});
