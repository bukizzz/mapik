<script setup lang="ts">
import { keysApi } from "@/api/keys";
import { settingsApi } from "@/api/settings";
import type { Group, GroupConfigOption, UpstreamInfo } from "@/types/models";
import { Add, Close, Remove } from "@vicons/ionicons5";
import {
  NButton,
  NCard,
  NCollapse,
  NCollapseItem,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NModal,
  NSelect,
  useMessage,
  type FormRules,
} from "naive-ui";
import { computed, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

interface Props {
  show: boolean;
  group?: Group | null;
}

interface Emits {
  (e: "update:show", value: boolean): void;
  (e: "success", value: Group): void;
}

// Tip za konfiguracionu stavku.
interface ConfigItem {
  key: string;
  value: number;
}

const props = withDefaults(defineProps<Props>(), {
  group: null,
});

const emit = defineEmits<Emits>();

const message = useMessage();
const loading = ref(false);
const formRef = ref();

// Definiše strukturu podataka forme grupe.
interface GroupFormData {
  name: string;
  display_name: string;
  description: string;
  upstreams: UpstreamInfo[];
  channel_type: "openai" | "gemini" | "anthropic";
  sort: number;
  test_model: string;
  param_overrides: string;
  config: Record<string, number>;
  configItems: ConfigItem[];
}

// Reaktivni objekat podataka forme.
const formData = reactive<GroupFormData>({
  name: "",
  display_name: "",
  description: "",
  upstreams: [
    {
      url: "",
      weight: 1,
    },
  ] as UpstreamInfo[],
  channel_type: "openai",
  sort: 1,
  test_model: "",
  param_overrides: "",
  config: {},
  configItems: [] as ConfigItem[],
});

const channelTypeOptions = ref<{ label: string; value: string }[]>([]);
const configOptions = ref<GroupConfigOption[]>([]);
const channelTypesFetched = ref(false);
const configOptionsFetched = ref(false);

// Dinamički generiše tekst čuvara mesta za unos test modela na osnovu izabranog tipa kanala.
const testModelPlaceholder = computed(() => {
  switch (formData.channel_type) {
    case "openai":
      return t("keys.groupForm.testModelOpenAIPlaceholder");
    case "gemini":
      return t("keys.groupForm.testModelGeminiPlaceholder");
    case "anthropic":
      return t("keys.groupForm.testModelAnthropicPlaceholder");
    default:
      return t("keys.groupForm.testModelDefaultPlaceholder");
  }
});

const upstreamPlaceholder = computed(() => {
  switch (formData.channel_type) {
    case "openai":
      return "https://api.openai.com";
    case "gemini":
      return "https://generativelanguage.googleapis.com";
    case "anthropic":
      return "https://api.anthropic.com";
    default:
      return t("keys.groupForm.upstreamDefaultPlaceholder");
  }
});

// Pravila validacije za polja forme.
const rules: FormRules = {
  name: [
    {
      required: true,
      message: t("keys.groupForm.nameRequired"),
      trigger: ["blur", "input"],
    },
    {
      pattern: /^[a-z0-9_-]{3,30}$/,
      message: t("keys.groupForm.namePattern"),
      trigger: ["blur", "input"],
    },
  ],
  channel_type: [
    {
      required: true,
      message: t("keys.groupForm.channelTypeRequired"),
      trigger: ["blur", "change"],
    },
  ],
  test_model: [
    {
      required: true,
      message: t("keys.groupForm.testModelRequired"),
      trigger: ["blur", "input"],
    },
  ],
  upstreams: [
    {
      type: "array",
      min: 1,
      message: t("keys.groupForm.upstreamsMin"),
      trigger: ["blur", "change"],
    },
  ],
};

// Prati promene u vidljivosti modala.
watch(
  () => props.show,
  show => {
    if (show) {
      if (!channelTypesFetched.value) {
        fetchChannelTypes();
      }
      if (!configOptionsFetched.value) {
        fetchGroupConfigOptions();
      }
      resetForm();
      if (props.group) {
        loadGroupData();
      }
    }
  }
);

// Resetuje formu na početno stanje.
function resetForm() {
  Object.assign(formData, {
    name: "",
    display_name: "",
    description: "",
    upstreams: [{ url: "", weight: 1 }],
    channel_type: "openai",
    sort: 1,
    test_model: "",
    param_overrides: "",
    config: {},
    configItems: [],
  });
}

// Učitava podatke grupe u formu kada je u režimu uređivanja.
function loadGroupData() {
  if (!props.group) {
    return;
  }

  const configItems = Object.entries(props.group.config || {}).map(([key, value]) => ({
    key,
    value: Number(value) || 0,
  }));
  Object.assign(formData, {
    name: props.group.name || "",
    display_name: props.group.display_name || "",
    description: props.group.description || "",
    upstreams: props.group.upstreams?.length
      ? [...props.group.upstreams]
      : [{ url: "", weight: 1 }],
    channel_type: props.group.channel_type || "openai",
    sort: props.group.sort || 1,
    test_model: props.group.test_model || "",
    param_overrides: JSON.stringify(props.group.param_overrides || {}, null, 2),
    config: {},
    configItems,
  });
}

async function fetchChannelTypes() {
  const options = (await settingsApi.getChannelTypes()) || [];
  channelTypeOptions.value =
    options?.map((type: string) => ({
      label: type,
      value: type,
    })) || [];
  channelTypesFetched.value = true;
}

// Dodaje novo polje za upstream URL.
function addUpstream() {
  formData.upstreams.push({
    url: "",
    weight: 1,
  });
}

// Uklanja polje za upstream URL.
function removeUpstream(index: number) {
  if (formData.upstreams.length > 1) {
    formData.upstreams.splice(index, 1);
  }
}

async function fetchGroupConfigOptions() {
  const options = await keysApi.getGroupConfigOptions();
  configOptions.value = options || [];
  configOptionsFetched.value = true;
}

// Dodaje novo polje za konfiguracionu stavku.
function addConfigItem() {
  formData.configItems.push({
    key: "",
    value: 0,
  });
}

// Uklanja polje za konfiguracionu stavku.
function removeConfigItem(index: number) {
  formData.configItems.splice(index, 1);
}

// Postavlja podrazumevanu vrednost za konfiguracionu stavku kada se njen ključ promeni.
function handleConfigKeyChange(index: number, key: string) {
  const option = configOptions.value.find(opt => opt.key === key);
  if (option) {
    formData.configItems[index].value = option.default_value || 0;
  }
}

// Zatvara modal.
function handleClose() {
  emit("update:show", false);
}

// Obrađuje slanje forme.
async function handleSubmit() {
  if (loading.value) {
    return;
  }

  try {
    await formRef.value?.validate();

    loading.value = true;

    // Validira JSON format za premošćavanje parametara.
    let paramOverrides = {};
    if (formData.param_overrides) {
      try {
        paramOverrides = JSON.parse(formData.param_overrides);
      } catch {
        message.error(t("keys.groupForm.paramOverridesInvalidJson"));
        return;
      }
    }

    // Konvertuje configItems u config objekat.
    const config: Record<string, number> = {};
    formData.configItems.forEach((item: ConfigItem) => {
      if (item.key && item.key.trim()) {
        config[item.key] = item.value;
      }
    });

    // Izgradi objekat podataka za slanje.
    const submitData = {
      name: formData.name,
      display_name: formData.display_name,
      description: formData.description,
      upstreams: formData.upstreams.filter((upstream: UpstreamInfo) => upstream.url.trim()),
      channel_type: formData.channel_type,
      sort: formData.sort,
      test_model: formData.test_model,
      param_overrides: formData.param_overrides ? paramOverrides : undefined,
      config,
    };

    let res: Group;
    if (props.group?.id) {
      // Režim uređivanja
      res = await keysApi.updateGroup(props.group.id, submitData);
    } else {
      // Režim kreiranja
      res = await keysApi.createGroup(submitData);
    }

    emit("success", res);
    handleClose();
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <n-modal :show="show" @update:show="handleClose" class="group-form-modal">
    <n-card
      style="width: 800px"
      :title="group ? t('keys.groupForm.editTitle') : t('keys.groupForm.createTitle')"
      :bordered="false"
      size="huge"
      role="dialog"
      aria-modal="true"
    >
      <template #header-extra>
        <n-button quaternary circle @click="handleClose">
          <template #icon>
            <n-icon :component="Close" />
          </template>
        </n-button>
      </template>

      <n-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-placement="left"
        label-width="120px"
        require-mark-placement="right-hanging"
      >
        <!-- Osnovne informacije -->
        <div class="form-section">
          <h4 class="section-title">{{ t("keys.groupForm.baseInfo") }}</h4>

          <n-form-item :label="t('keys.groupForm.nameLabel')" path="name">
            <n-input
              v-model:value="formData.name"
              :placeholder="t('keys.groupForm.namePlaceholder')"
            />
          </n-form-item>

          <n-form-item :label="t('keys.groupForm.displayNameLabel')" path="display_name">
            <n-input
              v-model:value="formData.display_name"
              :placeholder="t('keys.groupForm.displayNamePlaceholder')"
            />
          </n-form-item>

          <n-form-item :label="t('keys.groupForm.channelTypeLabel')" path="channel_type">
            <n-select
              v-model:value="formData.channel_type"
              :options="channelTypeOptions"
              :placeholder="t('keys.groupForm.channelTypePlaceholder')"
            />
          </n-form-item>

          <n-form-item :label="t('keys.groupForm.testModelLabel')" path="test_model">
            <n-input v-model:value="formData.test_model" :placeholder="testModelPlaceholder" />
          </n-form-item>

          <n-form-item :label="t('keys.groupForm.sortLabel')" path="sort">
            <n-input-number
              v-model:value="formData.sort"
              :min="0"
              :placeholder="t('keys.groupForm.sortPlaceholder')"
            />
          </n-form-item>

          <n-form-item :label="t('keys.groupForm.descriptionLabel')" path="description">
            <n-input
              v-model:value="formData.description"
              type="textarea"
              :placeholder="t('keys.groupForm.descriptionPlaceholder')"
              :rows="2"
              :autosize="{ minRows: 2, maxRows: 2 }"
              style="resize: none"
            />
          </n-form-item>
        </div>

        <!-- Upstream URL-ovi -->
        <div class="form-section" style="margin-top: 10px">
          <h4 class="section-title">{{ t("keys.groupForm.upstreams") }}</h4>

          <n-form-item
            v-for="(upstream, index) in formData.upstreams"
            :key="index"
            :label="t('keys.groupForm.upstreamLabel', { index: index + 1 })"
            :path="`upstreams[${index}].url`"
            :rule="{
              required: true,
              message: '',
              trigger: ['blur', 'input'],
            }"
          >
            <div class="flex items-center gap-2" style="width: 100%">
              <n-input
                v-model:value="upstream.url"
                :placeholder="upstreamPlaceholder"
                style="flex: 1"
              />
              <span class="form-label">{{ t("keys.groupForm.weightLabel") }}</span>
              <n-input-number
                v-model:value="upstream.weight"
                :min="1"
                :placeholder="t('keys.groupForm.weightPlaceholder')"
                style="width: 100px"
              />
              <div style="width: 40px">
                <n-button
                  v-if="formData.upstreams.length > 1"
                  @click="removeUpstream(index)"
                  type="error"
                  quaternary
                  circle
                  style="margin-left: 10px"
                >
                  <template #icon>
                    <n-icon :component="Remove" />
                  </template>
                </n-button>
              </div>
            </div>
          </n-form-item>

          <n-form-item>
            <n-button @click="addUpstream" dashed style="width: 100%">
              <template #icon>
                <n-icon :component="Add" />
              </template>
              {{ t("keys.groupForm.addUpstream") }}
            </n-button>
          </n-form-item>
        </div>

        <!-- Napredna konfiguracija -->
        <div class="form-section" style="margin-top: 10px">
          <n-collapse>
            <n-collapse-item :title="t('keys.groupForm.advancedConfig')" name="advanced">
              <div class="config-section">
                <h5 class="config-title">{{ t("keys.groupForm.groupConfig") }}</h5>

                <div class="config-items">
                  <n-form-item
                    v-for="(configItem, index) in formData.configItems"
                    :key="index"
                    class="flex config-item"
                    :label="t('keys.groupForm.configLabel', { index: index + 1 })"
                    :path="`configItems[${index}].key`"
                    :rule="{
                      required: true,
                      message: '',
                      trigger: ['blur', 'change'],
                    }"
                  >
                    <div class="flex items-center" style="width: 100%">
                      <n-select
                        v-model:value="configItem.key"
                        :options="
                          configOptions.map((opt: GroupConfigOption) => ({
                            label: opt.name,
                            value: opt.key,
                            disabled:
                              formData.configItems
                                .map((item: ConfigItem) => item.key)
                                ?.includes(opt.key) && opt.key !== configItem.key,
                          }))
                        "
                        :placeholder="t('keys.groupForm.configKeyPlaceholder')"
                        style="min-width: 200px"
                        @update:value="(value: string) => handleConfigKeyChange(index, value)"
                        clearable
                      />
                      <n-input-number
                        v-model:value="configItem.value"
                        :placeholder="t('keys.groupForm.configValuePlaceholder')"
                        style="width: 180px; margin-left: 15px"
                        :precision="0"
                      />
                      <n-button
                        @click="removeConfigItem(index)"
                        type="error"
                        quaternary
                        circle
                        size="small"
                        style="margin-left: 10px"
                      >
                        <template #icon>
                          <n-icon :component="Remove" />
                        </template>
                      </n-button>
                    </div>
                  </n-form-item>
                </div>

                <div style="margin-top: 12px; padding-left: 120px">
                  <n-button
                    @click="addConfigItem"
                    dashed
                    style="width: 100%"
                    :disabled="formData.configItems.length >= configOptions.length"
                  >
                    <template #icon>
                      <n-icon :component="Add" />
                    </template>
                    {{ t("keys.groupForm.addConfig") }}
                  </n-button>
                </div>
              </div>
              <div class="config-section">
                <h5 class="config-title">{{ t("keys.groupForm.paramOverrides") }}</h5>
                <div class="config-items">
                  <n-form-item path="param_overrides">
                    <n-input
                      v-model:value="formData.param_overrides"
                      type="textarea"
                      :placeholder="t('keys.groupForm.paramOverridesPlaceholder')"
                      :rows="4"
                    />
                  </n-form-item>
                </div>
              </div>
            </n-collapse-item>
          </n-collapse>
        </div>
      </n-form>

      <template #footer>
        <div style="display: flex; justify-content: flex-end; gap: 12px">
          <n-button @click="handleClose">{{ t("keys.groupForm.cancel") }}</n-button>
          <n-button type="primary" @click="handleSubmit" :loading="loading">
            {{ group ? t("keys.groupForm.update") : t("keys.groupForm.create") }}
          </n-button>
        </div>
      </template>
    </n-card>
  </n-modal>
</template>

<style scoped>
.group-form-modal {
  --n-color: rgba(255, 255, 255, 0.95);
}

.form-section {
  margin-top: 20px;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid rgba(102, 126, 234, 0.1);
}

:deep(.n-form-item-label) {
  font-weight: 500;
}

:deep(.n-form-item-blank) {
  flex-grow: 1;
}

:deep(.n-input) {
  --n-border-radius: 6px;
}

:deep(.n-select) {
  --n-border-radius: 6px;
}

:deep(.n-input-number) {
  --n-border-radius: 6px;
}

:deep(.n-card-header) {
  border-bottom: 1px solid rgba(239, 239, 245, 0.8);
  padding: 10px 20px;
}

:deep(.n-card__content) {
  max-height: calc(100vh - 68px - 61px - 50px);
  overflow-y: auto;
}

:deep(.n-card__footer) {
  border-top: 1px solid rgba(239, 239, 245, 0.8);
  padding: 10px 15px;
}

:deep(.n-form-item-feedback-wrapper) {
  min-height: 10px;
}

.config-section {
  margin-top: 16px;
}

.config-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 12px 0;
}

.form-label {
  margin-left: 25px;
  margin-right: 10px;
  height: 34px;
  line-height: 34px;
  font-weight: 500;
}

.config-item {
  margin-bottom: 12px;
}
:deep(.n-base-selection-label) {
  height: 40px;
}
</style>
