<!-- eslint-disable vue/html-self-closing @preserve -->
<!-- components/FileTable.vue @preserve -->
<!--
  Description:
  A table component for displaying and managing files in a job. Supports multi-select, context menus, and native HTML5 drag-and-drop for moving or copying selected files to other jobs, initiated only from the file name text. Dragging handles multi-selection if the dragged item is selected, or single item otherwise. Sorting prioritizes folders over files, both alphabetically.
  Usage Example:
  <FileTable
    :job-id="activeJob.id"
    :files="activeJob.files"
    :is-dragging="isDragging"
    :cut-files="cutFiles"
    :cut-source-job-id="cutSourceJobId"
    @remove-files="confirmRemoveFiles"
    @move-files="confirmMoveFiles"
    @move-to-new-job="confirmMoveToNewJob"
    @copy-files="confirmCopyFiles"
    @copy-to-new-job="confirmCopyToNewJob"
    @selection-changed="handleSelectionChange"
  />
-->
<template>
  <div
    ref="fileTableCompRef"
    class="file-table-comp"
    :class="{ 'is-dragging': isDragging || dragDropStore.isInternalDragActive, 'is-active': isActive }"
    data-component-name="FileTable"
    @mousedown="handleComponentMouseDown"
    @click="isActive = true"
  >
    <div class="file-table-visual-select" />
    <ToolBar v-if="props.showToolbar" class="file-table-toolbar">
      <template #start>
        <DropdownMenu
          button-style-class="trans-btn"
          dropdown-data-name="add-files-and-folders-dropdown"
          first-icon-name="mdi:add"
          :first-icon-size="20"
          last-icon-name="mdi:chevron-down"
          :last-icon-size="20"
        >
          <template #button-content> Add... </template>
          <template #default="{ close }">
            <CustomButton
              button-style-class="trans-btn"
              first-icon-name="mdi:file-outline"
              :first-icon-size="20"
              data-name="add-files-btn"
              @click="handleAddFile(close)"
            >
              Add File
            </CustomButton>
            <CustomButton
              button-style-class="trans-btn"
              first-icon-name="mdi:folder"
              :first-icon-size="20"
              data-name="add-folders-btn"
              @click="handleAddFolder(close)"
            >
              Add Folder
            </CustomButton>
          </template>
        </DropdownMenu>

        <CustomButton
          button-style-class="trans-btn"
          data-btn-theme="danger"
          data-name="remove-selected-files-btn"
          :disabled="selectedFiles.length === 0"
          first-icon-name="mdi:remove"
          :first-icon-size="20"
          @click="removeSelectedFiles"
        >
          Remove Selected
        </CustomButton>
        <DropdownMenu
          button-style-class="trans-btn"
          dropdown-data-name="move-to-job-dropdown"
          :disabled="selectedFiles.length === 0"
          first-icon-name="mdi:arrow-right"
          :first-icon-size="20"
          last-icon-name="mdi:chevron-down"
          :last-icon-size="20"
          placement="bottom-start"
        >
          <template #button-content> Move to </template>
          <template #default="{ close }">
            <CustomButton
              v-for="job in jobs.filter((j: Job) => j.id !== props.jobId)"
              :key="job.id"
              button-style-class="trans-btn"
              :data-name="`move-to-job-${job.id}-btn`"
              first-icon-name="mdi:briefcase"
              :first-icon-size="20"
              @click="
                () => {
                  moveToJob(job.id);
                  close();
                }
              "
            >
              Job {{ job.id }}
            </CustomButton>
          </template>
          <template #content-bottom="{ close }">
            <hr v-if="jobs.filter((j) => j.id !== props.jobId).length > 0" />
            <CustomButton
              button-style-class="trans-btn"
              data-name="move-to-new-job-btn"
              first-icon-name="mdi:plus"
              :first-icon-size="20"
              @click="
                () => {
                  moveToNewJob();
                  close();
                }
              "
            >
              New Job
            </CustomButton>
            <hr />
            <CustomButton
              button-style-class="trans-btn btn-lite"
              data-name="cancel-move-to-btn"
              first-icon-name="mdi:cancel"
              :first-icon-size="20"
              shortcut-text="Esc"
              @click="close()"
            >
              Cancel
            </CustomButton>
          </template>
        </DropdownMenu>
        <DropdownMenu
          button-style-class="trans-btn"
          dropdown-data-name="copy-to-job-dropdown"
          :disabled="selectedFiles.length === 0"
          first-icon-name="mdi:content-copy"
          :first-icon-size="20"
          last-icon-name="mdi:chevron-down"
          :last-icon-size="20"
          placement="bottom-start"
        >
          <template #button-content> Copy to </template>
          <template #default="{ close }">
            <CustomButton
              v-for="job in jobs.filter((j: Job) => j.id !== props.jobId)"
              :key="job.id"
              button-style-class="trans-btn"
              :data-name="`copy-to-job-${job.id}-btn`"
              first-icon-name="mdi:briefcase"
              :first-icon-size="20"
              @click="
                () => {
                  copyToJob(job.id);
                  close();
                }
              "
            >
              Job {{ job.id }}
            </CustomButton>
          </template>
          <template #content-bottom="{ close }">
            <hr v-if="jobs.filter((j) => j.id !== props.jobId).length > 0" />
            <CustomButton
              button-style-class="trans-btn"
              data-name="copy-to-new-job-btn"
              first-icon-name="mdi:plus"
              :first-icon-size="20"
              @click="
                () => {
                  copyToNewJob();
                  close();
                }
              "
            >
              New Job
            </CustomButton>
            <hr />
            <CustomButton
              button-style-class="trans-btn btn-lite"
              data-name="cancel-copy-to-btn"
              first-icon-name="mdi:cancel"
              :first-icon-size="20"
              shortcut-text="Esc"
              @click="close()"
            >
              Cancel
            </CustomButton>
          </template>
        </DropdownMenu>
      </template>
    </ToolBar>
    <div ref="scrollWrapperRef" class="table-scroll-wrapper">
      <div v-if="uiStore.marqueeBox.visible" class="selection-box" :style="marqueeBoxStyle" />
      <table v-if="files.length > 0" ref="fileTableRef" class="file-table">
        <thead :class="{ 'sticky-header': props.fixedHeaders }">
          <tr>
            <th v-if="props.showCheckboxes" class="item-checkbox" style="width: 30px">
              <div class="cell-content">
                <CustomButton
                  button-style-class="minimal-trans-btn"
                  data-name="select-all-files-checkbox"
                  role="checkbox"
                  :aria-checked="allSelected ? 'true' : 'false'"
                  @click="toggleAll"
                >
                  <Icon :name="allSelected ? 'mdi:checkbox-marked' : 'mdi:checkbox-blank-outline'" size="16" />
                </CustomButton>
              </div>
            </th>
            <th class="item-name">
              <div class="cell-content">Name ↑</div>
            </th>
            <th class="item-size" :style="{ width: `${columnWidths.size}px` }">
              <div class="cell-content">Size</div>
              <div class="resizer" @mousedown.stop="startResize($event, 'size')"></div>
            </th>
            <th class="item-type" :style="{ width: `${columnWidths.type}px` }">
              <div class="cell-content">Type</div>
              <div class="resizer" @mousedown.stop="startResize($event, 'type')"></div>
            </th>
            <th class="item-parent-path" :style="{ width: `${columnWidths.parentPath}px` }">
              <div class="cell-content">Parent Folder Path</div>
              <div class="resizer" @mousedown.stop="startResize($event, 'parentPath')"></div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="file in sortedFiles"
            :key="file.path"
            class="file-row"
            :class="{
              selected: selectedFiles.includes(file.path),
              'is-cut': cutFiles.includes(file.path) && jobId === cutSourceJobId,
            }"
            :data-path="file.path"
            data-has-context-menu="true"
            @contextmenu.prevent="showFileContextMenu(file, $event)"
          >
            <td v-if="props.showCheckboxes" class="item-checkbox">
              <div class="cell-content">
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
            </td>
            <td class="item-name">
              <div class="cell-content">
                <div
                  class="item-name-content"
                  :draggable="props.itemDragEnabled"
                  @dragstart="handleDragStart($event, file.path)"
                  @dragend="handleDragEnd"
                >
                  <Icon :name="file.type === 'Folder' ? 'mdi:folder' : 'mdi:file-outline'" size="16" />
                  <div class="item-name-text">
                    {{ file.name }}
                  </div>
                </div>
                <div v-if="props.showRowActions" class="row-actions" @click.stop>
                  <DropdownMenu
                    :ref="(el) => setFileMenuRef(file, el)"
                    :button-style-class="'trans-btn'"
                    :dropdown-data-name="`file-actions-${file.path}`"
                    :first-icon-name="''"
                    :last-icon-name="'mdi:dots-horizontal'"
                    :last-icon-size="20"
                    placement="bottom-start"
                  >
                    <template #default="{ close: closeMain }">
                      <CustomButton
                        button-style-class="trans-btn"
                        data-btn-theme="danger"
                        :data-name="`remove-file-${file.path}-btn`"
                        first-icon-name="mdi:trash-can-outline"
                        :first-icon-size="20"
                        shortcut-text="Del"
                        @click="
                          () => {
                            removeFile(file.path);
                            closeMain();
                          }
                        "
                      >
                        Remove
                      </CustomButton>
                      <hr />
                      <DropdownMenu
                        :button-style-class="'trans-btn'"
                        :dropdown-data-name="`move-file-${file.path}-submenu`"
                        :first-icon-name="'mdi:arrow-right'"
                        :first-icon-size="20"
                        :is-submenu="true"
                        :last-icon-name="'mdi:chevron-right'"
                        :last-icon-size="20"
                        placement="right-start"
                      >
                        <template #button-content>Move to</template>
                        <template #default="{ close: closeSub }">
                          <CustomButton
                            v-for="job in jobs.filter((j: Job) => j.id !== props.jobId)"
                            :key="job.id"
                            button-style-class="trans-btn"
                            :data-name="`move-file-${file.path}-to-job-${job.id}-btn`"
                            first-icon-name="mdi:briefcase"
                            :first-icon-size="20"
                            @click="
                              () => {
                                moveFile(job.id, file.path);
                                closeSub();
                                closeMain();
                              }
                            "
                          >
                            Job {{ job.id }}
                          </CustomButton>
                        </template>
                        <template #content-bottom="{ close: closeSub }">
                          <hr v-if="jobs.filter((j) => j.id !== props.jobId).length > 0" />
                          <CustomButton
                            button-style-class="trans-btn"
                            data-name="move-to-new-job-btn"
                            first-icon-name="mdi:plus"
                            :first-icon-size="20"
                            @click="
                              () => {
                                moveFileToNewJob(file.path);
                                closeSub();
                                closeMain();
                              }
                            "
                          >
                            New Job
                          </CustomButton>
                        </template>
                      </DropdownMenu>
                      <DropdownMenu
                        :button-style-class="'trans-btn'"
                        :dropdown-data-name="`copy-file-${file.path}-submenu`"
                        :first-icon-name="'mdi:content-copy'"
                        :first-icon-size="20"
                        :is-submenu="true"
                        :last-icon-name="'mdi:chevron-right'"
                        :last-icon-size="20"
                        placement="right-start"
                      >
                        <template #button-content>Copy to</template>
                        <template #default="{ close: closeSub }">
                          <CustomButton
                            v-for="job in jobs.filter((j: Job) => j.id !== props.jobId)"
                            :key="job.id"
                            button-style-class="trans-btn"
                            :data-name="`copy-file-${file.path}-to-job-${job.id}-btn`"
                            first-icon-name="mdi:briefcase"
                            :first-icon-size="20"
                            @click="
                              () => {
                                copyFile(job.id, file.path);
                                closeSub();
                                closeMain();
                              }
                            "
                          >
                            Job {{ job.id }}
                          </CustomButton>
                        </template>
                        <template #content-bottom="{ close: closeSub }">
                          <hr v-if="jobs.filter((j) => j.id !== props.jobId).length > 0" />
                          <CustomButton
                            button-style-class="trans-btn"
                            data-name="copy-to-new-job-btn"
                            first-icon-name="mdi:plus"
                            :first-icon-size="20"
                            @click="
                              () => {
                                copyFileToNewJob(file.path);
                                closeSub();
                                closeMain();
                              }
                            "
                          >
                            New Job
                          </CustomButton>
                        </template>
                      </DropdownMenu>
                      <hr />
                      <CustomButton
                        button-style-class="trans-btn btn-lite"
                        :data-name="`cut-file-${file.path}-btn`"
                        first-icon-name="mdi:content-cut"
                        :first-icon-size="20"
                        shortcut-text="Ctrl+X"
                        @click="
                          () => {
                            clipboardStore.cut([file], jobId);
                            closeMain();
                          }
                        "
                      >
                        Cut
                      </CustomButton>
                      <CustomButton
                        button-style-class="trans-btn btn-lite"
                        :data-name="`copy-file-${file.path}-btn`"
                        first-icon-name="mdi:content-copy"
                        :first-icon-size="20"
                        shortcut-text="Ctrl+C"
                        @click="
                          () => {
                            clipboardStore.copy([file], jobId);
                            closeMain();
                          }
                        "
                      >
                        Copy
                      </CustomButton>
                      <CustomButton
                        button-style-class="trans-btn btn-lite"
                        :data-name="`paste-file-${file.path}-btn`"
                        first-icon-name="mdi:content-paste"
                        :first-icon-size="20"
                        shortcut-text="Ctrl+V"
                        :disabled="!clipboardStore.hasClipboardItems()"
                        @click="
                          () => {
                            if (clipboardStore.isCut) {
                              moveFile(jobId, file.path); // Placeholder for move on paste
                            } else {
                              copyFile(jobId, file.path); // Placeholder for copy on paste
                            }
                            closeMain();
                          }
                        "
                      >
                        Paste
                      </CustomButton>
                      <hr />
                      <CustomButton
                        button-style-class="trans-btn btn-lite"
                        :data-name="`cancel-file-action-${file.path}-btn`"
                        first-icon-name="mdi:cancel"
                        :first-icon-size="20"
                        shortcut-text="Esc"
                        @click="closeMain()"
                      >
                        Cancel
                      </CustomButton>
                    </template>
                  </DropdownMenu>
                </div>
              </div>
            </td>
            <td class="item-size">
              <div class="cell-content">{{ file.size }} bytes</div>
            </td>
            <td class="item-type">
              <div class="cell-content">{{ file.type }}</div>
            </td>
            <td class="item-parent-path">
              <div class="cell-content">{{ file.parentPath }}</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUpdate, reactive, onUnmounted, onMounted, nextTick } from "vue";
