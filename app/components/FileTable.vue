<!-- eslint-disable vue/html-self-closing @preserve -->
<!-- 
  IMPORTANT: All AIs including (Gemini, Grok, GPT) must refer to the "assistant-context.md" before making any changes to this file.
  FileTable.vue @preserve
-->
<!-- components/FileTable.vue @preserve -->
<!-- 
  IMPORTANT: All AIs including (Gemini, Grok, GPT) must refer to the "assistant-context.md" before making any changes to this file.
  FileTable.vue @preserve
-->

<!--
  RECOMMENDATIONS FOR IMPROVEMENT:

  1. COMPONENT DECOMPOSITION
     - Break into smaller, focused components:
       * ✅ FileTableHeader.vue (sorting, column resizing)
       * ✅ FileTableRow.vue (individual row rendering)
       * ✅ FileTableToolbar.vue (add/remove/move/copy actions)
       * ✅ FileTableContextMenu.vue (right-click menu)

  2. PERFORMANCE OPTIMIZATIONS
     - ✅ Add memoization for expensive computations (sortedFiles, columnStyles)
     - ✅ Use useMemo or similar for sorting operations
     - ✅ Optimize large template with many conditional renders
     - ✅ Consider lazy loading for context menus

  3. ERROR HANDLING
     - Add comprehensive error handling for job operations
       * [Critically Important (5)] Add validation for file paths to ensure they exist and are accessible
       * [Critically Important (5)] Handle file read permission errors when retrieving metadata
       * [Very Important (4)] Handle inaccessible or deleted files gracefully
       * [Very Important (4)] Implement proper cleanup when metadata retrieval fails
       * [Important (3)] Implement retry mechanisms for transient file system errors
       * [Important (3)] Implement fallback behavior when file metadata cannot be retrieved
       * [Somewhat Important (2)] Add specific error handling for different file types (archives, executables, etc.)
     - Implement loading states for individual operations
       * [Very Important (4)] Show progress indicators for file additions/removals
       * [Very Important (4)] Display loading states for file metadata retrieval
       * [Important (3)] Add skeleton loaders for file table rows during operations
       * [Important (3)] Implement timeout handling for long-running metadata operations
       * [Somewhat Important (2)] Show cancellation options for user-initiated operations
     - Add error boundaries for component failures
       * [Critically Important (5)] Implement Vue error boundaries to catch component crashes
       * [Very Important (4)] Add fallback UI for when FileTable component fails to render
       * [Very Important (4)] Handle unexpected data format errors gracefully
       * [Important (3)] Implement component recovery mechanisms
       * [Somewhat Important (2)] Add error reporting/logging for debugging
     - Handle edge cases (empty states, file system changes)
       * [Very Important (4)] Implement proper empty state UI with helpful messaging
       * [Very Important (4)] Handle file system changes during component lifecycle
       * [Important (3)] Implement proper cleanup when component unmounts during operations
       * [Important (3)] Add validation for file size limits and system constraints
       * [Somewhat Important (2)] Handle cases where files are moved/deleted after being added to job
       * [Low Priority (1)] Add support for detecting file modifications after job creation

  4. TESTING
     - Implement comprehensive unit tests for complex interactions
     - ✅ Test virtual scrolling with large datasets (Result: Better, but not perfect)
     - ✅Test drag & drop functionality
     - Test keyboard navigation and accessibility
     - Add integration tests for file operations

  5. DOCUMENTATION
     - Add JSDoc comments for complex functions
     - Document component props and events
     - Add usage examples and best practices
     - Document performance considerations

  6. ACCESSIBILITY
     - Add more ARIA labels and descriptions
     - Improve keyboard navigation (Tab, Arrow keys)
     - Add screen reader announcements for state changes
     - Ensure proper focus management

  7. UI/UX ENHANCEMENTS
     - Add fancy animations/highlights to job selectors that have notifications above them
     - Consider pulse effects, glow animations, or attention-grabbing visual cues
     - Implement smooth transitions for notification states
     - Add visual feedback for drag operations across job boundaries
-->

<template>
  <div
    ref="fileTableCompRef"
    class="file-table-comp"
    :class="{
      'is-dragging': isDragging || dragDropStore.isInternalDragActive,
      'is-active': isActive && isActivatable,
      'is-scrolling': isScrolling,
      'is-marquee-dragging': isMarqueeActive,
    }"
    :style="Object.assign({}, columnStyles, fileTableRootStyle)"
    data-component-name="FileTable"
    @click="handleRootClick"
    @contextmenu="handleRootContextMenu"
  >
    <!-- Full-screen transparent blocker to prevent interaction with outside UI while marquee drag is active -->
    <div v-if="isMarqueeActive" class="marquee-blocker" aria-hidden="true"></div>
    <!-- Loading backdrop shown while the file table is loading. It reserves the
         component's height so surrounding modals/dialogs don't jump when the
         table finishes loading. -->
    <div v-if="props.isLoading" class="file-table-loading-backdrop" :style="loadingBackdropStyle" aria-hidden="true">
      <div class="file-table-loading-box">
        <LoadingAnim :visible="true" />
      </div>
    </div>
    <div class="file-table-visual-select" />
    <LoadingAnim :visible="props.isLoading" @cancel="$emit('cancel-load')"> Adding files, please wait... </LoadingAnim>
         <FileTableToolbar
       v-if="shouldShowToolbar"
       :job-id="props.jobId"
       :selected-files="actionItems"
       :show-toolbar="shouldShowToolbar"
       :is-filetable-active="isActive"
       @remove-files="removeSelectedFiles"
       @move-files="moveToJob"
       @move-to-new-job="moveToNewJob"
       @copy-files="copyToJob"
       @copy-to-new-job="copyToNewJob"
       @add-files="handleAddFile"
       @add-folders="handleAddFolder"
       @activate-filetable="setActive(true)"
     />

    <OverlayScrollbarsComponent
      ref="scrollComponentRef"
      class="table-scroll-wrapper"
      :options="{
        scrollbars: {
          visibility: 'auto',
          autoHide: 'never',
          autoHideSuspend: true,
          theme: currentTheme,
        },
      }"
      @os-scroll="handleScroll"
      @mousedown="handleComponentMouseDown"
    >
      <div class="table-content-wrapper" :style="tableContentStyle">
        <!-- Header is now a separate component -->
        <FileTableHeader
          :show-checkboxes="shouldShowCheckboxes"
          :all-selected="allSelected"
          :sort-key="sortKey"
          :sort-direction="sortDirection"
          @toggle-all="toggleAll"
          @sort="handleSort"
          @start-resize="startResize"
        />

        <!-- Local selection box: updated directly via DOM to avoid reactive writes every frame -->
        <div ref="localSelectionBox" class="selection-box" style="display: none" />

        <!-- debug hotzones removed -->

        <!-- Spacer for Virtual Scroll -->
        <div class="virtual-scroll-spacer" :style="{ height: `${totalHeight}px` }">
          <!-- Content container for visible rows -->
          <div class="virtual-scroll-content" :style="{ transform: `translateY(${contentOffsetY}px)` }">
            <template v-for="file in visibleFiles" :key="file.path">
              <FileTableRow
                :file="file"
                :job-id="props.jobId"
                :selected-files="selectedFiles"
                :checked-files="checkedFiles"
                :cut-files="cutFiles"
                :cut-source-job-id="cutSourceJobId"
                :show-checkboxes="shouldShowCheckboxes"
                :show-row-actions="shouldShowRowActions"
                :item-drag-enabled="isItemDragEnabled"
                :is-marquee-active="isMarqueeActive"
                :marquee-preview-selection="marqueePreviewSelection"
                :max-file-size-in-job="maxFileSizeInJob"
                :max-folder-size-in-job="maxFolderSizeInJob"
                :min-max-file-modified="minMaxFileModified"
                :min-max-folder-modified="minMaxFolderModified"
                :min-max-file-created="minMaxFileCreated"
                :min-max-folder-created="minMaxFolderCreated"
                :focused-row-index="focusedRowIndex"
                :row-index="sortedFiles.findIndex(f => f.path === file.path)"
                :is-file-table-active="isActive"
                @toggle-file-selection="toggleFileSelection"
                @click-row="clickRowByPath"
                @context-menu="handleContextMenu"
                @drag-start="handleDragStart"
                @drag-end="handleDragEnd"
                @remove-file="removeFile"
                @move-files="handleContextMenuMoveFiles"
                @move-to-new-job="moveFileToNewJob"
                @copy-files="handleContextMenuCopyFiles"
                @copy-to-new-job="copyFileToNewJob"
                @selection-changed="(paths) => selectedFiles = paths"
                @set-file-menu-ref="setFileMenuRef"
                @context-menu-closed="handleContextMenuClosed"
                @dropdown-opened="handleDropdownOpened"
              />
            </template>
          </div>
        </div>
      </div>
    </OverlayScrollbarsComponent>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUpdate, reactive, onUnmounted, onMounted, onUpdated, nextTick } from "vue";
import { OverlayScrollbarsComponent } from "overlayscrollbars-vue";
import { useThemeStore } from "@/stores/themeStore";
import { useDragDropStore } from "@/stores/dragDropStore";
import { useUiStore } from "@/stores/uiStore";
import { useUserPreferencesStore } from "@/stores/userPreferencesStore";
import type { FileItem } from "@/types/types";
import FileTableHeader from "./file-table-comp/FileTableHeader.vue";
import FileTableToolbar from "./file-table-comp/FileTableToolbar.vue";
import FileTableContextMenu from "./file-table-comp/FileTableContextMenu.vue";
import FileTableRow from "./file-table-comp/FileTableRow.vue";
import { logDragDropEvent, logLifecycle, logRendering, logUI, logMarqueeSelection, logFocus } from "@/utils/loggers";
import { useJobsStore, type Job } from "@/stores/jobsStore";
import { open } from "@tauri-apps/plugin-dialog";
import LoadingAnim from "@/components/LoadingAnim.vue";

// --- VIRTUAL SCROLLING CONSTANTS ---
const ROW_HEIGHT = 35;
const BUFFER_ROWS = 10;

// --- MEMOIZATION HELPERS ---
// Simple memoization utility for expensive computations
const createMemoizedComputed = <T>(fn: () => T, deps: (() => any)[]) => {
  let lastDeps: any[] = [];
  let lastResult: T | null = null;
  
  return computed(() => {
    const currentDeps = deps.map(dep => dep());
    const depsChanged = currentDeps.some((dep, index) => dep !== lastDeps[index]);
    
    if (depsChanged || lastResult === null) {
      lastDeps = currentDeps;
      lastResult = fn();
    }
    
    return lastResult!;
  });
};

// --- LAZY LOADING FOR CONTEXT MENUS ---
// Note: Context menus are handled by FileTableRow components, so lazy loading is not needed here
// Keeping the structure for potential future use

const props = withDefaults(
  defineProps<{
    jobId: number;
    files: FileItem[];
    isDragging: boolean;
    isLoading: boolean;
    cutFiles: string[];
    cutSourceJobId: number | null;
    showToolbar?: boolean;
    showCheckboxes?: boolean;
    showRowActions?: boolean;
    isSelectable?: boolean;
    fixedHeaders?: boolean;
    itemDragEnabled?: boolean;
    marqueeSelectionEnabled?: boolean;
  }>(),
  {
    showToolbar: true,
    showCheckboxes: true,
    showRowActions: true,
    isSelectable: true,
    fixedHeaders: true,
    itemDragEnabled: true,
    activatable: true,
    marqueeSelectionEnabled: true,
  }
);

