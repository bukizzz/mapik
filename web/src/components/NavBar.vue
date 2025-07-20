<script setup lang="ts">
import { GlobeOutline } from "@vicons/ionicons5";
import { NButton, NDropdown, NIcon, type MenuOption } from "naive-ui";
import { computed, h } from "vue";
import { useI18n } from "vue-i18n";
import { RouterLink, useRoute } from "vue-router";

const { t, locale } = useI18n();

const menuOptions = computed<MenuOption[]>(() => [
  renderMenuItem("dashboard", t("navbar.dashboard"), "📊"),
  renderMenuItem("keys", t("navbar.keys"), "🔑"),
  renderMenuItem("logs", t("navbar.logs"), "📋"),
  renderMenuItem("settings", t("navbar.settings"), "⚙️"),
]);

const route = useRoute();
const activeMenu = computed(() => route.name);

function renderMenuItem(key: string, label: string, icon: string): MenuOption {
  return {
    label: () =>
      h(
        RouterLink,
        {
          to: {
            name: key,
          },
          class: "nav-menu-item",
        },
        {
          default: () => [
            h("span", { class: "nav-item-icon" }, icon),
            h("span", { class: "nav-item-text" }, label),
          ],
        }
      ),
    key,
  };
}

const languageOptions = computed(() => [
  {
    label: t("languages.en"),
    key: "en",
  },
  {
    label: t("languages.zh"),
    key: "zh",
  },
  {
    label: t("languages.sr"),
    key: "sr",
  },
]);

const handleLanguageChange = (key: string) => {
  locale.value = key;
};

const currentLanguageLabel = computed(() => {
  const current = languageOptions.value.find(option => option.key === locale.value);
  return current ? current.label : "";
});
</script>

<template>
  <div class="navbar-container">
    <n-menu
      mode="horizontal"
      :options="menuOptions"
      :value="activeMenu"
      responsive
      class="modern-menu"
    />
    <div class="navbar-actions">
      <n-dropdown trigger="click" :options="languageOptions" @select="handleLanguageChange">
        <n-button text>
          <template #icon>
            <n-icon :component="GlobeOutline" />
          </template>
          {{ currentLanguageLabel }}
        </n-button>
      </n-dropdown>
    </div>
  </div>
</template>

<style scoped>
.navbar-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.navbar-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

:deep(.nav-menu-item) {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: inherit;
  padding: 8px;
  border-radius: var(--border-radius-md);
  transition: all 0.2s ease;
  font-weight: 500;
}

:deep(.n-menu-item-content) {
  padding: 0 10px !important;
}

:deep(.nav-item-text) {
  font-size: 0.95rem;
  letter-spacing: 0.2px;
}

:deep(.n-menu-item) {
  border-radius: var(--border-radius-md);
  margin: 0 4px;
  transition: all 0.2s ease;
}

:deep(.n-menu-item:hover) {
  background: rgba(102, 126, 234, 0.1);
  transform: translateY(-1px);
}

:deep(.n-menu-item--selected) {
  background: var(--primary-gradient);
  color: white;
  font-weight: 600;
  box-shadow: var(--shadow-md);
}

:deep(.n-menu-item--selected:hover) {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
  transform: translateY(-1px);
}
</style>
