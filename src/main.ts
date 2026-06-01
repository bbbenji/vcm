import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import "./styles.css";
import { initAnalytics } from "./plugins/analytics";

const app = createApp(App);

app.use(createPinia());

initAnalytics();

app.mount("#app");