const emit = defineEmits([
  "selection-changed",
  "remove-files",
  "move-files",
  "move-to-new-job",
  "copy-files",
  "copy-to-new-job",
  "add-files",
  "add-folders",
  "cancel-load",
  "file-table-context-menu-closed", // New event
  "dropdown-opened",
]);

const themeStore = useThemeStore();
const jobsStore = useJobsStore();
const dragDropStore = useDragDropStore();

const uiStore = useUiStore();
const userPreferencesStore = useUserPreferencesStore();

const scrollComponentRef = ref<InstanceType<typeof OverlayScrollbarsComponent> | null>(null);
const viewportRef = ref<HTMLElement | null>(null);
const fileTableCompRef = ref<HTMLElement | null>(null);
const fileMenuRefs = ref(new Map<string, any>());
// --- REACTIVE STATE ---
const selectedFiles = ref<string[]>([]);
const checkedFiles = ref<string[]>([]); // Separate array for checkbox state
const sortKey = ref<keyof FileItem>("name");
const sortDirection = ref<"asc" | "desc">("asc");
const isActive = ref(false);
const isScrolling = ref(false);
const isMarqueeActive = ref(false);
const wasMarqueeActive = ref(false); // Track if marquee was recently active
const marqueeIsAdditive = ref(false);
const marqueeAnchorX = ref(0);
const marqueeAnchorY = ref(0);
const lastClickedIndex = ref<number | null>(null);
const focusedRowIndex = ref<number | null>(null); // Track which row has focus
// Respect prop to allow disabling activation in contexts like modals
const allowActivation = computed(() => (props as any).activatable !== false);
let updateStartTime = 0;
let scrollTimeout: NodeJS.Timeout | null = null;

const scrollTop = ref(0);

const currentTheme = computed(() => (themeStore.isEffectiveDark ? "os-theme-light" : "os-theme-dark"));
const jobs = computed(() => jobsStore.jobs);



// --- MEMOIZED SORTING OPERATIONS ---
// Memoized sorting function with dependency tracking
const sortedFiles = createMemoizedComputed(() => {
  const filesCopy = [...props.files];
  const folders = filesCopy.filter((item) => item.type === "Folder");
  const files = filesCopy.filter((item) => item.type !== "Folder");

  const sortArray = (arr: FileItem[]) => {
    arr.sort((a, b) => {
      const key = sortKey.value;
      const aValue = a[key] ?? (typeof a[key] === "number" ? 0 : "");
      const bValue = b[key] ?? (typeof b[key] === "number" ? 0 : "");

      let comparison = 0;
      if (typeof aValue === "string" && typeof bValue === "string") {
        comparison = aValue.localeCompare(bValue, undefined, { numeric: true });
      } else if (typeof aValue === "number" && typeof bValue === "number") {
        comparison = aValue - bValue;
      }

      return sortDirection.value === "asc" ? comparison : -comparison;
    });
  };

  sortArray(folders);
  sortArray(files);

  return [...folders, ...files];
}, [
  () => props.files,
  () => sortKey.value,
  () => sortDirection.value
]);

const handleSort = (key: keyof FileItem) => {
  // Prevent sorting if we just finished a resize (suppresses the mouseup click that follows)
  if (suppressHeaderClick.value) {
    logUI("FileTable", `Sort suppressed due to recent resize operation`);
    return;
  }
  logUI("FileTable", `Sorting by: ${key}, current: ${sortKey.value}, direction: ${sortDirection.value}`);
  if (sortKey.value === key) {
    sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
  } else {
    sortKey.value = key;
    sortDirection.value = "asc";
  }
};

// --- MEMOIZED SIZE CALCULATIONS ---
const maxFileSizeInJob = createMemoizedComputed(() => {
  const fileSizes = props.files.filter((f) => f.type !== "Folder").map((f) => f.size);
  if (fileSizes.length === 0) return 1;
  return Math.max(...fileSizes);
}, [() => props.files]);

const maxFolderSizeInJob = createMemoizedComputed(() => {
  const folderSizes = props.files.filter((f) => f.type === "Folder").map((f) => f.size);
  if (folderSizes.length === 0) return 1;
  return Math.max(...folderSizes);
}, [() => props.files]);

// --- MEMOIZED DATE CALCULATIONS ---
const fileTimestamps = createMemoizedComputed(() =>
  props.files.filter((f) => f.type !== "Folder").map((f) => ({ modified: f.modified ?? 0, created: f.created ?? 0 }))
, [() => props.files]);

const folderTimestamps = createMemoizedComputed(() =>
  props.files.filter((f) => f.type === "Folder").map((f) => ({ modified: f.modified ?? 0, created: f.created ?? 0 }))
, [() => props.files]);

const getMinMax = (timestamps: number[]) => {
  if (timestamps.length === 0) return { min: 0, max: 1 };
  const cleanTimestamps = timestamps.filter((t) => t > 0);
  if (cleanTimestamps.length === 0) return { min: 0, max: 1 };
  return {
    min: Math.min(...cleanTimestamps),
    max: Math.max(...cleanTimestamps),
  };
};

const minMaxFileModified = createMemoizedComputed(() => 
  getMinMax(fileTimestamps.value.map((t) => t.modified))
, [() => fileTimestamps.value]);

const minMaxFolderModified = createMemoizedComputed(() => 
  getMinMax(folderTimestamps.value.map((t) => t.modified))
, [() => folderTimestamps.value]);

const minMaxFileCreated = createMemoizedComputed(() => 
  getMinMax(fileTimestamps.value.map((t) => t.created))
, [() => fileTimestamps.value]);

const minMaxFolderCreated = createMemoizedComputed(() => 
  getMinMax(folderTimestamps.value.map((t) => t.created))
, [() => folderTimestamps.value]);

// --- MEMOIZED VIRTUAL SCROLLING CALCULATIONS ---
const totalHeight = createMemoizedComputed(() => {
  const height = sortedFiles.value.length * ROW_HEIGHT;
  logRendering("FileTable", `Total height calculated: ${sortedFiles.value.length} files * ${ROW_HEIGHT}px = ${height}px`);
  return height;
}, [() => sortedFiles.value.length]);

const startIndex = createMemoizedComputed(() => {
  return Math.max(0, Math.floor(scrollTop.value / ROW_HEIGHT) - BUFFER_ROWS);
}, [() => scrollTop.value]);

const endIndex = createMemoizedComputed(() => {
  const wrapperHeight = viewportRef.value?.clientHeight || 0;
  return Math.min(sortedFiles.value.length, Math.ceil((scrollTop.value + wrapperHeight) / ROW_HEIGHT) + BUFFER_ROWS);
}, [() => scrollTop.value, () => viewportRef.value?.clientHeight, () => sortedFiles.value.length]);

const contentOffsetY = createMemoizedComputed(() => 
  startIndex.value * ROW_HEIGHT
, [() => startIndex.value]);

const visibleFiles = createMemoizedComputed(() => {
  const files = sortedFiles.value.slice(startIndex.value, endIndex.value);
  logRendering("FileTable", `Visible files calculated: ${files.length} files (${startIndex.value} to ${endIndex.value}) out of ${sortedFiles.value.length} total`);
  return files;
}, [() => sortedFiles.value, () => startIndex.value, () => endIndex.value]);

// --- RESTORED MISSING FUNCTIONS AND VARIABLES ---
const handleScroll = () => {
  if (viewportRef.value) {
    scrollTop.value = viewportRef.value.scrollTop;
  }
  isScrolling.value = true;
  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
  }
  scrollTimeout = setTimeout(() => {
    isScrolling.value = false;
  }, 150);
};

// Marquee selection state
const marqueePreviewSelection = ref<string[]>([]);
const marqueePreviewAdd = ref<string[]>([]);
const marqueePreviewRemove = ref<string[]>([]);
const marqueeIsInvert = ref(false);
const localSelectionBox = ref<HTMLElement | null>(null);
const localMarqueeRect = reactive({ x: 0, y: 0, width: 0, height: 0 });
const localPreviewSet = new Set<string>();
const skipRootClick = ref(false);
const isClosingContextMenu = ref(false);
const DRAG_THRESHOLD = 6;
const isPossibleMarquee = ref(false);

const headerHeight = ref(34);

// Auto-scroll variables
let autoScrollRaf: number | null = null;
let lastMouseClientX = 0;
let lastMouseClientY = 0;
const AUTO_SCROLL_THRESHOLD = 60;
const AUTO_SCROLL_MAX_SPEED = 24;
const HORIZONTAL_RIGHT_BUFFER = 48;

// Development mode check
const isDevelopment = computed(() => {
  return typeof window !== "undefined" && window.location.hostname === "localhost";
});

// Marquee helper functions
const calibrateHeaderHeight = (scrollWrapper: HTMLElement | null) => {
  try {
    const tableHeader = fileTableCompRef.value?.querySelector(".table-header") as HTMLElement | null;
    if (tableHeader) headerHeight.value = tableHeader.getBoundingClientRect().height || 34;
  } catch (err) {
    headerHeight.value = 34;
  }
};



const handleComponentMouseDown = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (target.closest(".os-scrollbar")) {
    return;
  }

  if (!props.marqueeSelectionEnabled || event.button !== 0) return;

  if (target.closest(".item-name-content") || target.closest(".item-checkbox")) {
    return;
  }

  const isInteractiveElement = target.closest("button, a, input, select, textarea, .table-header, .resizer");
  if (isInteractiveElement) return;
  
  const clickedOnName = !!target.closest(".item-name-content");
  const clickedOnCheckbox = !!target.closest(".item-checkbox");

  const ctrlPressed = event.ctrlKey || event.metaKey;
  const shiftPressed = event.shiftKey;

  // For marquee selection, immediately deselect all files when starting a new selection
  // (unless Ctrl is pressed for additive selection)
  if (!ctrlPressed) {
    // Clear selected files for visual feedback
    if (selectedFiles.value.length > 0) {
      selectedFiles.value = [];
    }
    // In checkbox mode, don't clear checked files - only deselect for visual feedback
    // Checked files should remain checked until explicitly unchecked by the user
  }

  event.preventDefault();
  isPossibleMarquee.value = true;
  isMarqueeActive.value = false;
  marqueeIsAdditive.value = ctrlPressed;
  marqueeIsInvert.value = ctrlPressed && shiftPressed;

  const scrollWrapper = viewportRef.value;
  if (!scrollWrapper) return;

  const scrollWrapperBounds = scrollWrapper.getBoundingClientRect();
  const rootStyles = getComputedStyle(document.documentElement);
  const ftZoomRaw = rootStyles.getPropertyValue("--file-table-zoom") || rootStyles.getPropertyValue("--file-table-zoom-local");
  const parsed = Number(ftZoomRaw ? parsedFloatSafe(ftZoomRaw) : NaN);
  const ftZoom = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;

  const computedAnchorX = event.clientX - scrollWrapperBounds.left + scrollWrapper.scrollLeft;
  const maxContentX = Math.max(0, scrollWrapper.scrollWidth - 1);
  marqueeAnchorX.value = Math.min(maxContentX, Math.max(0, computedAnchorX));
  const computedAnchorY = event.clientY - scrollWrapperBounds.top + scrollWrapper.scrollTop - headerHeight.value;
  const maxContentY = Math.max(0, scrollWrapper.scrollHeight - headerHeight.value - 1);
  marqueeAnchorY.value = Math.min(maxContentY, Math.max(0, computedAnchorY));

  window.addEventListener("mousemove", handleMarqueeMouseMove);
  window.addEventListener("mouseup", handleMarqueeMouseUp);
  window.addEventListener("pointerup", handleMarqueeMouseUp);
  window.addEventListener("pointercancel", handleMarqueeMouseUp);
};

