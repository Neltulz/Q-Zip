<template>
  <!-- FileTableContextMenu: Right-click context menu for file/folder actions -->
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
                  copyFileFromContext(job.id, file.path);
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
                  copyFileToNewJobFromContext(file.path);
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
                  moveFileFromContext(job.id, file.path);
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
                  moveFileToNewJobFromContext(file.path);
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
              performCutFor(file.path);
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
              performCopyFor(file.path);
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
                moveFile(jobId, file.path);
              } else {
                copyFile(jobId, file.path);
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
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { FileItem } from "@/types/types";
import DropdownMenu from "../DropdownMenu.vue";
import CustomButton from "../CustomButton.vue";
import { useJobsStore, type Job } from "@/stores/jobsStore";
import { useClipboardStore } from "@/stores/clipboardStore";

const props = defineProps<{
  file: FileItem;
  jobId: number;
  showRowActions?: boolean;
  selectedFiles: string[];
}>();

const emit = defineEmits([
  "remove-files",
  "move-files",
  "move-to-new-job",
  "copy-files",
  "copy-to-new-job",
  "selection-changed",
]);

const jobsStore = useJobsStore();
const clipboardStore = useClipboardStore();

const fileMenuRefs = ref(new Map<string, InstanceType<typeof DropdownMenu>>());

const jobs = computed(() => jobsStore.jobs);

const setFileMenuRef = (file: FileItem, el: any) => {
  if (el) {
    fileMenuRefs.value.set(file.path, el);
  }
};

const showFileContextMenu = (file: FileItem, event: MouseEvent) => {
  if (!props.selectedFiles.includes(file.path)) {
    emit("selection-changed", [file.path]);
  }
  const menuRef = fileMenuRefs.value.get(file.path);
  menuRef?.openDropdown({ x: event.clientX, y: event.clientY });
};

const performCopyFor = (pathOrPaths: string | string[]) => {
  const paths = Array.isArray(pathOrPaths)
    ? pathOrPaths
    : props.selectedFiles.includes(pathOrPaths) && props.selectedFiles.length > 0
    ? props.selectedFiles
    : [pathOrPaths];
  const filesToCopy: FileItem[] = paths
    .map((p) => jobsStore.jobs.find((j) => j.id === props.jobId)?.files.find((f) => f.path === p))
    .filter(Boolean) as FileItem[];
  clipboardStore.copy(filesToCopy, props.jobId);
};

const performCutFor = (pathOrPaths: string | string[]) => {
  const paths = Array.isArray(pathOrPaths)
    ? pathOrPaths
    : props.selectedFiles.includes(pathOrPaths) && props.selectedFiles.length > 0
    ? props.selectedFiles
    : [pathOrPaths];
  const filesToCut: FileItem[] = paths
    .map((p) => jobsStore.jobs.find((j) => j.id === props.jobId)?.files.find((f) => f.path === p))
    .filter(Boolean) as FileItem[];
  clipboardStore.cut(filesToCut, props.jobId);
};

const removeFile = (path: string): void => {
  emit("remove-files", path);
};

const moveFileFromContext = (targetJobId: number, pathOrPaths: string | string[]): void => {
  const paths = Array.isArray(pathOrPaths)
    ? pathOrPaths
    : props.selectedFiles.includes(pathOrPaths) && props.selectedFiles.length > 0
    ? props.selectedFiles
    : [pathOrPaths];
  
  // Add logging to debug the issue
  try {
    const { logStoreAction } = require("@/utils/loggers");
    logStoreAction("FileTableContextMenu", "moveFileFromContext called", { 
      targetJobId, 
      targetJobIdType: typeof targetJobId,
      pathOrPaths, 
      paths,
      selectedFiles: props.selectedFiles 
    });
  } catch (e) {
    console.log("FileTableContextMenu.moveFileFromContext", { 
      targetJobId, 
      targetJobIdType: typeof targetJobId,
      pathOrPaths, 
      paths 
    });
  }
  
  emit("move-files", { targetJobId, rightClickedPath: pathOrPaths });
};

const moveFileToNewJobFromContext = (pathOrPaths: string | string[]): void => {
  const paths = Array.isArray(pathOrPaths)
    ? pathOrPaths
    : props.selectedFiles.includes(pathOrPaths) && props.selectedFiles.length > 0
    ? props.selectedFiles
    : [pathOrPaths];
  emit("move-to-new-job", paths);
};

const copyFileFromContext = (targetJobId: number, pathOrPaths: string | string[]): void => {
  const paths = Array.isArray(pathOrPaths)
    ? pathOrPaths
    : props.selectedFiles.includes(pathOrPaths) && props.selectedFiles.length > 0
    ? props.selectedFiles
    : [pathOrPaths];
  
  // Add logging to debug the issue
  try {
    const { logStoreAction } = require("@/utils/loggers");
    logStoreAction("FileTableContextMenu", "copyFileFromContext called", { 
      targetJobId, 
      targetJobIdType: typeof targetJobId,
      pathOrPaths, 
      paths,
      selectedFiles: props.selectedFiles 
    });
  } catch (e) {
    console.log("FileTableContextMenu.copyFileFromContext", { 
      targetJobId, 
      targetJobIdType: typeof targetJobId,
      pathOrPaths, 
      paths 
    });
  }
  
  emit("copy-files", { targetJobId, rightClickedPath: pathOrPaths });
};

const copyFileToNewJobFromContext = (pathOrPaths: string | string[]): void => {
  const paths = Array.isArray(pathOrPaths)
    ? pathOrPaths
    : props.selectedFiles.includes(pathOrPaths) && props.selectedFiles.length > 0
    ? props.selectedFiles
    : [pathOrPaths];
  emit("copy-to-new-job", paths);
};

defineExpose({
  showFileContextMenu,
  setFileMenuRef,
  fileMenuRefs,
});
</script>

<style>
/* Row Actions Styles */
.row-actions {
  display: flex;
  justify-content: flex-end;
  opacity: 0;
  transition: opacity 150ms ease-in-out;
  flex-shrink: 0;
}

/* Show row actions on hover when not dragging */
.file-table-comp:not(.is-dragging) .table-row:hover .row-actions,
.file-table-comp .row-actions:has(.dropdown-menu.active) {
  opacity: 1;
}

/* Hide row actions during marquee dragging */
.file-table-comp.is-marquee-dragging .row-actions {
  opacity: 0;
  pointer-events: none;
}

/* Disable dropdown open button inside row-actions while marquee active (safe-guard) */
.file-table-comp.is-marquee-dragging .row-actions .trans-btn,
.file-table-comp.is-marquee-dragging .row-actions .minimal-trans-btn {
  pointer-events: none;
}
</style>
