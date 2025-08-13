<template>
  <!-- FileTableHeader: Table header with sorting and resizing -->
  <div class="table-header">
    <div v-if="showCheckboxes" class="item-checkbox">
      <CustomButton
        button-style-class="minimal-trans-btn"
        data-name="select-all-files-checkbox"
        role="checkbox"
        :aria-checked="allSelected ? 'true' : 'false'"
        @click="$emit('toggle-all')"
      >
        <Icon :name="allSelected ? 'mdi:checkbox-marked' : 'mdi:checkbox-blank-outline'" size="16" />
      </CustomButton>
      <div class="resizer" @mousedown.stop="startResize($event, 'checkbox')"></div>
    </div>
    <div class="item-name" @click="() => $emit('sort', 'name')">
      <span class="header-text">Name</span>
      <span v-if="sortKey === 'name'" class="sort-indicator">{{ sortDirection === "asc" ? "▲" : "▼" }}</span>
      <div class="resizer" @mousedown.stop="startResize($event, 'name')"></div>
    </div>
    <div class="item-size" @click="() => $emit('sort', 'size')">
      <span class="header-text">Size (MB)</span>
      <span v-if="sortKey === 'size'" class="sort-indicator">{{ sortDirection === "asc" ? "▲" : "▼" }}</span>
      <div class="resizer" @mousedown.stop="startResize($event, 'size')"></div>
    </div>
    <div class="item-ext" @click="() => $emit('sort', 'type')">
      <span class="header-text">Ext</span>
      <span v-if="sortKey === 'type'" class="sort-indicator">{{ sortDirection === "asc" ? "▲" : "▼" }}</span>
      <div class="resizer" @mousedown.stop="startResize($event, 'ext')"></div>
    </div>
    <div class="item-modified" @click="() => $emit('sort', 'modified')">
      <span class="header-text">Modified</span>
      <span v-if="sortKey === 'modified'" class="sort-indicator">{{ sortDirection === "asc" ? "▲" : "▼" }}</span>
      <div class="resizer" @mousedown.stop="startResize($event, 'modified')"></div>
    </div>
    <div class="item-created" @click="() => $emit('sort', 'created')">
      <span class="header-text">Creation Date</span>
      <span v-if="sortKey === 'created'" class="sort-indicator">{{ sortDirection === "asc" ? "▲" : "▼" }}</span>
      <div class="resizer" @mousedown.stop="startResize($event, 'created')"></div>
    </div>
    <div class="item-files" @click="() => $emit('sort', 'files')">
      <span class="header-text">Files</span>
      <span v-if="sortKey === 'files'" class="sort-indicator">{{ sortDirection === "asc" ? "▲" : "▼" }}</span>
      <div class="resizer" @mousedown.stop="startResize($event, 'files')"></div>
    </div>
    <div class="item-folders" @click="() => $emit('sort', 'folders')">
      <span class="header-text">Folders</span>
      <span v-if="sortKey === 'folders'" class="sort-indicator">{{ sortDirection === "asc" ? "▲" : "▼" }}</span>
      <div class="resizer" @mousedown.stop="startResize($event, 'folders')"></div>
    </div>
    <div class="item-files-total" @click="() => $emit('sort', 'filesTotal')">
      <span class="header-text">Files (Total)</span>
      <span v-if="sortKey === 'filesTotal'" class="sort-indicator">{{ sortDirection === "asc" ? "▲" : "▼" }}</span>
      <div class="resizer" @mousedown.stop="startResize($event, 'filesTotal')"></div>
    </div>
    <div class="item-folders-total" @click="() => $emit('sort', 'foldersTotal')">
      <span class="header-text">Folders (Total)</span>
      <span v-if="sortKey === 'foldersTotal'" class="sort-indicator">{{ sortDirection === "asc" ? "▲" : "▼" }}</span>
      <div class="resizer" @mousedown.stop="startResize($event, 'foldersTotal')"></div>
    </div>
    <div class="item-parent-path" @click="() => $emit('sort', 'parentPath')">
      <span class="header-text">Parent Folder Path</span>
      <span v-if="sortKey === 'parentPath'" class="sort-indicator">{{ sortDirection === "asc" ? "▲" : "▼" }}</span>
      <div class="resizer" @mousedown.stop="startResize($event, 'parentPath')"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import CustomButton from "../CustomButton.vue";
