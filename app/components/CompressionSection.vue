<!-- eslint-disable vue/html-self-closing @preserve -->
<!--
  CompressionSection.vue @preserve
-->
<!-- components/CompressionSection.vue @preserve -->
<!--
  CompressionSection.vue @preserve
-->
<template>
  <section class="compression-section" data-component-name="CompressionSection">
    <div class="compression-section__tabs">
      <CustomButton
        :class="[
          'compression-section__tab-button',
          { 'compression-section__tab-button--active': activeTab === 'global', active: activeTab === 'global' }
        ]"
        button-style-class="trans-btn btn-dark can-become-active active-line-block-end"
        data-name="global-settings-btn"
        @click="activeTab = 'global'"
      >
        Global Settings
      </CustomButton>
      <CustomButton
        :class="[
          'compression-section__tab-button',
          { 'compression-section__tab-button--active': activeTab === 'job', active: activeTab === 'job' }
        ]"
        button-style-class="trans-btn btn-dark can-become-active active-line-block-end"
        data-name="job-specific-settings-btn"
        @click="activeTab = 'job'"
      >
        Job Settings
      </CustomButton>
    </div>

    <!-- Output Location and Filename Inputs (moved to OutputControls.vue) -->
    <div class="compression-section__output-controls" v-if="false">
      <!-- Path Length Warning -->
      <InfoCard
        v-if="shouldShowPathWarningConsideringDebug"
        :theme="pathWarningTheme"
        class="compression-section__path-warning"
      >
        <template #icon>
          <Icon name="mdi:alert" size="16" />
        </template>
        <template #header>
          Path Length Warning
        </template>
        <template #default>
          <div>
            <p>{{ pathWarningMessage }}</p>
            <p v-if="isWindows() && !longPathsEnabled && outputPathLength >= 260" class="path-warning-help">
              <strong>To enable long paths on Windows:</strong><br>
              1. Open Registry Editor (regedit)<br>
              2. Navigate to: <code>HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\FileSystem</code><br>
              3. Set <code>LongPathsEnabled</code> to <code>1</code> (DWORD)<br>
              4. Restart your computer
            </p>
            <p v-if="isWindows() && longPathsEnabled && outputPathLength >= 260" class="path-warning-help">
              <strong>Note:</strong> Long paths are enabled on your system, but this path is still approaching the theoretical maximum limit.
            </p>
            <p v-else-if="isLinux() && outputPathLength >= 4096" class="path-warning-help">
              <strong>Note:</strong> Modern Linux systems typically support much longer paths than the traditional 4096 byte limit.
              If you're experiencing issues, check your filesystem type and kernel version.
            </p>
            <p v-else-if="isMacOS() && outputPathLength >= 1024" class="path-warning-help">
              <strong>Note:</strong> macOS with APFS filesystem supports longer paths than older HFS+ systems.
              Consider using shorter, more descriptive names for better compatibility.
            </p>
          </div>
        </template>
      </InfoCard>
      <CustomFieldNew
        field-id="output-location"
        input-type="text-area"
        :model-value="outputLocation"
        :spellcheck="false"
        title="Output Location"
        @update:model-value="updateOutputLocation"
        @unset-or-clear="clearOutputLocation"
      >
        <template #buttons-start>
          <CustomButton
            button-style-class="trans-btn btn-lite"
            data-name="auto-determine-output-location-btn"
            first-icon-name="mdi:auto-fix"
            :first-icon-size="16"
            @click="$emit('request-auto-location')"
            title="Auto-determine output location from current files"
          >
            Auto-Set
          </CustomButton>
        </template>
        <template #buttons-end>
          <CustomButton
            button-style-class="trans-btn btn-lite"
            data-name="browse-output-location-btn"
            first-icon-name="mdi:folder"
            :first-icon-size="20"
            @click="browseTopLevelOutputFolder"
          >
            Browse
          </CustomButton>
        </template>
      </CustomFieldNew>

      <!-- Read-only filename preview removed; handled by OutputControls.vue -->

      <!-- Output filename input removed; handled by OutputControls.vue -->
    </div>

    <OverlayScrollbarsComponent
      ref="scrollbarRef"
      defer
      :events="{ scroll: handleScroll }"
      :options="{
        scrollbars: {
          visibility: 'auto',
          autoHide: 'move',
          autoHideSuspend: true,
          theme: currentTheme,
        },
      }"
      class="compression-section__content"
    >

      <template v-if="activeTab === 'global'">
        <AccordionComp
          class="compression-section__accordion"
          :button-names="globalButtonNames"
          :categories="categories"
          :columns="2"
          :icons="categoryIcons"
          :first-icon-size="20"
          :last-icon-size="20"
          default-expanded
          min-column-width="300px"
          @transition-end="handleTransitionEnd"
        >
          <template #general>
            <form class="compression-section__settings-form" @submit.prevent>
                <!-- MODIFIED: Use computed property `generalFields` for type safety -->
                <template v-for="field in generalFields" :key="field.id">
                  <CustomFieldNew
                    v-if="!field.dependsOn || evaluateDependency(field.dependsOn, 'global')"
                    :data-field-name="field['data-field-name']"
                    :default-value="field.default"
                    :extra-classes="['compression-section__custom-field', `${field.id}-field`]"
                    :field-id="field.id"
                    :global-value="getDisplayValue(field.id, 'global')"
                    :input-type="field.type"
                    :model-value="getDisplayValue(field.id, 'global')"
                    :options="field.options ?? []"
                    :title="field.label"
                    @unset-or-clear="handleGlobalUnsetOrClear"
                    @update:model-value="updateSetting(field.id, $event, 'global')"
                  >
                    <div v-if="field.id === 'outputFolder'" class="buttons-end-slot">
                      <DropdownMenu
                        button-class="browse-btn"
                        button-style-class="trans-btn"
                        dropdown-data-name="browse-output-folder-global"
                        placement="bottom-end"
                      >
                        <template #default="{ close }">
                          <CustomButton
                            button-style-class="trans-btn btn-lite"
                            data-name="browse-output-folder-global-btn"
                            first-icon-name="mdi:folder"
                            :first-icon-size="20"
                            @mouseup="
                              () => {
                                browseOutputFolder('global');
                                close();
                              }
                            "
                          >
                            Browse
                          </CustomButton>
                        </template>
                      </DropdownMenu>
                    </div>
                  </CustomFieldNew>
                </template>
            </form>
          </template>
          <template #compression>
            <form class="compression-section__settings-form" @submit.prevent>
              <!-- MODIFIED: Use computed property `compressFields` for type safety -->
              <template v-for="field in compressFields" :key="field.id">
                <CustomFieldNew
                  v-if="!field.dependsOn || evaluateDependency(field.dependsOn, 'global')"
                  :data-field-name="field['data-field-name']"
                  :default-value="field.default"
                  :extra-classes="['compression-section__custom-field', `${field.id}-field`]"
                  :field-id="field.id"
                  :global-value="getDisplayValue(field.id, 'global')"
                  :input-type="field.type"
                  :model-value="getDisplayValue(field.id, 'global')"
                  :options="field.options ?? getOptions(field.id, 'global')"
                  :title="field.label"
                  @unset-or-clear="handleGlobalUnsetOrClear"
                  @update:model-value="updateSetting(field.id, $event, 'global')"
                />
              </template>
            </form>
          </template>
          <template #advanced>
            <form class="compression-section__settings-form" @submit.prevent>
              <!-- MODIFIED: Use computed property `advancedFields` for type safety -->
              <template v-for="field in advancedFields" :key="field.id">
                <CustomFieldNew
                  v-if="!field.dependsOn || evaluateDependency(field.dependsOn, 'global')"
                  :data-field-name="field['data-field-name']"
                  :default-value="field.default"
                  :extra-classes="['compression-section__custom-field', `${field.id}-field`]"
                  :field-id="field.id"
                  :global-value="getDisplayValue(field.id, 'global')"
                  :input-type="field.type"
                  :model-value="getDisplayValue(field.id, 'global')"
                  :options="field.options ?? []"
                  :placeholder="field.placeholder"
                  :title="field.label"
                  @unset-or-clear="handleGlobalUnsetOrClear"
                  @update:model-value="updateSetting(field.id, $event, 'global')"
                />
              </template>
            </form>
          </template>
          <template #encryption>
            <form class="compression-section__settings-form" @submit.prevent>
              <!-- MODIFIED: Use computed property `encryptFields` for type safety -->
              <template v-for="field in encryptFields" :key="field.id">
                <CustomFieldNew
                  v-if="!field.dependsOn || evaluateDependency(field.dependsOn, 'global')"
                  :data-field-name="field['data-field-name']"
                  :default-value="field.default"
                  :extra-classes="['compression-section__custom-field', `${field.id}-field`]"
                  :field-id="field.id"
                  :global-value="getDisplayValue(field.id, 'global')"
                  :input-type="field.type"
                  :model-value="getDisplayValue(field.id, 'global')"
                  :options="field.options ?? getOptions(field.id, 'global')"
                  :placeholder="field.placeholder"
                  :title="field.label"
                  @unset-or-clear="handleGlobalUnsetOrClear"
                  @update:model-value="updateSetting(field.id, $event, 'global')"
                />
              </template>
            </form>
          </template>
        </AccordionComp>
      </template>
      <template v-else-if="activeTab === 'job'">
        <div v-if="selectedJob">
          <AccordionComp
            class="compression-section__accordion"
            :button-names="jobButtonNames"
            :categories="categories"
            :columns="2"
            :icons="categoryIcons"
            :first-icon-size="20"
            :last-icon-size="20"
            default-expanded
            min-column-width="300px"
            @transition-end="handleTransitionEnd"
          >
            <template #general>
              <form class="compression-section__settings-form" @submit.prevent>
                  <!-- MODIFIED: Use computed property `generalFields` for type safety -->
                  <template v-for="field in generalFields" :key="field.id">
                    <CustomFieldNew
                      v-if="!field.dependsOn || evaluateDependency(field.dependsOn, 'job')"
                      :data-field-name="field['data-field-name']"
                      :default-value="field.default"
                      :disabled="getJobFieldDisabledState(field.id)"
                      :extra-classes="['compression-section__custom-field--job-specific', `${field.id}-field`]"
                      :field-id="field.id"
                      :global-value="getDisplayValue(field.id, 'global')"
                      :input-type="getJobFieldInputType(field.id, field.type)"
                      :is-job-settings="true"
                      :is-locked="getJobFieldLockedState(field.id)"
                      :model-value="getJobFieldModelValue(field.id)"
                      :options="getJobFieldOptions(field.id, field.type, field.options)"
                      :show-wrapper="true"
                      :title="field.label"
                      @reset-to-global="handleResetToGlobal"
                      @unset-or-clear="handleJobUnsetOrClear"
                      @update:model-value="updateSetting(field.id, $event, 'job')"
                    >
                      <template #before-input>
                        <LockButton
                          v-if="field.type === 'select' || field.id === 'parameters'"
                          :is-locked="getJobFieldLockedState(field.id)"
                          class="compression-section__lock-btn"
                          @click="toggleLock(field.id)"
                        />
                      </template>
                      <div v-if="field.id === 'outputFolder'" class="buttons-end-slot">
                        <DropdownMenu
                          button-class="browse-btn"
                          button-style-class="trans-btn"
                          dropdown-data-name="browse-output-folder-job"
                          :disabled="getJobFieldDisabledState(field.id)"
                          placement="bottom-end"
                        >
                          <template #default="{ close }">
                            <CustomButton
                              button-style-class="trans-btn btn-lite"
                              data-name="browse-output-folder-job-btn"
                              first-icon-name="mdi:folder"
                              :first-icon-size="20"
                              @mouseup="
                                () => {
                                  browseOutputFolder('job');
                                  close();
                                }
                              "
                            >
                              Browse
                            </CustomButton>
                          </template>
                        </DropdownMenu>
                      </div>
                    </CustomFieldNew>
                  </template>
              </form>
            </template>
            <template #compression>
              <form class="compression-section__settings-form" @submit.prevent>
                <!-- MODIFIED: Use computed property `compressFields` for type safety -->
                <template v-for="field in compressFields" :key="field.id">
                  <CustomFieldNew
                    v-if="!field.dependsOn || evaluateDependency(field.dependsOn, 'job')"
                    :data-field-name="field['data-field-name']"
                    :default-value="field.default"
                    :disabled="getJobFieldDisabledState(field.id)"
                    :extra-classes="['compression-section__custom-field', `${field.id}-field`]"
                    :field-id="field.id"
                    :global-value="getDisplayValue(field.id, 'global')"
                    :input-type="getJobFieldInputType(field.id, field.type)"
                    :is-job-settings="true"
                    :is-locked="getJobFieldLockedState(field.id)"
                    :model-value="getJobFieldModelValue(field.id)"
                    :options="getJobFieldOptions(field.id, field.type, field.options)"
                    :show-wrapper="true"
                    :title="field.label"
                    @reset-to-global="handleResetToGlobal"
                    @unset-or-clear="handleJobUnsetOrClear"
                    @update:model-value="updateSetting(field.id, $event, 'job')"
                  >
                    <template #before-input>
                      <LockButton
                        v-if="field.type === 'select' || field.id === 'parameters'"
                        :is-locked="getJobFieldLockedState(field.id)"
                        class="compression-section__lock-btn"
                        @click="toggleLock(field.id)"
                      />
                    </template>
                  </CustomFieldNew>
                </template>
              </form>
            </template>
            <template #advanced>
              <form class="compression-section__settings-form" @submit.prevent>
                <!-- MODIFIED: Use computed property `advancedFields` for type safety -->
                <template v-for="field in advancedFields" :key="field.id">
                  <CustomFieldNew
                    v-if="!field.dependsOn || evaluateDependency(field.dependsOn, 'job')"
                    :data-field-name="field['data-field-name']"
                    :default-value="field.default"
                    :disabled="getJobFieldDisabledState(field.id)"
                    :extra-classes="['compression-section__custom-field', `${field.id}-field`]"
                    :field-id="field.id"
                    :global-value="getDisplayValue(field.id, 'global')"
                    :input-type="getJobFieldInputType(field.id, field.type)"
                    :is-job-settings="true"
                    :is-locked="getJobFieldLockedState(field.id)"
                    :model-value="getJobFieldModelValue(field.id)"
                    :options="getJobFieldOptions(field.id, field.type, field.options)"
                    :placeholder="field.placeholder"
                    :show-wrapper="true"
                    :title="field.label"
                    @reset-to-global="handleResetToGlobal"
                    @unset-or-clear="handleJobUnsetOrClear"
                    @update:model-value="updateSetting(field.id, $event, 'job')"
                  >
                    <template #before-input>
                      <LockButton
                        v-if="field.type === 'select' || field.id === 'parameters'"
                        :is-locked="getJobFieldLockedState(field.id)"
                        class="compression-section__lock-btn"
                        @click="toggleLock(field.id)"
                      />
                    </template>
                  </CustomFieldNew>
                </template>
              </form>
            </template>
            <template #encryption>
              <form class="compression-section__settings-form" @submit.prevent>
                <!-- MODIFIED: Use computed property `encryptFields` for type safety -->
                              <template v-for="field in encryptFields" :key="field.id">
                <CustomFieldNew
                  v-if="!field.dependsOn || evaluateDependency(field.dependsOn, 'job')"
                  :data-field-name="field['data-field-name']"
                  :default-value="field.default"
                  :disabled="getJobFieldDisabledState(field.id)"
                  :extra-classes="['compression-section__custom-field', `${field.id}-field`]"
                  :field-id="field.id"
                  :global-value="getDisplayValue(field.id, 'global')"
                  :input-type="getJobFieldInputType(field.id, field.type)"
                  :is-job-settings="true"
                  :is-locked="getJobFieldLockedState(field.id)"
                  :model-value="getJobFieldModelValue(field.id)"
                  :options="getJobFieldOptions(field.id, field.type, field.options)"
                  :placeholder="field.placeholder"
                  :show-wrapper="true"
                  :title="field.label"
                  @reset-to-global="handleResetToGlobal"
                  @unset-or-clear="handleJobUnsetOrClear"
                  @update:model-value="updateSetting(field.id, $event, 'job')"
                >
                    <template #before-input>
                      <LockButton
                        v-if="field.type === 'select'"
                        :is-locked="getJobFieldLockedState(field.id)"
                        class="compression-section__lock-btn"
                        @click="toggleLock(field.id)"
                      />
                    </template>
                  </CustomFieldNew>
                </template>
              </form>
            </template>
          </AccordionComp>
        </div>
        <div v-else>
          <p>Please select a job to configure its settings.</p>
        </div>
      </template>
    </OverlayScrollbarsComponent>
  </section>
