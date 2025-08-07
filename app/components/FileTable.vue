<!-- eslint-disable vue/html-self-closing @preserve -->
<!-- components/FileTable.vue @preserve -->

<!--
  RECOMMENDATIONS FOR IMPROVEMENT:
  
  1. COMPONENT DECOMPOSITION
     - Break into smaller, focused components:
       * FileTableHeader.vue (sorting, column resizing)
       * FileTableRow.vue (individual row rendering)
       * FileTableToolbar.vue (add/remove/move/copy actions)
       * FileTableContextMenu.vue (right-click menu)
     - Current component is 1145 lines and handles too many responsibilities
  
  2. PERFORMANCE OPTIMIZATIONS
     - Add memoization for expensive computations (sortedFiles, columnStyles)
     - Use useMemo or similar for sorting operations
     - Optimize large template with many conditional renders
     - Consider lazy loading for context menus
  
  3. ERROR HANDLING
     - Add comprehensive error handling for file operations
     - Implement loading states for individual operations
     - Add error boundaries for component failures
     - Handle edge cases (empty states, network failures)
  
  4. TESTING
     - Implement comprehensive unit tests for complex interactions
     - Test virtual scrolling with large datasets
     - Test drag & drop functionality
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
     - Add high contrast mode support
-->

<template>
  <div
    ref="fileTableCompRef"
    class="file-table-comp"
    :class="{
      'is-dragging': isDragging || dragDropStore.isInternalDragActive,
      'is-active': isActive,
      'is-scrolling': isScrolling,
    }"
    :style="columnStyles"
    data-component-name="FileTable"
    @click="isActive = true"
  >
    <div class="file-table-visual-select" />
    <LoadingAnim :visible="props.isLoading" @cancel="$emit('cancel-load')"> Adding files, please wait... </LoadingAnim>
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
        <!-- Header is now INSIDE the scroll wrapper to scroll horizontally -->
        <div class="table-header">
          <div v-if="props.showCheckboxes" class="item-checkbox">
            <CustomButton
              button-style-class="minimal-trans-btn"
              data-name="select-all-files-checkbox"
              role="checkbox"
              :aria-checked="allSelected ? 'true' : 'false'"
              @click="toggleAll"
            >
              <Icon :name="allSelected ? 'mdi:checkbox-marked' : 'mdi:checkbox-blank-outline'" size="16" />
            </CustomButton>
            <div class="resizer" @mousedown.stop="startResize($event, 'checkbox')"></div>
          </div>
          <div class="item-name" @click="handleSort('name')">
            <span class="header-text">Name</span>
            <span v-if="sortKey === 'name'" class="sort-indicator">{{ sortDirection === "asc" ? "▲" : "▼" }}</span>
            <div class="resizer" @mousedown.stop="startResize($event, 'name')"></div>
          </div>
          <div class="item-size" @click="handleSort('size')">
            <span class="header-text">Size (MB)</span>
            <span v-if="sortKey === 'size'" class="sort-indicator">{{ sortDirection === "asc" ? "▲" : "▼" }}</span>
            <div class="resizer" @mousedown.stop="startResize($event, 'size')"></div>
          </div>
          <div class="item-ext" @click="handleSort('type')">
            <span class="header-text">Ext</span>
            <span v-if="sortKey === 'type'" class="sort-indicator">{{ sortDirection === "asc" ? "▲" : "▼" }}</span>
            <div class="resizer" @mousedown.stop="startResize($event, 'ext')"></div>
          </div>
          <div class="item-modified" @click="handleSort('modified')">
            <span class="header-text">Modified</span>
            <span v-if="sortKey === 'modified'" class="sort-indicator">{{ sortDirection === "asc" ? "▲" : "▼" }}</span>
            <div class="resizer" @mousedown.stop="startResize($event, 'modified')"></div>
          </div>
          <div class="item-created" @click="handleSort('created')">
            <span class="header-text">Creation Date</span>
            <span v-if="sortKey === 'created'" class="sort-indicator">{{ sortDirection === "asc" ? "▲" : "▼" }}</span>
            <div class="resizer" @mousedown.stop="startResize($event, 'created')"></div>
          </div>
          <div class="item-files" @click="handleSort('files')">
            <span class="header-text">Files</span>
            <span v-if="sortKey === 'files'" class="sort-indicator">{{ sortDirection === "asc" ? "▲" : "▼" }}</span>
            <div class="resizer" @mousedown.stop="startResize($event, 'files')"></div>
          </div>
          <div class="item-folders" @click="handleSort('folders')">
            <span class="header-text">Folders</span>
            <span v-if="sortKey === 'folders'" class="sort-indicator">{{ sortDirection === "asc" ? "▲" : "▼" }}</span>
            <div class="resizer" @mousedown.stop="startResize($event, 'folders')"></div>
          </div>
          <div class="item-files-total" @click="handleSort('filesTotal')">
            <span class="header-text">Files (Total)</span>
            <span v-if="sortKey === 'filesTotal'" class="sort-indicator">{{ sortDirection === "asc" ? "▲" : "▼" }}</span>
            <div class="resizer" @mousedown.stop="startResize($event, 'filesTotal')"></div>
          </div>
          <div class="item-folders-total" @click="handleSort('foldersTotal')">
            <span class="header-text">Folders (Total)</span>
            <span v-if="sortKey === 'foldersTotal'" class="sort-indicator">{{ sortDirection === "asc" ? "▲" : "▼" }}</span>
            <div class="resizer" @mousedown.stop="startResize($event, 'foldersTotal')"></div>
          </div>
          <div class="item-parent-path" @click="handleSort('parentPath')">
            <span class="header-text">Parent Folder Path</span>
            <span v-if="sortKey === 'parentPath'" class="sort-indicator">{{ sortDirection === "asc" ? "▲" : "▼" }}</span>
            <div class="resizer" @mousedown.stop="startResize($event, 'parentPath')"></div>
          </div>
        </div>

        <div v-if="uiStore.marqueeBox.visible" class="selection-box" :style="marqueeBoxStyle" />

        <!-- Spacer for Virtual Scroll -->
        <div class="virtual-scroll-spacer" :style="{ height: `${totalHeight}px` }">
          <!-- Content container for visible rows -->
          <div class="virtual-scroll-content" :style="{ transform: `translateY(${contentOffsetY}px)` }">
            <template v-for="file in visibleFiles" :key="file.path">
              <div
                class="table-row"
                :class="{
                  selected: selectedFiles.includes(file.path),
                  'is-cut': cutFiles.includes(file.path) && jobId === cutSourceJobId,
                  'is-folder': file.type === 'Folder',
                }"
                :data-path="file.path"
                data-has-context-menu="true"
                @click="clickRowByPath($event, file.path)"
                @contextmenu.prevent="showFileContextMenu(file, $event)"
              >
                <!-- Checkbox Cell -->
                <div v-if="props.showCheckboxes" class="item-checkbox">
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
                <div class="item-name">
                  <div
                    class="item-name-content"
                    :draggable="props.itemDragEnabled"
                    @dragstart="handleDragStart($event, file.path)"
                    @dragend="handleDragEnd"
                  >
                    <Icon :name="file.type === 'Folder' ? 'mdi:folder' : 'mdi:file-outline'" size="16" />
                    <span class="cell-text">{{ file.name }}</span>
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
                </div>
                <!-- Other Cells -->
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
          </div>
        </div>
      </div>
    </OverlayScrollbarsComponent>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUpdate, reactive, onUnmounted, onMounted, onUpdated } from "vue";
