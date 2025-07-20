import { keysApi } from "@/api/keys";
import { appState } from "@/utils/app-state";
import { copy } from "@/utils/clipboard";
import { getGroupDisplayName, maskKey } from "@/utils/display";
import { AddCircleOutline, AlertCircleOutline, CheckmarkCircle, CopyOutline, EyeOffOutline, EyeOutline, RemoveCircleOutline, Search, } from "@vicons/ionicons5";
import { NButton, NDropdown, NEmpty, NIcon, NInput, NSelect, NSpace, NSpin, useDialog, } from "naive-ui";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import KeyCreateDialog from "./KeyCreateDialog.vue";
import KeyDeleteDialog from "./KeyDeleteDialog.vue";
const props = defineProps();
const keys = ref([]);
const loading = ref(false);
const searchText = ref("");
const statusFilter = ref("all");
const currentPage = ref(1);
const pageSize = ref(12);
const total = ref(0);
const totalPages = ref(0);
const dialog = useDialog();
const { t } = useI18n();
// Opcije za filtriranje statusa ključa.
const statusOptions = computed(() => [
    { label: t("keys.keyTable.all"), value: "all" },
    { label: t("keys.keyTable.active"), value: "active" },
    { label: t("keys.keyTable.invalid"), value: "invalid" },
]);
// Opcije za padajući meni "Više akcija".
const moreOptions = computed(() => [
    { label: t("keys.keyTable.exportAll"), key: "copyAll" },
    { label: t("keys.keyTable.exportActive"), key: "copyValid" },
    { label: t("keys.keyTable.exportInvalid"), key: "copyInvalid" },
    { type: "divider" },
    { label: t("keys.keyTable.restoreAll"), key: "restoreAll" },
    {
        label: t("keys.keyTable.clearInvalid"),
        key: "clearInvalid",
        props: { style: { color: "#d03050" } },
    },
    { type: "divider" },
    { label: t("keys.keyTable.validateAll"), key: "validateAll" },
]);
let testingMsg = null;
const isDeling = ref(false);
const isRestoring = ref(false);
const createDialogShow = ref(false);
const deleteDialogShow = ref(false);
watch(() => props.selectedGroup, async (newGroup) => {
    if (newGroup) {
        // Proverite da li će resetovanje stranice pokrenuti posmatrača paginacije.
        const willWatcherTrigger = currentPage.value !== 1 || statusFilter.value !== "all";
        resetPage();
        // Ako posmatrač paginacije neće biti pokrenut, ručno učitajte ključeve.
        if (!willWatcherTrigger) {
            await loadKeys();
        }
    }
}, { immediate: true });
watch([currentPage, pageSize, statusFilter], async () => {
    await loadKeys();
});
// Obrađuje debouncing za unos pretrage.
function handleSearchInput() {
    currentPage.value = 1; // Resetuj na prvu stranicu pri pretrazi
    loadKeys();
}
// Obrađuje akcije iz padajućeg menija "Više akcija".
function handleMoreAction(key) {
    switch (key) {
        case "copyAll":
            copyAllKeys();
            break;
        case "copyValid":
            copyValidKeys();
            break;
        case "copyInvalid":
            copyInvalidKeys();
            break;
        case "restoreAll":
            restoreAllInvalid();
            break;
        case "validateAll":
            validateAllKeys();
            break;
        case "clearInvalid":
            clearAllInvalid();
            break;
    }
}
async function loadKeys() {
    if (!props.selectedGroup?.id) {
        return;
    }
    try {
        loading.value = true;
        const result = await keysApi.getGroupKeys({
            group_id: props.selectedGroup.id,
            page: currentPage.value,
            page_size: pageSize.value,
            status: statusFilter.value === "all" ? undefined : statusFilter.value,
            key: searchText.value.trim() || undefined,
        });
        keys.value = result.items;
        total.value = result.pagination.total_items;
        totalPages.value = result.pagination.total_pages;
    }
    catch (_error) {
        window.$message.error(t("keys.keyTable.loadKeysFailed"));
    }
    finally {
        loading.value = false;
    }
}
async function copyKey(key) {
    const success = await copy(key.key_value);
    if (success) {
        window.$message.success(t("keys.keyTable.copyKeySuccess"));
    }
    else {
        window.$message.error(t("keys.keyTable.copyKeyFailed"));
    }
}
async function testKey(_key) {
    if (!props.selectedGroup?.id || !_key.key_value || testingMsg) {
        return;
    }
    testingMsg = window.$message.info(t("keys.keyTable.testingKey"), {
        duration: 0,
    });
    try {
        const res = await keysApi.testKeys(props.selectedGroup.id, _key.key_value);
        const curValid = res?.[0] || {};
        if (curValid.is_valid) {
            window.$message.success(t("keys.keyTable.testSuccess"));
        }
        else {
            window.$message.error(curValid.error || t("keys.keyTable.testFailed"), {
                keepAliveOnHover: true,
                duration: 5000,
                closable: true,
            });
        }
    }
    catch (_error) {
        console.error(t("keys.keyTable.testFailedGeneric"));
    }
    finally {
        testingMsg?.destroy();
        testingMsg = null;
    }
}
function toggleKeyVisibility(key) {
    key.is_visible = !key.is_visible;
}
async function restoreKey(key) {
    if (!props.selectedGroup?.id || !key.key_value || isRestoring.value) {
        return;
    }
    const d = dialog.warning({
        title: t("keys.keyTable.restoreKeyTitle"),
        content: t("keys.keyTable.restoreKeyContent", { key: maskKey(key.key_value) }),
        positiveText: t("keys.groupInfo.confirm"),
        negativeText: t("keys.groupInfo.cancel"),
        onPositiveClick: async () => {
            if (!props.selectedGroup?.id) {
                return;
            }
            isRestoring.value = true;
            d.loading = true;
            try {
                await keysApi.restoreKeys(props.selectedGroup.id, key.key_value);
                await loadKeys();
            }
            catch (_error) {
                console.error(t("keys.keyTable.restoreFailed"));
            }
            finally {
                d.loading = false;
                isRestoring.value = false;
            }
        },
    });
}
async function deleteKey(key) {
    if (!props.selectedGroup?.id || !key.key_value || isDeling.value) {
        return;
    }
    const d = dialog.warning({
        title: t("keys.keyTable.deleteKeyTitle"),
        content: t("keys.keyTable.deleteKeyContent", { key: maskKey(key.key_value) }),
        positiveText: t("keys.groupInfo.confirm"),
        negativeText: t("keys.groupInfo.cancel"),
        onPositiveClick: async () => {
            if (!props.selectedGroup?.id) {
                return;
            }
            d.loading = true;
            isDeling.value = true;
            try {
                await keysApi.deleteKeys(props.selectedGroup.id, key.key_value);
                await loadKeys();
            }
            catch (_error) {
                console.error(t("keys.keyTable.deleteFailed"));
            }
            finally {
                d.loading = false;
                isDeling.value = false;
            }
        },
    });
}
function formatRelativeTime(date) {
    if (!date) {
        return t("keys.keyTable.never");
    }
    const now = new Date();
    const target = new Date(date);
    const diffSeconds = Math.floor((now.getTime() - target.getTime()) / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays > 0) {
        return t("keys.keyTable.daysAgo", { count: diffDays });
    }
    if (diffHours > 0) {
        return t("keys.keyTable.hoursAgo", { count: diffHours });
    }
    if (diffMinutes > 0) {
        return t("keys.keyTable.minutesAgo", { count: diffMinutes });
    }
    if (diffSeconds > 0) {
        return t("keys.keyTable.secondsAgo", { count: diffSeconds });
    }
    return t("keys.keyTable.justNow");
}
function getStatusClass(status) {
    switch (status) {
        case "active":
            return "status-valid";
        case "invalid":
            return "status-invalid";
        default:
            return "status-unknown";
    }
}
async function copyAllKeys() {
    if (!props.selectedGroup?.id) {
        return;
    }
    keysApi.exportKeys(props.selectedGroup.id, "all");
}
async function copyValidKeys() {
    if (!props.selectedGroup?.id) {
        return;
    }
    keysApi.exportKeys(props.selectedGroup.id, "active");
}
async function copyInvalidKeys() {
    if (!props.selectedGroup?.id) {
        return;
    }
    keysApi.exportKeys(props.selectedGroup.id, "invalid");
}
async function restoreAllInvalid() {
    if (!props.selectedGroup?.id || isRestoring.value) {
        return;
    }
    const d = dialog.warning({
        title: t("keys.keyTable.restoreAllTitle"),
        content: t("keys.keyTable.restoreAllContent"),
        positiveText: t("keys.groupInfo.confirm"),
        negativeText: t("keys.groupInfo.cancel"),
        onPositiveClick: async () => {
            if (!props.selectedGroup?.id) {
                return;
            }
            isRestoring.value = true;
            d.loading = true;
            try {
                await keysApi.restoreAllInvalidKeys(props.selectedGroup.id);
                await loadKeys();
            }
            catch (_error) {
                console.error(t("keys.keyTable.restoreFailed"));
            }
            finally {
                d.loading = false;
                isRestoring.value = false;
            }
        },
    });
}
async function validateAllKeys() {
    if (!props.selectedGroup?.id || testingMsg) {
        return;
    }
    testingMsg = window.$message.info(t("keys.keyTable.validatingKeys"), {
        duration: 0,
    });
    try {
        await keysApi.validateGroupKeys(props.selectedGroup.id);
        localStorage.removeItem("last_closed_task");
        appState.taskPollingTrigger++;
    }
    catch (_error) {
        console.error(t("keys.keyTable.testFailedGeneric"));
    }
    finally {
        testingMsg?.destroy();
        testingMsg = null;
    }
}
async function clearAllInvalid() {
    if (!props.selectedGroup?.id || isDeling.value) {
        return;
    }
    const d = dialog.warning({
        title: t("keys.keyTable.clearAllTitle"),
        content: t("keys.keyTable.clearAllContent"),
        positiveText: t("keys.groupInfo.confirm"),
        negativeText: t("keys.groupInfo.cancel"),
        onPositiveClick: async () => {
            if (!props.selectedGroup?.id) {
                return;
            }
            isDeling.value = true;
            d.loading = true;
            try {
                const { data } = await keysApi.clearAllInvalidKeys(props.selectedGroup.id);
                window.$message.success(data?.message || t("keys.keyTable.clearSuccess"));
                await loadKeys();
            }
            catch (_error) {
                console.error(t("keys.keyTable.deleteFailed"));
            }
            finally {
                d.loading = false;
                isDeling.value = false;
            }
        },
    });
}
function changePage(page) {
    currentPage.value = page;
}
function changePageSize(size) {
    pageSize.value = size;
    currentPage.value = 1;
}
function resetPage() {
    currentPage.value = 1;
    searchText.value = "";
    statusFilter.value = "all";
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['menu-item']} */ ;
/** @type {__VLS_StyleScopedClasses['menu-item']} */ ;
/** @type {__VLS_StyleScopedClasses['menu-item']} */ ;
/** @type {__VLS_StyleScopedClasses['danger']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['search-input']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
/** @type {__VLS_StyleScopedClasses['search-input']} */ ;
/** @type {__VLS_StyleScopedClasses['page-size-select']} */ ;
/** @type {__VLS_StyleScopedClasses['key-card']} */ ;
/** @type {__VLS_StyleScopedClasses['key-card']} */ ;
/** @type {__VLS_StyleScopedClasses['key-card']} */ ;
/** @type {__VLS_StyleScopedClasses['key-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-item']} */ ;
/** @type {__VLS_StyleScopedClasses['quick-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['primary']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['danger']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['danger']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "key-table-container" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "toolbar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "toolbar-left" },
});
const __VLS_0 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onClick': {} },
    type: "success",
    size: "small",
}));
const __VLS_2 = __VLS_1({
    ...{ 'onClick': {} },
    type: "success",
    size: "small",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    onClick: (...[$event]) => {
        __VLS_ctx.createDialogShow = true;
    }
};
__VLS_3.slots.default;
{
    const { icon: __VLS_thisSlot } = __VLS_3.slots;
    const __VLS_8 = {}.NIcon;
    /** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.nIcon, ]} */ ;
    // @ts-ignore
    const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
        component: (__VLS_ctx.AddCircleOutline),
    }));
    const __VLS_10 = __VLS_9({
        component: (__VLS_ctx.AddCircleOutline),
    }, ...__VLS_functionalComponentArgsRest(__VLS_9));
}
(__VLS_ctx.t("keys.keyTable.addKey"));
var __VLS_3;
const __VLS_12 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    ...{ 'onClick': {} },
    type: "error",
    size: "small",
}));
const __VLS_14 = __VLS_13({
    ...{ 'onClick': {} },
    type: "error",
    size: "small",
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
let __VLS_16;
let __VLS_17;
let __VLS_18;
const __VLS_19 = {
    onClick: (...[$event]) => {
        __VLS_ctx.deleteDialogShow = true;
    }
};
__VLS_15.slots.default;
{
    const { icon: __VLS_thisSlot } = __VLS_15.slots;
    const __VLS_20 = {}.NIcon;
    /** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.nIcon, ]} */ ;
    // @ts-ignore
    const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
        component: (__VLS_ctx.RemoveCircleOutline),
    }));
    const __VLS_22 = __VLS_21({
        component: (__VLS_ctx.RemoveCircleOutline),
    }, ...__VLS_functionalComponentArgsRest(__VLS_21));
}
(__VLS_ctx.t("keys.keyTable.deleteKey"));
var __VLS_15;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "toolbar-right" },
});
const __VLS_24 = {}.NSpace;
/** @type {[typeof __VLS_components.NSpace, typeof __VLS_components.nSpace, typeof __VLS_components.NSpace, typeof __VLS_components.nSpace, ]} */ ;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
    size: (12),
}));
const __VLS_26 = __VLS_25({
    size: (12),
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
__VLS_27.slots.default;
const __VLS_28 = {}.NSelect;
/** @type {[typeof __VLS_components.NSelect, typeof __VLS_components.nSelect, ]} */ ;
// @ts-ignore
const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
    value: (__VLS_ctx.statusFilter),
    options: (__VLS_ctx.statusOptions),
    size: "small",
    ...{ style: {} },
}));
const __VLS_30 = __VLS_29({
    value: (__VLS_ctx.statusFilter),
    options: (__VLS_ctx.statusOptions),
    size: "small",
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_29));
const __VLS_32 = {}.NInputGroup;
/** @type {[typeof __VLS_components.NInputGroup, typeof __VLS_components.nInputGroup, typeof __VLS_components.NInputGroup, typeof __VLS_components.nInputGroup, ]} */ ;
// @ts-ignore
const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({}));
const __VLS_34 = __VLS_33({}, ...__VLS_functionalComponentArgsRest(__VLS_33));
__VLS_35.slots.default;
const __VLS_36 = {}.NInput;
/** @type {[typeof __VLS_components.NInput, typeof __VLS_components.nInput, ]} */ ;
// @ts-ignore
const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
    ...{ 'onKeyup': {} },
    value: (__VLS_ctx.searchText),
    placeholder: (__VLS_ctx.t('keys.keyTable.searchPlaceholder')),
    size: "small",
    ...{ style: {} },
    clearable: true,
}));
const __VLS_38 = __VLS_37({
    ...{ 'onKeyup': {} },
    value: (__VLS_ctx.searchText),
    placeholder: (__VLS_ctx.t('keys.keyTable.searchPlaceholder')),
    size: "small",
    ...{ style: {} },
    clearable: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_37));
