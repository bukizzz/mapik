<script setup lang="ts">
import { logApi } from "@/api/logs";
import type { LogFilter, RequestLog } from "@/types/models";
import { maskKey } from "@/utils/display";
import { DownloadOutline, EyeOffOutline, EyeOutline, Search } from "@vicons/ionicons5";
import {
  NButton,
  NDataTable,
  NDatePicker,
  NEllipsis,
  NIcon,
  NInput,
  NSelect,
  NSpace,
  NSpin,
  NTag,
} from "naive-ui";
import { computed, h, onMounted, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

interface LogRow extends RequestLog {
  is_key_visible: boolean;
}

// Podaci komponente.
const loading = ref(false);
const logs = ref<LogRow[]>([]);
const currentPage = ref(1);
const pageSize = ref(15);
const total = ref(0);
const totalPages = computed(() => Math.ceil(total.value / pageSize.value));
const { t } = useI18n();

// Reaktivni objekat filtera za logove.
const filters = reactive({
  group_name: "",
  key_value: "",
  is_success: "" as "true" | "false" | "",
  status_code: "",
  source_ip: "",
  error_contains: "",
  start_time: null as number | null,
  end_time: null as number | null,
});

const successOptions = computed(() => [
  { label: t("logs.status"), value: "" },
  { label: t("logs.success"), value: "true" },
  { label: t("logs.failure"), value: "false" },
]);

// Preuzima podatke logova sa API-ja.
const loadLogs = async () => {
  loading.value = true;
  try {
    const params: LogFilter = {
      page: currentPage.value,
      page_size: pageSize.value,
      group_name: filters.group_name || undefined,
      key_value: filters.key_value || undefined,
      is_success: filters.is_success === "" ? undefined : filters.is_success === "true",
      status_code: filters.status_code ? parseInt(filters.status_code, 10) : undefined,
      source_ip: filters.source_ip || undefined,
      error_contains: filters.error_contains || undefined,
      start_time: filters.start_time ? new Date(filters.start_time).toISOString() : undefined,
      end_time: filters.end_time ? new Date(filters.end_time).toISOString() : undefined,
    };

    const res = await logApi.getLogs(params);
    if (res.code === 0 && res.data) {
      logs.value = res.data.items.map(log => ({ ...log, is_key_visible: false }));
      total.value = res.data.pagination.total_items;
    } else {
      logs.value = [];
      total.value = 0;
      window.$message.error(res.message || t("logs.loadLogsFailed"), {
        keepAliveOnHover: true,
        duration: 5000,
        closable: true,
      });
    }
  } catch (_error) {
    window.$message.error(t("logs.loadLogsRequestFailed"));
  } finally {
    loading.value = false;
  }
};

const formatDateTime = (timestamp: string) => {
  if (!timestamp) {
    return "-";
  }
  const date = new Date(timestamp);
  return date.toLocaleString(navigator.language, { hour12: false }).replace(/\//g, "-");
};

const toggleKeyVisibility = (row: LogRow) => {
  row.is_key_visible = !row.is_key_visible;
};

// Definiše kolone za tabelu podataka.
const createColumns = () => [
  {
    title: t("logs.time"),
    key: "timestamp",
    width: 160,
    render: (row: LogRow) => formatDateTime(row.timestamp),
  },
  {
    title: t("logs.status"),
    key: "is_success",
    width: 50,
    render: (row: LogRow) =>
      h(
        NTag,
        { type: row.is_success ? "success" : "error", size: "small", round: true },
        { default: () => (row.is_success ? t("logs.success") : t("logs.failure")) }
      ),
  },
  {
    title: t("logs.type"),
    key: "is_stream",
    width: 50,
    render: (row: LogRow) =>
      h(
        NTag,
        { type: row.is_stream ? "info" : "default", size: "small", round: true },
        { default: () => (row.is_stream ? t("logs.stream") : t("logs.nonStream")) }
      ),
  },
  { title: t("logs.statusCode"), key: "status_code", width: 60 },
  { title: t("logs.duration"), key: "duration_ms", width: 80 },
  { title: t("logs.retries"), key: "retries", width: 50 },
  { title: t("logs.group"), key: "group_name", width: 120 },
  {
    title: t("logs.key"),
    key: "key_value",
    width: 200,
    render: (row: LogRow) =>
      h(NSpace, { align: "center", wrap: false }, () => [
        h(
          NEllipsis,
          { style: "max-width: 150px" },
          { default: () => (row.is_key_visible ? row.key_value : maskKey(row.key_value || "")) }
        ),
        h(
          NButton,
          { size: "tiny", text: true, onClick: () => toggleKeyVisibility(row) },
          {
            icon: () =>
              h(NIcon, null, { default: () => h(row.is_key_visible ? EyeOffOutline : EyeOutline) }),
          }
        ),
      ]),
  },
  {
    title: t("logs.requestPath"),
    key: "request_path",
    width: 220,
    render: (row: LogRow) =>
      h(NEllipsis, { style: "max-width: 200px" }, { default: () => row.request_path }),
  },
  {
    title: t("logs.upstreamAddress"),
    key: "upstream_addr",
    width: 220,
    render: (row: LogRow) =>
      h(NEllipsis, { style: "max-width: 200px" }, { default: () => row.upstream_addr }),
  },
  { title: t("logs.sourceIP"), key: "source_ip", width: 140 },
  {
    title: t("logs.errorMessage"),
    width: 270,
    key: "error_message",
    render: (row: LogRow) =>
      h(NEllipsis, { style: "max-width: 250px" }, { default: () => row.error_message || "-" }),
  },
  {
    title: t("logs.userAgent"),
    key: "user_agent",
    width: 220,
    render: (row: LogRow) =>
      h(NEllipsis, { style: "max-width: 200px" }, { default: () => row.user_agent }),
  },
];

const columns = computed(() => createColumns());

// Životni ciklusi i posmatrači.
onMounted(loadLogs);
watch([currentPage, pageSize], loadLogs);

const handleSearch = () => {
  currentPage.value = 1;
  loadLogs();
};

const resetFilters = () => {
  filters.group_name = "";
  filters.key_value = "";
  filters.is_success = "";
  filters.status_code = "";
  filters.source_ip = "";
  filters.error_contains = "";
  filters.start_time = null;
  filters.end_time = null;
  handleSearch();
};

const exportLogs = () => {
  const params: Omit<LogFilter, "page" | "page_size"> = {
    group_name: filters.group_name || undefined,
    key_value: filters.key_value || undefined,
    is_success: filters.is_success === "" ? undefined : filters.is_success === "true",
    status_code: filters.status_code ? parseInt(filters.status_code, 10) : undefined,
    source_ip: filters.source_ip || undefined,
    error_contains: filters.error_contains || undefined,
    start_time: filters.start_time ? new Date(filters.start_time).toISOString() : undefined,
    end_time: filters.end_time ? new Date(filters.end_time).toISOString() : undefined,
  };
  logApi.exportLogs(params);
};

function changePage(page: number) {
  currentPage.value = page;
}

function changePageSize(size: number) {
  pageSize.value = size;
  currentPage.value = 1;
}
</script>

<template>
  <div class="log-table-container">
    <n-space vertical>
      <!-- Traka sa alatkama -->
      <div class="toolbar">
        <div class="filter-section">
          <!-- Prvi red: Osnovni filteri -->
          <div class="filter-row">
            <div class="filter-group">
              <n-date-picker
                v-model:value="filters.start_time"
                type="datetime"
                clearable
                size="small"
                :placeholder="t('logs.startTime')"
                style="width: 180px"
              />
            </div>
            <div class="filter-group">
              <n-date-picker
                v-model:value="filters.end_time"
                type="datetime"
                clearable
                size="small"
                :placeholder="t('logs.endTime')"
                style="width: 180px"
              />
            </div>
            <div class="filter-group">
              <n-select
                v-model:value="filters.is_success"
                :options="successOptions"
                size="small"
                style="width: 166px"
                @update:value="handleSearch"
              />
            </div>
            <div class="filter-group">
              <n-input
                v-model:value="filters.status_code"
                :placeholder="t('logs.statusCode')"
                size="small"
                clearable
                style="width: 166px"
                @keyup.enter="handleSearch"
              />
            </div>
            <div class="filter-group">
              <n-input
                v-model:value="filters.group_name"
                :placeholder="t('logs.groupName')"
                size="small"
                clearable
                style="width: 166px"
                @keyup.enter="handleSearch"
              />
            </div>
            <div class="filter-group">
              <n-input
                v-model:value="filters.key_value"
                :placeholder="t('logs.key')"
                size="small"
                clearable
                style="width: 166px"
                @keyup.enter="handleSearch"
              />
            </div>
          </div>

          <!-- Drugi red: Detaljni filteri i akcije -->
          <div class="filter-row">
            <div class="filter-group">
              <n-input
                v-model:value="filters.error_contains"
                :placeholder="t('logs.errorInfo')"
                size="small"
                clearable
                style="width: 384px"
                @keyup.enter="handleSearch"
              />
            </div>
            <div class="filter-actions">
              <n-button ghost size="small" :disabled="loading" @click="handleSearch">
                <template #icon>
                  <n-icon :component="Search" />
                </template>
                {{ t("logs.search") }}
              </n-button>
              <n-button size="small" @click="resetFilters">{{ t("logs.reset") }}</n-button>
              <n-button size="small" type="primary" ghost @click="exportLogs">
                <template #icon>
                  <n-icon :component="DownloadOutline" />
                </template>
                {{ t("logs.exportKeys") }}
              </n-button>
            </div>
          </div>
        </div>
      </div>
      <div class="table-main">
        <!-- Tabela -->
        <div class="table-container">
          <n-spin :show="loading">
            <n-data-table :columns="columns" :data="logs" :bordered="false" remote size="small" />
          </n-spin>
        </div>

        <!-- Paginacija -->
        <div class="pagination-container">
          <div class="pagination-info">
            <span>{{ t("keys.keyTable.totalRecords", { count: total }) }}</span>
            <n-select
              v-model:value="pageSize"
              :options="[
                { label: t('keys.keyTable.perPage', { count: 15 }), value: 15 },
                { label: t('keys.keyTable.perPage', { count: 30 }), value: 30 },
                { label: t('keys.keyTable.perPage', { count: 50 }), value: 50 },
                { label: t('keys.keyTable.perPage', { count: 100 }), value: 100 },
              ]"
              size="small"
              style="width: 100px; margin-left: 12px"
              @update:value="changePageSize"
            />
          </div>
          <div class="pagination-controls">
            <n-button
              size="small"
              :disabled="currentPage <= 1"
              @click="changePage(currentPage - 1)"
            >
              {{ t("keys.keyTable.prevPage") }}
            </n-button>
            <span class="page-info">
              {{ t("keys.keyTable.pageInfo", { currentPage, totalPages }) }}
            </span>
            <n-button
              size="small"
              :disabled="currentPage >= totalPages"
              @click="changePage(currentPage + 1)"
            >
              {{ t("keys.keyTable.nextPage") }}
            </n-button>
          </div>
        </div>
      </div>
    </n-space>
  </div>
</template>

<style scoped>
.log-table-container {
  /* background: white; */
  /* border-radius: 8px; */
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  /* height: 100%; */
}
.toolbar {
  background: white;
  border-radius: 8px;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.filter-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-size: 13px;
  color: #666;
  white-space: nowrap;
  min-width: 50px;
}

.filter-separator {
  font-size: 12px;
  color: #999;
  margin: 0 4px;
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

@media (max-width: 1200px) {
  .filter-row {
    gap: 16px;
  }

  .filter-group {
    min-width: auto;
  }

  .filter-actions {
    margin-left: 0;
  }
}
.table-main {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}
.table-container {
  /* background: white;
  border-radius: 8px; */
  flex: 1;
  overflow: hidden;
  position: relative;
}
.empty-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-top: 1px solid #f0f0f0;
}
.pagination-info {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #666;
}
.pagination-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}
.page-info {
  font-size: 13px;
  color: #666;
}
</style>