const handleMarqueeMouseMove = (event: MouseEvent) => {
  const scrollWrapper = viewportRef.value;
  if (!scrollWrapper) return;

  lastMouseClientX = event.clientX;
  lastMouseClientY = event.clientY;

  const scrollWrapperBounds = scrollWrapper.getBoundingClientRect();
  const mouseX_content = event.clientX - scrollWrapperBounds.left + scrollWrapper.scrollLeft;
  const mouseY_content = event.clientY - scrollWrapperBounds.top + scrollWrapper.scrollTop - headerHeight.value;

  if (!isMarqueeActive.value && isPossibleMarquee.value) {
    const dx = mouseX_content - marqueeAnchorX.value;
    const dy = mouseY_content - marqueeAnchorY.value;
    const distSq = dx * dx + dy * dy;
    if (distSq < DRAG_THRESHOLD * DRAG_THRESHOLD) {
      return;
    }
    isMarqueeActive.value = true;
    isPossibleMarquee.value = false;
    isActive.value = true;
    if (localSelectionBox.value) {
      localSelectionBox.value.style.display = "block";
      localSelectionBox.value.style.transform = `translate(${marqueeAnchorX.value}px, ${marqueeAnchorY.value}px)`;
      localSelectionBox.value.style.width = `0px`;
      localSelectionBox.value.style.height = `0px`;
    }
    try {
      scrollWrapper.style.setProperty("overscroll-behavior", "contain");
    } catch (e) {
      // ignore
    }
    startAutoScroll(scrollWrapper);
  }

  if (!isMarqueeActive.value) return;

  let scheduled = false as boolean;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(() => {
      scheduled = false;
      if (!isMarqueeActive.value) return;
      const bounds = scrollWrapper.getBoundingClientRect();
      let mx = event.clientX - bounds.left + scrollWrapper.scrollLeft;
      let my = event.clientY - bounds.top + scrollWrapper.scrollTop - headerHeight.value;
      const maxContentY = Math.max(0, (scrollWrapper.scrollHeight || totalHeight.value) - headerHeight.value - 1);
      const maxContentX = Math.max(0, (scrollWrapper.scrollWidth || bounds.width) - HORIZONTAL_RIGHT_BUFFER - 1);
      mx = Math.min(maxContentX, Math.max(0, mx));
      my = Math.min(maxContentY, Math.max(0, my));

      const x = Math.min(marqueeAnchorX.value, mx);
      const y = Math.min(marqueeAnchorY.value, my);
      const width = Math.abs(mx - marqueeAnchorX.value);
      const height = Math.abs(my - marqueeAnchorY.value);

      localMarqueeRect.x = x;
      localMarqueeRect.y = y;
      localMarqueeRect.width = width;
      localMarqueeRect.height = height;

      if (localSelectionBox.value) {
        localSelectionBox.value.style.transform = `translate(${x}px, ${y}px)`;
        localSelectionBox.value.style.width = `${width}px`;
        localSelectionBox.value.style.height = `${height}px`;
      }

      const paths = computeSelectionByRectLocal(marqueeIsAdditive.value, x, y, width, height);
      updatePreviewDOM(paths);
    });
  };

  schedule();
};

const startAutoScroll = (scrollWrapper: HTMLElement) => {
  if (autoScrollRaf) return;

  const tick = () => {
    if (!isMarqueeActive.value) {
      stopAutoScroll();
      return;
    }

    const bounds = scrollWrapper.getBoundingClientRect();
    const y = lastMouseClientY - bounds.top;
    const xPos = lastMouseClientX - bounds.left;
    let speedY = 0;
    let speedX = 0;

    if (y < AUTO_SCROLL_THRESHOLD) {
      const pct = (AUTO_SCROLL_THRESHOLD - y) / AUTO_SCROLL_THRESHOLD;
      speedY = -Math.min(AUTO_SCROLL_MAX_SPEED, Math.max(2, AUTO_SCROLL_MAX_SPEED * pct));
    } else if (y > bounds.height - AUTO_SCROLL_THRESHOLD) {
      const pct = (y - (bounds.height - AUTO_SCROLL_THRESHOLD)) / AUTO_SCROLL_THRESHOLD;
      speedY = Math.min(AUTO_SCROLL_MAX_SPEED, Math.max(2, AUTO_SCROLL_MAX_SPEED * pct));
    }

    if (xPos < AUTO_SCROLL_THRESHOLD) {
      const pct = (AUTO_SCROLL_THRESHOLD - xPos) / AUTO_SCROLL_THRESHOLD;
      speedX = -Math.min(AUTO_SCROLL_MAX_SPEED, Math.max(2, AUTO_SCROLL_MAX_SPEED * pct));
    } else if (xPos > bounds.width - AUTO_SCROLL_THRESHOLD) {
      const pct = (xPos - (bounds.width - AUTO_SCROLL_THRESHOLD)) / AUTO_SCROLL_THRESHOLD;
      speedX = Math.min(AUTO_SCROLL_MAX_SPEED, Math.max(2, AUTO_SCROLL_MAX_SPEED * pct));
    }

    if (speedY !== 0 || speedX !== 0) {
      const maxScrollTop = Math.max(0, scrollWrapper.scrollHeight - bounds.height);
      const desiredTop = scrollWrapper.scrollTop + speedY;
      const newTop = Math.max(0, Math.min(maxScrollTop, desiredTop));
      if (newTop !== scrollWrapper.scrollTop) scrollWrapper.scrollTop = newTop;

      const maxScrollLeft = Math.max(0, scrollWrapper.scrollWidth - bounds.width - HORIZONTAL_RIGHT_BUFFER);
      const desiredLeft = scrollWrapper.scrollLeft + speedX;
      const newLeft = Math.max(0, Math.min(maxScrollLeft, desiredLeft));
      if (newLeft !== scrollWrapper.scrollLeft) scrollWrapper.scrollLeft = newLeft;

      const mouseX_content = lastMouseClientX - bounds.left + scrollWrapper.scrollLeft;
      let mouseY_content = lastMouseClientY - bounds.top + scrollWrapper.scrollTop - headerHeight.value;
      const maxY = Math.max(0, (scrollWrapper.scrollHeight || totalHeight.value) - headerHeight.value - 1);
      const maxX = Math.max(0, (scrollWrapper.scrollWidth || bounds.width) - HORIZONTAL_RIGHT_BUFFER - 1);
      const clampedMouseX = Math.min(maxX, Math.max(0, mouseX_content));
      mouseY_content = Math.min(maxY, Math.max(0, mouseY_content));

      const x = Math.min(marqueeAnchorX.value, clampedMouseX);
      const yPos = Math.min(marqueeAnchorY.value, mouseY_content);
      const width = Math.abs(mouseX_content - marqueeAnchorX.value);
      const height = Math.abs(mouseY_content - marqueeAnchorY.value);

      localMarqueeRect.x = x;
      localMarqueeRect.y = yPos;
      localMarqueeRect.width = width;
      localMarqueeRect.height = height;
      if (localSelectionBox.value) {
        localSelectionBox.value.style.display = "block";
        localSelectionBox.value.style.transform = `translate(${x}px, ${yPos}px)`;
        localSelectionBox.value.style.width = `${width}px`;
        localSelectionBox.value.style.height = `${height}px`;
      }

      const paths = computeSelectionByRectLocal(marqueeIsAdditive.value, x, yPos, width, height);
      updatePreviewDOM(paths);
    }

    autoScrollRaf = window.requestAnimationFrame(tick);
  };

  autoScrollRaf = window.requestAnimationFrame(tick);
};

const stopAutoScroll = () => {
  if (autoScrollRaf) {
    window.cancelAnimationFrame(autoScrollRaf);
    autoScrollRaf = null;
  }
};

const handleMarqueeMouseUp = () => {
  skipRootClick.value = true;
  wasMarqueeActive.value = true;
  // Extend the protection time to prevent outside click handler from firing
  // during marquee selection completion
  setTimeout(() => {
    skipRootClick.value = false;
    wasMarqueeActive.value = false;
  }, 300);
  isMarqueeActive.value = false;
  const finalPaths = computeSelectionByRectLocal(
    marqueeIsAdditive.value,
    localMarqueeRect.x,
    localMarqueeRect.y,
    localMarqueeRect.width,
    localMarqueeRect.height
  );
  if (finalPaths.length > 0) {
         if (marqueeIsInvert.value) {
       // For invert selection, always work with selected files for consistency
       const currentSet = new Set(selectedFiles.value);
       for (const p of finalPaths) {
         if (currentSet.has(p)) currentSet.delete(p);
         else currentSet.add(p);
       }
       selectedFiles.value = Array.from(currentSet);
       // Only update checked files if auto-check is enabled
       if (userPreferencesStore.checkboxMode && userPreferencesStore.autoCheckOnSelect) {
         checkedFiles.value = Array.from(currentSet);
       }
     } else if (marqueeIsAdditive.value) {
       // For additive selection, always work with selected files for consistency
       const selectionSet = new Set([...selectedFiles.value, ...finalPaths]);
       selectedFiles.value = Array.from(selectionSet);
       // Only update checked files if auto-check is enabled
       if (userPreferencesStore.checkboxMode && userPreferencesStore.autoCheckOnSelect) {
         checkedFiles.value = Array.from(selectionSet);
       }
     } else {
       // Normal marquee selection (not additive)
       if (userPreferencesStore.checkboxMode) {
         // In checkbox mode, only update checked files if auto-check is enabled
         if (userPreferencesStore.autoCheckOnSelect) {
           checkedFiles.value = finalPaths;
         }
         // Always update selected files for visual feedback
         selectedFiles.value = finalPaths;
       } else {
         selectedFiles.value = finalPaths;
       }
     }
  }
  clearPreviewDOM();
  marqueePreviewSelection.value = [];
  uiStore.marqueeBox.visible = false;
  window.removeEventListener("mousemove", handleMarqueeMouseMove);
  window.removeEventListener("mouseup", handleMarqueeMouseUp);
  window.removeEventListener("pointerup", handleMarqueeMouseUp);
  window.removeEventListener("pointercancel", handleMarqueeMouseUp);
  stopAutoScroll();
};