let __VLS_40;
let __VLS_41;
let __VLS_42;
const __VLS_43 = {
    onKeyup: (__VLS_ctx.handleSearchInput)
};
var __VLS_39;
const __VLS_44 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
    ...{ 'onClick': {} },
    ghost: true,
    size: "small",
    disabled: (__VLS_ctx.loading),
}));
const __VLS_46 = __VLS_45({
    ...{ 'onClick': {} },
    ghost: true,
    size: "small",
    disabled: (__VLS_ctx.loading),
}, ...__VLS_functionalComponentArgsRest(__VLS_45));
let __VLS_48;
let __VLS_49;
let __VLS_50;
const __VLS_51 = {
    onClick: (__VLS_ctx.handleSearchInput)
};
__VLS_47.slots.default;
const __VLS_52 = {}.NIcon;
/** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.nIcon, ]} */ ;
// @ts-ignore
const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
    component: (__VLS_ctx.Search),
}));
const __VLS_54 = __VLS_53({
    component: (__VLS_ctx.Search),
}, ...__VLS_functionalComponentArgsRest(__VLS_53));
var __VLS_47;
var __VLS_35;
const __VLS_56 = {}.NDropdown;
/** @type {[typeof __VLS_components.NDropdown, typeof __VLS_components.nDropdown, typeof __VLS_components.NDropdown, typeof __VLS_components.nDropdown, ]} */ ;
// @ts-ignore
const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
    ...{ 'onSelect': {} },
    options: (__VLS_ctx.moreOptions),
    trigger: "click",
}));
const __VLS_58 = __VLS_57({
    ...{ 'onSelect': {} },
    options: (__VLS_ctx.moreOptions),
    trigger: "click",
}, ...__VLS_functionalComponentArgsRest(__VLS_57));
let __VLS_60;
let __VLS_61;
let __VLS_62;
const __VLS_63 = {
    onSelect: (__VLS_ctx.handleMoreAction)
};
__VLS_59.slots.default;
const __VLS_64 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
    size: "small",
    secondary: true,
}));
const __VLS_66 = __VLS_65({
    size: "small",
    secondary: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_65));
