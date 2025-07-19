<!-- components/PageHeader.vue -->
<template>
  <div class="page-header" data-component-name="PageHeader">
    <div class="icon-area">
      <slot name="icon" />
    </div>
    <div class="text-area">
      <div class="big-text">
        <slot name="big-text" />
      </div>
      <div class="description">
        <slot name="description" />
      </div>
    </div>
  </div>
</template>

<script setup>
// No logic needed
</script>

<style scoped>
.page-header {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: auto;
  grid-template-areas: "icon text";
  align-items: center;
  background-color: var(--bg-clr);
  color: var(--txt-clr);
  column-gap: 10px;
  width: 100%;
  margin-inline: auto;
  max-width: 2000px;

  & .icon-area {
    grid-area: icon;
  }

  & .text-area {
    grid-area: text;
    display: flex;
    flex-direction: column;
    gap: 4px;

    & .big-text {
      font-size: 2.333rem;
      font-weight: bold;
      line-height: 1.25;
      color: var(--txt-clr-lite);
    }

    & .description {
      font-size: 1rem;
      color: var(--txt-clr);
      line-height: 1.25;
      margin-bottom: 10px;
    }
  }
}

@media (width < 1024px) {
  .page-header {
    padding-inline: var(--pad-in);

    .icon-area {
      .iconify {
        font-size: 32px;
      }
    }

    .text-area {
      .big-text {
        font-size: 1.25rem;
      }

      .description {
        font-size: 0.875rem;
      }
    }
  }
}
</style>

<style>
@media (width < 1024px) {
  .page-header {
    .icon-area {
      .iconify {
        font-size: 32px !important;
      }
    }
  }
}
</style>
