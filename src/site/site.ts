import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "@/site/App.vue";

// Create Vue App
const root = document.createElement("div");
root.id = "seventv-root";

document.body.append(root);

const app = createApp(App);

app.use(createPinia()).mount("#seventv-root");