import { OverlayScrollbarsComponent } from "overlayscrollbars-vue";
import { useThemeStore } from "@/stores/themeStore";
import { useDragDropStore } from "@/stores/dragDropStore";
import { useUiStore } from "@/stores/uiStore";
import type { FileItem } from "@/types/types";
import DropdownMenu from "./DropdownMenu.vue";
import { logDragDropEvent, logLifecycle, logRendering, logUI } from "@/utils/loggers";
import { useJobsStore, type Job } from "@/stores/jobsStore";
import { useClipboardStore } from "@/stores/clipboardStore";
import { open } from "@tauri-apps/plugin-dialog";
import LoadingAnim from "@/components/LoadingAnim.vue";

// --- VIRTUAL SCROLLING CONSTANTS ---
const ROW_HEIGHT = 35;
const BUFFER_ROWS = 10;

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
]);

const themeStore = useThemeStore();
const jobsStore = useJobsStore();
const dragDropStore = useDragDropStore();
const clipboardStore = useClipboardStore();
const uiStore = useUiStore();

const scrollComponentRef = ref<InstanceType<typeof OverlayScrollbarsComponent> | null>(null);
const viewportRef = ref<HTMLElement | null>(null);
const fileTableCompRef = ref<HTMLElement | null>(null);
const fileMenuRefs = ref(new Map<string, InstanceType<typeof DropdownMenu>>());
const selectedFiles = ref<string[]>([]);
const lastClickedIndex = ref<number | null>(null);
const isActive = ref<boolean>(false);
let updateStartTime = 0;
const isScrolling = ref(false);
let scrollTimeout: NodeJS.Timeout | null = null;

