export default defineNuxtPlugin(() => {
  if (process.client) {
    // Disable native context menu globally
    // Use capture: true to intercept before other listeners and teleported elements
    window.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    }, { capture: true });
  }
});
