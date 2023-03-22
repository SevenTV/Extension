import { createApp, h, provide } from "vue";
import { createPinia } from "pinia";
import { SITE_ASSETS_URL, SITE_EXT_OPTIONS_URL, SITE_WORKER_URL } from "@/common/Constant";
import App from "@/site/App.vue";
import { apolloClient } from "@/apollo/apollo";
import { TextPaintDirective } from "@/directive/TextPaintDirective";
import { TooltipDirective } from "@/directive/TooltipDirective";
import { setupI18n } from "@/i18n";
import { ApolloClients } from "@vue/apollo-composable";

const appID = Date.now().toString();

// Sanity Check
//
// Detect duplicate instances
const roots = document.querySelectorAll("#seventv-root, script#seventv");

let dupeCount = 0;
for (let i = 0; i < roots.length; i++) {
	const root = roots.item(i);
	if (!root) continue;

	const rootID = root.getAttribute("data-app-id");
	if (root.tagName === "script" || (rootID && rootID === appID)) continue;

	dupeCount++;
}

if (dupeCount > 0) {
	const oldTitle = document.title;
	document.title = "BIG PROBLEM - 7TV - Twitch";
	alert(
		"[7TV] Woah there! It seems you're running multiple different instances of 7TV. Please disable any other version of the extension and try again.",
	);

	document.title = oldTitle;
	throw new Error("Duplicate 7TV instances detected, aborting");
}

// Create Vue App
const root = document.createElement("div");
root.id = "seventv-root";
root.setAttribute("data-app-id", appID);

document.body.append(root);

const scr = document.querySelector("script#seventv-extension");

const app = createApp({
	setup() {
		provide(ApolloClients, {
			default: apolloClient,
		});
	},
	render: () => h(App),
});

app.provide("app-id", appID);

const extensionOrigin = scr?.getAttribute("extension_origin") ?? "";
app.provide(SITE_WORKER_URL, scr?.getAttribute("worker_url"));
app.provide(SITE_ASSETS_URL, extensionOrigin + "assets");
app.provide(SITE_EXT_OPTIONS_URL, extensionOrigin + "index.html");

app.use(createPinia())
	.use(setupI18n())
	.directive("tooltip", TooltipDirective)
	.directive("cosmetic-paint", TextPaintDirective)
	.mount("#seventv-root");