</template>
<script setup lang="ts">
import { computed, ref, watch, type ComponentPublicInstance } from "vue";
import { useJobsStore, type Job, type CompressionSettings } from "@/stores/jobsStore";
import { open } from "@tauri-apps/plugin-dialog";
import { useThemeStore } from "@/stores/themeStore";
import { OverlayScrollbarsComponent } from "overlayscrollbars-vue";
import generalConfigJson from "@/assets/config/generalSettingsConfig.json";
import advancedConfigJson from "@/assets/config/advancedSettingsConfig.json";
import compressConfigJson from "@/assets/config/compressSettingsConfig.json";
import encryptConfigJson from "@/assets/config/encryptSettingsConfig.json";
import { useDropdownManager } from "@/composables/dropdownManager";
import { DEBUG, debugConfig } from "@/utils/debugConfig";
import { logInteraction } from "@/utils/loggers";
import { getPlatform, isWindows, isLinux, isMacOS, getCurrentPathLimit, checkLongPathsEnabled } from "@/utils/platformUtils";
import CustomInput from "@/components/CustomInput.vue";
import InfoCard from "@/components/InfoCard.vue";

const emit = defineEmits<{
  "request-auto-location": [];
  "request-auto-filename": [];
}>();
// --- START: TYPE DEFINITIONS ---
// These types ensure that the data from JSON config files matches the props
// expected by child components, resolving TypeScript errors.
type InputType = "select" | "input" | "text-area" | "custom" | "checkbox";
interface FieldOption {
  value: string | number;
  text: string;
}
interface FieldDependency {
  field: string;
  value: string | boolean;
}
interface FieldConfig {
  id: string;
  type: InputType;
  label: string;
  options?: FieldOption[];
  default: string | number | boolean;
  "data-field-name": string;
  dependsOn?: FieldDependency;
  placeholder?: string;
}
interface SettingsCategory {
  title: string;
  fields: FieldConfig[];
}
interface SettingsConfig {
  [key: string]: SettingsCategory;
}
interface CompressConfigData extends SettingsConfig {
  compress: {
    title: string;
    fields: FieldConfig[];
    formats: {
      [key: string]: {
        compressionLevels: { value: number; label: string }[];
        compressionMethods: string[];
        defaultCompressionLevel: number;
        defaultCompressionMethod: string;
      };
    };
    dictionarySizes: { [key: string]: string[] };
    wordSizes: { [key: string]: number[] };
    solidBlockSizes: string[];
    defaultExtensions: { [key: string]: string };
  };
}
// --- END: TYPE DEFINITIONS ---
interface ExtendedInstance extends ComponentPublicInstance {
  osInstance: () => {
    elements: () => { content: HTMLElement };
    update: () => void;
  };
}
// Cast imported JSON to the defined types
// MODIFIED: Added explicit type assertions to ensure the nested properties exist
const generalConfig = generalConfigJson as { general: SettingsCategory };
const advancedConfig = advancedConfigJson as { advanced: SettingsCategory };
const compressConfig = compressConfigJson as CompressConfigData;
const encryptConfig = encryptConfigJson as { encrypt: SettingsCategory };
const jobsStore = useJobsStore();
const themeStore = useThemeStore();
const dropdownManager = useDropdownManager();
const activeTab = ref<"global" | "job">("global");
const scrollbarRef = ref<ExtendedInstance | null>(null);
const lockStates = ref<Record<string, boolean>>({});
const outputLocation = ref<string>("");
const outputFilename = ref<string>("");

