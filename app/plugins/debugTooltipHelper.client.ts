// app/plugins/debugTooltipHelper.client.ts
// 
export default defineNuxtPlugin(() => {
  if (process.client) {
    // Wait for the app to be ready before accessing stores
    const nuxtApp = useNuxtApp();

    nuxtApp.hook('app:mounted', async () => {
      // Import the debug store
      const { useDebugStore } = await import('@/stores/debugStore');
      const debugStore = useDebugStore();

      // Watch for changes to debug options and update body classes
      watch(() => debugStore.debugOptions.disableDropdownPointerEvents, (enabled) => {
        if (enabled) {
          document.body.classList.add('debug-disable-dropdown-pointer-events');
        } else {
          document.body.classList.remove('debug-disable-dropdown-pointer-events');
        }
      }, { immediate: true });
    });
  }
});