import { useDragDropStore } from "@/stores/dragDropStore";
import { useUiStore } from "@/stores/uiStore";
import type { FileItem } from "@/types/types";
import DropdownMenu from "./DropdownMenu.vue";
import { logDragDropEvent } from "@/utils/loggers";
import { useJobsStore, type Job } from "@/stores/jobsStore";
import { useClipboardStore } from "@/stores/clipboardStore";
import { open } from "@tauri-apps/plugin-dialog";

interface FileGeometry {
  path: string;
  top: number;
  bottom: number;
  left: number;
  right: number;
}

const props = withDefaults(
  defineProps<{
    jobId: number;
    files: FileItem[];
    isDragging: boolean;
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
]);

const jobsStore = useJobsStore();
const dragDropStore = useDragDropStore();
const clipboardStore = useClipboardStore();
const uiStore = useUiStore();
const fileTableRef = ref<HTMLTableElement | null>(null);
const scrollWrapperRef = ref<HTMLElement | null>(null);
const fileTableCompRef = ref<HTMLElement | null>(null);
const fileMenuRefs = ref(new Map<string, InstanceType<typeof DropdownMenu>>());
const selectedFiles = ref<string[]>([]);
const lastClickedIndex = ref<number | null>(null);
const isActive = ref<boolean>(false);

