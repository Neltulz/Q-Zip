// plugins/removeNuxtNotifications.client.ts
// 
// IMPORTANT: All AIs including (Gemini, Grok, GPT) must refer to the "assistant-context.md" before making any changes to this file. @preserve

// This plugin removes Nuxt UI's notification container from the DOM
// since we have our own custom notification system

export default defineNuxtPlugin(() => {
  // Only run on client side
  if (process.server) return;

  // Function to remove the notification element
  const removeNotificationElement = () => {
    // Find the element with aria-label="Notifications (F8)"
    const notificationElement = document.querySelector('[aria-label="Notifications (F8)"]');
    if (notificationElement) {
      notificationElement.remove();
      console.log('Removed Nuxt UI notification element from DOM');
    }
  };

  // Remove immediately if DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', removeNotificationElement);
  } else {
    removeNotificationElement();
  }

  // Also watch for dynamic additions (in case it gets added later)
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          if (element.getAttribute('aria-label') === 'Notifications (F8)') {
            element.remove();
            console.log('Removed dynamically added Nuxt UI notification element');
          }
          // Also check children
          const childNotification = element.querySelector('[aria-label="Notifications (F8)"]');
          if (childNotification) {
            childNotification.remove();
            console.log('Removed Nuxt UI notification element from added node');
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

  // Also try to prevent it from being created in the first place
  // by overriding the createElement method temporarily
  const originalCreateElement = document.createElement;
  document.createElement = function (tagName: string, options?: ElementCreationOptions) {
    const element = originalCreateElement.call(this, tagName, options);

    // If this is a div that might become a notification element, watch it
    if (tagName.toLowerCase() === 'div') {
      // Use a small delay to check if it gets the notification attributes
      setTimeout(() => {
        if (element.getAttribute('aria-label') === 'Notifications (F8)') {
          element.remove();
          console.log('Prevented Nuxt UI notification element from being created');
        }
      }, 0);
    }

    return element;
  };
});
