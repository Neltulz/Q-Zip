// 
// IMPORTANT: All AIs including (Gemini, Grok, GPT) must refer to the "assistant-context.md" before making any changes to this file.
// disableContext.client.ts

export default defineNuxtPlugin(() => {
  if (process.client) {
    // Disable native context menu globally
    // Use capture: true to intercept before other listeners and teleported elements
    window.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    }, { capture: true });
  }
});