const selectedJob = computed(() => jobsStore.jobs.find((job: Job) => job.id === jobsStore.selectedJobId));
const globalSettings = computed(() => jobsStore.globalSettings);
const currentTheme = computed(() => (themeStore.isEffectiveDark ? "os-theme-light" : "os-theme-dark"));
// MODIFIED: Computed properties to safely access fields from config JSONs
const generalFields = computed(() => generalConfig.general.fields || []);
const advancedFields = computed(() => advancedConfig.advanced.fields || []);
const compressFields = computed(() => compressConfig.compress.fields || []);
const encryptFields = computed(() => encryptConfig.encrypt.fields || []);
const categories: string[] = ["general", "compression", "advanced", "encryption"];
const globalButtonNames: Record<string, string> = {
  general: "global-general-btn",
  compression: "global-compression-btn",
  advanced: "global-advanced-btn",
  encryption: "global-encryption-btn",
};
const jobButtonNames: Record<string, string> = {
  general: "job-general-btn",
  compression: "job-compression-btn",
  advanced: "job-advanced-btn",
  encryption: "job-encryption-btn",
};
const categoryIcons: Record<string, string> = {
  general: "mdi:cog",
  compression: "mdi:compress",
  advanced: "mdi:brain",
  encryption: "mdi:lock",
};

