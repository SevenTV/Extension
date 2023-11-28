import { RouteRecordRaw, createRouter, createWebHashHistory } from "vue-router";

const routes = [
	{
		path: "",
		redirect: "/onboarding/start",
		children: [
			{
				path: "onboarding/:step?",
				name: "Onboarding",
				component: () => import("../views/Onboarding/Onboarding.vue"),
			},
		],
	},
	{
		path: "/popup",
		name: "Popup",
		component: () => import("../views/Popup/Popup.vue"),
	},
	{
		path: "/compat",
		name: "Compat",
		component: () => import("../views/Compat/Compat.vue"),
	},
] as RouteRecordRaw[];

export const router = createRouter({
	history: createWebHashHistory(),
	strict: true,
	routes,
});
