// app/plugins/tooltipContainer.client.ts
// 
export default defineNuxtPlugin(() => {
  // Create the tooltip container element immediately when the plugin loads
  // This ensures it exists before any components try to teleport to it
  if (process.client) {
    // Check if the container already exists (in case of hot reload)
    if (!document.getElementById('tooltip-container')) {
      const tooltipContainer = document.createElement('div');
      tooltipContainer.id = 'tooltip-container';
      tooltipContainer.className = 'tooltip-container';
      tooltipContainer.setAttribute('aria-hidden', 'true');
      tooltipContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 999999;
        isolation: isolate;
      `;
      document.body.appendChild(tooltipContainer);
    }
  }
});