// Reactive state for dynamic path limit detection
const platform = getPlatform();

// Make current path limit reactive based on debug store
const currentPathLimit = computed(() => {
  if (debugStore.value) {
    return getCurrentPathLimit(debugStore.value.debugOptions.longPathsEnabled);
  }
  // Default fallback when debug store isn't ready
  return platform === 'windows' ? 260 : 4096;
});

// Legacy longPathsEnabled ref for backwards compatibility (now reactive through debugStore)
const longPathsEnabled = computed(() => {
  return debugStore.value?.debugOptions.longPathsEnabled ?? true;
});

// Initialize path limit detection (minimal async work now)
onMounted(async () => {
  // Debug store is already being initialized above, no additional async work needed
  // The computed properties will automatically update when debugStore becomes available
});

// Path length warning computed properties
const fullOutputPath = computed(() => {
  const location = outputLocation.value || "";
  const filename = outputFilename.value || "";
  // Combine location and filename, ensuring proper path separator
  if (location && filename) {
    const separator = platform === 'windows' ? "\\" : "/";
    return location.endsWith("\\") || location.endsWith("/")
      ? location + filename
      : location + separator + filename;
  }
  return location + filename;
});

const outputPathLength = computed(() => fullOutputPath.value.length);

const shouldShowPathWarning = computed(() => outputPathLength.value >= currentPathLimit.value);

