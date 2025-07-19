<!-- eslint-disable vue/html-self-closing @preserve -->
<!-- components/CompressionSectionNew.vue @preserve -->

<template>
  <section id="compression-section" data-component-name="CompressionSectionNew">
    <div class="tabs">
      <CustomButton
        :class="{ active: activeTab === 'global' }"
        button-style-class="trans-btn btn-dark can-become-active active-line-block-end"
        data-name="global-settings-btn"
        @click="activeTab = 'global'"
      >
        Global Settings
      </CustomButton>
      <CustomButton
        :class="{ active: activeTab === 'job' }"
        button-style-class="trans-btn btn-dark can-become-active active-line-block-end"
        data-name="job-specific-settings-btn"
        @click="activeTab = 'job'"
      >
        Job Settings
      </CustomButton>
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
      class="content"
    >
      <template v-if="activeTab === 'global'">
        <AccordionComp
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
            <form class="settings-form" @submit.prevent>
              <fieldset class="output-location">
                <template v-for="field in generalConfig.general.fields" :key="field.id">
                  <CustomFieldNew
                    v-if="!field.dependsOn || evaluateDependency(field.dependsOn, 'global')"
                    :data-field-name="field['data-field-name']"
                    :default-value="field.default"
                    :extra-classes="[`${field.id}-field`]"
                    :field-id="field.id"
                    :global-value="getDisplayValue(field.id, 'global')"
                    :input-type="field.type"
                    :model-value="getDisplayValue(field.id, 'global')"
                    :options="field.options ?? []"
                    :title="field.label"
                    @unset-or-clear="handleGlobalUnsetOrClear"
                    @update:model-value="updateSetting(field.id, $event, 'global')"
                  >
                    <template v-if="field.id === 'outputFolder'" #buttons-end>
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
                    </template>
                  </CustomFieldNew>
                </template>
              </fieldset>
            </form>
          </template>
          <template #compression>
            <form class="settings-form" @submit.prevent>
              <template v-for="field in compressConfig.compress.fields" :key="field.id">
                <CustomFieldNew
                  v-if="!field.dependsOn || evaluateDependency(field.dependsOn, 'global')"
                  :data-field-name="field['data-field-name']"
                  :default-value="field.default"
                  :extra-classes="[`${field.id}-field`]"
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
            <form class="settings-form" @submit.prevent>
              <template v-for="field in advancedConfig.advanced.fields" :key="field.id">
                <CustomFieldNew
                  v-if="!field.dependsOn || evaluateDependency(field.dependsOn, 'global')"
                  :data-field-name="field['data-field-name']"
                  :default-value="field.default"
                  :extra-classes="[`${field.id}-field`]"
                  :field-id="field.id"
                  :global-value="getDisplayValue(field.id, 'global')"
                  :input-type="field.type"
                  :model-value="getDisplayValue(field.id, 'global')"
                  :options="field.options ?? []"
                  :title="field.label"
                  @unset-or-clear="handleGlobalUnsetOrClear"
                  @update:model-value="updateSetting(field.id, $event, 'global')"
                />
              </template>
            </form>
          </template>
          <template #encryption>
            <form class="settings-form" @submit.prevent>
              <template v-for="field in encryptConfig.encrypt.fields" :key="field.id">
                <CustomFieldNew
                  v-if="!field.dependsOn || evaluateDependency(field.dependsOn, 'global')"
                  :data-field-name="field['data-field-name']"
                  :default-value="field.default"
                  :extra-classes="[`${field.id}-field`]"
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
        </AccordionComp>
      </template>
      <template v-else-if="activeTab === 'job'">
        <div v-if="selectedJob">
          <AccordionComp
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
              <form class="settings-form" @submit.prevent>
                <fieldset class="output-location">
                  <template v-for="field in generalConfig.general.fields" :key="field.id">
                    <CustomFieldNew
                      v-if="!field.dependsOn || evaluateDependency(field.dependsOn, 'job')"
                      :data-field-name="field['data-field-name']"
                      :default-value="field.default"
                      :disabled="
                        field.id === 'outputFolder'
                          ? lockStates['useInputLocationsForOutput'] ||
                            getDisplayValue('useInputLocationsForOutput', 'job') === 'use_input' ||
                            lockStates[field.id] ||
                            false
                          : lockStates[field.id] || false
                      "
                      :extra-classes="[`${field.id}-field`]"
                      :field-id="field.id"
                      :global-value="getDisplayValue(field.id, 'global')"
                      :input-type="lockStates[field.id] ? 'input' : field.type"
                      :is-job-settings="true"
                      :is-locked="lockStates[field.id] ?? false"
                      :model-value="lockStates[field.id] ? getFormattedGlobalValue(field.id) : getDisplayValue(field.id, 'job')"
                      :options="field.type === 'select' && !lockStates[field.id] ? field.options ?? [] : []"
                      :show-wrapper="true"
                      :title="field.label"
                      @reset-to-global="handleResetToGlobal"
                      @unset-or-clear="handleJobUnsetOrClear"
                      @update:model-value="updateSetting(field.id, $event, 'job')"
                    >
                      <template #before-input>
                        <LockButton
                          v-if="field.type === 'select'"
                          :is-locked="lockStates[field.id]"
                          @click="toggleLock(field.id)"
                        />
                      </template>
                      <template v-if="field.id === 'outputFolder'" #buttons-end>
                        <DropdownMenu
                          button-class="browse-btn"
                          button-style-class="trans-btn"
                          dropdown-data-name="browse-output-folder-job"
                          :disabled="
                            lockStates['useInputLocationsForOutput'] ||
                            getDisplayValue('useInputLocationsForOutput', 'job') === 'use_input' ||
                            lockStates[field.id] ||
                            false
                          "
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
                      </template>
                    </CustomFieldNew>
                  </template>
                </fieldset>
              </form>
            </template>
            <template #compression>
              <form class="settings-form" @submit.prevent>
                <template v-for="field in compressConfig.compress.fields" :key="field.id">
                  <CustomFieldNew
                    v-if="!field.dependsOn || evaluateDependency(field.dependsOn, 'job')"
                    :data-field-name="field['data-field-name']"
                    :default-value="field.default"
                    :disabled="lockStates[field.id] || false"
                    :extra-classes="[`${field.id}-field`]"
                    :field-id="field.id"
                    :global-value="getDisplayValue(field.id, 'global')"
                    :input-type="lockStates[field.id] ? 'input' : field.type"
                    :is-job-settings="true"
                    :is-locked="lockStates[field.id] ?? false"
                    :model-value="lockStates[field.id] ? getFormattedGlobalValue(field.id) : getDisplayValue(field.id, 'job')"
                    :options="
                      field.type === 'select' && !lockStates[field.id] ? field.options ?? getOptions(field.id, 'job') : []
                    "
                    :show-wrapper="true"
                    :title="field.label"
                    @reset-to-global="handleResetToGlobal"
                    @unset-or-clear="handleJobUnsetOrClear"
                    @update:model-value="updateSetting(field.id, $event, 'job')"
                  >
                    <template #before-input>
                      <LockButton
                        v-if="field.type === 'select'"
                        :is-locked="lockStates[field.id]"
                        @click="toggleLock(field.id)"
                      />
                    </template>
                  </CustomFieldNew>
                </template>
              </form>
            </template>
            <template #advanced>
              <form class="settings-form" @submit.prevent>
                <template v-for="field in advancedConfig.advanced.fields" :key="field.id">
                  <CustomFieldNew
                    v-if="!field.dependsOn || evaluateDependency(field.dependsOn, 'job')"
                    :data-field-name="field['data-field-name']"
                    :default-value="field.default"
                    :disabled="lockStates[field.id] || false"
                    :extra-classes="[`${field.id}-field`]"
                    :field-id="field.id"
                    :global-value="getDisplayValue(field.id, 'global')"
                    :input-type="lockStates[field.id] ? 'input' : field.type"
                    :is-job-settings="true"
                    :is-locked="lockStates[field.id] ?? false"
                    :model-value="lockStates[field.id] ? getFormattedGlobalValue(field.id) : getDisplayValue(field.id, 'job')"
                    :options="field.type === 'select' && !lockStates[field.id] ? field.options ?? [] : []"
                    :show-wrapper="true"
                    :title="field.label"
                    @reset-to-global="handleResetToGlobal"
                    @unset-or-clear="handleJobUnsetOrClear"
                    @update:model-value="updateSetting(field.id, $event, 'job')"
                  >
                    <template #before-input>
                      <LockButton
                        v-if="field.type === 'select' || field.id === 'parameters'"
                        :is-locked="lockStates[field.id]"
                        @click="toggleLock(field.id)"
                      />
                    </template>
                  </CustomFieldNew>
                </template>
              </form>
            </template>
            <template #encryption>
              <form class="settings-form" @submit.prevent>
                <template v-for="field in encryptConfig.encrypt.fields" :key="field.id">
                  <CustomFieldNew
                    v-if="!field.dependsOn || evaluateDependency(field.dependsOn, 'job')"
                    :data-field-name="field['data-field-name']"
                    :default-value="field.default"
                    :disabled="lockStates[field.id] || false"
                    :extra-classes="[`${field.id}-field`]"
                    :field-id="field.id"
                    :global-value="getDisplayValue(field.id, 'global')"
                    :input-type="lockStates[field.id] ? 'input' : field.type"
                    :is-job-settings="true"
                    :is-locked="lockStates[field.id] ?? false"
                    :model-value="lockStates[field.id] ? getFormattedGlobalValue(field.id) : getDisplayValue(field.id, 'job')"
                    :options="
                      field.type === 'select' && !lockStates[field.id] ? field.options ?? getOptions(field.id, 'job') : []
                    "
                    :show-wrapper="true"
                    :title="field.label"
                    @reset-to-global="handleResetToGlobal"
                    @unset-or-clear="handleJobUnsetOrClear"
                    @update:model-value="updateSetting(field.id, $event, 'job')"
                  >
                    <template #before-input>
                      <LockButton
                        v-if="field.type === 'select'"
                        :is-locked="lockStates[field.id]"
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
const generalConfig = generalConfigJson as SettingsConfig;
const advancedConfig = advancedConfigJson as SettingsConfig;
const compressConfig = compressConfigJson as CompressConfigData;
const encryptConfig = encryptConfigJson as SettingsConfig;

