import App from "@/App.vue";
import "@/assets/style.css";
import router from "@/router";
import naive from "naive-ui";
import { createApp } from "vue";
import { createI18n } from "vue-i18n";
import en from "./locales/en.json";
import sr from "./locales/sr.json";
import zh from "./locales/zh.json";

const i18n = createI18n({
  legacy: false,
  locale: "sr", // set locale
  fallbackLocale: "en", // set fallback locale
  messages: {
    en,
    zh,
    sr,
  },
});

createApp(App).use(router).use(naive).use(i18n).mount("#app");