const pathWarningTheme = computed((): "warning" | "danger" => {
  const length = outputPathLength.value;
  // Use a critical threshold based on platform
  const criticalThreshold = platform === 'windows' ? 32767 : 65536;
  return length >= criticalThreshold ? "danger" : "warning";
});

const pathWarningMessage = computed(() => {
  const length = outputPathLength.value;
  const platformName = platform === 'macos' ? 'macOS' : platform.charAt(0).toUpperCase() + platform.slice(1);

  // Dynamic thresholds based on detected capabilities
  const criticalThreshold = platform === 'windows' ? 32767 : 65536;
  const extendedThreshold = currentPathLimit.value;

  if (length >= criticalThreshold) {
    if (isWindows()) {
      return `Path length (${length.toLocaleString()} characters) exceeds ${platformName} theoretical maximum. File operations may fail. Please ensure long paths are enabled in Windows settings.`;
    } else {
      return `Path length (${length.toLocaleString()} characters) is extremely long and may cause issues on ${platformName}. Consider shortening the path.`;
    }
  } else if (length >= extendedThreshold) {
    if (isWindows() && !longPathsEnabled) {
      return `Path length (${length.toLocaleString()} characters) exceeds default ${platformName} limit of ${extendedThreshold} characters. Please enable long paths in Windows settings or shorten the path.`;
    } else {
      return `Path length (${length.toLocaleString()} characters) exceeds recommended ${platformName} limit of ${extendedThreshold} characters.`;
    }
  } else {
    return `Path length (${length.toLocaleString()} characters) exceeds ${platformName} limit of ${extendedThreshold} characters.`;
  }
});

