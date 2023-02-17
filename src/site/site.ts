import { createApp, h, provide } from "vue";
import { createPinia } from "pinia";
import App from "@/site/App.vue";
import { apolloClient } from "@/apollo/apollo";
import { TextPaintDirective } from "@/directive/TextPaintDirective";
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

const app = createApp({
	setup() {
		provide(ApolloClients, {
			default: apolloClient,
		});
	},
	render: () => h(App),
});
app.provide("app-id", appID);

app.use(createPinia()).directive("cosmetic-paint", TextPaintDirective).mount("#seventv-root");
