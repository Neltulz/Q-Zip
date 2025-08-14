<template>
  <div
    class="table-row"
    :class="{
      selected: selectedFiles.includes(file.path),
      'preview-selected': isMarqueeActive && marqueePreviewSelection.includes(file.path),
      'is-cut': cutFiles.includes(file.path) && jobId === cutSourceJobId,
      'is-folder': file.type === 'Folder',
      'is-focused': isFocused,
    }"
    :data-path="file.path"
    data-has-context-menu="true"
    @click="clickRowByPath($event, file.path)"
    @contextmenu.prevent.stop="handleContextMenu(file, $event)"
  >
    <!-- Checkbox Cell -->
<!-- 
  IMPORTANT: All AIs including (Gemini, Grok, GPT) must refer to the "assistant-context.md" before making any changes to this file.
  FileTableRow.vue @preserve
-->
    <div v-if="showCheckboxes" class="item-checkbox">
      <CustomButton
        button-style-class="minimal-trans-btn"
        :data-name="`select-file-${file.path}`"
        role="checkbox"
        :aria-checked="selectedFiles.includes(file.path) ? 'true' : 'false'"
        @click.stop="toggleFileSelection(file.path)"
      >
        <Icon
          :name="selectedFiles.includes(file.path) ? 'mdi:checkbox-marked' : 'mdi:checkbox-blank-outline'"
          size="16"
        />
      </CustomButton>
    </div>
    <!-- Name Cell -->
<!-- 
  IMPORTANT: All AIs including (Gemini, Grok, GPT) must refer to the "assistant-context.md" before making any changes to this file.
  FileTableRow.vue @preserve
-->
    <div class="item-name">
      <div
        class="item-name-content"
        :draggable="itemDragEnabled"
        @dragstart="handleDragStart($event, file.path)"
        @dragend="handleDragEnd"
      >
        <Icon :name="file.type === 'Folder' ? 'mdi:folder' : 'mdi:file-outline'" size="16" />
        <span class="cell-text">{{ file.name }}</span>
      </div>
      <FileTableContextMenu
        :file="file"
        :job-id="jobId"
        :show-row-actions="showRowActions"
        :selected-files="selectedFiles"
        :ref="(el) => setFileMenuRef(file, el)"
        @remove-files="removeFile"
        @move-files="handleContextMenuMoveFiles"
        @move-to-new-job="moveFileToNewJob"
        @copy-files="handleContextMenuCopyFiles"
        @copy-to-new-job="copyFileToNewJob"
        @selection-changed="(paths) => selectedFiles = paths"
        @context-menu-closed="handleContextMenuClosed"
      />
    </div>
    <!-- Other Cells -->
<!-- 
  IMPORTANT: All AIs including (Gemini, Grok, GPT) must refer to the "assistant-context.md" before making any changes to this file.
  FileTableRow.vue @preserve
-->
    <div class="item-size">
      <div
        class="size-bar"
        :class="file.type === 'Folder' ? 'size-bar-folder' : 'size-bar-file'"
        :style="{
          inlineSize: `${(file.size / (file.type === 'Folder' ? maxFolderSizeInJob : maxFileSizeInJob)) * 100}%`,
        }"
      ></div>
      <span class="cell-text">{{ formatBytes(file.size) }} MB</span>
    </div>
    <div class="item-ext">
      <span class="cell-text">{{ file.type }}</span>
    </div>
    <div class="item-modified">
      <div
        v-if="file.modified"
        class="date-bar"
        :style="{
          inlineSize: `${normalizeTimestamp(
            file.modified,
            file.type === 'Folder' ? minMaxFolderModified : minMaxFileModified
          )}%`,
        }"
      ></div>
      <span class="cell-text">{{ file.modified ? formatModifiedDate(file.modified) : "---" }}</span>
    </div>
    <div class="item-created">
      <div
        v-if="file.created"
        class="date-bar"
        :style="{
          inlineSize: `${normalizeTimestamp(
            file.created,
            file.type === 'Folder' ? minMaxFolderCreated : minMaxFileCreated
          )}%`,
        }"
      ></div>
      <span class="cell-text">{{ file.created ? formatCreationDate(file.created) : "---" }}</span>
    </div>
    <div class="item-files">
      <span v-if="file.type === 'Folder'" class="cell-text">{{ file.files ?? "---" }}</span>
    </div>
    <div class="item-folders">
      <span v-if="file.type === 'Folder'" class="cell-text">{{ file.folders ?? "---" }}</span>
    </div>
    <div class="item-files-total">
      <span v-if="file.type === 'Folder'" class="cell-text">{{ file.filesTotal ?? "---" }}</span>
    </div>
    <div class="item-folders-total">
      <span v-if="file.type === 'Folder'" class="cell-text">{{ file.foldersTotal ?? "---" }}</span>
    </div>
    <div class="item-parent-path">
      <span class="cell-text">{{ file.parentPath }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { FileItem } from "@/types/types";
import CustomButton from "@/components/CustomButton.vue";
import FileTableContextMenu from "./FileTableContextMenu.vue";
import { Icon } from "#components";

const props = defineProps<{
  file: FileItem;
  jobId: number;
  selectedFiles: string[];
  cutFiles: string[];
  cutSourceJobId: number | null;
  showCheckboxes: boolean;
  showRowActions: boolean;
  itemDragEnabled: boolean;
  isMarqueeActive: boolean;
  marqueePreviewSelection: string[];
  maxFileSizeInJob: number;
  maxFolderSizeInJob: number;
  minMaxFileModified: { min: number; max: number };
  minMaxFolderModified: { min: number; max: number };
  minMaxFileCreated: { min: number; max: number };
  minMaxFolderCreated: { min: number; max: number };
  focusedRowIndex: number | null;
  rowIndex: number;
}>();

const emit = defineEmits<{
  'toggle-file-selection': [path: string];
  'click-row': [event: MouseEvent, path: string];
  'context-menu': [file: FileItem, event: MouseEvent, preserveSelection: boolean];
  'drag-start': [event: DragEvent, path: string];
  'drag-end': [];
  'remove-file': [path: string];
  'move-files': [payload: { targetJobId: number; rightClickedPath: string }];
  'move-to-new-job': [paths: string[]];
  'copy-files': [payload: { targetJobId: number; rightClickedPath: string }];
  'copy-to-new-job': [paths: string[]];
  'selection-changed': [paths: string[]];
  'set-file-menu-ref': [file: FileItem, el: any];
  'context-menu-closed': [];
}>();

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0.00";
  const mb = bytes / (1024 * 1024);
  return mb.toFixed(2);
};