// Get debug store reference - make it reactive
const debugStore = ref<ReturnType<typeof import('@/stores/debugStore').useDebugStore> | null>(null);

// Initialize debug store
onMounted(async () => {
  try {
    const { useDebugStore } = await import('@/stores/debugStore');
    debugStore.value = useDebugStore();
  } catch (error) {
    console.warn('Failed to initialize debug store for long paths:', error);
  }
});

// Check if path warning should be shown
const shouldShowPathWarningConsideringDebug = computed(() => {
  const length = outputPathLength.value;
  const extendedThreshold = currentPathLimit.value;

  // Show warning if path is too long AND long paths are disabled
  if (length >= extendedThreshold) {
    // Check the single source of truth from debug store
    if (debugStore.value && !debugStore.value.debugOptions.longPathsEnabled) {
      console.log('Long paths disabled - showing warning');
      return true;
    }

    console.log('Long paths enabled - no warning needed');
    return false;
  }

  return false;
});
watch(
  selectedJob,
  (newJob) => {
    if (newJob) {
      const allFields = [
        ...generalFields.value, // MODIFIED: Use computed properties
        ...compressFields.value, // MODIFIED: Use computed properties
        ...advancedFields.value, // MODIFIED: Use computed properties
        ...encryptFields.value, // MODIFIED: Use computed properties
      ];
      const lockableFields = allFields.filter((f) => f.type === "select" || f.id === "parameters");
      lockStates.value = Object.fromEntries(
        lockableFields.map((field) => [field.id, newJob.settings[field.id as keyof CompressionSettings] === undefined])
      );
    } else {
      lockStates.value = {};
    }
  },
  { immediate: true }
);
const handleScroll = (): void => {
  dropdownManager.closeAllDropdowns();
  if (DEBUG && debugConfig.logUIEvents) {
    logInteraction("CompressionSection", "Scroll detected, closing all dropdowns.");
  }
};
// Switch to Job tab and focus the filename input
const focusJobFilename = (): void => {
  activeTab.value = "job";
  // Wait for DOM update, then focus the job filename input
  requestAnimationFrame(() => {
    const el = document.getElementById("job-output-filename") as HTMLInputElement | null;
    el?.focus();
    el?.select?.();
  });
};
const getActualDefaultValue = (key: string): string | number | boolean | undefined => {
  const allFields: FieldConfig[] = [
    ...generalFields.value, // MODIFIED: Use computed properties
    ...advancedFields.value, // MODIFIED: Use computed properties
    ...compressFields.value, // MODIFIED: Use computed properties
    ...encryptFields.value, // MODIFIED: Use computed properties
  ];
  const field = allFields.find((f) => f.id === key);
  if (!field) return undefined;
  if (key === "useInputLocationsForOutput") {
    return field.default === "use_input";
  } else if (key === "createMultipleArchives") {
    return field.default === "multiple";
  } else {
    return field.default;
  }
};
const getFormattedGlobalValue = (key: string): string => {
  const allFields: FieldConfig[] = [
    ...generalFields.value, // MODIFIED: Use computed properties
    ...advancedFields.value, // MODIFIED: Use computed properties
    ...compressFields.value, // MODIFIED: Use computed properties
    ...encryptFields.value, // MODIFIED: Use computed properties
  ];
  const field = allFields.find((f) => f.id === key);
  if (field && field.type === "select") {
    const displayValue = getDisplayValue(key, "global");
    const option = field.options?.find((opt) => opt.value === displayValue);
    const text = option ? option.text : displayValue;
    return `Use Global: ${text}`;
  } else {
    const valueStr = String(globalSettings.value[key as keyof CompressionSettings]);
    return `Use Global: ${valueStr === "" ? "None" : valueStr}`;
  }
};
const getCurrentArchiveFormat = (): string => {
  return activeTab.value === "global"
    ? globalSettings.value.archiveFormat
    : selectedJob.value?.settings.archiveFormat ?? globalSettings.value.archiveFormat;
};

