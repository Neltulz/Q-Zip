import { ref, computed } from 'vue';

export interface UseButtonTooltipOptions {
  shortcutText?: string;
  tooltipText?: string;
  tooltipPlacement?: "top" | "bottom" | "left" | "right" | "top-start" | "top-end" | "bottom-start" | "bottom-end" | "left-start" | "left-end" | "right-start" | "right-end";
}

export function useButtonTooltip(options: UseButtonTooltipOptions = {}) {
  const isTooltipVisible = ref(false);

  const tooltipContent = computed(() => {
    // If custom tooltip text is provided, use it
    if (options.tooltipText) {
      return { text: options.tooltipText };
    }
    // If no custom tooltip text but shortcut text is provided, show empty content
    // (the keyboard shortcut will be displayed via the keyboardShortcut prop)
    if (options.shortcutText) {
      return { text: "" };
    }
    return { text: "" };
  });

  const showTooltip = () => {
    isTooltipVisible.value = true;
  };

  const hideTooltip = () => {
    isTooltipVisible.value = false;
  };

  return {
    isTooltipVisible,
    tooltipContent,
    showTooltip,
    hideTooltip,
    keyboardShortcut: options.shortcutText ?? "",
    tooltipPlacement: options.tooltipPlacement ?? "top"
  };
}
