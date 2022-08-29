import { createApp, h } from "vue";
import App from "@/site/App.vue";

const root = document.createElement("div");
root.id = "seventv-root";

document.body.append(root);

const app = createApp(App);

app.mount("#seventv-root");