import { defineProps, defineEmits } from "vue";

const props = defineProps({
  showCheckboxes: Boolean,
  allSelected: Boolean,
  sortKey: String,
  sortDirection: String,
});

defineEmits(["toggle-all", "sort", "start-resize"]);

// Resizing logic will be passed in from parent for now
const startResize = (event: MouseEvent, column: string) => {
  // Emit to parent to handle
  // Parent should handle actual resizing logic
  // This keeps this component presentational
  // Optionally, you could move the logic here if desired
  // $emit is not available in <script setup>, so use defineEmits
  // We'll emit 'start-resize' with event and column
  // The parent should listen for this event
  // and handle the resizing logic
  // Example: <FileTableHeader @start-resize="..." />
  // and in parent: <FileTableHeader @start-resize="startResize" />
  // For now, just emit
  // @ts-ignore
  emit("start-resize", event, column);
};
</script>

<style scoped>
.table-header {
  background-color: var(--bg-clr-liter);
  color: hsl(0, 0%, 75%);
  font-weight: 600;
  block-size: 34px;
  align-items: center;
  display: flex;
  inline-size: 100%;
  flex-shrink: 0;
  position: sticky;
  inset-block-start: 0;
  z-index: 10;
}
.table-header > div {
  padding-inline: 8px;
  display: flex;
  align-items: center;
  position: relative;
  border-inline-end: 1px solid var(--brdr-clr-dark);
  overflow: visible;
  min-width: 0;
  cursor: pointer;
  user-select: none;
}
.table-header > div .header-text {
  display: block;
  height: 100%;
  width: 100%;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 34px;
}
.sort-indicator {
  margin-left: 6px;
  display: inline-flex;
  align-items: center;
  font-size: 0.7em;
  color: var(--txt-clr-litest);
  position: relative;
  transform: none;
  line-height: 1;
  flex-shrink: 0;
}
.resizer {
  position: absolute;
  inset-block: 0;
  inset-inline-end: -3px;
  inline-size: 5px;
  cursor: col-resize;
  z-index: 20;
  background-color: var(--brdr-clr-liter);
  opacity: 0;
  transition: opacity 150ms ease-in-out;
}
.resizer:hover {
  opacity: 1;
}
.item-checkbox {
  inline-size: var(--col-width-checkbox);
  flex-shrink: 0;
  justify-content: center;
  padding-inline: 4px;
  cursor: default;
}
.item-name {
  inline-size: var(--col-width-name);
  min-inline-size: 150px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-start;
  overflow: hidden;
}
.item-size {
  inline-size: var(--col-width-size);
  flex-shrink: 0;
  justify-content: flex-end;
}
.item-ext {
  inline-size: var(--col-width-ext);
  flex-shrink: 0;
  justify-content: flex-start;
}
.item-modified {
  inline-size: var(--col-width-modified);
  flex-shrink: 0;
}
.item-created {
  inline-size: var(--col-width-created);
  flex-shrink: 0;
}
.item-files {
  inline-size: var(--col-width-files);
  flex-shrink: 0;
  justify-content: flex-end;
}
.item-folders {
  inline-size: var(--col-width-folders);
  flex-shrink: 0;
  justify-content: flex-end;
}
.item-files-total {
  inline-size: var(--col-width-files-total);
  flex-shrink: 0;
  justify-content: flex-end;
}
.item-folders-total {
  inline-size: var(--col-width-folders-total);
  flex-shrink: 0;
  justify-content: flex-end;
}
.item-parent-path {
  inline-size: var(--col-width-parent-path);
  flex-shrink: 0;
  min-inline-size: 150px;
}
</style>