__VLS_67.slots.default;
{
    const { icon: __VLS_thisSlot } = __VLS_67.slots;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ style: {} },
    });
}
var __VLS_67;
var __VLS_59;
var __VLS_27;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "keys-grid-container" },
});
const __VLS_68 = {}.NSpin;
/** @type {[typeof __VLS_components.NSpin, typeof __VLS_components.nSpin, typeof __VLS_components.NSpin, typeof __VLS_components.nSpin, ]} */ ;
// @ts-ignore
const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({
    show: (__VLS_ctx.loading),
}));
const __VLS_70 = __VLS_69({
    show: (__VLS_ctx.loading),
}, ...__VLS_functionalComponentArgsRest(__VLS_69));
__VLS_71.slots.default;
if (__VLS_ctx.keys.length === 0 && !__VLS_ctx.loading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "empty-container" },
    });
    const __VLS_72 = {}.NEmpty;
    /** @type {[typeof __VLS_components.NEmpty, typeof __VLS_components.nEmpty, ]} */ ;
    // @ts-ignore
    const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({
        description: (__VLS_ctx.t('keys.keyTable.noMatchingKeys')),
    }));
    const __VLS_74 = __VLS_73({
        description: (__VLS_ctx.t('keys.keyTable.noMatchingKeys')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_73));
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "keys-grid" },
    });
    for (const [key] of __VLS_getVForSourceType((__VLS_ctx.keys))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (key.id),
            ...{ class: "key-card" },
            ...{ class: (__VLS_ctx.getStatusClass(key.status)) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "key-main" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "key-section" },
        });
        if (key.status === 'active') {
            const __VLS_76 = {}.NTag;
            /** @type {[typeof __VLS_components.NTag, typeof __VLS_components.nTag, typeof __VLS_components.NTag, typeof __VLS_components.nTag, ]} */ ;
            // @ts-ignore
            const __VLS_77 = __VLS_asFunctionalComponent(__VLS_76, new __VLS_76({
                type: "success",
                bordered: (false),
                round: true,
            }));
            const __VLS_78 = __VLS_77({
                type: "success",
                bordered: (false),
                round: true,
            }, ...__VLS_functionalComponentArgsRest(__VLS_77));
            __VLS_79.slots.default;
            {
                const { icon: __VLS_thisSlot } = __VLS_79.slots;
                const __VLS_80 = {}.NIcon;
                /** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.nIcon, ]} */ ;
                // @ts-ignore
                const __VLS_81 = __VLS_asFunctionalComponent(__VLS_80, new __VLS_80({
                    component: (__VLS_ctx.CheckmarkCircle),
                }));
                const __VLS_82 = __VLS_81({
                    component: (__VLS_ctx.CheckmarkCircle),
                }, ...__VLS_functionalComponentArgsRest(__VLS_81));
            }
            (__VLS_ctx.t("keys.keyTable.active"));
            var __VLS_79;
        }
        else {
            const __VLS_84 = {}.NTag;
            /** @type {[typeof __VLS_components.NTag, typeof __VLS_components.nTag, typeof __VLS_components.NTag, typeof __VLS_components.nTag, ]} */ ;
            // @ts-ignore
            const __VLS_85 = __VLS_asFunctionalComponent(__VLS_84, new __VLS_84({
                bordered: (false),
                round: true,
            }));
            const __VLS_86 = __VLS_85({
                bordered: (false),
                round: true,
            }, ...__VLS_functionalComponentArgsRest(__VLS_85));
            __VLS_87.slots.default;
            {
                const { icon: __VLS_thisSlot } = __VLS_87.slots;
                const __VLS_88 = {}.NIcon;
                /** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.nIcon, ]} */ ;
                // @ts-ignore
                const __VLS_89 = __VLS_asFunctionalComponent(__VLS_88, new __VLS_88({
                    component: (__VLS_ctx.AlertCircleOutline),
                }));
                const __VLS_90 = __VLS_89({
                    component: (__VLS_ctx.AlertCircleOutline),
                }, ...__VLS_functionalComponentArgsRest(__VLS_89));
            }
            (__VLS_ctx.t("keys.keyTable.invalid"));
            var __VLS_87;
        }
        const __VLS_92 = {}.NInput;
        /** @type {[typeof __VLS_components.NInput, typeof __VLS_components.nInput, ]} */ ;
        // @ts-ignore
        const __VLS_93 = __VLS_asFunctionalComponent(__VLS_92, new __VLS_92({
            ...{ class: "key-text" },
            value: (key.is_visible ? key.key_value : __VLS_ctx.maskKey(key.key_value)),
            readonly: true,
            size: "small",
        }));
        const __VLS_94 = __VLS_93({
            ...{ class: "key-text" },
            value: (key.is_visible ? key.key_value : __VLS_ctx.maskKey(key.key_value)),
            readonly: true,
            size: "small",
        }, ...__VLS_functionalComponentArgsRest(__VLS_93));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "quick-actions" },
        });
        const __VLS_96 = {}.NButton;
        /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
        // @ts-ignore
        const __VLS_97 = __VLS_asFunctionalComponent(__VLS_96, new __VLS_96({
            ...{ 'onClick': {} },
            size: "tiny",
            text: true,
            title: (__VLS_ctx.t('keys.keyTable.toggleVisibility')),
        }));
        const __VLS_98 = __VLS_97({
            ...{ 'onClick': {} },
            size: "tiny",
            text: true,
            title: (__VLS_ctx.t('keys.keyTable.toggleVisibility')),
        }, ...__VLS_functionalComponentArgsRest(__VLS_97));
        let __VLS_100;
        let __VLS_101;
        let __VLS_102;
        const __VLS_103 = {
            onClick: (...[$event]) => {
                if (!!(__VLS_ctx.keys.length === 0 && !__VLS_ctx.loading))
                    return;
                __VLS_ctx.toggleKeyVisibility(key);
            }
        };
        __VLS_99.slots.default;
        {
            const { icon: __VLS_thisSlot } = __VLS_99.slots;
            const __VLS_104 = {}.NIcon;
            /** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.nIcon, ]} */ ;
            // @ts-ignore
            const __VLS_105 = __VLS_asFunctionalComponent(__VLS_104, new __VLS_104({
                component: (key.is_visible ? __VLS_ctx.EyeOffOutline : __VLS_ctx.EyeOutline),
            }));
            const __VLS_106 = __VLS_105({
                component: (key.is_visible ? __VLS_ctx.EyeOffOutline : __VLS_ctx.EyeOutline),
            }, ...__VLS_functionalComponentArgsRest(__VLS_105));
        }
        var __VLS_99;
        const __VLS_108 = {}.NButton;
        /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
        // @ts-ignore
        const __VLS_109 = __VLS_asFunctionalComponent(__VLS_108, new __VLS_108({
            ...{ 'onClick': {} },
            size: "tiny",
            text: true,
            title: (__VLS_ctx.t('keys.keyTable.copy')),
        }));
        const __VLS_110 = __VLS_109({
            ...{ 'onClick': {} },
            size: "tiny",
            text: true,
            title: (__VLS_ctx.t('keys.keyTable.copy')),
        }, ...__VLS_functionalComponentArgsRest(__VLS_109));
        let __VLS_112;
        let __VLS_113;
        let __VLS_114;
        const __VLS_115 = {
            onClick: (...[$event]) => {
                if (!!(__VLS_ctx.keys.length === 0 && !__VLS_ctx.loading))
                    return;
                __VLS_ctx.copyKey(key);
            }
        };
        __VLS_111.slots.default;
        {
            const { icon: __VLS_thisSlot } = __VLS_111.slots;
            const __VLS_116 = {}.NIcon;
            /** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.nIcon, ]} */ ;
            // @ts-ignore
            const __VLS_117 = __VLS_asFunctionalComponent(__VLS_116, new __VLS_116({
                component: (__VLS_ctx.CopyOutline),
            }));
            const __VLS_118 = __VLS_117({
                component: (__VLS_ctx.CopyOutline),
            }, ...__VLS_functionalComponentArgsRest(__VLS_117));
        }
        var __VLS_111;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "key-bottom" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "key-stats" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "stat-item" },
        });
        (__VLS_ctx.t("keys.keyTable.requests"));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (key.request_count);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "stat-item" },
        });
        (__VLS_ctx.t("keys.keyTable.failures"));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (key.failure_count);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "stat-item" },
        });
        (key.last_used_at
            ? __VLS_ctx.formatRelativeTime(key.last_used_at)
            : __VLS_ctx.t("keys.keyTable.notUsed"));
        const __VLS_120 = {}.NButtonGroup;
        /** @type {[typeof __VLS_components.NButtonGroup, typeof __VLS_components.nButtonGroup, typeof __VLS_components.NButtonGroup, typeof __VLS_components.nButtonGroup, ]} */ ;
        // @ts-ignore
        const __VLS_121 = __VLS_asFunctionalComponent(__VLS_120, new __VLS_120({
            ...{ class: "key-actions" },
        }));
        const __VLS_122 = __VLS_121({
            ...{ class: "key-actions" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_121));
        __VLS_123.slots.default;
        const __VLS_124 = {}.NButton;
        /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
        // @ts-ignore
        const __VLS_125 = __VLS_asFunctionalComponent(__VLS_124, new __VLS_124({
            ...{ 'onClick': {} },
            round: true,
            tertiary: true,
            type: "info",
            size: "tiny",
            title: (__VLS_ctx.t('keys.keyTable.test')),
        }));
        const __VLS_126 = __VLS_125({
            ...{ 'onClick': {} },
            round: true,
            tertiary: true,
            type: "info",
            size: "tiny",
            title: (__VLS_ctx.t('keys.keyTable.test')),
        }, ...__VLS_functionalComponentArgsRest(__VLS_125));
        let __VLS_128;
        let __VLS_129;
        let __VLS_130;
        const __VLS_131 = {
            onClick: (...[$event]) => {
                if (!!(__VLS_ctx.keys.length === 0 && !__VLS_ctx.loading))
                    return;
                __VLS_ctx.testKey(key);
            }
        };
        __VLS_127.slots.default;
        (__VLS_ctx.t("keys.keyTable.test"));
        var __VLS_127;
        if (key.status !== 'active') {
            const __VLS_132 = {}.NButton;
            /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
            // @ts-ignore
            const __VLS_133 = __VLS_asFunctionalComponent(__VLS_132, new __VLS_132({
                ...{ 'onClick': {} },
                tertiary: true,
                size: "tiny",
                title: (__VLS_ctx.t('keys.keyTable.restore')),
                type: "warning",
            }));
            const __VLS_134 = __VLS_133({
                ...{ 'onClick': {} },
                tertiary: true,
                size: "tiny",
                title: (__VLS_ctx.t('keys.keyTable.restore')),
                type: "warning",
            }, ...__VLS_functionalComponentArgsRest(__VLS_133));
            let __VLS_136;
            let __VLS_137;
            let __VLS_138;
            const __VLS_139 = {
                onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.keys.length === 0 && !__VLS_ctx.loading))
                        return;
                    if (!(key.status !== 'active'))
                        return;
                    __VLS_ctx.restoreKey(key);
                }
            };
            __VLS_135.slots.default;
            (__VLS_ctx.t("keys.keyTable.restore"));
            var __VLS_135;
        }
        const __VLS_140 = {}.NButton;
        /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
        // @ts-ignore
        const __VLS_141 = __VLS_asFunctionalComponent(__VLS_140, new __VLS_140({
            ...{ 'onClick': {} },
            round: true,
            tertiary: true,
            size: "tiny",
            type: "error",
            title: (__VLS_ctx.t('keys.keyTable.delete')),
        }));
        const __VLS_142 = __VLS_141({
            ...{ 'onClick': {} },
            round: true,
            tertiary: true,
            size: "tiny",
            type: "error",
            title: (__VLS_ctx.t('keys.keyTable.delete')),
        }, ...__VLS_functionalComponentArgsRest(__VLS_141));
        let __VLS_144;
        let __VLS_145;
        let __VLS_146;
        const __VLS_147 = {
            onClick: (...[$event]) => {
                if (!!(__VLS_ctx.keys.length === 0 && !__VLS_ctx.loading))
                    return;
                __VLS_ctx.deleteKey(key);
            }
        };
        __VLS_143.slots.default;
        (__VLS_ctx.t("keys.keyTable.delete"));
        var __VLS_143;
        var __VLS_123;
    }
}
var __VLS_71;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pagination-container" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pagination-info" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.t("keys.keyTable.totalRecords", { count: __VLS_ctx.total }));
const __VLS_148 = {}.NSelect;
/** @type {[typeof __VLS_components.NSelect, typeof __VLS_components.nSelect, ]} */ ;
// @ts-ignore
const __VLS_149 = __VLS_asFunctionalComponent(__VLS_148, new __VLS_148({
    ...{ 'onUpdate:value': {} },
    value: (__VLS_ctx.pageSize),
    options: ([
        { label: __VLS_ctx.t('keys.keyTable.perPage', { count: 12 }), value: 12 },
        { label: __VLS_ctx.t('keys.keyTable.perPage', { count: 24 }), value: 24 },
        { label: __VLS_ctx.t('keys.keyTable.perPage', { count: 60 }), value: 60 },
        { label: __VLS_ctx.t('keys.keyTable.perPage', { count: 120 }), value: 120 },
    ]),
    size: "small",
    ...{ style: {} },
}));
const __VLS_150 = __VLS_149({
    ...{ 'onUpdate:value': {} },
    value: (__VLS_ctx.pageSize),
    options: ([
        { label: __VLS_ctx.t('keys.keyTable.perPage', { count: 12 }), value: 12 },
        { label: __VLS_ctx.t('keys.keyTable.perPage', { count: 24 }), value: 24 },
        { label: __VLS_ctx.t('keys.keyTable.perPage', { count: 60 }), value: 60 },
        { label: __VLS_ctx.t('keys.keyTable.perPage', { count: 120 }), value: 120 },
    ]),
    size: "small",
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_149));
let __VLS_152;
let __VLS_153;
let __VLS_154;
const __VLS_155 = {
    'onUpdate:value': (__VLS_ctx.changePageSize)
};
var __VLS_151;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pagination-controls" },
});
const __VLS_156 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_157 = __VLS_asFunctionalComponent(__VLS_156, new __VLS_156({
    ...{ 'onClick': {} },
    size: "small",
    disabled: (__VLS_ctx.currentPage <= 1),
}));
const __VLS_158 = __VLS_157({
    ...{ 'onClick': {} },
    size: "small",
    disabled: (__VLS_ctx.currentPage <= 1),
}, ...__VLS_functionalComponentArgsRest(__VLS_157));
let __VLS_160;
let __VLS_161;
let __VLS_162;
const __VLS_163 = {
    onClick: (...[$event]) => {
        __VLS_ctx.changePage(__VLS_ctx.currentPage - 1);
    }
};
__VLS_159.slots.default;
(__VLS_ctx.t("keys.keyTable.prevPage"));
var __VLS_159;
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "page-info" },
});
(__VLS_ctx.t("keys.keyTable.pageInfo", { currentPage: __VLS_ctx.currentPage, totalPages: __VLS_ctx.totalPages }));
const __VLS_164 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_165 = __VLS_asFunctionalComponent(__VLS_164, new __VLS_164({
    ...{ 'onClick': {} },
    size: "small",
    disabled: (__VLS_ctx.currentPage >= __VLS_ctx.totalPages),
}));
const __VLS_166 = __VLS_165({
    ...{ 'onClick': {} },
    size: "small",
    disabled: (__VLS_ctx.currentPage >= __VLS_ctx.totalPages),
}, ...__VLS_functionalComponentArgsRest(__VLS_165));
let __VLS_168;
let __VLS_169;
let __VLS_170;
const __VLS_171 = {
    onClick: (...[$event]) => {
        __VLS_ctx.changePage(__VLS_ctx.currentPage + 1);
    }
};
__VLS_167.slots.default;
(__VLS_ctx.t("keys.keyTable.nextPage"));
var __VLS_167;
if (__VLS_ctx.selectedGroup?.id) {
    /** @type {[typeof KeyCreateDialog, ]} */ ;
    // @ts-ignore
    const __VLS_172 = __VLS_asFunctionalComponent(KeyCreateDialog, new KeyCreateDialog({
        ...{ 'onSuccess': {} },
        show: (__VLS_ctx.createDialogShow),
        groupId: (__VLS_ctx.selectedGroup.id),
        groupName: (__VLS_ctx.getGroupDisplayName(__VLS_ctx.selectedGroup)),
    }));
    const __VLS_173 = __VLS_172({
        ...{ 'onSuccess': {} },
        show: (__VLS_ctx.createDialogShow),
        groupId: (__VLS_ctx.selectedGroup.id),
        groupName: (__VLS_ctx.getGroupDisplayName(__VLS_ctx.selectedGroup)),
    }, ...__VLS_functionalComponentArgsRest(__VLS_172));
    let __VLS_175;
    let __VLS_176;
    let __VLS_177;
    const __VLS_178 = {
        onSuccess: (__VLS_ctx.loadKeys)
    };
    var __VLS_174;
}
if (__VLS_ctx.selectedGroup?.id) {
    /** @type {[typeof KeyDeleteDialog, ]} */ ;
    // @ts-ignore
    const __VLS_179 = __VLS_asFunctionalComponent(KeyDeleteDialog, new KeyDeleteDialog({
        ...{ 'onSuccess': {} },
        show: (__VLS_ctx.deleteDialogShow),
        groupId: (__VLS_ctx.selectedGroup.id),
        groupName: (__VLS_ctx.getGroupDisplayName(__VLS_ctx.selectedGroup)),
    }));
    const __VLS_180 = __VLS_179({
        ...{ 'onSuccess': {} },
        show: (__VLS_ctx.deleteDialogShow),
        groupId: (__VLS_ctx.selectedGroup.id),
        groupName: (__VLS_ctx.getGroupDisplayName(__VLS_ctx.selectedGroup)),
    }, ...__VLS_functionalComponentArgsRest(__VLS_179));
    let __VLS_182;
    let __VLS_183;
    let __VLS_184;
    const __VLS_185 = {
        onSuccess: (__VLS_ctx.loadKeys)
    };
    var __VLS_181;
}
/** @type {__VLS_StyleScopedClasses['key-table-container']} */ ;
/** @type {__VLS_StyleScopedClasses['toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['toolbar-left']} */ ;
/** @type {__VLS_StyleScopedClasses['toolbar-right']} */ ;
/** @type {__VLS_StyleScopedClasses['keys-grid-container']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-container']} */ ;
/** @type {__VLS_StyleScopedClasses['keys-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['key-card']} */ ;
/** @type {__VLS_StyleScopedClasses['key-main']} */ ;
/** @type {__VLS_StyleScopedClasses['key-section']} */ ;
/** @type {__VLS_StyleScopedClasses['key-text']} */ ;
/** @type {__VLS_StyleScopedClasses['quick-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['key-bottom']} */ ;
/** @type {__VLS_StyleScopedClasses['key-stats']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-item']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-item']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-item']} */ ;
/** @type {__VLS_StyleScopedClasses['key-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['pagination-container']} */ ;
/** @type {__VLS_StyleScopedClasses['pagination-info']} */ ;
/** @type {__VLS_StyleScopedClasses['pagination-controls']} */ ;
/** @type {__VLS_StyleScopedClasses['page-info']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            getGroupDisplayName: getGroupDisplayName,
            maskKey: maskKey,
            AddCircleOutline: AddCircleOutline,
            AlertCircleOutline: AlertCircleOutline,
            CheckmarkCircle: CheckmarkCircle,
            CopyOutline: CopyOutline,
            EyeOffOutline: EyeOffOutline,
            EyeOutline: EyeOutline,
            RemoveCircleOutline: RemoveCircleOutline,
            Search: Search,
            NButton: NButton,
            NDropdown: NDropdown,
            NEmpty: NEmpty,
            NIcon: NIcon,
            NInput: NInput,
            NSelect: NSelect,
            NSpace: NSpace,
            NSpin: NSpin,
            KeyCreateDialog: KeyCreateDialog,
            KeyDeleteDialog: KeyDeleteDialog,
            keys: keys,
            loading: loading,
            searchText: searchText,
            statusFilter: statusFilter,
            currentPage: currentPage,
            pageSize: pageSize,
            total: total,
            totalPages: totalPages,
            t: t,
            statusOptions: statusOptions,
            moreOptions: moreOptions,
            createDialogShow: createDialogShow,
            deleteDialogShow: deleteDialogShow,
            handleSearchInput: handleSearchInput,
            handleMoreAction: handleMoreAction,
            loadKeys: loadKeys,
            copyKey: copyKey,
            testKey: testKey,
            toggleKeyVisibility: toggleKeyVisibility,
            restoreKey: restoreKey,
            deleteKey: deleteKey,
            formatRelativeTime: formatRelativeTime,
            getStatusClass: getStatusClass,
            changePage: changePage,
            changePageSize: changePageSize,
        };
    },
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