const jobs = computed(() => jobsStore.jobs);

const marqueeBoxStyle = computed(() => ({
  transform: `translate(${uiStore.marqueeBox.x}px, ${uiStore.marqueeBox.y}px)`,
  width: `${uiStore.marqueeBox.width}px`,
  height: `${uiStore.marqueeBox.height}px`,
}));

const isMarqueeActive = ref(false);
const marqueeAnchorX = ref(0);
const marqueeAnchorY = ref(0);
const fileGeometries = ref<FileGeometry[]>([]);
let autoScrollInterval: number | null = null;

const handleComponentMouseDown = (event: MouseEvent) => {
  if (!props.marqueeSelectionEnabled || event.button !== 0) return;

  const targetElement = event.target as Element;
  const scrollWrapper = scrollWrapperRef.value;
  if (!scrollWrapper || !scrollWrapper.contains(targetElement)) {
    return;
  }

  // **FIX**: Only treat clicks on `.item-name-content` as a row selection action.
  // Any other click on the row or empty space can start a marquee.
  if (targetElement.closest(".item-name-content")) {
    const parentRow = targetElement.closest(".file-row");
    const path = parentRow?.getAttribute("data-path");
    if (path) {
      clickRowByPath(event, path);
    }
    return;
  }

  // Prevent marquee on other specific interactive elements
  const isInteractiveElement = targetElement.closest("button, a, input, select, textarea, .dropdown-content, .resizer");
  if (isInteractiveElement) {
    return;
  }

  // If we've reached here, it's a valid marquee start.
  event.preventDefault();
  isMarqueeActive.value = true;

  const scrollWrapperBounds = scrollWrapper.getBoundingClientRect();
  marqueeAnchorX.value = event.clientX - scrollWrapperBounds.left;
  marqueeAnchorY.value = event.clientY - scrollWrapperBounds.top + scrollWrapper.scrollTop;

  cacheFileGeometries();

  window.addEventListener("mousemove", handleMarqueeMouseMove);
  window.addEventListener("mouseup", handleMarqueeMouseUp);
};