const getArchiveExtension = (format?: string): string => {
  const archiveFormat = format || getCurrentArchiveFormat();
  return compressConfig.compress.defaultExtensions[archiveFormat] || ".7z";
};

const getOptions = (fieldId: string, context: "global" | "job"): { value: string | number; text: string }[] => {
  const format: string =
    context === "global"
      ? globalSettings.value.archiveFormat
      : selectedJob.value?.settings.archiveFormat ?? globalSettings.value.archiveFormat;
  const method: string =
    context === "global"
      ? globalSettings.value.compressionMethod
      : selectedJob.value?.settings.compressionMethod ?? globalSettings.value.compressionMethod;
  switch (fieldId) {
    case "compressionLevel":
      return (
        compressConfig.compress.formats[format]?.compressionLevels.map((level) => ({
          value: level.value,
          text: level.label,
        })) || []
      );
    case "compressionMethod":
      return (
        compressConfig.compress.formats[format]?.compressionMethods.map((m) => ({
          value: m,
          text: m,
        })) || []
      );
    case "dictionarySize": {
      const dictKey: string = method === "PPMd" ? (format === "7z" ? "PPMd-7z" : "PPMd-zip") : method;
      return (
        compressConfig.compress.dictionarySizes[dictKey]?.map((size) => ({
          value: size,
          text: size,
        })) || []
      );
    }
    case "wordSize":
      return (
        compressConfig.compress.wordSizes[method]?.map((size) => ({
          value: String(size),
          text: String(size),
        })) || []
      );
    case "solidBlockSize":
      return compressConfig.compress.solidBlockSizes.map((size) => ({
        value: size,
        text: size,
      }));
    case "encryptionMethod":
      if (format === "7z") {
        return [{ value: "AES-256", text: "* AES-256" }];
      } else if (format === "zip") {
        return [
          { value: "ZipCrypto", text: "* ZipCrypto" },
          { value: "AES-256", text: "AES-256" },
        ];
      }
      return [];
    default:
      return [];
  }
};
const updateOutputLocation = (value: string | number | boolean): void => {
  outputLocation.value = String(value);
};
const clearOutputLocation = (_fieldId: string): void => {
  outputLocation.value = "";
};
const updateOutputFilename = (value: string | number | boolean): void => {
  outputFilename.value = String(value);
};
const clearOutputFilename = (_fieldId: string): void => {
  outputFilename.value = "";
};
const browseTopLevelOutputFolder = async (): Promise<void> => {
  try {
    const selected: string | null = await open({
      directory: true,
      multiple: false,
    });
    if (selected && typeof selected === "string") {
      outputLocation.value = selected;
    }
  } catch (error) {
    console.error("Error selecting output folder:", error);
  }
};

// Exposed methods for parent components to set output values
const setOutputLocation = (location: string): void => {
  outputLocation.value = location;
};