const jobsStore = useJobsStore();
const themeStore = useThemeStore();
const dropdownManager = useDropdownManager();
const activeTab = ref<"global" | "job">("global");
const scrollbarRef = ref<ExtendedInstance | null>(null);
const lockStates = ref<Record<string, boolean>>({});
const selectedJob = computed(() => jobsStore.jobs.find((job: Job) => job.id === jobsStore.selectedJobId));
const globalSettings = computed(() => jobsStore.globalSettings);
const currentTheme = computed(() => (themeStore.isEffectiveDark ? "os-theme-light" : "os-theme-dark"));

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

watch(
  selectedJob,
  (newJob) => {
    if (newJob) {
      const allFields = [
        ...generalConfig.general.fields,
        ...compressConfig.compress.fields,
        ...advancedConfig.advanced.fields,
        ...encryptConfig.encrypt.fields,
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
    logInteraction("CompressionSectionNew", "Scroll detected, closing all dropdowns.");
  }
};

const getActualDefaultValue = (key: string): string | number | boolean | undefined => {
  const allFields: FieldConfig[] = [
    ...generalConfig.general.fields,
    ...advancedConfig.advanced.fields,
    ...compressConfig.compress.fields,
    ...encryptConfig.encrypt.fields,
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
    ...generalConfig.general.fields,
    ...advancedConfig.advanced.fields,
    ...compressConfig.compress.fields,
    ...encryptConfig.encrypt.fields,
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
          logInteraction("CompressionSectionNew", "OverlayScrollbars instance updated.");
        }
      }, 0);
    }
  }
};
</script>

<style scoped>
@import "~/components/compression-section-comp/compression-section.scoped.css";
</style>