const handleMarqueeMouseMove = (event: MouseEvent) => {
  if (!isMarqueeActive.value) return;

  const scrollWrapper = scrollWrapperRef.value;
  if (!scrollWrapper) return;

  const scrollWrapperBounds = scrollWrapper.getBoundingClientRect();
  const mouseX_viewport = event.clientX;
  const mouseY_viewport = event.clientY;

  const hotZoneSize = 50;
  if (mouseY_viewport < scrollWrapperBounds.top + hotZoneSize) {
    startAutoScroll(-10);
  } else if (mouseY_viewport > scrollWrapperBounds.bottom - hotZoneSize) {
    startAutoScroll(10);
  } else {
    stopAutoScroll();
  }

  const mouseX_content = mouseX_viewport - scrollWrapperBounds.left;
  const mouseY_content = mouseY_viewport - scrollWrapperBounds.top + scrollWrapper.scrollTop;

  const x = Math.min(marqueeAnchorX.value, mouseX_content);
  const y = Math.min(marqueeAnchorY.value, mouseY_content);
  const width = Math.abs(mouseX_content - marqueeAnchorX.value);
  const height = Math.abs(mouseY_content - marqueeAnchorY.value);

  uiStore.marqueeBox.visible = true;
  uiStore.marqueeBox.x = x;
  uiStore.marqueeBox.y = y;
  uiStore.marqueeBox.width = width;
  uiStore.marqueeBox.height = height;

  updateSelectionByRect(event.ctrlKey || event.metaKey);
};

