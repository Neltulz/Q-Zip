<!--
  ContentGrid.vue @preserve
  Reusable 5-column content grid:
  auto | 1fr | var(--ideal-char-reading-count) | 1fr | auto
  Defaults: paragraphs and lists flow to the center column.
  Use .grid-center or .grid-breakout on children to control placement.
-->
<template>
  <div class="content-grid">
    <slot />
  </div>
</template>

<script setup lang="ts">
// No props needed for now; can be extended later (gap, columns, etc.)
</script>

<style scoped>
.content-grid {
  display: grid;
  grid-template-columns: auto 50px var(--ideal-char-reading-count) 50px auto;
  grid-template-areas: "full-width-start breakout-start center breakout-end full-width-end"
}

.content-grid > * {
  grid-column: center;
}

/* Default placement for common text elements into the center column */
.content-grid :deep(p),
.content-grid :deep(ul),
.content-grid :deep(ol) {
  grid-column: center;
}

/* Utilities for explicit placement */
.content-grid :deep(.grid-center) {
  grid-column: center;
}

.content-grid :deep(.grid-breakout) {
  grid-column: breakout-start / breakout-end;
}

/* Responsive collapse */
@media (max-width: 768px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
  .content-grid :deep(.grid-center),
  .content-grid :deep(.grid-breakout) {
    grid-column: 1;
  }
}
</style>


