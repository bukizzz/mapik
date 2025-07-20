import { logApi } from "@/api/logs";
import { maskKey } from "@/utils/display";
import { DownloadOutline, EyeOffOutline, EyeOutline, Search } from "@vicons/ionicons5";
import { NButton, NDataTable, NDatePicker, NEllipsis, NIcon, NInput, NSelect, NSpace, NSpin, NTag, } from "naive-ui";
import { computed, h, onMounted, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
// Podaci komponente.
const loading = ref(false);
const logs = ref([]);
const currentPage = ref(1);
const pageSize = ref(15);
const total = ref(0);
const totalPages = computed(() => Math.ceil(total.value / pageSize.value));
const { t } = useI18n();
// Reaktivni objekat filtera za logove.
const filters = reactive({
    group_name: "",
    key_value: "",
    is_success: "",
    status_code: "",
    source_ip: "",
    error_contains: "",
    start_time: null,
    end_time: null,
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
        const params = {
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
        }
        else {
            logs.value = [];
            total.value = 0;
            window.$message.error(res.message || t("logs.loadLogsFailed"), {
                keepAliveOnHover: true,
                duration: 5000,
                closable: true,
            });
        }
    }
    catch (_error) {
        window.$message.error(t("logs.loadLogsRequestFailed"));
    }
    finally {
        loading.value = false;
    }
};
const formatDateTime = (timestamp) => {
    if (!timestamp) {
        return "-";
    }
    const date = new Date(timestamp);
    return date.toLocaleString(navigator.language, { hour12: false }).replace(/\//g, "-");
};
const toggleKeyVisibility = (row) => {
    row.is_key_visible = !row.is_key_visible;
};
// Definiše kolone za tabelu podataka.
const createColumns = () => [
    {
        title: t("logs.time"),
        key: "timestamp",
        width: 160,
        render: (row) => formatDateTime(row.timestamp),
    },
    {
        title: t("logs.status"),
        key: "is_success",
        width: 50,
        render: (row) => h(NTag, { type: row.is_success ? "success" : "error", size: "small", round: true }, { default: () => (row.is_success ? t("logs.success") : t("logs.failure")) }),
    },
    {
        title: t("logs.type"),
        key: "is_stream",
        width: 50,
        render: (row) => h(NTag, { type: row.is_stream ? "info" : "default", size: "small", round: true }, { default: () => (row.is_stream ? t("logs.stream") : t("logs.nonStream")) }),
    },
    { title: t("logs.statusCode"), key: "status_code", width: 60 },
    { title: t("logs.duration"), key: "duration_ms", width: 80 },
    { title: t("logs.retries"), key: "retries", width: 50 },
    { title: t("logs.group"), key: "group_name", width: 120 },
    {
        title: t("logs.key"),
        key: "key_value",
        width: 200,
        render: (row) => h(NSpace, { align: "center", wrap: false }, () => [
            h(NEllipsis, { style: "max-width: 150px" }, { default: () => (row.is_key_visible ? row.key_value : maskKey(row.key_value || "")) }),
            h(NButton, { size: "tiny", text: true, onClick: () => toggleKeyVisibility(row) }, {
                icon: () => h(NIcon, null, { default: () => h(row.is_key_visible ? EyeOffOutline : EyeOutline) }),
            }),
        ]),
    },
    {
        title: t("logs.requestPath"),
        key: "request_path",
        width: 220,
        render: (row) => h(NEllipsis, { style: "max-width: 200px" }, { default: () => row.request_path }),
    },
    {
        title: t("logs.upstreamAddress"),
        key: "upstream_addr",
        width: 220,
        render: (row) => h(NEllipsis, { style: "max-width: 200px" }, { default: () => row.upstream_addr }),
    },
    { title: t("logs.sourceIP"), key: "source_ip", width: 140 },
    {
        title: t("logs.errorMessage"),
        width: 270,
        key: "error_message",
        render: (row) => h(NEllipsis, { style: "max-width: 250px" }, { default: () => row.error_message || "-" }),
    },
    {
        title: t("logs.userAgent"),
        key: "user_agent",
        width: 220,
        render: (row) => h(NEllipsis, { style: "max-width: 200px" }, { default: () => row.user_agent }),
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
    const params = {
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
function changePage(page) {
    currentPage.value = page;
}
function changePageSize(size) {
    pageSize.value = size;
    currentPage.value = 1;
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['filter-row']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-group']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-actions']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "log-table-container" },
});
const __VLS_0 = {}.NSpace;
/** @type {[typeof __VLS_components.NSpace, typeof __VLS_components.nSpace, typeof __VLS_components.NSpace, typeof __VLS_components.nSpace, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    vertical: true,
}));
const __VLS_2 = __VLS_1({
    vertical: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_3.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "toolbar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "filter-section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "filter-row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "filter-group" },
});
const __VLS_4 = {}.NDatePicker;
/** @type {[typeof __VLS_components.NDatePicker, typeof __VLS_components.nDatePicker, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
    value: (__VLS_ctx.filters.start_time),
    type: "datetime",
    clearable: true,
    size: "small",
    placeholder: (__VLS_ctx.t('logs.startTime')),
    ...{ style: {} },
}));
const __VLS_6 = __VLS_5({
    value: (__VLS_ctx.filters.start_time),
    type: "datetime",
    clearable: true,
    size: "small",
    placeholder: (__VLS_ctx.t('logs.startTime')),
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_5));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "filter-group" },
});
const __VLS_8 = {}.NDatePicker;
/** @type {[typeof __VLS_components.NDatePicker, typeof __VLS_components.nDatePicker, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    value: (__VLS_ctx.filters.end_time),
    type: "datetime",
    clearable: true,
    size: "small",
    placeholder: (__VLS_ctx.t('logs.endTime')),
    ...{ style: {} },
}));
const __VLS_10 = __VLS_9({
    value: (__VLS_ctx.filters.end_time),
    type: "datetime",
    clearable: true,
    size: "small",
    placeholder: (__VLS_ctx.t('logs.endTime')),
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "filter-group" },
});
const __VLS_12 = {}.NSelect;
/** @type {[typeof __VLS_components.NSelect, typeof __VLS_components.nSelect, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    ...{ 'onUpdate:value': {} },
    value: (__VLS_ctx.filters.is_success),
    options: (__VLS_ctx.successOptions),
    size: "small",
    ...{ style: {} },
}));
const __VLS_14 = __VLS_13({
    ...{ 'onUpdate:value': {} },
    value: (__VLS_ctx.filters.is_success),
    options: (__VLS_ctx.successOptions),
    size: "small",
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
let __VLS_16;
let __VLS_17;
let __VLS_18;
const __VLS_19 = {
    'onUpdate:value': (__VLS_ctx.handleSearch)
};
var __VLS_15;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "filter-group" },
});
const __VLS_20 = {}.NInput;
/** @type {[typeof __VLS_components.NInput, typeof __VLS_components.nInput, ]} */ ;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
    ...{ 'onKeyup': {} },
    value: (__VLS_ctx.filters.status_code),
    placeholder: (__VLS_ctx.t('logs.statusCode')),
    size: "small",
    clearable: true,
    ...{ style: {} },
}));
const __VLS_22 = __VLS_21({
    ...{ 'onKeyup': {} },
    value: (__VLS_ctx.filters.status_code),
    placeholder: (__VLS_ctx.t('logs.statusCode')),
    size: "small",
    clearable: true,
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
let __VLS_24;
let __VLS_25;
let __VLS_26;
const __VLS_27 = {
    onKeyup: (__VLS_ctx.handleSearch)
};
var __VLS_23;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "filter-group" },
});
const __VLS_28 = {}.NInput;
/** @type {[typeof __VLS_components.NInput, typeof __VLS_components.nInput, ]} */ ;
// @ts-ignore
const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
    ...{ 'onKeyup': {} },
    value: (__VLS_ctx.filters.group_name),
    placeholder: (__VLS_ctx.t('logs.groupName')),
    size: "small",
    clearable: true,
    ...{ style: {} },
}));
const __VLS_30 = __VLS_29({
    ...{ 'onKeyup': {} },
    value: (__VLS_ctx.filters.group_name),
    placeholder: (__VLS_ctx.t('logs.groupName')),
    size: "small",
    clearable: true,
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_29));
let __VLS_32;
let __VLS_33;
let __VLS_34;
const __VLS_35 = {
    onKeyup: (__VLS_ctx.handleSearch)
};
var __VLS_31;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "filter-group" },
});
const __VLS_36 = {}.NInput;
/** @type {[typeof __VLS_components.NInput, typeof __VLS_components.nInput, ]} */ ;
// @ts-ignore
const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
    ...{ 'onKeyup': {} },
    value: (__VLS_ctx.filters.key_value),
    placeholder: (__VLS_ctx.t('logs.key')),
    size: "small",
    clearable: true,
    ...{ style: {} },
}));
const __VLS_38 = __VLS_37({
    ...{ 'onKeyup': {} },
    value: (__VLS_ctx.filters.key_value),
    placeholder: (__VLS_ctx.t('logs.key')),
    size: "small",
    clearable: true,
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_37));
let __VLS_40;
let __VLS_41;
let __VLS_42;
const __VLS_43 = {
    onKeyup: (__VLS_ctx.handleSearch)
};
var __VLS_39;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "filter-row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "filter-group" },
});
const __VLS_44 = {}.NInput;
/** @type {[typeof __VLS_components.NInput, typeof __VLS_components.nInput, ]} */ ;
// @ts-ignore
const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
    ...{ 'onKeyup': {} },
    value: (__VLS_ctx.filters.error_contains),
    placeholder: (__VLS_ctx.t('logs.errorInfo')),
    size: "small",
    clearable: true,
    ...{ style: {} },
}));
const __VLS_46 = __VLS_45({
    ...{ 'onKeyup': {} },
    value: (__VLS_ctx.filters.error_contains),
    placeholder: (__VLS_ctx.t('logs.errorInfo')),
    size: "small",
    clearable: true,
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_45));
let __VLS_48;
let __VLS_49;
let __VLS_50;
const __VLS_51 = {
    onKeyup: (__VLS_ctx.handleSearch)
};
var __VLS_47;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "filter-actions" },
});
const __VLS_52 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
    ...{ 'onClick': {} },
    ghost: true,
    size: "small",
    disabled: (__VLS_ctx.loading),
}));
const __VLS_54 = __VLS_53({
    ...{ 'onClick': {} },
    ghost: true,
    size: "small",
    disabled: (__VLS_ctx.loading),
}, ...__VLS_functionalComponentArgsRest(__VLS_53));
let __VLS_56;
let __VLS_57;
let __VLS_58;
const __VLS_59 = {
    onClick: (__VLS_ctx.handleSearch)
};
__VLS_55.slots.default;
{
    const { icon: __VLS_thisSlot } = __VLS_55.slots;
    const __VLS_60 = {}.NIcon;
    /** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.nIcon, ]} */ ;
    // @ts-ignore
    const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({
        component: (__VLS_ctx.Search),
    }));
    const __VLS_62 = __VLS_61({
        component: (__VLS_ctx.Search),
    }, ...__VLS_functionalComponentArgsRest(__VLS_61));
}
(__VLS_ctx.t("logs.search"));
var __VLS_55;
const __VLS_64 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
    ...{ 'onClick': {} },
    size: "small",
}));
const __VLS_66 = __VLS_65({
    ...{ 'onClick': {} },
    size: "small",
}, ...__VLS_functionalComponentArgsRest(__VLS_65));
let __VLS_68;
let __VLS_69;
let __VLS_70;
const __VLS_71 = {
    onClick: (__VLS_ctx.resetFilters)
};
__VLS_67.slots.default;
(__VLS_ctx.t("logs.reset"));
var __VLS_67;
const __VLS_72 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({
    ...{ 'onClick': {} },
    size: "small",
    type: "primary",
    ghost: true,
}));
const __VLS_74 = __VLS_73({
    ...{ 'onClick': {} },
    size: "small",
    type: "primary",
    ghost: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_73));