const scrollTop = ref(0);

const currentTheme = computed(() => (themeStore.isEffectiveDark ? "os-theme-light" : "os-theme-dark"));
const jobs = computed(() => jobsStore.jobs);

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0.00";
  const mb = bytes / (1024 * 1024);
  return mb.toFixed(2);
};

const formatModifiedDate = (timestamp: number): string => {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(new Date(timestamp));
};

const formatCreationDate = (timestamp: number): string => {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(new Date(timestamp));
};

const sortKey = ref<keyof FileItem>("name");
const sortDirection = ref<"asc" | "desc">("asc");

const sortedFiles = computed(() => {
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
});

const handleSort = (key: keyof FileItem) => {
  if (sortKey.value === key) {
    sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
  } else {
    sortKey.value = key;
    sortDirection.value = "asc";
  }
};

// --- FIX: Separate max size calculations for files and folders ---
const maxFileSizeInJob = computed(() => {
  const fileSizes = props.files.filter((f) => f.type !== "Folder").map((f) => f.size);
  if (fileSizes.length === 0) return 1;
  return Math.max(...fileSizes);
});

const maxFolderSizeInJob = computed(() => {
  const folderSizes = props.files.filter((f) => f.type === "Folder").map((f) => f.size);
  if (folderSizes.length === 0) return 1;
  return Math.max(...folderSizes);
});

// --- Date Bar Computeds ---
const fileTimestamps = computed(() =>
  props.files.filter((f) => f.type !== "Folder").map((f) => ({ modified: f.modified ?? 0, created: f.created ?? 0 }))
);
const folderTimestamps = computed(() =>
  props.files.filter((f) => f.type === "Folder").map((f) => ({ modified: f.modified ?? 0, created: f.created ?? 0 }))
);

const getMinMax = (timestamps: number[]) => {
  if (timestamps.length === 0) return { min: 0, max: 1 };
  const cleanTimestamps = timestamps.filter((t) => t > 0);
  if (cleanTimestamps.length === 0) return { min: 0, max: 1 };
  return {
    min: Math.min(...cleanTimestamps),
    max: Math.max(...cleanTimestamps),
  };
};

const minMaxFileModified = computed(() => getMinMax(fileTimestamps.value.map((t) => t.modified)));
const minMaxFolderModified = computed(() => getMinMax(folderTimestamps.value.map((t) => t.modified)));
const minMaxFileCreated = computed(() => getMinMax(fileTimestamps.value.map((t) => t.created)));
const minMaxFolderCreated = computed(() => getMinMax(folderTimestamps.value.map((t) => t.created)));

const normalizeTimestamp = (timestamp: number, range: { min: number; max: number }): number => {
  if (range.max === range.min) return 50; // If all items have the same date, show a half-bar
  // Invert the scale: older dates (smaller timestamps) should have a larger bar
  return 100 - ((timestamp - range.min) / (range.max - range.min)) * 100;
};

const totalHeight = computed(() => sortedFiles.value.length * ROW_HEIGHT);

const startIndex = computed(() => {
  return Math.max(0, Math.floor(scrollTop.value / ROW_HEIGHT) - BUFFER_ROWS);
});

const endIndex = computed(() => {
  const wrapperHeight = viewportRef.value?.clientHeight || 0;
  return Math.min(sortedFiles.value.length, Math.ceil((scrollTop.value + wrapperHeight) / ROW_HEIGHT) + BUFFER_ROWS);
});

const contentOffsetY = computed(() => startIndex.value * ROW_HEIGHT);

const visibleFiles = computed(() => {
  return sortedFiles.value.slice(startIndex.value, endIndex.value);
});

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

const marqueeBoxStyle = computed(() => ({
  transform: `translate(${uiStore.marqueeBox.x}px, ${uiStore.marqueeBox.y}px)`,
  width: `${uiStore.marqueeBox.width}px`,
  height: `${uiStore.marqueeBox.height}px`,
}));

const isMarqueeActive = ref(false);
const marqueeAnchorX = ref(0);
const marqueeAnchorY = ref(0);