// Memoized formatters to avoid constructing on every render
const MODIFIED_DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
});

const CREATION_DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

const formatModifiedDate = (timestamp: number): string => MODIFIED_DATE_FORMATTER.format(new Date(timestamp));
const formatCreationDate = (timestamp: number): string => CREATION_DATE_FORMATTER.format(new Date(timestamp));

// Check if this row is focused
const isFocused = computed(() => props.focusedRowIndex === props.rowIndex);

const normalizeTimestamp = (timestamp: number, range: { min: number; max: number }): number => {
  if (range.max === range.min) return 50; // If all items have the same date, show a half-bar
  // Invert the scale: older dates (smaller timestamps) should have a larger bar
  return 100 - ((timestamp - range.min) / (range.max - range.min)) * 100;
};

const toggleFileSelection = (path: string) => {
  emit('toggle-file-selection', path);
};

const clickRowByPath = (event: MouseEvent, path: string) => {
  emit('click-row', event, path);
};

const handleContextMenu = (file: FileItem, event: MouseEvent) => {
  // Check if the right-click target is the .item-name-content
  const target = event.target as Element;
  const isNameContent = target.closest('.item-name-content');
  
  emit('context-menu', file, event, isNameContent !== null);
};

const handleContextMenuClosed = () => {
  emit('context-menu-closed');
};

const handleDragStart = (event: DragEvent, path: string) => {
  emit('drag-start', event, path);
};

const handleDragEnd = () => {
  emit('drag-end');
};

const removeFile = (path: string) => {
  emit('remove-file', path);
};

const handleContextMenuMoveFiles = (payload: { targetJobId: number; rightClickedPath: string }) => {
  emit('move-files', payload);
};

const moveFileToNewJob = (paths: string[]) => {
  emit('move-to-new-job', paths);
};

const handleContextMenuCopyFiles = (payload: { targetJobId: number; rightClickedPath: string }) => {
  emit('copy-files', payload);
};

const copyFileToNewJob = (paths: string[]) => {
  emit('copy-to-new-job', paths);
};

const setFileMenuRef = (file: FileItem, el: any) => {
  emit('set-file-menu-ref', file, el);
};
</script>

<style scoped>
/* Table Row Styles */
.table-row {
  display: flex;
  inline-size: 100%;
  border-block-end: 1px solid var(--brdr-clr-dark);
  block-size: 35px;
  box-sizing: border-box;
  align-items: stretch;
  scroll-snap-align: start; /* Designate rows as snap points */

  &.is-folder {
    color: var(--blu-lite);
  }

  &:not(.is-folder).selected {
    background-color: hsla(var(--success-hue), var(--success-sat), var(--success-lum), 0.35);
    color: white;
  }

  &.is-folder.selected {
    background-color: hsla(var(--blu-hue), var(--blu-sat), var(--blu-lite-lum), 0.35);
    color: white;
  }

  /* Focus indicator - 1px border around the focused row */
  &.is-focused {
    outline: 1px solid var(--blu-lite);
    outline-offset: -1px;
  }

  /* Hover state - dimmer than selection */
  &:hover:not(.selected) {
    background-color: hsla(var(--success-hue), var(--success-sat), var(--success-lum), 0.15);
  }

  &.is-folder:hover:not(.selected) {
    background-color: hsla(var(--blu-hue), var(--blu-sat), var(--blu-lite-lum), 0.15);
  }
}

