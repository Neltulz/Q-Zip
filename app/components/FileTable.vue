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
    class="file-table-comp"
    :class="{ 'is-dragging': isDragging || dragDropStore.isInternalDragActive }"
    data-component-name="FileTable"
  >
    <ToolBar v-if="files.length >= 1" class="file-table-toolbar">
      <template #start>
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
            <hr />
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
            <hr />
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
          </template>
        </DropdownMenu>
      </template>
    </ToolBar>
    <div v-if="files.length <= 0" class="no-files-message">No files added yet.</div>
    <table v-else ref="fileTable" class="file-table">
      <thead>
        <tr>
          <th class="item-checkbox">
            <CustomButton
              button-style-class="minimal-trans-btn"
              data-name="select-all-files-checkbox"
              role="checkbox"
              :aria-checked="allSelected ? 'true' : 'false'"
              @click="toggleAll"
            >
              <Icon :name="allSelected ? 'mdi:checkbox-marked' : 'mdi:checkbox-blank-outline'" size="16" />
            </CustomButton>
          </th>
          <th class="item-name"><div class="cell-content">Name ↑</div></th>
          <th class="item-size"><div class="cell-content">Size</div></th>
          <th class="item-type"><div class="cell-content">Type</div></th>
          <th class="item-parent-path">
            <div class="cell-content">Parent Folder Path</div>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(file, index) in sortedFiles"
          :key="file.path"
          class="file-row"
          :class="{
            selected: selectedFiles.includes(file.path),
            'is-cut': cutFiles.includes(file.path) && jobId === cutSourceJobId,
          }"
          :data-path="file.path"
          data-has-context-menu="true"
          @click="clickRowByPath($event, file.path)"
          @contextmenu.prevent="showFileContextMenu(file, $event)"
        >
          <td class="item-checkbox">
            <CustomButton
              button-style-class="minimal-trans-btn"
              :data-name="`select-file-${index}-checkbox`"
              role="checkbox"
              :aria-checked="selectedFiles.includes(file.path) ? 'true' : 'false'"
              @click.stop="toggleFileSelection(file.path)"
            >
              <Icon :name="selectedFiles.includes(file.path) ? 'mdi:checkbox-marked' : 'mdi:checkbox-blank-outline'" size="16" />
            </CustomButton>
          </td>
          <td class="item-name">
            <div class="cell-content">
              <Icon :name="file.type === 'Folder' ? 'mdi:folder' : 'mdi:file-outline'" size="16" />
              <div
                class="item-name-text"
                draggable="true"
                @dragstart="handleDragStart($event, file.path)"
                @dragend="handleDragEnd"
              >
                {{ file.name }}
              </div>
              <div class="row-actions" @click.stop>
                <DropdownMenu
                  :ref="(el) => setFileMenuRef(file, el)"
                  :button-style-class="'trans-btn'"
                  :dropdown-data-name="`file-actions-${index}`"
                  :first-icon-name="''"
                  :last-icon-name="'mdi:dots-horizontal'"
                  :last-icon-size="20"
                  placement="bottom-start"
                >
                  <template #default="{ close: closeMain }">
                    <CustomButton
                      button-style-class="trans-btn"
                      data-btn-theme="danger"
                      :data-name="`remove-file-${index}-btn`"
                      first-icon-name="mdi:trash-can-outline"
                      :first-icon-size="20"
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
                      :dropdown-data-name="`move-file-${index}-submenu`"
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
                          :data-name="`move-file-${index}-to-job-${job.id}-btn`"
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
                        <hr />
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
                      :dropdown-data-name="`copy-file-${index}-submenu`"
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
                          :data-name="`copy-file-${index}-to-job-${job.id}-btn`"
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
                        <hr />
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
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUpdate, type ComponentPublicInstance } from "vue";
import { useJobsStore, type Job } from "@/stores/jobsStore";
import { useDragDropStore } from "@/stores/dragDropStore";
import type { FileItem } from "@/types/types";
import DropdownMenu from "./DropdownMenu.vue";
import { logDragDropEvent } from "@/utils/loggers";

interface SelectionBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

const props = defineProps<{
  jobId: number;
  files: FileItem[];
  isDragging: boolean;
  cutFiles: string[];
  cutSourceJobId: number | null;
}>();

const emit = defineEmits(["selection-changed", "remove-files", "move-files", "move-to-new-job", "copy-files", "copy-to-new-job"]);

const jobsStore = useJobsStore();
const dragDropStore = useDragDropStore();
const jobs = computed(() => jobsStore.jobs);

const selectedFiles = ref<string[]>([]);
const lastClickedIndex = ref<number | null>(null);
const fileTable = ref<HTMLElement | null>(null);
const fileMenuRefs = ref(new Map<string, InstanceType<typeof DropdownMenu>>());

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

watch(
  () => dragDropStore.isInternalDragActive,
  (isActive) => {
    if (!isActive) {
      logDragDropEvent("FileTable", "Internal drag ended (via store change).");
    }
  }
);