const handleComponentMouseDown = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (target.closest(".os-scrollbar")) {
    return;
  }

  if (!props.marqueeSelectionEnabled || event.button !== 0) return;

  const isInteractiveElement = target.closest("button, a, input, select, textarea, .table-header, .resizer");
  if (isInteractiveElement) return;

  event.preventDefault();
  isMarqueeActive.value = true;

  const scrollWrapper = viewportRef.value;
  if (!scrollWrapper) return;

  const scrollWrapperBounds = scrollWrapper.getBoundingClientRect();
  marqueeAnchorX.value = event.clientX - scrollWrapperBounds.left;
  marqueeAnchorY.value = event.clientY - scrollWrapperBounds.top + scrollWrapper.scrollTop - 34; // Offset by header height

  window.addEventListener("mousemove", handleMarqueeMouseMove);
  window.addEventListener("mouseup", handleMarqueeMouseUp);
};

const handleMarqueeMouseMove = (event: MouseEvent) => {
  if (!isMarqueeActive.value) return;

  const scrollWrapper = viewportRef.value;
  if (!scrollWrapper) return;

  const scrollWrapperBounds = scrollWrapper.getBoundingClientRect();
  const mouseX_content = event.clientX - scrollWrapperBounds.left;
  const mouseY_content = event.clientY - scrollWrapperBounds.top + scrollWrapper.scrollTop - 34; // Offset by header height

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
  window.removeEventListener("mousemove", handleMarqueeMouseMove);
  window.removeEventListener("mouseup", handleMarqueeMouseUp);
};

const updateSelectionByRect = (isAdditive: boolean) => {
  const marqueeTop = uiStore.marqueeBox.y;
  const marqueeBottom = marqueeTop + uiStore.marqueeBox.height;

  const startIndexInView = Math.floor(marqueeTop / ROW_HEIGHT);
  const endIndexInView = Math.ceil(marqueeBottom / ROW_HEIGHT);

  const pathsToSelect = sortedFiles.value.slice(startIndexInView, endIndexInView).map((f) => f.path);

  if (isAdditive) {
    const selectionSet = new Set([...selectedFiles.value, ...pathsToSelect]);
    selectedFiles.value = Array.from(selectionSet);
  } else {
    selectedFiles.value = pathsToSelect;
  }
};

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

const columnStyles = computed(() => ({
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
}));

const tableContentStyle = computed(() => {
  const totalWidth = Object.values(columnWidths).reduce((sum, width) => sum + width, 0);
  return {
    minInlineSize: `${totalWidth}px`,
  };
});

const resizingColumn = ref<keyof typeof columnWidths | null>(null);
const startX = ref(0);
const startWidth = ref(0);

const startResize = (event: MouseEvent, column: keyof typeof columnWidths) => {
  document.body.classList.add("is-resizing");
  resizingColumn.value = column;
  startX.value = event.clientX;
  startWidth.value = columnWidths[column];
  window.addEventListener("mousemove", doResize);
  window.addEventListener("mouseup", stopResize);
};

const doResize = (event: MouseEvent) => {
  if (resizingColumn.value) {
    const delta = event.clientX - startX.value;
    const newWidth = Math.max(30, startWidth.value + delta);
    columnWidths[resizingColumn.value] = newWidth;
  }
};

const stopResize = () => {
  document.body.classList.remove("is-resizing");
  resizingColumn.value = null;
  window.removeEventListener("mousemove", doResize);
  window.removeEventListener("mouseup", stopResize);
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

// --- LOGGING ---
watch(visibleFiles, (newVisibleFiles) => {
  logRendering("FileTable", `Virtual scroll update: now showing ${newVisibleFiles.length} files.`);
});

watch(columnStyles, (newStyle) => {
  logRendering("FileTable", `Column styles updated`, newStyle);
});

// --- LIFECYCLE HOOKS ---
onMounted(() => {
  logLifecycle("FileTable", "Component has been mounted.");
});

onBeforeUpdate(() => {
  fileMenuRefs.value.clear();
  updateStartTime = performance.now();
  logLifecycle("FileTable", "Component is about to update...");
});

onUpdated(() => {
  const updateDuration = performance.now() - updateStartTime;
  logLifecycle("FileTable", `Component has been updated. Update duration: ${updateDuration.toFixed(2)}ms`);
});

watch(scrollComponentRef, (newRef) => {
  if (newRef) {
    const osInstance = newRef.osInstance();
    if (osInstance) {
      viewportRef.value = osInstance.elements().viewport;
    }
  }
});

defineExpose({
  deselectAll,
  toggleAll,
  selectedFiles,
});
</script>

<style scoped src="./file-table-comp/file-table.scoped.css"></style>