let __VLS_76;
let __VLS_77;
let __VLS_78;
const __VLS_79 = {
    onClick: (__VLS_ctx.exportLogs)
};
__VLS_75.slots.default;
{
    const { icon: __VLS_thisSlot } = __VLS_75.slots;
    const __VLS_80 = {}.NIcon;
    /** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.nIcon, ]} */ ;
    // @ts-ignore
    const __VLS_81 = __VLS_asFunctionalComponent(__VLS_80, new __VLS_80({
        component: (__VLS_ctx.DownloadOutline),
    }));
    const __VLS_82 = __VLS_81({
        component: (__VLS_ctx.DownloadOutline),
    }, ...__VLS_functionalComponentArgsRest(__VLS_81));
}
(__VLS_ctx.t("logs.exportKeys"));
var __VLS_75;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "table-main" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "table-container" },
});
const __VLS_84 = {}.NSpin;
/** @type {[typeof __VLS_components.NSpin, typeof __VLS_components.nSpin, typeof __VLS_components.NSpin, typeof __VLS_components.nSpin, ]} */ ;
// @ts-ignore
const __VLS_85 = __VLS_asFunctionalComponent(__VLS_84, new __VLS_84({
    show: (__VLS_ctx.loading),
}));
const __VLS_86 = __VLS_85({
    show: (__VLS_ctx.loading),
}, ...__VLS_functionalComponentArgsRest(__VLS_85));
__VLS_87.slots.default;
const __VLS_88 = {}.NDataTable;
/** @type {[typeof __VLS_components.NDataTable, typeof __VLS_components.nDataTable, ]} */ ;
// @ts-ignore
const __VLS_89 = __VLS_asFunctionalComponent(__VLS_88, new __VLS_88({
    columns: (__VLS_ctx.columns),
    data: (__VLS_ctx.logs),
    bordered: (false),
    remote: true,
    size: "small",
}));
const __VLS_90 = __VLS_89({
    columns: (__VLS_ctx.columns),
    data: (__VLS_ctx.logs),
    bordered: (false),
    remote: true,
    size: "small",
}, ...__VLS_functionalComponentArgsRest(__VLS_89));
var __VLS_87;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pagination-container" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pagination-info" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.t("keys.keyTable.totalRecords", { count: __VLS_ctx.total }));
const __VLS_92 = {}.NSelect;
/** @type {[typeof __VLS_components.NSelect, typeof __VLS_components.nSelect, ]} */ ;
// @ts-ignore
const __VLS_93 = __VLS_asFunctionalComponent(__VLS_92, new __VLS_92({
    ...{ 'onUpdate:value': {} },
    value: (__VLS_ctx.pageSize),
    options: ([
        { label: __VLS_ctx.t('keys.keyTable.perPage', { count: 15 }), value: 15 },
        { label: __VLS_ctx.t('keys.keyTable.perPage', { count: 30 }), value: 30 },
        { label: __VLS_ctx.t('keys.keyTable.perPage', { count: 50 }), value: 50 },
        { label: __VLS_ctx.t('keys.keyTable.perPage', { count: 100 }), value: 100 },
    ]),
    size: "small",
    ...{ style: {} },
}));
const __VLS_94 = __VLS_93({
    ...{ 'onUpdate:value': {} },
    value: (__VLS_ctx.pageSize),
    options: ([
        { label: __VLS_ctx.t('keys.keyTable.perPage', { count: 15 }), value: 15 },
        { label: __VLS_ctx.t('keys.keyTable.perPage', { count: 30 }), value: 30 },
        { label: __VLS_ctx.t('keys.keyTable.perPage', { count: 50 }), value: 50 },
        { label: __VLS_ctx.t('keys.keyTable.perPage', { count: 100 }), value: 100 },
    ]),
    size: "small",
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_93));
let __VLS_96;
let __VLS_97;
let __VLS_98;
const __VLS_99 = {
    'onUpdate:value': (__VLS_ctx.changePageSize)
};
var __VLS_95;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pagination-controls" },
});
const __VLS_100 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_101 = __VLS_asFunctionalComponent(__VLS_100, new __VLS_100({
    ...{ 'onClick': {} },
    size: "small",
    disabled: (__VLS_ctx.currentPage <= 1),
}));
const __VLS_102 = __VLS_101({
    ...{ 'onClick': {} },
    size: "small",
    disabled: (__VLS_ctx.currentPage <= 1),
}, ...__VLS_functionalComponentArgsRest(__VLS_101));
let __VLS_104;
let __VLS_105;
let __VLS_106;
const __VLS_107 = {
    onClick: (...[$event]) => {
        __VLS_ctx.changePage(__VLS_ctx.currentPage - 1);
    }
};
__VLS_103.slots.default;
(__VLS_ctx.t("keys.keyTable.prevPage"));
var __VLS_103;
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "page-info" },
});
(__VLS_ctx.t("keys.keyTable.pageInfo", { currentPage: __VLS_ctx.currentPage, totalPages: __VLS_ctx.totalPages }));
const __VLS_108 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_109 = __VLS_asFunctionalComponent(__VLS_108, new __VLS_108({
    ...{ 'onClick': {} },
    size: "small",
    disabled: (__VLS_ctx.currentPage >= __VLS_ctx.totalPages),
}));
const __VLS_110 = __VLS_109({
    ...{ 'onClick': {} },
    size: "small",
    disabled: (__VLS_ctx.currentPage >= __VLS_ctx.totalPages),
}, ...__VLS_functionalComponentArgsRest(__VLS_109));
let __VLS_112;
let __VLS_113;
let __VLS_114;
const __VLS_115 = {
    onClick: (...[$event]) => {
        __VLS_ctx.changePage(__VLS_ctx.currentPage + 1);
    }
};
__VLS_111.slots.default;
(__VLS_ctx.t("keys.keyTable.nextPage"));
var __VLS_111;
var __VLS_3;
/** @type {__VLS_StyleScopedClasses['log-table-container']} */ ;
/** @type {__VLS_StyleScopedClasses['toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-section']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-row']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-group']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-group']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-group']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-group']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-group']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-group']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-row']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-group']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['table-main']} */ ;
/** @type {__VLS_StyleScopedClasses['table-container']} */ ;
/** @type {__VLS_StyleScopedClasses['pagination-container']} */ ;
/** @type {__VLS_StyleScopedClasses['pagination-info']} */ ;
/** @type {__VLS_StyleScopedClasses['pagination-controls']} */ ;
/** @type {__VLS_StyleScopedClasses['page-info']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            DownloadOutline: DownloadOutline,
            Search: Search,
            NButton: NButton,
            NDataTable: NDataTable,
            NDatePicker: NDatePicker,
            NIcon: NIcon,
            NInput: NInput,
            NSelect: NSelect,
            NSpace: NSpace,
            NSpin: NSpin,
            loading: loading,
            logs: logs,
            currentPage: currentPage,
            pageSize: pageSize,
            total: total,
            totalPages: totalPages,
            t: t,
            filters: filters,
            successOptions: successOptions,
            columns: columns,
            handleSearch: handleSearch,
            resetFilters: resetFilters,
            exportLogs: exportLogs,
            changePage: changePage,
            changePageSize: changePageSize,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
