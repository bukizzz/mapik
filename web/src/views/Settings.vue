<script setup lang="ts">
import { settingsApi, type SettingCategory } from "@/api/settings"; // Uvozi API za podešavanja i tip SettingCategory
import { HelpCircle, Save } from "@vicons/ionicons5"; // Uvozi ikone iz Ionicons 5
import {
  NButton,
  NCard,
  NForm,
  NFormItem,
  NGrid,
  NGridItem,
  NIcon,
  NInput,
  NInputNumber,
  NSpace,
  NTooltip,
  useMessage,
} from "naive-ui"; // Uvozi komponente iz Naive UI
import { ref } from "vue"; // Uvozi funkciju ref iz Vue
import { useI18n } from "vue-i18n"; // Uvozi useI18n za internacionalizaciju

const settingList = ref<SettingCategory[]>([]); // Reaktivna referenca za listu kategorija podešavanja
const formRef = ref(); // Referenca na formu
const form = ref<Record<string, string | number>>({}); // Reaktivna referenca za podatke forme
const isSaving = ref(false); // Reaktivna referenca za status čuvanja
const message = useMessage(); // Instanca za poruke
const { t } = useI18n(); // Inicijalizuje funkciju za prevođenje

// Dohvata podešavanja sa API-ja.
fetchSettings();

async function fetchSettings() {
  try {
    const data = await settingsApi.getSettings(); // Dohvata podešavanja
    settingList.value = data || []; // Postavlja listu podešavanja
    initForm(); // Inicijalizuje formu
  } catch (_error) {
    message.error(t("settings.fetchFailed")); // Prikazuje grešku ako dohvatanje ne uspe
  }
}

function initForm() {
  form.value = settingList.value.reduce((acc: Record<string, string | number>, category) => {
    category.settings?.forEach(setting => {
      acc[setting.key] = setting.value; // Popunjava formu sa vrednostima podešavanja
    });
    return acc;
  }, {});
}

// Obrađuje slanje forme za ažuriranje podešavanja.
async function handleSubmit() {
  if (isSaving.value) {
    return; // Sprečava višestruko slanje
  }

  try {
    await formRef.value.validate(); // Validira formu
    isSaving.value = true; // Postavlja status čuvanja na true
    try {
      await settingsApi.updateSettings(form.value); // Ažurira podešavanja putem API-ja
      message.success(t("settings.updateSuccess")); // Prikazuje poruku o uspehu
      await fetchSettings(); // Ponovo dohvata podešavanja
    } catch (_error) {
      message.error(t("settings.updateFailed")); // Prikazuje grešku ako ažuriranje ne uspe
    }
  } finally {
    isSaving.value = false; // Postavlja status čuvanja na false
  }
}
</script>

<template>
  <n-space vertical>
    <n-form ref="formRef" :model="form" label-placement="top">
      <n-space vertical>
        <n-card
          size="small"
          v-for="category in settingList"
          :key="category.category_name"
          :title="t(`settings.categories.${category.category_name.replace(/ /g, '')}`)"
          hoverable
          bordered
        >
          <n-grid :x-gap="24" :y-gap="24" responsive="screen" cols="1 s:2 m:2 l:3 xl:4">
            <n-grid-item v-for="item in category.settings" :key="item.key">
              <n-form-item
                :path="item.key"
                :rule="{
                  required: true,
                  message: t('settings.inputRequired', { name: item.name }),
                }"
              >
                <template #label>
                  <n-space align="center" :size="4" :wrap-item="false">
                    <n-tooltip trigger="hover" placement="top">
                      <template #trigger>
                        <n-icon
                          :component="HelpCircle"
                          :size="16"
                          style="cursor: help; color: #9ca3af"
                        />
                      </template>
                      {{ item.description }}
                    </n-tooltip>
                    <span>{{ t(`settings.fields.${item.name}`) }}</span>
                  </n-space>
                </template>

                <n-input-number
                  v-if="item.type === 'int'"
                  v-model:value="form[item.key] as number"
                  :min="
                    item.min_value !== undefined && item.min_value >= 0 ? item.min_value : undefined
                  "
                  :placeholder="t('settings.inputPlaceholder')"
                  clearable
                  style="width: 100%"
                  size="small"
                />
                <n-input
                  v-else
                  v-model:value="form[item.key] as string"
                  :placeholder="t('settings.inputContentPlaceholder')"
                  clearable
                  size="small"
                />
              </n-form-item>
            </n-grid-item>
          </n-grid>
        </n-card>
      </n-space>
    </n-form>

    <div
      v-if="settingList.length > 0"
      style="display: flex; justify-content: center; padding-top: 12px"
    >
      <n-button
        type="primary"
        size="large"
        :loading="isSaving"
        :disabled="isSaving"
        @click="handleSubmit"
        style="min-width: 200px"
      >
        <template #icon>
          <n-icon :component="Save" />
        </template>
        {{ isSaving ? t("settings.saving") : t("settings.save") }}
      </n-button>
    </div>
  </n-space>
</template>