const handleMarqueeMouseUp = () => {
  isMarqueeActive.value = false;
  uiStore.marqueeBox.visible = false;
  stopAutoScroll();
  fileGeometries.value = [];
  window.removeEventListener("mousemove", handleMarqueeMouseMove);
  window.removeEventListener("mouseup", handleMarqueeMouseUp);
};

const cacheFileGeometries = () => {
  const table = fileTableRef.value;
  const scrollWrapper = scrollWrapperRef.value;
  if (!table || !scrollWrapper) return;

  const scrollWrapperBounds = scrollWrapper.getBoundingClientRect();
  const scrollTop = scrollWrapper.scrollTop;
  const geometries: FileGeometry[] = [];

  // **FIX**: Get all name elements at once for performance.
  const nameElements = table.querySelectorAll("tbody tr.file-row .item-name-content");

  nameElements.forEach((nameElement) => {
    const row = nameElement.closest(".file-row");
    if (row) {
      const path = (row as HTMLElement).dataset.path;
      if (path) {
        const nameRect = nameElement.getBoundingClientRect();
        geometries.push({
          path,
          top: nameRect.top - scrollWrapperBounds.top + scrollTop,
          bottom: nameRect.bottom - scrollWrapperBounds.top + scrollTop,
          left: nameRect.left - scrollWrapperBounds.left,
          right: nameRect.right - scrollWrapperBounds.left,
        });
      }
    }
  });
  fileGeometries.value = geometries;
};