const computeSelectionByRect = (isAdditive: boolean): string[] => {
  const marqueeTop = isMarqueeActive.value ? localMarqueeRect.y : uiStore.marqueeBox.y;
  const marqueeBottom = marqueeTop + (isMarqueeActive.value ? localMarqueeRect.height : uiStore.marqueeBox.height);
  const marqueeLeft = isMarqueeActive.value ? localMarqueeRect.x : uiStore.marqueeBox.x;
  const marqueeRight = marqueeLeft + (isMarqueeActive.value ? localMarqueeRect.width : uiStore.marqueeBox.width);

  const startIndexInView = Math.max(0, Math.floor(marqueeTop / ROW_HEIGHT));
  const endIndexInView = Math.min(sortedFiles.value.length, Math.ceil(marqueeBottom / ROW_HEIGHT));

  const pathsToSelect: string[] = [];

  try {
    const scrollWrapper = viewportRef.value;
    if (scrollWrapper) {
      const scrollBounds = scrollWrapper.getBoundingClientRect();
      const rowNodes = document.querySelectorAll(".virtual-scroll-content .table-row");

      for (let i = startIndexInView; i < endIndexInView; i++) {
        const file = sortedFiles.value[i];
        if (!file) continue;

        const rowTop = i * ROW_HEIGHT;
        const rowBottom = rowTop + ROW_HEIGHT;

        if (!(marqueeBottom > rowTop && marqueeTop < rowBottom)) continue;

        const rowNode = rowNodes[i - startIndex.value] as HTMLElement | undefined;
        if (rowNode) {
          const contentNode = rowNode.querySelector(".item-name-content") as HTMLElement | null;
          if (contentNode) {
            const rect = contentNode.getBoundingClientRect();
            const itemLeft = rect.left - scrollBounds.left;
            const itemRight = itemLeft + rect.width;
            
            // Only select if marquee intersects with the actual .item-name-content bounds
            if (marqueeRight > itemLeft - 2 && marqueeLeft < itemRight + 2) {
              pathsToSelect.push(file.path);
            }
          }
        }
      }
    }
  } catch (err) {
    // If we can't access the DOM elements, don't select anything
    logUI("FileTable", "Error computing marquee selection, no files selected", err);
  }

  return pathsToSelect;
};

const computeSelectionByRectLocal = (
  isAdditive: boolean,
  rectX: number,
  rectY: number,
  rectW: number,
  rectH: number
): string[] => {
  const marqueeTop = rectY;
  const marqueeBottom = rectY + rectH;
  const marqueeLeft = rectX;
  const marqueeRight = rectX + rectW;

  const startIndexInView = Math.max(0, Math.floor(marqueeTop / ROW_HEIGHT));
  const endIndexInView = Math.min(sortedFiles.value.length, Math.ceil(marqueeBottom / ROW_HEIGHT));

  const pathsToSelect: string[] = [];

  try {
    const scrollWrapper = viewportRef.value;
    const scrollBounds = scrollWrapper ? scrollWrapper.getBoundingClientRect() : null;
    const rowNodes = document.querySelectorAll(".virtual-scroll-content .table-row");

    for (let i = startIndexInView; i < endIndexInView; i++) {
      const file = sortedFiles.value[i];
      if (!file) continue;

      const rowTop = i * ROW_HEIGHT;
      const rowBottom = rowTop + ROW_HEIGHT;
      if (!(marqueeBottom > rowTop && marqueeTop < rowBottom)) continue;

      const node = rowNodes[i - startIndex.value] as HTMLElement | undefined;
      if (node && scrollBounds) {
        const contentNode = node.querySelector(".item-name-content") as HTMLElement | null;
        if (contentNode) {
          const rect = contentNode.getBoundingClientRect();
          const scrollLeft = scrollWrapper ? scrollWrapper.scrollLeft : 0;
          const itemLeft = rect.left - scrollBounds.left + scrollLeft;
          const itemRight = itemLeft + rect.width;
          
          // Only select if marquee intersects with the actual .item-name-content bounds
          if (marqueeRight > itemLeft - 2 && marqueeLeft < itemRight + 2) {
            pathsToSelect.push(file.path);
          }
        }
      }
    }
  } catch (err) {
    // If we can't access the DOM elements, don't select anything
    // This is better than falling back to incorrect column width calculations
    logUI("FileTable", "Error computing marquee selection, no files selected", err);
  }

  return pathsToSelect;
};

const updatePreviewDOM = (paths: string[]) => {
  const newSet = new Set(paths);
  const rowNodes = document.querySelectorAll(".virtual-scroll-content .table-row");
  rowNodes.forEach((node) => {
    const path = node.getAttribute("data-path") || "";
    const shouldHave = newSet.has(path);
    const has = node.classList.contains("preview-selected");
    if (shouldHave && !has) node.classList.add("preview-selected");
    else if (!shouldHave && has) node.classList.remove("preview-selected");
  });
};

const clearPreviewDOM = () => {
  const rowNodes = document.querySelectorAll(".virtual-scroll-content .table-row.preview-selected");
  rowNodes.forEach((n) => n.classList.remove("preview-selected"));
  if (localSelectionBox.value) {
    localSelectionBox.value.style.display = "none";
  }
};

// --- MEMOIZED COLUMN STYLES ---
const columnStyles = createMemoizedComputed(() => ({
  "--col-width-checkbox": `${columnWidths.checkbox}px`,
  "--col-width-name": `${columnWidths.name}px`,
  "--col-width-size": `${columnWidths.size}px`,
  "--col-width-ext": `${columnWidths.ext}px`,
  "--col-width-modified": `${columnWidths.modified}px`,
  "--col-width-created": `${columnWidths.created}px`,
  "--col-width-files": `${columnWidths.files}px`,
  "--col-width-folders": `${columnWidths.folders}px`,
  "--col-width-files-total": `${columnWidths.filesTotal}px`,
  "--col-width-folders-total": `${columnWidths.foldersTotal}px`,
  "--col-width-parent-path": `${columnWidths.parentPath}px`,
}), [
  () => columnWidths.checkbox,
  () => columnWidths.name,
  () => columnWidths.size,
  () => columnWidths.ext,
  () => columnWidths.modified,
  () => columnWidths.created,
  () => columnWidths.files,
  () => columnWidths.folders,
  () => columnWidths.filesTotal,
  () => columnWidths.foldersTotal,
  () => columnWidths.parentPath
]);

// --- MEMOIZED TABLE CONTENT STYLE ---
const tableContentStyle = createMemoizedComputed(() => {
  const totalWidth = Object.values(columnWidths).reduce((sum, width) => sum + width, 0);
  return {
    minInlineSize: `${totalWidth}px`,
  };
}, [() => Object.values(columnWidths).reduce((sum, width) => sum + width, 0)]);

// --- MEMOIZED FILE TABLE ROOT STYLE ---
const fileTableRootStyle = createMemoizedComputed(() => ({
  "--file-table-zoom-local": String(fileTableZoom.value),
}), [() => fileTableZoom.value]);

// --- MEMOIZED LOADING BACKDROP STYLE ---
const loadingBackdropStyle = createMemoizedComputed(() => {
  const minHeight = Math.max(ROW_HEIGHT * (props.files?.length || 1) + 34, 120);
  return {
    minHeight: `${minHeight}px`,
  };
}, [() => props.files?.length]);

// --- MEMOIZED SELECTION STATE ---
const allSelected = createMemoizedComputed(() => {
  // In checkbox mode, check if all files are checked
  // In normal mode, check if all files are selected
  if (userPreferencesStore.checkboxMode) {
    return props.files.length > 0 && checkedFiles.value.length === props.files.length;
  } else {
    return props.files.length > 0 && selectedFiles.value.length === props.files.length;
  }
}, [() => props.files.length, () => selectedFiles.value.length, () => checkedFiles.value.length, () => userPreferencesStore.checkboxMode]);

// --- OPTIMIZED TEMPLATE CONDITIONALS ---
// Pre-compute conditional states to reduce template complexity
const shouldShowToolbar = computed(() => props.showToolbar);

// Computed property that returns the appropriate array for actions based on checkbox mode
const actionItems = computed(() => {
  // In checkbox mode, use checked files for actions
  // In normal mode, use selected files for actions
  if (userPreferencesStore.checkboxMode) {
    return checkedFiles.value;
  } else {
    return selectedFiles.value;
  }
});
const shouldShowCheckboxes = computed(() => props.showCheckboxes && userPreferencesStore.checkboxMode);
const shouldShowRowActions = computed(() => props.showRowActions);
const isSelectableEnabled = computed(() => props.isSelectable);
const isItemDragEnabled = computed(() => props.itemDragEnabled);
const isMarqueeSelectionEnabled = computed(() => props.marqueeSelectionEnabled);
const isActivatable = computed(() => (props as any).activatable !== false);

const columnWidths = reactive({
  checkbox: 40,
  name: 300,
  size: 100,
  ext: 80,
  modified: 180,
  created: 120,
  files: 80,
  folders: 80,
  filesTotal: 100,
  foldersTotal: 100,
  parentPath: 300,
});

// Per-component zoom factor for FileTable. Uses CSS var `--file-table-zoom` set by useZoom.
const fileTableZoom = ref<number>(1.0);
const applyFileTableZoomFromCSS = () => {
  try {
    const raw = getComputedStyle(document.documentElement).getPropertyValue("--file-table-zoom").trim();
    const parsed = raw ? Number(parsedFloatSafe(raw)) : NaN;
    fileTableZoom.value = Number.isFinite(parsed) ? parsed : 1.0;
  } catch (e) {
    fileTableZoom.value = 1.0;
  }
};

// safe parse float helper to avoid stray characters
const parsedFloatSafe = (s: string) => {
  const m = s.match(/-?\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : NaN;
};

// initialize from CSS var
applyFileTableZoomFromCSS();

// Watch for changes to the root CSS var and apply to the component root as a style variable
// This is now handled by fileTableRootStyle
// const fileTableRootStyle = computed(() => ({
//   "--file-table-zoom-local": String(fileTableZoom.value),
// }));

// MutationObserver to detect style changes on documentElement
let fileTableZoomObserver: MutationObserver | null = null;
let fileTableClassObserver: MutationObserver | null = null;
onMounted(() => {
  try {
    fileTableZoomObserver = new MutationObserver(() => {
      applyFileTableZoomFromCSS();
    });
    fileTableZoomObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["style"] });
  } catch (e) {
    // ignore
  }
});
onUnmounted(() => {
  if (fileTableZoomObserver) {
    fileTableZoomObserver.disconnect();
    fileTableZoomObserver = null;
  }
  if (fileTableClassObserver) {
    fileTableClassObserver.disconnect();
    fileTableClassObserver = null;
  }
});

const effectiveZoom = () => (fileTableZoom.value && fileTableZoom.value > 0 ? fileTableZoom.value : 1);

// This is now handled by tableContentStyle
// const tableContentStyle = computed(() => {
//   const totalWidth = Object.values(columnWidths).reduce((sum, width) => sum + width, 0);
//   return {
//     minInlineSize: `${totalWidth}px`,
//   };
// });

const resizingColumn = ref<keyof typeof columnWidths | null>(null);
const startX = ref(0);
const startWidth = ref(0);
const isResizing = ref(false);
const suppressHeaderClick = ref(false);

const startResize = (event: MouseEvent, column: keyof typeof columnWidths) => {
  logUI("FileTable", `Starting resize for column: ${column}`);
  document.body.classList.add("is-resizing");
  isResizing.value = true;
  resizingColumn.value = column;
  startX.value = event.clientX;
  startWidth.value = columnWidths[column];
  window.addEventListener("mousemove", doResize);
  window.addEventListener("mouseup", stopResize);
};

// Use rAF batching to avoid updating reactive state on every mousemove
let pendingResizeRaf: number | null = null;
let pendingResizeColumn: keyof typeof columnWidths | null = null;
let pendingResizeWidth = 0;

