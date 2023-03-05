import { RouteRecordRaw, createRouter, createWebHashHistory } from "vue-router";
import Onboarding from "../views/Onboarding/Onboarding.vue";

const routes = [
	{
		path: "",
		redirect: "/onboarding/start",
		children: [
			{
				path: "onboarding/:step?",
				name: "Onboarding",
				component: Onboarding,
			},
		],
	},
] as RouteRecordRaw[];

export const router = createRouter({
	history: createWebHashHistory(),
	strict: true,
	routes,
});