const updateSelectionByRect = (isAdditive: boolean) => {
  const marqueeTop = uiStore.marqueeBox.y;
  const marqueeBottom = marqueeTop + uiStore.marqueeBox.height;
  const marqueeLeft = uiStore.marqueeBox.x;
  const marqueeRight = marqueeLeft + uiStore.marqueeBox.width;

  const pathsToSelect = fileGeometries.value
    .filter(
      (geom) => geom.bottom > marqueeTop && geom.top < marqueeBottom && geom.right > marqueeLeft && geom.left < marqueeRight
    )
    .map((geom) => geom.path);

  if (isAdditive) {
    const selectionSet = new Set([...selectedFiles.value, ...pathsToSelect]);
    selectedFiles.value = Array.from(selectionSet);
  } else {
    selectedFiles.value = pathsToSelect;
  }
};

const startAutoScroll = (speed: number) => {
  if (autoScrollInterval) return;
  autoScrollInterval = window.setInterval(() => {
    if (scrollWrapperRef.value) {
      scrollWrapperRef.value.scrollTop += speed;
      const lastEvent = new MouseEvent("mousemove", {
        clientX: (window.event as MouseEvent).clientX,
        clientY: (window.event as MouseEvent).clientY,
        ctrlKey: (window.event as MouseEvent).ctrlKey,
        metaKey: (window.event as MouseEvent).metaKey,
      });
      handleMarqueeMouseMove(lastEvent);
    }
  }, 16);
};

const stopAutoScroll = () => {
  if (autoScrollInterval) {
    clearInterval(autoScrollInterval);
    autoScrollInterval = null;
  }
};

const columnWidths = reactive({
  size: 100,
  type: 100,
  parentPath: 200,
});
const resizingColumn = ref<string | null>(null);
const startX = ref(0);
const startWidth = ref(0);

const startResize = (event: MouseEvent, column: "size" | "type" | "parentPath") => {
  resizingColumn.value = column;
  startX.value = event.clientX;
  startWidth.value = columnWidths[column];
  window.addEventListener("mousemove", doResize);
  window.addEventListener("mouseup", stopResize);
};

const doResize = (event: MouseEvent) => {
  if (resizingColumn.value) {
    const delta = event.clientX - startX.value;
    const newWidth = Math.max(50, startWidth.value + delta);
    columnWidths[resizingColumn.value as keyof typeof columnWidths] = newWidth;
  }
};

const stopResize = () => {
  resizingColumn.value = null;
  window.removeEventListener("mousemove", doResize);
  window.removeEventListener("mouseup", stopResize);
};

onBeforeUpdate(() => {
  fileMenuRefs.value.clear();
});

watch(
  selectedFiles,
  (newSelection) => {
    emit("selection-changed", newSelection);
  },
  { deep: true }
);

const setFileMenuRef = (file: FileItem, el: any) => {
  if (el) {
    fileMenuRefs.value.set(file.path, el);
  }
};

const showFileContextMenu = (file: FileItem, event: MouseEvent) => {
  if (!props.isSelectable) return;
  if (!selectedFiles.value.includes(file.path)) {
    selectedFiles.value = [file.path];
    const fileIndex = sortedFiles.value.findIndex((f) => f.path === file.path);
    if (fileIndex !== -1) {
      lastClickedIndex.value = fileIndex;
    }
  }
  const menuRef = fileMenuRefs.value.get(file.path);
  menuRef?.openDropdown({ x: event.clientX, y: event.clientY });
};

const allSelected = computed(() => {
  return props.files.length > 0 && selectedFiles.value.length === props.files.length;
});

const toggleFileSelection = (path: string) => {
  if (!props.isSelectable) return;
  const selectedIndex = selectedFiles.value.indexOf(path);
  if (selectedIndex > -1) {
    selectedFiles.value.splice(selectedIndex, 1);
  } else {
    selectedFiles.value.push(path);
  }
  const fileIndex = sortedFiles.value.findIndex((f) => f.path === path);
  if (fileIndex !== -1) {
    lastClickedIndex.value = fileIndex;
  }
};