const doResize = (event: MouseEvent) => {
  if (!resizingColumn.value) return;
  const delta = event.clientX - startX.value;
  const newWidth = Math.max(30, startWidth.value + delta);

  // store pending values
  pendingResizeColumn = resizingColumn.value;
  pendingResizeWidth = newWidth;

  if (pendingResizeRaf !== null) return;
  pendingResizeRaf = window.requestAnimationFrame(() => {
    if (pendingResizeColumn) {
      // commit to reactive state once per frame
      columnWidths[pendingResizeColumn] = pendingResizeWidth;
    }
    pendingResizeRaf = null;
    pendingResizeColumn = null;
    pendingResizeWidth = 0;
  });
};

const stopResize = () => {
  logUI("FileTable", `Stopping resize for column: ${resizingColumn.value}`);
  document.body.classList.remove("is-resizing");
  // small delay to prevent the click event that follows mouseup from triggering header actions
  isResizing.value = false;
  suppressHeaderClick.value = true;
  setTimeout(() => (suppressHeaderClick.value = false), 150);
  resizingColumn.value = null;
  // cancel any pending rAF and commit pending width synchronously
  if (pendingResizeRaf !== null) {
    window.cancelAnimationFrame(pendingResizeRaf);
    pendingResizeRaf = null;
  }
  if (pendingResizeColumn) {
    columnWidths[pendingResizeColumn] = pendingResizeWidth;
    pendingResizeColumn = null;
    pendingResizeWidth = 0;
  }
  window.removeEventListener("mousemove", doResize);
  window.removeEventListener("mouseup", stopResize);
};

// This is now handled by allSelected
// const allSelected = computed(() => {
//   return props.files.length > 0 && selectedFiles.value.length === props.files.length;
// });

const toggleFileSelection = (path: string) => {
  if (!props.isSelectable) return;
  isActive.value = true;
  const selectedIndex = selectedFiles.value.indexOf(path);
  const checkedIndex = checkedFiles.value.indexOf(path);
  const fileIndex = sortedFiles.value.findIndex((f) => f.path === path);
  const fileName = sortedFiles.value[fileIndex]?.name;
  
  if (selectedIndex > -1) {
    selectedFiles.value.splice(selectedIndex, 1);
    logFocus("FileTable", `Toggle selection: Deselected file`, {
      jobId: props.jobId,
      fileName,
      filePath: path,
      newSelectionCount: selectedFiles.value.length,
      checkboxMode: userPreferencesStore.checkboxMode,
      autoCheckOnSelect: userPreferencesStore.autoCheckOnSelect
    });
  } else {
    selectedFiles.value.push(path);
    logFocus("FileTable", `Toggle selection: Selected file`, {
      jobId: props.jobId,
      fileName,
      filePath: path,
      newSelectionCount: selectedFiles.value.length,
      checkboxMode: userPreferencesStore.checkboxMode,
      autoCheckOnSelect: userPreferencesStore.autoCheckOnSelect
    });
  }
  
  // Toggle checkbox state
  if (checkedIndex > -1) {
    checkedFiles.value.splice(checkedIndex, 1);
  } else {
    checkedFiles.value.push(path);
  }
  
  if (fileIndex !== -1) {
    lastClickedIndex.value = fileIndex;
  }
};

const clickRowByPath = (event: MouseEvent, path: string) => {
  if (!props.isSelectable) return;

  // Only treat as a row-selection click if the user clicked the name content or checkbox
  const target = event.target as HTMLElement;
  const clickedOnName = !!target.closest(".item-name-content");
  const clickedOnCheckbox = !!target.closest(".item-checkbox");

  if (!clickedOnName && !clickedOnCheckbox) {
    // Clicked elsewhere in the row: deselect all
    deselectAll();
    return;
  }

  // Prevent the root click handler from also deselecting
  event.stopPropagation();

  const clickedIndex = sortedFiles.value.findIndex((f) => f.path === path);
  if (clickedIndex === -1) return;

  // Set focus to the clicked row
  const previousFocusIndex = focusedRowIndex.value;
  focusedRowIndex.value = clickedIndex;
  
  logFocus("FileTable", `Row clicked: Focus moved to row ${clickedIndex}`, {
    jobId: props.jobId,
    fileName: sortedFiles.value[clickedIndex]?.name,
    filePath: sortedFiles.value[clickedIndex]?.path,
    previousFocusIndex,
    clickedOnName,
    clickedOnCheckbox,
    checkboxMode: userPreferencesStore.checkboxMode,
    autoCheckOnSelect: userPreferencesStore.autoCheckOnSelect
  });

  const isCtrlPressed = event.ctrlKey || event.metaKey;

  if (event.shiftKey && lastClickedIndex.value !== null) {
    const start = Math.min(lastClickedIndex.value, clickedIndex);
    const end = Math.max(lastClickedIndex.value, clickedIndex);
    const rangePaths = sortedFiles.value.slice(start, end + 1).map((f) => f.path);

    // If file table is active, add the new range to existing selection instead of replacing
    if (isActive.value && selectedFiles.value.length > 0) {
      const selectionSet = new Set(selectedFiles.value);
      rangePaths.forEach((p) => selectionSet.add(p));
      selectedFiles.value = Array.from(selectionSet);
    } else {
      selectedFiles.value = rangePaths;
    }
    
    // Auto check on select: if checkbox mode is enabled and auto check is enabled, 
    // automatically check the checkboxes for the range
    if (userPreferencesStore.checkboxMode && userPreferencesStore.autoCheckOnSelect) {
      // Add files to checkedFiles array to mark checkboxes as checked
      const checkedSet = new Set(checkedFiles.value);
      rangePaths.forEach((p) => checkedSet.add(p));
      checkedFiles.value = Array.from(checkedSet);
      
      logFocus("FileTable", "Auto check on select: Range automatically checked", {
        jobId: props.jobId,
        rangeSize: rangePaths.length,
        startIndex: start,
        endIndex: end,
        checkboxMode: userPreferencesStore.checkboxMode,
        autoCheckOnSelect: userPreferencesStore.autoCheckOnSelect
      });
    }
  } else if (isCtrlPressed) {
    toggleFileSelection(path);
  } else {
    selectedFiles.value = [path];
    
    // Auto check on select: if checkbox mode is enabled and auto check is enabled, 
    // automatically check the checkbox when selecting a row
    if (userPreferencesStore.checkboxMode && userPreferencesStore.autoCheckOnSelect) {
      // Add file to checkedFiles array to mark checkbox as checked
      if (!checkedFiles.value.includes(path)) {
        checkedFiles.value.push(path);
      }
      
      logFocus("FileTable", "Auto check on select: File automatically checked", {
        jobId: props.jobId,
        fileName: sortedFiles.value[clickedIndex]?.name,
        filePath: path,
        checkboxMode: userPreferencesStore.checkboxMode,
        autoCheckOnSelect: userPreferencesStore.autoCheckOnSelect
      });
    }
  }
  lastClickedIndex.value = clickedIndex;
  isActive.value = true;
};

const handleRootClick = (event: MouseEvent) => {
  isActive.value = true;
  // If we recently ended a marquee drag, ignore this root click (it comes from the mouseup)
  if (skipRootClick.value) {
    skipRootClick.value = false;
    return;
  }
  // If we just finished a resize, suppress the immediate click
  if (suppressHeaderClick.value) {
    return;
  }
  const target = event.target as HTMLElement;
  // If click is inside item-name-content or interactive controls, do nothing
  if (
    target.closest(".item-name-content") ||
    target.closest(".item-checkbox") ||
    target.closest(".file-table-toolbar") ||
    target.closest(".row-actions") ||
    target.closest(".table-header") ||
    target.closest(".resizer")
  ) {
    return;
  }
  // Otherwise deselect all
  deselectAll();
};

const handleRootContextMenu = (event: MouseEvent) => {
  // Make the file table active when right-clicking anywhere in it
  isActive.value = true;
  logFocus("FileTable", "Root context menu - activating file table", {
    jobId: props.jobId,
    target: (event.target as HTMLElement)?.className
  });
};

const toggleAll = (): void => {
  if (!props.isSelectable) return;
  
  if (userPreferencesStore.checkboxMode) {
    // In checkbox mode, toggle the checked state of all files
    if (allSelected.value) {
      const previousCheckedCount = checkedFiles.value.length;
      checkedFiles.value = [];
      // When auto check on select is enabled, also clear selection
      if (userPreferencesStore.autoCheckOnSelect) {
        selectedFiles.value = [];
      }
      logFocus("FileTable", "Toggle all: Unchecked all files", {
        jobId: props.jobId,
        previousCheckedCount,
        checkboxMode: userPreferencesStore.checkboxMode,
        autoCheckOnSelect: userPreferencesStore.autoCheckOnSelect
      });
    } else {
      checkedFiles.value = props.files.map((file) => file.path);
      // When auto check on select is enabled, also select all
      if (userPreferencesStore.autoCheckOnSelect) {
        selectedFiles.value = props.files.map((file) => file.path);
      }
      logFocus("FileTable", "Toggle all: Checked all files", {
        jobId: props.jobId,
        fileCount: props.files.length,
        checkboxMode: userPreferencesStore.checkboxMode,
        autoCheckOnSelect: userPreferencesStore.autoCheckOnSelect
      });
    }
  } else {
    // In normal mode, toggle the selected state of all files
    if (allSelected.value) {
      const previousSelectionCount = selectedFiles.value.length;
      selectedFiles.value = [];
      logFocus("FileTable", "Toggle all: Deselected all files", {
        jobId: props.jobId,
        previousSelectionCount,
        checkboxMode: userPreferencesStore.checkboxMode,
        autoCheckOnSelect: userPreferencesStore.autoCheckOnSelect
      });
    } else {
      selectedFiles.value = props.files.map((file) => file.path);
      logFocus("FileTable", "Toggle all: Selected all files", {
        jobId: props.jobId,
        fileCount: props.files.length,
        checkboxMode: userPreferencesStore.checkboxMode,
        autoCheckOnSelect: userPreferencesStore.autoCheckOnSelect
      });
    }
  }
  lastClickedIndex.value = null;
};

const deselectAll = () => {
  if (!props.isSelectable) return;
  const previousSelectionCount = selectedFiles.value.length;
  const previousCheckedCount = checkedFiles.value.length;
  selectedFiles.value = [];
  
  // When auto check on select is enabled, checked files are tied to selection
  // So when deselecting, we should also clear checked files
  if (userPreferencesStore.checkboxMode && userPreferencesStore.autoCheckOnSelect) {
    checkedFiles.value = [];
  } else if (!userPreferencesStore.checkboxMode) {
    // In normal mode (not checkbox mode), clear checked files
    checkedFiles.value = [];
  }
  // In checkbox mode with auto check disabled, preserve checked files
  
  lastClickedIndex.value = null;
  // Keep focus on the last focused row even when deselecting
  
  logFocus("FileTable", `Deselect all: Cleared all selections${userPreferencesStore.checkboxMode && userPreferencesStore.autoCheckOnSelect ? ' and checkboxes (auto check enabled)' : !userPreferencesStore.checkboxMode ? ' and checkboxes' : ''}`, {
    jobId: props.jobId,
    previousSelectionCount,
    previousCheckedCount,
    checkboxMode: userPreferencesStore.checkboxMode,
    autoCheckOnSelect: userPreferencesStore.autoCheckOnSelect
  });
};

