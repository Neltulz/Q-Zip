// plugins/pinia-persistence.ts @preserve
import { defineNuxtPlugin } from "nuxt/app";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import type { Pinia } from "pinia";

export default defineNuxtPlugin((nuxtApp) => {
  if (import.meta.client) {
    (nuxtApp.$pinia as Pinia).use(piniaPluginPersistedstate);
  }
});