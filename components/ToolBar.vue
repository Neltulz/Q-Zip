<!-- components/ToolBar.vue @preserve -->
<template>
  <div class="toolbar" data-component-name="ToolBar">
    <div class="start-buttons">
      <slot name="start" />
    </div>
    <div class="end-buttons">
      <slot name="end" />
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  --bg-clr: var(--bg-clr-lite);

  display: flex;
  justify-content: space-between;
  gap: 6px;
  padding-inline: var(--pad-in);
  padding-block: var(--pad-blok);
  background-color: var(--bg-clr);

  .start-buttons,
  .end-buttons {
    display: flex;
    column-gap: 3px;
  }
}
</style>
