<!-- eslint-disable vue/html-self-closing @preserve -->
<!-- 
  InfoTooltipContainer.vue @preserve
-->
<!-- components/InfoTooltipContainer.vue @preserve -->
<!-- 
  InfoTooltipContainer.vue @preserve
-->
<!--
  InfoTooltipContainer.vue
  What it is:
  - A floating tooltip component that teleports to the tooltip container and positions itself
    relative to a target element using @floating-ui/vue.
  What it does:
  - Shows either simple text (with optional shortcut parsing like "Copy (Ctrl+C)")
    or a structured notification payload (e.g., source/destination jobs and a
    scrollable list of affected file paths with reasons).
  - Automatically flips/offsets/shifts to stay in view and renders a styled arrow
    pointing at the target element.
  - Uses a lightweight fade transition and high-contrast, blurred backdrop styling.
  Key features:
  - Teleport to tooltip container for better organization
  - Smart positioning (offset, flip, shift, arrow)
  - Simple text mode with shortcut extraction
  - Rich details mode for notification/message details
  - Conditional rendering - only mounts in DOM when visible
  Props:
  - visible: boolean — Controls visibility and DOM mounting
  - content: TooltipContent (NotificationMessageDetails | { text: string }) — What to display
  - target: MaybeElement — The reference element for positioning
  - debugForceVisible: boolean — Forces visibility for debugging
  Example usage:
  <InfoTooltipContainer
    :visible="isTooltipVisible"
    :content="{ text: 'Copy (Ctrl+C)' }"
    :target="buttonRef"
  />
  
  IMPORTANT: For proper implementation patterns and usage guidelines,
  see: app/components/info-tooltip-comp/info-tooltip-usage.md
-->
<template>
  <InfoTooltipContainer />
</template>

<script setup lang="ts">
import InfoTooltipContainer from './info-tooltip-comp/InfoTooltipContainer.vue';
</script>

<style scoped>
/* 
  IMPORTANT: All tooltip CSS has been moved to app/components/info-tooltip-comp/info-tooltip.scoped.css
  DO NOT add any CSS here - add it to the dedicated CSS file instead.
*/
@import './info-tooltip-comp/info-tooltip.scoped.css';
</style>
