<!-- eslint-disable vue/html-self-closing @preserve -->
<!-- eslint-disable vue/no-v-html @preserve -->
<!-- components/modals/ResetConfirmationModalContent.vue @preserve -->
<!--
  Description:
  The content for a generic confirmation modal. It now receives and displays
  a description prop, ensuring the user understands the action they are
  confirming. It can also display an optional, expandable list of files.
-->
<template>
  <div class="confirmation-content" data-component-name="ResetConfirmationModalContent">
    <template v-if="Array.isArray(description)">
      <p v-for="(line, index) in description" :key="index" v-html="line"></p>
    </template>
    <p v-else v-html="description"></p>

    <details v-if="fileList && fileList.length > 0" class="file-list-details">
      <summary>View {{ fileList.length }} item(s)</summary>
      <ul class="file-list">
        <li v-for="file in fileList" :key="file">{{ file }}</li>
      </ul>
    </details>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  description: string | string[];
  fileList?: string[];
}>();
</script>

<style scoped>
.confirmation-content {
  line-height: 1.5;
}

.confirmation-content p {
  margin-block-end: 1em;
}

.confirmation-content p:last-child {
  margin-block-end: 0;
}

.file-list-details {
  border: 1px solid var(--brdr-clr);
  border-radius: 4px;
  margin-block-start: 1em;

  summary {
    cursor: pointer;
    font-weight: 500;
    padding: 8px;
  }

  &[open] > summary {
    border-block-end: 1px solid var(--brdr-clr);
  }

  .file-list {
    background-color: var(--bg-clr-darkr);
    list-style-type: none;
    max-height: 150px;
    overflow-y: auto;
    padding: 8px;

    li {
      font-family: monospace;
      padding-block: 2px;
      white-space: nowrap;
    }
  }
}
</style>