const setOutputFilename = (filename: string): void => {
  outputFilename.value = filename;
};
const handleGlobalUnsetOrClear = (fieldId: string): void => {
  const defaultValue = getActualDefaultValue(fieldId);
  jobsStore.updateGlobalSettings({ [fieldId]: defaultValue });
};
const handleJobUnsetOrClear = (fieldId: string): void => {
  if (selectedJob.value) {
    const defaultValue = getActualDefaultValue(fieldId);
    jobsStore.updateJobSettings(selectedJob.value.id, {
      [fieldId]: defaultValue,
    });
  }
};
const handleResetToGlobal = (fieldId: string): void => {
  if (selectedJob.value) {
    jobsStore.updateJobSettings(selectedJob.value.id, { [fieldId]: undefined });
  }
};
const toggleLock = (key: string): void => {
  if (activeTab.value !== "job" || !selectedJob.value) return;
  const isLocked = lockStates.value[key];
  const jobSettings = selectedJob.value.settings as Record<string, unknown>;
  if (isLocked) {
    jobSettings[key] = globalSettings.value[key as keyof CompressionSettings];
    lockStates.value[key] = false;
  } else {
    jobSettings[key] = undefined;
    lockStates.value[key] = true;
  }
};
const browseOutputFolder = async (context: "global" | "job"): Promise<void> => {
  try {
    const selected: string | null = await open({
      directory: true,
      multiple: false,
    });
    if (selected && typeof selected === "string") {
      updateSetting("outputFolder", selected, context);
    }
  } catch (error) {
    console.error("Error selecting output folder:", error);
  }
};
const getDisplayValue = (key: string, context: "global" | "job"): string | number | boolean => {
  const typedKey = key as keyof CompressionSettings;
  let value;
  if (context === "job" && selectedJob.value) {
    value =
      selectedJob.value.settings[typedKey] !== undefined ? selectedJob.value.settings[typedKey] : globalSettings.value[typedKey];
  } else {
    value = globalSettings.value[typedKey];
  }
  if (key === "useInputLocationsForOutput") {
    return value === true ? "use_input" : "use_specified";
  } else if (key === "createMultipleArchives") {
    return value === true ? "multiple" : "single";
  }
  return value;
};
const updateSetting = (key: string, value: string | number | boolean, context: "global" | "job"): void => {
  if (context === "job" && lockStates.value[key]) return;
  const typedKey = key as keyof CompressionSettings;
  let typedValue: string | number | boolean = value;
  if (key === "useInputLocationsForOutput") {
    typedValue = String(value) === "use_input";
  } else if (key === "createMultipleArchives") {
    typedValue = String(value) === "multiple";
  } else if (["compressionLevel", "wordSize"].includes(key)) {
    typedValue = Number(value);
  }
  if (context === "global") {
    jobsStore.updateGlobalSettings({ [typedKey]: typedValue });
  } else if (selectedJob.value) {
    jobsStore.updateJobSettings(selectedJob.value.id, {
      [typedKey]: typedValue,
    });
  }
};
const evaluateDependency = (dependsOn: FieldDependency | undefined, context: "global" | "job"): boolean => {
  if (!dependsOn) return true;
  const fieldValue =
    context === "global"
      ? globalSettings.value[dependsOn.field as keyof CompressionSettings]
      : selectedJob.value?.settings[dependsOn.field as keyof CompressionSettings] ??
        globalSettings.value[dependsOn.field as keyof CompressionSettings];
  return fieldValue === dependsOn.value;
};
// MODIFIED: Helper functions to simplify template logic and improve type safety
const getJobFieldDisabledState = (fieldId: string): boolean => {
  if (fieldId === "outputFolder") {
    return (
      (lockStates.value["useInputLocationsForOutput"] ?? false) ||
      getDisplayValue("useInputLocationsForOutput", "job") === "use_input" ||
      (lockStates.value[fieldId] ?? false)
    );
  }
  return lockStates.value[fieldId] ?? false;
};
const getJobFieldInputType = (fieldId: string, defaultType: InputType): InputType => {
  return lockStates.value[fieldId] ?? false ? "input" : defaultType;
};
const getJobFieldLockedState = (fieldId: string): boolean => {
  return lockStates.value[fieldId] ?? false;
};
const getJobFieldModelValue = (fieldId: string): string | number | boolean => {
  return lockStates.value[fieldId] ?? false ? getFormattedGlobalValue(fieldId) : getDisplayValue(fieldId, "job");
};
const getJobFieldOptions = (fieldId: string, fieldType: InputType, defaultOptions: FieldOption[] | undefined): FieldOption[] => {
  if (fieldType === "select" && !(lockStates.value[fieldId] ?? false)) {
    return defaultOptions ?? getOptions(fieldId, "job");
  }
  return [];
};
const handleTransitionEnd = (): void => {
  if (scrollbarRef.value?.osInstance) {
    const osInstance = scrollbarRef.value.osInstance();
    const contentElement = osInstance.elements().content;
    if (contentElement) {
      contentElement.style.overflow = "hidden";
      setTimeout(() => {
        contentElement.style.overflow = "";
        osInstance.update();
        if (DEBUG && debugConfig.logUIEvents) {
          logInteraction("CompressionSection", "OverlayScrollbars instance updated.");
        }
      }, 0);
    }
  }
};

// Expose methods for parent components
defineExpose({
  setOutputLocation,
  setOutputFilename,
  getCurrentArchiveFormat,
  getArchiveExtension,
});
</script>
<style scoped>
@import "./compression-section-comp/compression-section.scoped.css";
/* Simple filename preview styles */
.compression-section__filename-preview {
  display: grid;
  gap: 0.25rem;
  padding-inline: var(--pad-in);
  margin-block-start: 0.5rem;
}
.compression-section__filename-label {
  color: var(--txt-clr-lite);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.compression-section__filename-row {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: var(--pad-in);
}
.compression-section__filename-text {
  color: var(--txt-clr);
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
