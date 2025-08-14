// plugins/pinia-persistence.ts
// 
// IMPORTANT: All AIs including (Gemini, Grok, GPT) must refer to the "assistant-context.md" before making any changes to this file. @preserve
import { defineNuxtPlugin } from "nuxt/app";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import type { Pinia } from "pinia";

export default defineNuxtPlugin((nuxtApp) => {
  if (import.meta.client) {
    (nuxtApp.$pinia as Pinia).use(piniaPluginPersistedstate);
  }
});