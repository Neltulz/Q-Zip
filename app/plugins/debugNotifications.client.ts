// plugins/debugNotifications.client.ts @preserve

// This plugin helps debug where the notification element is coming from

export default defineNuxtPlugin(() => {
  // Only run on client side
  if (process.server) return;

  // Function to debug the notification element
  const debugNotificationElement = () => {
    // Find the element with aria-label="Notifications (F8)"
    const notificationElement = document.querySelector('[aria-label="Notifications (F8)"]');
    if (notificationElement) {
      console.log('Found notification element:', notificationElement);
      console.log('Parent element:', notificationElement.parentElement);
      console.log('Element attributes:', Array.from(notificationElement.attributes).map(attr => `${attr.name}="${attr.value}"`));
      console.log('Element classes:', notificationElement.className);
      console.log('Element style:', notificationElement.getAttribute('style'));

      // Check if it has any Vue-specific attributes
      const vueAttrs = Array.from(notificationElement.attributes).filter(attr =>
        attr.name.startsWith('data-v-') ||
        attr.name.startsWith('v-') ||
        attr.name === 'data-vue'
      );
      console.log('Vue attributes:', vueAttrs);

      // Check the stack trace to see where it was created
      console.trace('Notification element found - stack trace:');
    }
  };

  // Check immediately if DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', debugNotificationElement);
  } else {
    debugNotificationElement();
  }

  // Also watch for when it gets added
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          if (element.getAttribute('aria-label') === 'Notifications (F8)') {
            console.log('Notification element added dynamically:', element);
            console.trace('Stack trace when element was added:');
          }
          // Also check children
          const childNotification = element.querySelector('[aria-label="Notifications (F8)"]');
          if (childNotification) {
            console.log('Notification element found in added node:', childNotification);
            console.trace('Stack trace when parent was added:');
          }
        }
      });
    });
  });

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
});