// Initialize focus on the last selected row or first row
const initializeFocus = () => {
  if (sortedFiles.value.length === 0) return;
  
  // If there are selected files, focus on the first selected file
  if (selectedFiles.value.length > 0) {
    const firstSelectedPath = selectedFiles.value[0];
    const selectedIndex = sortedFiles.value.findIndex(f => f.path === firstSelectedPath);
    if (selectedIndex !== -1) {
      focusedRowIndex.value = selectedIndex;
      logFocus("FileTable", `Initialize focus: Focused on first selected file at row ${selectedIndex}`, {
        jobId: props.jobId,
        fileName: sortedFiles.value[selectedIndex]?.name,
        filePath: sortedFiles.value[selectedIndex]?.path,
        checkboxMode: userPreferencesStore.checkboxMode,
        autoCheckOnSelect: userPreferencesStore.autoCheckOnSelect
      });
      return;
    }
  }
  
  // If no selected files or selected file not found, focus on first row
  focusedRowIndex.value = 0;
  logFocus("FileTable", `Initialize focus: Focused on first row (no selection)`, {
    jobId: props.jobId,
    fileName: sortedFiles.value[0]?.name,
    filePath: sortedFiles.value[0]?.path,
    checkboxMode: userPreferencesStore.checkboxMode,
    autoCheckOnSelect: userPreferencesStore.autoCheckOnSelect
  });
};

const handleDragStart = (event: DragEvent, path: string) => {
  if (!props.itemDragEnabled) {
    event.preventDefault();
    return;
  }
  let pathsToDrag: string[];

  if (actionItems.value.includes(path)) {
    pathsToDrag = [...actionItems.value];
  } else {
    // In checkbox mode, we don't want to automatically select/check the file
    // In normal mode, we can select it
    if (!userPreferencesStore.checkboxMode) {
      selectedFiles.value = [path];
    }
    pathsToDrag = [path];
  }

  if (event.dataTransfer) {
    event.dataTransfer.setData(
      "text/plain",
      JSON.stringify({ type: "internal-files", paths: pathsToDrag, sourceJobId: props.jobId })
    );
    event.dataTransfer.effectAllowed = "copyMove";
  }

  isActive.value = true;
  dragDropStore.startInternalDrag(pathsToDrag, null, props.jobId);
  logDragDropEvent("FileTable", `Native drag started for ${pathsToDrag.length} files from job ${props.jobId}.`);
};

const handleDragEnd = () => {
  logDragDropEvent("FileTable", "Native drag ended.");
  setTimeout(() => {
    if (dragDropStore.isInternalDragActive && !dragDropStore.dropOccurred) {
      logDragDropEvent("FileTable", "Drag ended on an invalid target. Cleaning up state.");
      dragDropStore.endInternalDrag();
    }
  }, 50);
};

// --- DRAG-TO-SCROLL FUNCTIONALITY ---
let dragScrollRaf: number | null = null;
let dragScrollSpeed = 0;
let dragScrollDirection: 'up' | 'down' | 'left' | 'right' | null = null;

const startDragScroll = (event: MouseEvent) => {
  if (!dragDropStore.isInternalDragActive || !viewportRef.value) return;
  
  const rect = viewportRef.value.getBoundingClientRect();
  const edgeDistance = 30; // pixels from edge to start scrolling
  
  const mouseX = event.clientX;
  const mouseY = event.clientY;
  
  // Determine scroll direction and speed
  let direction: 'up' | 'down' | 'left' | 'right' | null = null;
  let speed = 0;
  
  if (mouseY < rect.top + edgeDistance) {
    direction = 'up';
    speed = Math.max(2, Math.min(15, (edgeDistance - (mouseY - rect.top)) / 2));
  } else if (mouseY > rect.bottom - edgeDistance) {
    direction = 'down';
    speed = Math.max(2, Math.min(15, (mouseY - (rect.bottom - edgeDistance)) / 2));
  } else if (mouseX < rect.left + edgeDistance) {
    direction = 'left';
    speed = Math.max(2, Math.min(15, (edgeDistance - (mouseX - rect.left)) / 2));
  } else if (mouseX > rect.right - edgeDistance) {
    direction = 'right';
    speed = Math.max(2, Math.min(15, (mouseX - (rect.right - edgeDistance)) / 2));
  }
  
  if (direction && speed > 0) {
    if (dragScrollDirection !== direction) {
      logUI("FileTable", `Drag scroll started: ${direction} at speed ${speed}`);
    }
    dragScrollDirection = direction;
    dragScrollSpeed = speed;
    
    if (!dragScrollRaf) {
      const tick = () => {
        if (!viewportRef.value || !dragDropStore.isInternalDragActive) {
          stopDragScroll();
          return;
        }
        
        const scrollAmount = Math.floor(dragScrollSpeed);
        
        switch (dragScrollDirection) {
          case 'up':
            viewportRef.value.scrollTop = Math.max(0, viewportRef.value.scrollTop - scrollAmount);
            break;
          case 'down':
            viewportRef.value.scrollTop = Math.min(
              viewportRef.value.scrollHeight - viewportRef.value.clientHeight,
              viewportRef.value.scrollTop + scrollAmount
            );
            break;
          case 'left':
            viewportRef.value.scrollLeft = Math.max(0, viewportRef.value.scrollLeft - scrollAmount);
            break;
          case 'right':
            viewportRef.value.scrollLeft = Math.min(
              viewportRef.value.scrollWidth - viewportRef.value.clientWidth,
              viewportRef.value.scrollLeft + scrollAmount
            );
            break;
        }
        
        dragScrollRaf = requestAnimationFrame(tick);
      };
      
      dragScrollRaf = requestAnimationFrame(tick);
    }
  } else {
    if (dragScrollDirection !== null) {
      logUI("FileTable", "Drag scroll stopped");
    }
    stopDragScroll();
  }
};

const stopDragScroll = () => {
  if (dragScrollRaf) {
    cancelAnimationFrame(dragScrollRaf);
    dragScrollRaf = null;
  }
  dragScrollDirection = null;
  dragScrollSpeed = 0;
};

// --- MISSING FUNCTIONS THAT WERE ACCIDENTALLY REMOVED ---
const removeSelectedFiles = (): void => {
  emit("remove-files", actionItems.value);
};

const moveToJob = (targetJobId: number): void => {
  emit("move-files", { targetJobId, files: actionItems.value });
};

const moveToNewJob = (): void => {
  emit("move-to-new-job", actionItems.value);
};

const copyToJob = (targetJobId: number): void => {
  emit("copy-files", { targetJobId, files: actionItems.value });
};

const copyToNewJob = (): void => {
  emit("copy-to-new-job", actionItems.value);
};

const handleAddFile = async (files: string[]): Promise<void> => {
  emit("add-files", files);
};

const handleAddFolder = async (folders: string[]): Promise<void> => {
  emit("add-folders", folders);
};

const removeFile = (path: string): void => {
  // Emit the path as a string so parent can decide whether to act on the full selection
  emit("remove-files", path);
};

const moveFile = (targetJobId: number, pathOrPaths: string | string[]): void => {
  const paths = Array.isArray(pathOrPaths)
    ? pathOrPaths
    : actionItems.value.includes(pathOrPaths) && actionItems.value.length > 0
    ? actionItems.value
    : [pathOrPaths];
  emit("move-files", { targetJobId, files: paths });
};

const moveFileToNewJob = (pathOrPaths: string | string[]): void => {
  const paths = Array.isArray(pathOrPaths)
    ? pathOrPaths
    : actionItems.value.includes(pathOrPaths) && actionItems.value.length > 0
    ? actionItems.value
    : [pathOrPaths];
  // Emit array so parent can use selection if appropriate
  emit("move-to-new-job", paths);
};

const copyFile = (targetJobId: number, pathOrPaths: string | string[]): void => {
  const paths = Array.isArray(pathOrPaths)
    ? pathOrPaths
    : actionItems.value.includes(pathOrPaths) && actionItems.value.length > 0
    ? actionItems.value
    : [pathOrPaths];
  emit("copy-files", { targetJobId, files: paths });
};

const copyFileToNewJob = (pathOrPaths: string | string[]): void => {
  const paths = Array.isArray(pathOrPaths)
    ? pathOrPaths
    : actionItems.value.includes(pathOrPaths) && actionItems.value.length > 0
    ? actionItems.value
    : [pathOrPaths];
  // Emit array so parent can use selection if appropriate
  emit("copy-to-new-job", paths);
};

// Handler for context menu copy events (different format)
const handleContextMenuCopyFiles = (payload: { targetJobId: number; rightClickedPath: string }): void => {
  emit("copy-files", payload);
};

// Handler for context menu move events (different format)
const handleContextMenuMoveFiles = (payload: { targetJobId: number; rightClickedPath: string }): void => {
  emit("move-files", payload);
};

const setFileMenuRef = (file: FileItem, el: any) => {
  if (el) {
    fileMenuRefs.value.set(file.path, el);
  }
};

const handleContextMenu = (file: FileItem, event: MouseEvent, preserveSelection: boolean) => {
  if (!isSelectableEnabled.value) return;
  
  // Make the file table active when right-clicking on any file
  isActive.value = true;
  logFocus("FileTable", "Context menu - activating file table", {
    jobId: props.jobId,
    filePath: file.path,
    preserveSelection
  });
  
  // If not preserving selection (i.e., right-clicked outside .item-name-content), deselect all
  if (!preserveSelection) {
    selectedFiles.value = [];
    lastClickedIndex.value = null;
  } else {
         // Only select the file if right-clicking on .item-name-content AND it's not already selected
     if (!actionItems.value.includes(file.path)) {
       // In checkbox mode, we don't want to automatically select/check the file
       // In normal mode, we can select it
       if (!userPreferencesStore.checkboxMode) {
         selectedFiles.value = [file.path];
       }
       const fileIndex = sortedFiles.value.findIndex((f) => f.path === file.path);
       if (fileIndex !== -1) {
         lastClickedIndex.value = fileIndex;
       }
     }
  }
  
  // Context menu is handled by the FileTableRow component
  const menuRef = fileMenuRefs.value.get(file.path);
  if (menuRef) {
    menuRef.showFileContextMenu(file, event);
  } else {
    // Fallback: if menu ref is not available, try to find it in the DOM
    // This can happen if the component just updated and refs haven't been re-established
    logLifecycle("FileTable", `Menu ref not found for ${file.path}, attempting fallback`);
    
    // Wait for next tick to allow refs to be established
    nextTick(() => {
      const retryMenuRef = fileMenuRefs.value.get(file.path);
      if (retryMenuRef) {
        retryMenuRef.showFileContextMenu(file, event);
      } else {
        logLifecycle("FileTable", `Menu ref still not found for ${file.path} after retry`);
      }
    });
  }
};

const handleContextMenuClosed = () => {
  // Set flag to prevent outside click handler from deactivating file table
  isClosingContextMenu.value = true;
  nextTick(() => {
    // Reset flag after a short delay
    setTimeout(() => {
      isClosingContextMenu.value = false;
    }, 100);
  });
  emit('file-table-context-menu-closed');
};