/* Preview selection state (visual only during marquee drag) */
.table-row.preview-selected {
  background-color: hsla(var(--success-hue), var(--success-sat), var(--success-lum), 0.25);
  color: white;
}

/* Preview selection for folder rows: use a distinct blue tint during marquee preview */
.table-row.is-folder.preview-selected {
  background-color: rgba(54, 115, 170, 0.25); /* bluish preview for folders */
  color: white;
}

/* Common Cell Styles */
.table-row > div {
  padding-inline: 8px;
  display: flex;
  align-items: center; /* Center content vertically */
  position: relative;
  border-inline-end: 1px solid var(--brdr-clr-dark);
  overflow: hidden; /* Prevent content from spilling */
  /* Allow flex items to shrink below their content so text-overflow works */
  min-width: 0;
}

/* Ensure text within cell content stays vertically centered */
.table-row > div .cell-text {
  display: block;
  height: 100%;
  line-height: 35px; /* Match row height for vertical centering */
}

/* Universal Text Truncation */
.cell-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block; /* Ensure block-level for proper text overflow */
  width: 100%; /* Take full width of container */
}

/* Ensure cell text elements are properly configured for text overflow */
.table-row > div .cell-text {
  display: block; /* Change from flex to block for proper text overflow */
  height: 100%;
  width: 100%;
  min-width: 0; /* Allow shrinking below content size */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 35px; /* Match row height for vertical centering */
}

/* Individual Column Widths using CSS Variables */
.item-checkbox {
  inline-size: var(--col-width-checkbox);
  flex-shrink: 0;
  justify-content: center;
  padding-inline: 4px;
  cursor: default; /* Checkbox header is not sortable */
}

.item-name {
  inline-size: var(--col-width-name);
  min-inline-size: 150px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-start; /* keep header text and sort indicator together */
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

.item-modified,
.item-created {
  flex-shrink: 0;
}
.item-modified {
  inline-size: var(--col-width-modified);
}
.item-created {
  inline-size: var(--col-width-created);
}

.item-files,
.item-folders,
.item-files-total,
.item-folders-total {
  flex-shrink: 0;
  justify-content: flex-end;
}

.item-files {
  inline-size: var(--col-width-files);
}
.item-folders {
  inline-size: var(--col-width-folders);
}
.item-files-total {
  inline-size: var(--col-width-files-total);
}
.item-folders-total {
  inline-size: var(--col-width-folders-total);
}

.item-parent-path {
  inline-size: var(--col-width-parent-path);
  flex-shrink: 0;
  min-inline-size: 150px;
}

/* IMPORTANT: Do NOT add width: 100% or flex: 1 to .item-name-content
 * This element should only be as wide as its content (icon + text) to ensure
 * marquee drag selection works correctly. The selection box should only
 * select items when it visually intersects with the actual icon and text,
 * not the full width of the container. Adding width: 100% or flex: 1 would
 * make the element span the full column width, causing incorrect marquee selection.
 */
.item-name-content {
  display: flex;
  align-items: center;
  column-gap: 8px;
  cursor: default;
  flex-shrink: 1;
  overflow: hidden;
  white-space: nowrap;
  min-width: 0;

  & > .iconify {
    flex-shrink: 0;
    min-width: 1em;
  }

  & > .cell-text {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
    display: block;
  }
}

/* Color folder icon yellow for rows that are folders */
.table-row.is-folder .item-name-content > .iconify {
  color: var(--warning-clr, #f5c542);
  /* Ensure SVG inherits currentColor */
  fill: currentColor;
}

/* Data Bar Styles */
.size-bar,
.date-bar {
  position: absolute;
  inset-block: 0;
  inset-inline-start: 0;
  block-size: 100%;
  opacity: 0.15;
}
.size-bar-file {
  background-color: var(--success-clr);
}
.size-bar-folder {
  background-color: var(--blu-lite);
}
.date-bar {
  background-color: var(--warning-clr);
}

/* Folder rows: use a distinct color for date bars (modified/created) */
.table-row.is-folder .date-bar {
  background-color: var(--folder-date-clr, #b355c9); /* magenta/purple fallback */
}

/* Wrapper span for data bar text is now .cell-text */
.item-size .cell-text,
.item-modified .cell-text,
.item-created .cell-text {
  position: relative;
  z-index: 1;
}
</style>
