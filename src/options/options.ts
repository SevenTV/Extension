import { createApp } from "vue";
import { createHead } from "@vueuse/head";
import { TooltipDirective } from "@/directive/TooltipDirective";
import Options from "@/options/Options.vue";
import { router } from "@/options/router/router";

const app = createApp(Options);
const head = createHead({
	titleTemplate(title) {
		return title ? `${title} — 7TV` : "7TV";
	},
});

app.directive("tooltip", TooltipDirective);
app.use(router).use(head).mount("#app");