const handleDropdownOpened = () => {
  console.log('FileTable: handleDropdownOpened called');
  logFocus("FileTable", "Dropdown opened, activating file table", { jobId: props.jobId });
  isActive.value = true;
  // Add a small delay to ensure activation persists through the dropdown opening
  nextTick(() => {
    isActive.value = true;
  });
};

// --- LOGGING ---
watch(visibleFiles, (newVisibleFiles) => {
  logRendering("FileTable", `Virtual scroll update: now showing ${newVisibleFiles.length} files.`);
});

// Watch for changes in the files prop to ensure component updates when files are added/removed
watch(() => props.files, (newFiles, oldFiles) => {
  logRendering("FileTable", `Files prop changed: ${oldFiles?.length || 0} -> ${newFiles?.length || 0} files`);
  
  // Initialize focus when files change (e.g., on refresh)
  if (newFiles.length > 0 && focusedRowIndex.value === null) {
    initializeFocus();
  }
}, { deep: true });

// Emit selection changes so parent components (e.g., JobArea) stay in sync
watch(selectedFiles, (newSelection) => {
  emit("selection-changed", newSelection);
});

watch(columnStyles, (newStyle) => {
  logRendering("FileTable", `Column styles updated`, newStyle);
});

// --- LIFECYCLE HOOKS ---
onMounted(() => {
  // NOOP: already handled above
});

onBeforeUpdate(() => {
  // Don't clear menu refs immediately - let them be cleared naturally when components unmount
  // This prevents the "initial right click doesn't work" issue
  updateStartTime = performance.now();
  logLifecycle("FileTable", "Component is about to update...");
});

onUpdated(() => {
  const updateDuration = performance.now() - updateStartTime;
  logLifecycle("FileTable", `Component has been updated. Update duration: ${updateDuration.toFixed(2)}ms`);
  
  // Clean up stale menu refs after update
  // Only keep refs for files that are still in the current visible files
  const visibleFilePaths = new Set(visibleFiles.value.map(f => f.path));
  for (const [filePath, menuRef] of fileMenuRefs.value.entries()) {
    if (!visibleFilePaths.has(filePath)) {
      fileMenuRefs.value.delete(filePath);
    }
  }
});

watch(scrollComponentRef, (newRef) => {
  if (newRef) {
    const osInstance = newRef.osInstance();
    if (osInstance) {
      const viewportEl = osInstance.elements().viewport;
      const contentEl = osInstance.elements().content;
      viewportRef.value = viewportEl;
      try {
        // Disable momentum/elastic scrolling for this overlayscrollbars instance
        // -webkit-overflow-scrolling: auto disables iOS momentum
        // overscroll-behavior: contain prevents rubber-banding
        // scrollBehavior: auto avoids smooth scrolling side-effects
        if (viewportEl) {
          viewportEl.style.setProperty("-webkit-overflow-scrolling", "auto");
          viewportEl.style.setProperty("overscroll-behavior", "contain");
          viewportEl.style.setProperty("scroll-behavior", "auto");
        }
        if (contentEl) {
          contentEl.style.setProperty("-webkit-overflow-scrolling", "auto");
        }
      } catch (err) {
        // ignore
      }
    }
  }
});

// --- Global marquee blocker (app-level overlay) ---
let globalMarqueeBlocker: HTMLElement | null = null;
// Reference to the global click handler so it can be removed on unmount
let globalClickHandler: ((e: MouseEvent) => void) | null = null;
let globalOutsideClickHandler: ((e: MouseEvent) => void) | null = null;

onMounted(() => {
  logLifecycle("FileTable", "Component has been mounted.");

  // Add global drag scroll listeners
  const handleGlobalDragMove = (event: MouseEvent) => {
    if (dragDropStore.isInternalDragActive) {
      startDragScroll(event);
    }
  };
  
  const handleGlobalDragEnd = () => {
    stopDragScroll();
  };
  
  window.addEventListener('mousemove', handleGlobalDragMove);
  window.addEventListener('dragend', handleGlobalDragEnd);
  window.addEventListener('keydown', handleKeyDown);
  
  // Store the handlers for cleanup
  const cleanup = () => {
    window.removeEventListener('mousemove', handleGlobalDragMove);
    window.removeEventListener('dragend', handleGlobalDragEnd);
    window.removeEventListener('keydown', handleKeyDown);
    stopDragScroll();
  };
  
  // Clean up on unmount
  onUnmounted(cleanup);

  // Initialize focus when component is mounted
  nextTick(() => {
    if (sortedFiles.value.length > 0) {
      initializeFocus();
    }
  });

  // Watch the root element for class changes so we can diagnose 'is-active' toggles
  try {
    nextTick(() => {
      const root = fileTableCompRef.value as HTMLElement | null;
      if (root) {
        // Log initial classes
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const { logLifecycle } = require("@/utils/loggers");
          logLifecycle("FileTable", `root initial classes: ${Array.from(root.classList).join(" ")}`);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.log("FileTable root initial classes:", root.className);
        }

        fileTableClassObserver = new MutationObserver((muts) => {
          for (const m of muts) {
            if (m.type === "attributes" && m.attributeName === "class") {
              const el = m.target as HTMLElement;
              // eslint-disable-next-line no-console
              console.log(`FileTable.classMutation: job=${props.jobId} class="${el.className}"`);
            }
          }
        });
        fileTableClassObserver.observe(root, { attributes: true, attributeFilter: ["class"] });
      }
    });
  } catch (err) {
    // ignore
  }

  // create a global blocker appended to body so it captures pointer events outside this component
  try {
    globalMarqueeBlocker = document.createElement("div");
    globalMarqueeBlocker.className = "marquee-blocker-global";
    // Inline styles (so they apply even without global CSS)
    Object.assign(globalMarqueeBlocker.style, {
      position: "fixed",
      inset: "0",
      background: "transparent",
      zIndex: "2000",
      pointerEvents: "auto",
    });

    // Watch marquee active state to add/remove from DOM
    watch(
      () => isMarqueeActive.value,
      (val) => {
        if (!globalMarqueeBlocker) return;

        if (val) {
          // Add to DOM when marquee becomes active
          if (!document.body.contains(globalMarqueeBlocker)) {
            document.body.appendChild(globalMarqueeBlocker);
          }
        } else {
          // Remove from DOM when marquee becomes inactive
          if (document.body.contains(globalMarqueeBlocker)) {
            document.body.removeChild(globalMarqueeBlocker);
          }
        }
      }
    );
  } catch (err) {
    // ignore if DOM unavailable
  }
  
  // install a global click handler to deselect when clicking empty space inside .job-content
  // store handler reference so it can be removed on unmount
  globalClickHandler = (event: MouseEvent) => {
    if (skipRootClick.value) {
      // ignore spurious click generated by mouseup after marquee
      skipRootClick.value = false;
      return;
    }
    if (isMarqueeActive.value) return; // ignore while dragging
    const target = event.target as HTMLElement;
    // If click is within a job-content but not on interactive name/checkbox/header/resizer, deselect
    if (target.closest(".job-content")) {
      const clickedOnName = !!target.closest(".item-name-content");
      const clickedOnCheckbox = !!target.closest(".item-checkbox");
      const isInteractive = !!target.closest(".row-actions") || !!target.closest(".table-header") || !!target.closest(".resizer");
      if (!clickedOnName && !clickedOnCheckbox && !isInteractive) {
        deselectAll();
      }
    }
  };

  window.addEventListener("click", globalClickHandler);
  
  // Add global outside click handler to deactivate file table when clicking outside
  globalOutsideClickHandler = (event: MouseEvent) => {
    if (skipRootClick.value || isMarqueeActive.value || wasMarqueeActive.value || isClosingContextMenu.value) return;
    
    const target = event.target as HTMLElement;
    const fileTableElement = fileTableCompRef.value;
    
    // Check if click is outside the file table component
    if (fileTableElement && !fileTableElement.contains(target)) {
      // Don't deactivate if clicking on toolbar or other file table related elements
      const isFileTableRelated = target.closest(".file-table-toolbar") || 
                                target.closest(".file-table-comp") ||
                                target.closest(".job-content") ||
                                target.closest(".dropdown-menu");
      
      // Additional protection: if the click target is the body or html element
      // and we recently had marquee activity, don't deactivate
      if ((target.tagName === 'BODY' || target.tagName === 'HTML') && skipRootClick.value) {
        return;
      }
      
      if (!isFileTableRelated) {
        logFocus("FileTable", "Outside click detected, deactivating file table", {
          jobId: props.jobId,
          target: target.className
        });
        setActive(false);
      }
    }
  };
  
  window.addEventListener("click", globalOutsideClickHandler);
  
  // Listen for app-level outside clicks to deactivate job-content
  const outsideHandler = () => {
    logFocus("FileTable", "outsideHandler called", {
      jobId: props.jobId,
      currentIsActive: isActive.value,
      selectedJobId: jobsStore.selectedJobId
    });
    
    // Only deactivate if this is not the currently selected job
    // This prevents the file table from becoming inactive when context menus close
    if (props.jobId !== jobsStore.selectedJobId) {
      logFocus("FileTable", "outsideHandler: deactivating (not selected job)");
      isActive.value = false;
    } else {
      logFocus("FileTable", "outsideHandler: keeping active (selected job)");
    }
  };
  window.addEventListener("app:clicked-outside-job-content", outsideHandler as EventListener);
});

onUnmounted(() => {
  if (globalMarqueeBlocker && globalMarqueeBlocker.parentElement) {
    globalMarqueeBlocker.parentElement.removeChild(globalMarqueeBlocker);
    globalMarqueeBlocker = null;
  }
  if (globalClickHandler) {
    window.removeEventListener("click", globalClickHandler);
    globalClickHandler = null;
  }
  if (globalOutsideClickHandler) {
    window.removeEventListener("click", globalOutsideClickHandler);
    globalOutsideClickHandler = null;
  }
  window.removeEventListener("app:clicked-outside-job-content", (() => {}) as EventListener);
});

// Programmatic setter so parents can toggle active state. Log for debugging.
const setActive = (val: boolean) => {
  try {
    logFocus("FileTable", `setActive called with val=${val}, allowActivation=${allowActivation.value}`, {
      jobId: props.jobId,
      currentIsActive: isActive.value,
      allowActivation: allowActivation.value
    });
    
    if (!allowActivation.value) {
      // ignore attempts to activate when activatable is false
      logFocus("FileTable", "setActive ignored - activation not allowed");
      return;
    }
    const prev = isActive.value;
    isActive.value = !!val;
    
    logFocus("FileTable", `setActive completed -> ${isActive.value} (was ${prev})`, {
      jobId: props.jobId,
      previousValue: prev,
      newValue: isActive.value
    });
    
    // log lifecycle/state change
    try {
      // prefer logLifecycle (component state changes)
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { logLifecycle } = require("@/utils/loggers");
      logLifecycle("FileTable", `setActive called -> ${isActive.value} (was ${prev})`, {
        jobId: props.jobId,
      });
    } catch (e) {
      // fallback console
      // eslint-disable-next-line no-console
      console.log(`FileTable.setActive: job=${props.jobId} -> ${isActive.value} (was ${prev})`);
    }
  } catch (err) {
    logFocus("FileTable", `setActive error: ${err}`, { error: err });
    // ignore
  }
};