const clickRowByPath = (event: MouseEvent, path: string) => {
  if (!props.isSelectable) return;

  const clickedIndex = sortedFiles.value.findIndex((f) => f.path === path);
  if (clickedIndex === -1) return;

  const isCtrlPressed = event.ctrlKey || event.metaKey;

  if (event.shiftKey && lastClickedIndex.value !== null) {
    const start = Math.min(lastClickedIndex.value, clickedIndex);
    const end = Math.max(lastClickedIndex.value, clickedIndex);
    const rangePaths = sortedFiles.value.slice(start, end + 1).map((f) => f.path);

    if (isCtrlPressed) {
      const selectionSet = new Set(selectedFiles.value);
      rangePaths.forEach((p) => selectionSet.add(p));
      selectedFiles.value = Array.from(selectionSet);
    } else {
      selectedFiles.value = rangePaths;
    }
  } else if (isCtrlPressed) {
    toggleFileSelection(path);
  } else {
    selectedFiles.value = [path];
  }
  lastClickedIndex.value = clickedIndex;
};

const toggleAll = (): void => {
  if (!props.isSelectable) return;
  if (allSelected.value) {
    selectedFiles.value = [];
  } else {
    selectedFiles.value = props.files.map((file) => file.path);
  }
  lastClickedIndex.value = null;
};

const deselectAll = () => {
  if (!props.isSelectable) return;
  selectedFiles.value = [];
  lastClickedIndex.value = null;
};

const handleDragStart = (event: DragEvent, path: string) => {
  if (!props.itemDragEnabled) {
    event.preventDefault();
    return;
  }
  let pathsToDrag: string[];

  if (selectedFiles.value.includes(path)) {
    pathsToDrag = [...selectedFiles.value];
  } else {
    selectedFiles.value = [path];
    pathsToDrag = [path];
  }

  if (event.dataTransfer) {
    event.dataTransfer.setData(
      "text/plain",
      JSON.stringify({ type: "internal-files", paths: pathsToDrag, sourceJobId: props.jobId })
    );
    event.dataTransfer.effectAllowed = "copyMove";
  }

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

const handleAddFile = async (close: () => void): Promise<void> => {
  close();
  const selected: string[] | null = await open({
    multiple: true,
    directory: false,
  });
  if (selected) {
    emit("add-files", selected);
  }
};

const handleAddFolder = async (close: () => void): Promise<void> => {
  close();
  const selected: string[] | null = await open({
    multiple: true,
    directory: true,
  });
  if (selected) {
    emit("add-folders", selected);
  }
};

const removeSelectedFiles = (): void => {
  emit("remove-files", selectedFiles.value);
};

const moveToJob = (targetJobId: number): void => {
  emit("move-files", { targetJobId, files: selectedFiles.value });
};

const moveToNewJob = (): void => {
  emit("move-to-new-job", selectedFiles.value);
};

const copyToJob = (targetJobId: number): void => {
  emit("copy-files", { targetJobId, files: selectedFiles.value });
};

const copyToNewJob = (): void => {
  emit("copy-to-new-job", selectedFiles.value);
};

const removeFile = (path: string): void => {
  emit("remove-files", [path]);
};

const moveFile = (targetJobId: number, path: string): void => {
  emit("move-files", { targetJobId, files: [path] });
};

const moveFileToNewJob = (path: string): void => {
  emit("move-to-new-job", [path]);
};

const copyFile = (targetJobId: number, path: string): void => {
  emit("copy-files", { targetJobId, files: [path] });
};

const copyFileToNewJob = (path: string): void => {
  emit("copy-to-new-job", [path]);
};

const sortedFiles = computed(() => {
  const filesCopy = [...props.files];
  const folders = filesCopy.filter((file) => file.type === "Folder");
  const filesOnly = filesCopy.filter((file) => file.type !== "Folder");
  const sortedFolders = folders.sort((a, b) => a.name.localeCompare(b.name));
  const sortedFilesOnly = filesOnly.sort((a, b) => a.name.localeCompare(b.name));
  return [...sortedFolders, ...sortedFilesOnly];
});

watch(
  () => props.files,
  (newFiles) => {
    selectedFiles.value = selectedFiles.value.filter((path) => newFiles.some((file) => file.path === path));
  },
  { deep: true }
);

onUnmounted(() => {
  stopAutoScroll();
  window.removeEventListener("mousemove", handleMarqueeMouseMove);
  window.removeEventListener("mouseup", handleMarqueeMouseUp);
});

defineExpose({
  deselectAll,
  toggleAll,
  selectedFiles,
});
</script>

<!-- Note: For component-specific styles, please edit the corresponding file: ./file-table-comp/file-table.scoped.css -->
<style scoped src="./file-table-comp/file-table.scoped.css"></style>
