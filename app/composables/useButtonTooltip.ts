import { ref, computed } from 'vue';

export interface UseButtonTooltipOptions {
  shortcutText?: string;
  tooltipText?: string;
  tooltipPlacement?: "top" | "bottom" | "left" | "right" | "top-start" | "top-end" | "bottom-start" | "bottom-end" | "left-start" | "left-end" | "right-start" | "right-end";
  buttonAction?: string; // New prop for button action description
}

export function useButtonTooltip(options: UseButtonTooltipOptions = {}) {
  const isTooltipVisible = ref(false);

  const tooltipContent = computed(() => {
    // If custom tooltip text is provided, use it
    if (options.tooltipText) {
      return { text: options.tooltipText };
    }
    // If button action is provided, use it
    if (options.buttonAction) {
      return { text: options.buttonAction };
    }
    // If shortcut text is provided, show a generic tooltip
    // (the keyboard shortcut will be displayed via the keyboardShortcut prop)
    if (options.shortcutText) {
      return { text: "Keyboard shortcut available" };
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