defineExpose({
  deselectAll,
  toggleAll,
  selectedFiles,
  setActive,
  isClosingContextMenu,
});

// Watch isActive to add/remove the visual class only when activation allowed
watch(
  () => isActive.value,
  (val) => {
    const root = fileTableCompRef.value;
    if (!root) return;
    
    logFocus("FileTable", `isActive watcher triggered: val=${val}, allowActivation=${allowActivation.value}`, {
      jobId: props.jobId,
      hasRoot: !!root,
      currentClasses: root.className
    });
    
    if (allowActivation.value) {
      if (val) {
        root.classList.add("is-active");
        logFocus("FileTable", "Added is-active class", { jobId: props.jobId });
      } else {
        root.classList.remove("is-active");
        logFocus("FileTable", "Removed is-active class", { jobId: props.jobId });
      }
    } else {
      // ensure class removed if activation disabled
      root.classList.remove("is-active");
      logFocus("FileTable", "Removed is-active class (activation disabled)", { jobId: props.jobId });
    }
  }
);

// Watch drag state to reactivate file table when drag operations end
watch(
  () => dragDropStore.isInternalDragActive,
  (isDragActive, wasDragActive) => {
    // When drag operation ends (was active, now inactive), reactivate the file table
    if (wasDragActive && !isDragActive && props.jobId === jobsStore.selectedJobId) {
      nextTick(() => {
        setActive(true);
      });
    }
  }
);

// Watch focus changes for logging
watch(
  () => focusedRowIndex.value,
  (newFocusIndex, oldFocusIndex) => {
    if (newFocusIndex !== oldFocusIndex) {
      const focusedFile = newFocusIndex !== null ? sortedFiles.value[newFocusIndex] : null;
      logFocus("FileTable", `Focus changed: ${oldFocusIndex} -> ${newFocusIndex}`, {
        jobId: props.jobId,
        fileName: focusedFile?.name,
        filePath: focusedFile?.path,
        oldFocusIndex,
        newFocusIndex,
        checkboxMode: userPreferencesStore.checkboxMode,
        autoCheckOnSelect: userPreferencesStore.autoCheckOnSelect
      });
    }
  }
);

// Handle keyboard navigation
const handleKeyDown = (event: KeyboardEvent) => {
  if (!isActive.value || sortedFiles.value.length === 0) return;

  switch (event.key) {
    case 'ArrowUp':
      event.preventDefault();
      if (focusedRowIndex.value !== null && focusedRowIndex.value > 0) {
        const newIndex = focusedRowIndex.value - 1;
        focusedRowIndex.value = newIndex;
        logFocus("FileTable", `Arrow Up: Focus moved to row ${newIndex}`, {
          jobId: props.jobId,
          fileName: sortedFiles.value[newIndex]?.name,
          filePath: sortedFiles.value[newIndex]?.path,
          checkboxMode: userPreferencesStore.checkboxMode,
          autoCheckOnSelect: userPreferencesStore.autoCheckOnSelect
        });
        
        // Directory Opus behavior: 
        // - Without Ctrl: deselect all, then select the newly focused row
        // - With Ctrl: only move focus, don't affect selection
        if (!event.ctrlKey && !event.metaKey) {
          // Deselect all files
          if (selectedFiles.value.length > 0) {
            selectedFiles.value = [];
                      logFocus("FileTable", "Arrow Up: Deselected all files", {
            jobId: props.jobId,
            previousSelectionCount: selectedFiles.value.length,
            checkboxMode: userPreferencesStore.checkboxMode,
            autoCheckOnSelect: userPreferencesStore.autoCheckOnSelect
          });
          }
          
          // Select the newly focused row
          const focusedFile = sortedFiles.value[newIndex];
          if (focusedFile) {
            selectedFiles.value = [focusedFile.path];
            logFocus("FileTable", "Arrow Up: Selected newly focused row", {
              jobId: props.jobId,
              fileName: focusedFile.name,
              filePath: focusedFile.path,
              checkboxMode: userPreferencesStore.checkboxMode,
              autoCheckOnSelect: userPreferencesStore.autoCheckOnSelect
            });
          }
        } else {
          // Ctrl/Cmd + Arrow: only move focus, don't affect selection
          logFocus("FileTable", "Ctrl+Arrow Up: Only moved focus, selection unchanged", {
            jobId: props.jobId,
            fileName: sortedFiles.value[newIndex]?.name,
            filePath: sortedFiles.value[newIndex]?.path,
            checkboxMode: userPreferencesStore.checkboxMode,
            autoCheckOnSelect: userPreferencesStore.autoCheckOnSelect
          });
        }
      } else if (focusedRowIndex.value === null) {
        focusedRowIndex.value = sortedFiles.value.length - 1;
        logFocus("FileTable", `Arrow Up: Focus moved to last row ${focusedRowIndex.value}`, {
          jobId: props.jobId,
          fileName: sortedFiles.value[focusedRowIndex.value]?.name,
          checkboxMode: userPreferencesStore.checkboxMode,
          autoCheckOnSelect: userPreferencesStore.autoCheckOnSelect
        });
      }
      break;
    case 'ArrowDown':
      event.preventDefault();
      if (focusedRowIndex.value !== null && focusedRowIndex.value < sortedFiles.value.length - 1) {
        const newIndex = focusedRowIndex.value + 1;
        focusedRowIndex.value = newIndex;
        logFocus("FileTable", `Arrow Down: Focus moved to row ${newIndex}`, {
          jobId: props.jobId,
          fileName: sortedFiles.value[newIndex]?.name,
          filePath: sortedFiles.value[newIndex]?.path,
          checkboxMode: userPreferencesStore.checkboxMode,
          autoCheckOnSelect: userPreferencesStore.autoCheckOnSelect
        });
        
        // Directory Opus behavior: 
        // - Without Ctrl: deselect all, then select the newly focused row
        // - With Ctrl: only move focus, don't affect selection
        if (!event.ctrlKey && !event.metaKey) {
          // Deselect all files
          if (selectedFiles.value.length > 0) {
            selectedFiles.value = [];
                      logFocus("FileTable", "Arrow Down: Deselected all files", {
            jobId: props.jobId,
            previousSelectionCount: selectedFiles.value.length,
            checkboxMode: userPreferencesStore.checkboxMode,
            autoCheckOnSelect: userPreferencesStore.autoCheckOnSelect
          });
          }
          
          // Select the newly focused row
          const focusedFile = sortedFiles.value[newIndex];
          if (focusedFile) {
            selectedFiles.value = [focusedFile.path];
            logFocus("FileTable", "Arrow Down: Selected newly focused row", {
              jobId: props.jobId,
              fileName: focusedFile.name,
              filePath: focusedFile.path,
              checkboxMode: userPreferencesStore.checkboxMode,
              autoCheckOnSelect: userPreferencesStore.autoCheckOnSelect
            });
          }
        } else {
          // Ctrl/Cmd + Arrow: only move focus, don't affect selection
          logFocus("FileTable", "Ctrl+Arrow Down: Only moved focus, selection unchanged", {
            jobId: props.jobId,
            fileName: sortedFiles.value[newIndex]?.name,
            filePath: sortedFiles.value[newIndex]?.path,
            checkboxMode: userPreferencesStore.checkboxMode,
            autoCheckOnSelect: userPreferencesStore.autoCheckOnSelect
          });
        }
      } else if (focusedRowIndex.value === null) {
        focusedRowIndex.value = 0;
        logFocus("FileTable", `Arrow Down: Focus moved to first row ${focusedRowIndex.value}`, {
          jobId: props.jobId,
          fileName: sortedFiles.value[focusedRowIndex.value]?.name,
          checkboxMode: userPreferencesStore.checkboxMode,
          autoCheckOnSelect: userPreferencesStore.autoCheckOnSelect
        });
      }
      break;
    case 'Enter':
      event.preventDefault();
      if (focusedRowIndex.value !== null) {
        const focusedFile = sortedFiles.value[focusedRowIndex.value];
        if (focusedFile) {
          const focusedPath = focusedFile.path;
          if (event.shiftKey) {
            // Shift+Enter: add to selection
            if (!selectedFiles.value.includes(focusedPath)) {
              selectedFiles.value.push(focusedPath);
              logFocus("FileTable", `Shift+Enter: Added file to selection`, {
                jobId: props.jobId,
                fileName: focusedFile.name,
                filePath: focusedPath,
                newSelectionCount: selectedFiles.value.length,
                checkboxMode: userPreferencesStore.checkboxMode,
                autoCheckOnSelect: userPreferencesStore.autoCheckOnSelect
              });
            }
          } else {
            // Enter: select only this file
            selectedFiles.value = [focusedPath];
            logFocus("FileTable", `Enter: Selected single file`, {
              jobId: props.jobId,
              fileName: focusedFile.name,
              filePath: focusedPath,
              checkboxMode: userPreferencesStore.checkboxMode,
              autoCheckOnSelect: userPreferencesStore.autoCheckOnSelect
            });
          }
        }
      }
      break;
    case ' ':
      // Spacebar: check/uncheck files when auto check is disabled and files are selected
      if (userPreferencesStore.checkboxMode && !userPreferencesStore.autoCheckOnSelect && selectedFiles.value.length > 0) {
        event.preventDefault();
        
        // Toggle checkbox state for all selected files
        const selectedSet = new Set(selectedFiles.value);
        const checkedSet = new Set(checkedFiles.value);
        
        // If all selected files are checked, uncheck them; otherwise check them
        const allSelectedAreChecked = selectedFiles.value.every(file => checkedSet.has(file));
        
        if (allSelectedAreChecked) {
          // Uncheck all selected files
          checkedFiles.value = checkedFiles.value.filter(file => !selectedSet.has(file));
          logFocus("FileTable", "Spacebar: Unchecked all selected files", {
            jobId: props.jobId,
            selectedCount: selectedFiles.value.length,
            checkboxMode: userPreferencesStore.checkboxMode,
            autoCheckOnSelect: userPreferencesStore.autoCheckOnSelect
          });
        } else {
          // Check all selected files
          selectedFiles.value.forEach(file => {
            if (!checkedSet.has(file)) {
              checkedFiles.value.push(file);
            }
          });
          logFocus("FileTable", "Spacebar: Checked all selected files", {
            jobId: props.jobId,
            selectedCount: selectedFiles.value.length,
            checkboxMode: userPreferencesStore.checkboxMode,
            autoCheckOnSelect: userPreferencesStore.autoCheckOnSelect
          });
        }
      } else {
        // Spacebar: no action when auto check is enabled or no files selected
        logFocus("FileTable", "Spacebar pressed: No action", {
          jobId: props.jobId,
          focusedRowIndex: focusedRowIndex.value,
          checkboxMode: userPreferencesStore.checkboxMode,
          autoCheckOnSelect: userPreferencesStore.autoCheckOnSelect,
          selectedCount: selectedFiles.value.length
        });
      }
      break;
  }
};

// Reserve space for the loading backdrop so dialogs/modals don't jump
// Use the same height as the table would have if loaded
// This is now handled by loadingBackdropStyle
// const loadingBackdropStyle = computed(() => {
//   const minHeight = Math.max(ROW_HEIGHT * (props.files?.length || 1) + 34, 120);
//   return {
//     minHeight: `${minHeight}px`,
//   };
// });
</script>

<style scoped src="./file-table-comp/file-table.scoped.css"></style>
