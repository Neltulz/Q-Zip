import { ref, provide, inject, markRaw } from 'vue';
import type { Ref, InjectionKey } from 'vue';

// 1. Define a unique, type-safe key for our communication channel.
const ScrollContainerKey: InjectionKey<Ref<HTMLElement | null>> = Symbol('ScrollContainer');

/**
 * Call this once in an ancestor component (like app.vue) to establish the
 * communication channel for the scroll container element.
 */
export const provideScrollContainer = () => {
  const scrollContainer = ref<HTMLElement | null>(null);
  provide(ScrollContainerKey, scrollContainer);
};

/**
 * Call this in any descendant component to get access to the shared
 * scroll container ref.
 */
export const useScrollContainer = () => {
  const scrollContainer = inject(ScrollContainerKey);

  if (!scrollContainer) {
    // This error will fire if we forget to call provideScrollContainer in an ancestor.
    throw new Error('useScrollContainer() called without a provider.');
  }

  /**
   * Sets the scroll container element. The element is marked with `markRaw`
   * to prevent Vue from making it reactive, which is crucial for performance
   * and preventing errors.
   */
  const setScrollContainer = (el: HTMLElement | null) => {
    scrollContainer.value = el ? markRaw(el) : null;
  };

  return {
    scrollContainer,
    setScrollContainer,
  };
};