const setFileMenuRef = (file: FileItem, el: Element | ComponentPublicInstance | null) => {
  if (el && "$el" in el) {
    fileMenuRefs.value.set(file.path, el as InstanceType<typeof DropdownMenu>);
  }
};

const showFileContextMenu = (file: FileItem, event: MouseEvent) => {
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
    lastClickedIndex.value = clickedIndex;
  }
};

const updateSelectionByRect = (box: SelectionBox, isAdditive: boolean) => {
  const selectableItems = fileTable.value?.querySelectorAll(".file-row .item-name-text");
  const pathsToSelect: string[] = [];

  if (selectableItems) {
    const boxRect = {
      left: box.x,
      top: box.y,
      right: box.x + box.width,
      bottom: box.y + box.height,
    };

    selectableItems.forEach((itemEl: Element) => {
      const itemRect = itemEl.getBoundingClientRect();
      const rowEl = itemEl.closest(".file-row");
      const path = rowEl?.getAttribute("data-path");

      if (
        path &&
        boxRect.left < itemRect.right &&
        boxRect.right > itemRect.left &&
        boxRect.top < itemRect.bottom &&
        boxRect.bottom > itemRect.top
      ) {
        pathsToSelect.push(path);
      }
    });
  }

  let newSelection: string[];
  if (isAdditive) {
    const selectionSet = new Set([...selectedFiles.value, ...pathsToSelect]);
    newSelection = Array.from(selectionSet);
  } else {
    newSelection = pathsToSelect;
  }

  const currentSelection = selectedFiles.value;
  const hasChanged =
    newSelection.length !== currentSelection.length || !newSelection.every((path) => currentSelection.includes(path));

  if (hasChanged) {
    selectedFiles.value = newSelection;
  }

  lastClickedIndex.value = null;
};

const toggleAll = (): void => {
  if (allSelected.value) {
    selectedFiles.value = [];
  } else {
    selectedFiles.value = props.files.map((file) => file.path);
  }
  lastClickedIndex.value = null;
};

const deselectAll = () => {
  selectedFiles.value = [];
  lastClickedIndex.value = null;
};

const handleDragStart = (event: DragEvent, path: string) => {
  const paths: string[] = selectedFiles.value.includes(path) ? selectedFiles.value : [path];
  event.dataTransfer?.setData("text/plain", JSON.stringify({ type: "internal-files", paths, sourceJobId: props.jobId }));
  event.dataTransfer!.effectAllowed = "copyMove";

  const count = paths.length;

  const canvas = document.createElement("canvas");
  canvas.width = 150;
  canvas.height = 30;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "hsla(210, 100%, 50%, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "bold 0.9rem sans-serif";
    ctx.fillText(`${count} item(s)`, 10, 20);
    ctx.fillRect(5, 5, 20, 20);
  }

  event.dataTransfer?.setDragImage(canvas, -10, -10);

  dragDropStore.startInternalDrag(paths, null, props.jobId);
  logDragDropEvent("FileTable", `Native drag started for ${paths.length} files from job ${props.jobId}.`);
};

const handleDragEnd = () => {
  logDragDropEvent("FileTable", "Native drag ended.");
  // FIX: This is a failsafe. The `drop` event on the target fires *before* `dragend` on the source.
  // We use a timeout to push this check to the end of the event queue. If a valid drop target
  // has handled the drop, `isInternalDragActive` will be false by the time this runs.
  // If the drop was on an invalid target (or cancelled), the state will still be active,
  // and this will correctly clean it up.
  setTimeout(() => {
    if (dragDropStore.isInternalDragActive) {
      logDragDropEvent("FileTable", "Drag ended on an invalid target. Cleaning up state.");
      dragDropStore.endInternalDrag();
    }
  }, 50);
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
  emit("remove-files", path);
};

const moveFile = (targetJobId: number, path: string): void => {
  emit("move-files", { targetJobId, files: [path], rightClickedPath: path });
};

const moveFileToNewJob = (path: string): void => {
  emit("move-to-new-job", path);
};

const copyFile = (targetJobId: number, path: string): void => {
  emit("copy-files", { targetJobId, files: [path], rightClickedPath: path });
};

const copyFileToNewJob = (path: string): void => {
  emit("copy-to-new-job", path);
};

const sortedFiles = computed(() => {
  const folders = props.files.filter((file) => file.type === "Folder");
  const filesOnly = props.files.filter((file) => file.type !== "Folder");
  const sortedFolders = folders.sort((a, b) => a.name.localeCompare(b.name));
  const sortedFiles = filesOnly.sort((a, b) => a.name.localeCompare(b.name));
  return [...sortedFolders, ...sortedFiles];
});

watch(
  () => props.files,
  (newFiles) => {
    selectedFiles.value = selectedFiles.value.filter((path) => newFiles.some((file) => file.path === path));
  },
  { deep: true }
);

defineExpose({
  deselectAll,
  updateSelectionByRect,
  onFileClick: clickRowByPath,
  toggleAll,
  selectedFiles,
});
</script>

<style scoped>
@import "./file-table-comp/file-table.scoped.css";
</style>
