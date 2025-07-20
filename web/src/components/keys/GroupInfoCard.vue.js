import { keysApi } from "@/api/keys";
import { copy } from "@/utils/clipboard";
import { getGroupDisplayName } from "@/utils/display";
import { Pencil, Trash } from "@vicons/ionicons5";
import { NButton, NCard, NCollapse, NCollapseItem, NForm, NFormItem, NGrid, NGridItem, NSpin, NTag, useDialog, } from "naive-ui";
import { onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import GroupFormModal from "./GroupFormModal.vue";
const props = defineProps();
const emit = defineEmits();
const { t } = useI18n();
const stats = ref(null);
const loading = ref(false);
const dialog = useDialog();
const showEditModal = ref(false);
const delLoading = ref(false);
const expandedName = ref([]);
// Kada je komponenta montirana, učitajte statistiku.
onMounted(() => {
    loadStats();
});
// Pratite promene u prop.group i ponovo učitajte statistiku.
watch(() => props.group, () => {
    resetPage();
    loadStats();
});
// Asinhrono učitava statistiku grupe.
async function loadStats() {
    if (!props.group?.id) {
        stats.value = null;
        return;
    }
    try {
        loading.value = true;
        if (props.group?.id) {
            stats.value = await keysApi.getGroupStats(props.group.id);
        }
    }
    finally {
        loading.value = false;
    }
}
// Otvara modal za uređivanje grupe.
function handleEdit() {
    showEditModal.value = true;
}
// Obrađuje događaj kada je grupa uređena.
function handleGroupEdited(newGroup) {
    showEditModal.value = false;
    if (newGroup) {
        emit("refresh", newGroup);
    }
}
// Obrađuje brisanje grupe.
async function handleDelete() {
    if (!props.group || delLoading.value) {
        return;
    }
    const d = dialog.warning({
        title: t("keys.groupInfo.deleteGroupTitle"),
        content: t("keys.groupInfo.deleteGroupContent", {
            groupName: getGroupDisplayName(props.group),
        }),
        positiveText: t("keys.groupInfo.confirm"),
        negativeText: t("keys.groupInfo.cancel"),
        onPositiveClick: async () => {
            d.loading = true;
            delLoading.value = true;
            try {
                if (props.group?.id) {
                    await keysApi.deleteGroup(props.group.id);
                    emit("delete", props.group);
                }
            }
            catch (error) {
                console.error(t("keys.groupInfo.deleteGroupFailed"), error);
            }
            finally {
                d.loading = false;
                delLoading.value = false;
            }
        },
    });
}
// Formatira broj za prikaz (npr. 12345 -> 12.3K).
function formatNumber(num) {
    // if (num >= 1000000) {
    //   return `${(num / 1000000).toFixed(1)}M`;
    // }
    if (num >= 1000) {
        return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
}
// Formatira broj kao procenat.
function formatPercentage(num) {
    if (num <= 0) {
        return "0";
    }
    return `${(num * 100).toFixed(1)}%`;
}
// Kopira URL u clipboard.
async function copyUrl(url) {
    if (!url) {
        return;
    }
    const success = await copy(url);
    if (success) {
        window.$message.success(t("keys.groupInfo.copySuccess"));
    }
    else {
        window.$message.error(t("keys.groupInfo.copyFailed"));
    }
}
// Resetuje stanje stranice.
function resetPage() {
    showEditModal.value = false;
    expandedName.value = [];
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['detail-section']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "group-info-container" },
});
const __VLS_0 = {}.NCard;
/** @type {[typeof __VLS_components.NCard, typeof __VLS_components.nCard, typeof __VLS_components.NCard, typeof __VLS_components.nCard, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    bordered: (false),
    ...{ class: "group-info-card" },
}));
const __VLS_2 = __VLS_1({
    bordered: (false),
    ...{ class: "group-info-card" },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_3.slots.default;
{
    const { header: __VLS_thisSlot } = __VLS_3.slots;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "card-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "header-left" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
        ...{ class: "group-title" },
    });
    (__VLS_ctx.group ? __VLS_ctx.getGroupDisplayName(__VLS_ctx.group) : __VLS_ctx.t("keys.groupInfo.pleaseSelectGroup"));
    if (__VLS_ctx.group) {
        const __VLS_4 = {}.NTooltip;
        /** @type {[typeof __VLS_components.NTooltip, typeof __VLS_components.nTooltip, typeof __VLS_components.NTooltip, typeof __VLS_components.nTooltip, ]} */ ;
        // @ts-ignore
        const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
            trigger: "hover",
        }));
        const __VLS_6 = __VLS_5({
            trigger: "hover",
        }, ...__VLS_functionalComponentArgsRest(__VLS_5));
        __VLS_7.slots.default;
        {
            const { trigger: __VLS_thisSlot } = __VLS_7.slots;
            __VLS_asFunctionalElement(__VLS_intrinsicElements.code, __VLS_intrinsicElements.code)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.group))
                            return;
                        __VLS_ctx.copyUrl(__VLS_ctx.group?.endpoint || '');
                    } },
                ...{ class: "group-url" },
            });
            (__VLS_ctx.group.endpoint);
        }
        (__VLS_ctx.t("keys.groupInfo.copyTooltip"));
        var __VLS_7;
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "header-actions" },
    });
    const __VLS_8 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
        ...{ 'onClick': {} },
        quaternary: true,
        circle: true,
        size: "small",
        title: (__VLS_ctx.t('keys.groupInfo.editGroup')),
    }));
    const __VLS_10 = __VLS_9({
        ...{ 'onClick': {} },
        quaternary: true,
        circle: true,
        size: "small",
        title: (__VLS_ctx.t('keys.groupInfo.editGroup')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_9));
    let __VLS_12;
    let __VLS_13;
    let __VLS_14;
    const __VLS_15 = {
        onClick: (__VLS_ctx.handleEdit)
    };
    __VLS_11.slots.default;
    {
        const { icon: __VLS_thisSlot } = __VLS_11.slots;
        const __VLS_16 = {}.NIcon;
        /** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.nIcon, ]} */ ;
        // @ts-ignore
        const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
            component: (__VLS_ctx.Pencil),
        }));
        const __VLS_18 = __VLS_17({
            component: (__VLS_ctx.Pencil),
        }, ...__VLS_functionalComponentArgsRest(__VLS_17));
    }
    var __VLS_11;
    const __VLS_20 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
        ...{ 'onClick': {} },
        quaternary: true,
        circle: true,
        size: "small",
        title: (__VLS_ctx.t('keys.groupInfo.deleteGroup')),
        type: "error",
        disabled: (!__VLS_ctx.group),
    }));
    const __VLS_22 = __VLS_21({
        ...{ 'onClick': {} },
        quaternary: true,
        circle: true,
        size: "small",
        title: (__VLS_ctx.t('keys.groupInfo.deleteGroup')),
        type: "error",
        disabled: (!__VLS_ctx.group),
    }, ...__VLS_functionalComponentArgsRest(__VLS_21));
    let __VLS_24;
    let __VLS_25;
    let __VLS_26;
    const __VLS_27 = {
        onClick: (__VLS_ctx.handleDelete)
    };
    __VLS_23.slots.default;
    {
        const { icon: __VLS_thisSlot } = __VLS_23.slots;
        const __VLS_28 = {}.NIcon;
        /** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.nIcon, ]} */ ;
        // @ts-ignore
        const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
            component: (__VLS_ctx.Trash),
        }));
        const __VLS_30 = __VLS_29({
            component: (__VLS_ctx.Trash),
        }, ...__VLS_functionalComponentArgsRest(__VLS_29));
    }
    var __VLS_23;
}
const __VLS_32 = {}.NDivider;
/** @type {[typeof __VLS_components.NDivider, typeof __VLS_components.nDivider, ]} */ ;
// @ts-ignore
const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
    ...{ style: {} },
}));
const __VLS_34 = __VLS_33({
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_33));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stats-summary" },
});
const __VLS_36 = {}.NSpin;
/** @type {[typeof __VLS_components.NSpin, typeof __VLS_components.nSpin, typeof __VLS_components.NSpin, typeof __VLS_components.nSpin, ]} */ ;
// @ts-ignore
const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
    show: (__VLS_ctx.loading),
    size: "small",
}));
const __VLS_38 = __VLS_37({
    show: (__VLS_ctx.loading),
    size: "small",
}, ...__VLS_functionalComponentArgsRest(__VLS_37));
__VLS_39.slots.default;
const __VLS_40 = {}.NGrid;
/** @type {[typeof __VLS_components.NGrid, typeof __VLS_components.nGrid, typeof __VLS_components.NGrid, typeof __VLS_components.nGrid, ]} */ ;
// @ts-ignore
const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
    cols: (4),
    xGap: (12),
    yGap: (12),
    responsive: "screen",
}));
const __VLS_42 = __VLS_41({
    cols: (4),
    xGap: (12),
    yGap: (12),
    responsive: "screen",
}, ...__VLS_functionalComponentArgsRest(__VLS_41));
__VLS_43.slots.default;
const __VLS_44 = {}.NGridItem;
/** @type {[typeof __VLS_components.NGridItem, typeof __VLS_components.nGridItem, typeof __VLS_components.NGridItem, typeof __VLS_components.nGridItem, ]} */ ;
// @ts-ignore
const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
    span: "1",
}));
const __VLS_46 = __VLS_45({
    span: "1",
}, ...__VLS_functionalComponentArgsRest(__VLS_45));
__VLS_47.slots.default;
const __VLS_48 = {}.NStatistic;
/** @type {[typeof __VLS_components.NStatistic, typeof __VLS_components.nStatistic, typeof __VLS_components.NStatistic, typeof __VLS_components.nStatistic, ]} */ ;
// @ts-ignore
const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
    label: (__VLS_ctx.t('keys.groupInfo.keyCount', { count: __VLS_ctx.stats?.key_stats?.total_keys ?? 0 })),
}));
const __VLS_50 = __VLS_49({
    label: (__VLS_ctx.t('keys.groupInfo.keyCount', { count: __VLS_ctx.stats?.key_stats?.total_keys ?? 0 })),
}, ...__VLS_functionalComponentArgsRest(__VLS_49));
__VLS_51.slots.default;
const __VLS_52 = {}.NTooltip;
/** @type {[typeof __VLS_components.NTooltip, typeof __VLS_components.nTooltip, typeof __VLS_components.NTooltip, typeof __VLS_components.nTooltip, ]} */ ;
// @ts-ignore
const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
    trigger: "hover",
}));
const __VLS_54 = __VLS_53({
    trigger: "hover",
}, ...__VLS_functionalComponentArgsRest(__VLS_53));
__VLS_55.slots.default;
{
    const { trigger: __VLS_thisSlot } = __VLS_55.slots;
    const __VLS_56 = {}.NGradientText;
    /** @type {[typeof __VLS_components.NGradientText, typeof __VLS_components.nGradientText, typeof __VLS_components.NGradientText, typeof __VLS_components.nGradientText, ]} */ ;
    // @ts-ignore
    const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
        type: "success",
        size: "20",
    }));
    const __VLS_58 = __VLS_57({
        type: "success",
        size: "20",
    }, ...__VLS_functionalComponentArgsRest(__VLS_57));
    __VLS_59.slots.default;
    (__VLS_ctx.stats?.key_stats?.active_keys ?? 0);
    var __VLS_59;
}
(__VLS_ctx.t("keys.groupInfo.activeKeys"));
var __VLS_55;
const __VLS_60 = {}.NDivider;
/** @type {[typeof __VLS_components.NDivider, typeof __VLS_components.nDivider, ]} */ ;
// @ts-ignore
const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({
    vertical: true,
}));
const __VLS_62 = __VLS_61({
    vertical: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_61));
const __VLS_64 = {}.NTooltip;
/** @type {[typeof __VLS_components.NTooltip, typeof __VLS_components.nTooltip, typeof __VLS_components.NTooltip, typeof __VLS_components.nTooltip, ]} */ ;
// @ts-ignore
const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
    trigger: "hover",
}));
const __VLS_66 = __VLS_65({
    trigger: "hover",
}, ...__VLS_functionalComponentArgsRest(__VLS_65));
__VLS_67.slots.default;
{
    const { trigger: __VLS_thisSlot } = __VLS_67.slots;
    const __VLS_68 = {}.NGradientText;
    /** @type {[typeof __VLS_components.NGradientText, typeof __VLS_components.nGradientText, typeof __VLS_components.NGradientText, typeof __VLS_components.nGradientText, ]} */ ;
    // @ts-ignore
    const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({
        type: "error",
        size: "20",
    }));
    const __VLS_70 = __VLS_69({
        type: "error",
        size: "20",
    }, ...__VLS_functionalComponentArgsRest(__VLS_69));
    __VLS_71.slots.default;
    (__VLS_ctx.stats?.key_stats?.invalid_keys ?? 0);
    var __VLS_71;
}
(__VLS_ctx.t("keys.groupInfo.invalidKeys"));
var __VLS_67;
var __VLS_51;
var __VLS_47;
const __VLS_72 = {}.NGridItem;
/** @type {[typeof __VLS_components.NGridItem, typeof __VLS_components.nGridItem, typeof __VLS_components.NGridItem, typeof __VLS_components.nGridItem, ]} */ ;
// @ts-ignore
const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({
    span: "1",
}));
const __VLS_74 = __VLS_73({
    span: "1",
}, ...__VLS_functionalComponentArgsRest(__VLS_73));
__VLS_75.slots.default;
const __VLS_76 = {}.NStatistic;
/** @type {[typeof __VLS_components.NStatistic, typeof __VLS_components.nStatistic, typeof __VLS_components.NStatistic, typeof __VLS_components.nStatistic, ]} */ ;
// @ts-ignore
const __VLS_77 = __VLS_asFunctionalComponent(__VLS_76, new __VLS_76({
    label: (__VLS_ctx.t('keys.groupInfo.requests1h', {
        count: __VLS_ctx.formatNumber(__VLS_ctx.stats?.hourly_stats?.total_requests ?? 0),
    })),
}));
const __VLS_78 = __VLS_77({
    label: (__VLS_ctx.t('keys.groupInfo.requests1h', {
        count: __VLS_ctx.formatNumber(__VLS_ctx.stats?.hourly_stats?.total_requests ?? 0),
    })),
}, ...__VLS_functionalComponentArgsRest(__VLS_77));
__VLS_79.slots.default;
const __VLS_80 = {}.NTooltip;
/** @type {[typeof __VLS_components.NTooltip, typeof __VLS_components.nTooltip, typeof __VLS_components.NTooltip, typeof __VLS_components.nTooltip, ]} */ ;
// @ts-ignore
const __VLS_81 = __VLS_asFunctionalComponent(__VLS_80, new __VLS_80({
    trigger: "hover",
}));
const __VLS_82 = __VLS_81({
    trigger: "hover",
}, ...__VLS_functionalComponentArgsRest(__VLS_81));
__VLS_83.slots.default;
{
    const { trigger: __VLS_thisSlot } = __VLS_83.slots;
    const __VLS_84 = {}.NGradientText;
    /** @type {[typeof __VLS_components.NGradientText, typeof __VLS_components.nGradientText, typeof __VLS_components.NGradientText, typeof __VLS_components.nGradientText, ]} */ ;
    // @ts-ignore
    const __VLS_85 = __VLS_asFunctionalComponent(__VLS_84, new __VLS_84({
        type: "error",
        size: "20",
    }));
    const __VLS_86 = __VLS_85({
        type: "error",
        size: "20",
    }, ...__VLS_functionalComponentArgsRest(__VLS_85));
    __VLS_87.slots.default;
    (__VLS_ctx.formatNumber(__VLS_ctx.stats?.hourly_stats?.failed_requests ?? 0));
    var __VLS_87;
}
(__VLS_ctx.t("keys.groupInfo.failedRequests1h"));
var __VLS_83;
const __VLS_88 = {}.NDivider;
/** @type {[typeof __VLS_components.NDivider, typeof __VLS_components.nDivider, ]} */ ;
// @ts-ignore
const __VLS_89 = __VLS_asFunctionalComponent(__VLS_88, new __VLS_88({
    vertical: true,
}));
const __VLS_90 = __VLS_89({
    vertical: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_89));
const __VLS_92 = {}.NTooltip;
/** @type {[typeof __VLS_components.NTooltip, typeof __VLS_components.nTooltip, typeof __VLS_components.NTooltip, typeof __VLS_components.nTooltip, ]} */ ;
// @ts-ignore
const __VLS_93 = __VLS_asFunctionalComponent(__VLS_92, new __VLS_92({
    trigger: "hover",
}));
const __VLS_94 = __VLS_93({
    trigger: "hover",
}, ...__VLS_functionalComponentArgsRest(__VLS_93));
__VLS_95.slots.default;
{
    const { trigger: __VLS_thisSlot } = __VLS_95.slots;
    const __VLS_96 = {}.NGradientText;
    /** @type {[typeof __VLS_components.NGradientText, typeof __VLS_components.nGradientText, typeof __VLS_components.NGradientText, typeof __VLS_components.nGradientText, ]} */ ;
    // @ts-ignore
    const __VLS_97 = __VLS_asFunctionalComponent(__VLS_96, new __VLS_96({
        type: "error",
        size: "20",
    }));
    const __VLS_98 = __VLS_97({
        type: "error",
        size: "20",
    }, ...__VLS_functionalComponentArgsRest(__VLS_97));
    __VLS_99.slots.default;
    (__VLS_ctx.formatPercentage(__VLS_ctx.stats?.hourly_stats?.failure_rate ?? 0));
    var __VLS_99;
}
(__VLS_ctx.t("keys.groupInfo.failureRate1h"));
var __VLS_95;
var __VLS_79;
var __VLS_75;
const __VLS_100 = {}.NGridItem;
/** @type {[typeof __VLS_components.NGridItem, typeof __VLS_components.nGridItem, typeof __VLS_components.NGridItem, typeof __VLS_components.nGridItem, ]} */ ;
// @ts-ignore
const __VLS_101 = __VLS_asFunctionalComponent(__VLS_100, new __VLS_100({
    span: "1",
}));
const __VLS_102 = __VLS_101({
    span: "1",
}, ...__VLS_functionalComponentArgsRest(__VLS_101));
__VLS_103.slots.default;
const __VLS_104 = {}.NStatistic;
/** @type {[typeof __VLS_components.NStatistic, typeof __VLS_components.nStatistic, typeof __VLS_components.NStatistic, typeof __VLS_components.nStatistic, ]} */ ;
// @ts-ignore
const __VLS_105 = __VLS_asFunctionalComponent(__VLS_104, new __VLS_104({
    label: (__VLS_ctx.t('keys.groupInfo.requests24h', {
        count: __VLS_ctx.formatNumber(__VLS_ctx.stats?.daily_stats?.total_requests ?? 0),
    })),
}));
const __VLS_106 = __VLS_105({
    label: (__VLS_ctx.t('keys.groupInfo.requests24h', {
        count: __VLS_ctx.formatNumber(__VLS_ctx.stats?.daily_stats?.total_requests ?? 0),
    })),
}, ...__VLS_functionalComponentArgsRest(__VLS_105));
__VLS_107.slots.default;
const __VLS_108 = {}.NTooltip;
/** @type {[typeof __VLS_components.NTooltip, typeof __VLS_components.nTooltip, typeof __VLS_components.NTooltip, typeof __VLS_components.nTooltip, ]} */ ;
// @ts-ignore
const __VLS_109 = __VLS_asFunctionalComponent(__VLS_108, new __VLS_108({
    trigger: "hover",
}));
const __VLS_110 = __VLS_109({
    trigger: "hover",
}, ...__VLS_functionalComponentArgsRest(__VLS_109));
__VLS_111.slots.default;
{
    const { trigger: __VLS_thisSlot } = __VLS_111.slots;
    const __VLS_112 = {}.NGradientText;
    /** @type {[typeof __VLS_components.NGradientText, typeof __VLS_components.nGradientText, typeof __VLS_components.NGradientText, typeof __VLS_components.nGradientText, ]} */ ;
    // @ts-ignore
    const __VLS_113 = __VLS_asFunctionalComponent(__VLS_112, new __VLS_112({
        type: "error",
        size: "20",
    }));
    const __VLS_114 = __VLS_113({
        type: "error",
        size: "20",
    }, ...__VLS_functionalComponentArgsRest(__VLS_113));
    __VLS_115.slots.default;
    (__VLS_ctx.formatNumber(__VLS_ctx.stats?.daily_stats?.failed_requests ?? 0));
    var __VLS_115;
}
(__VLS_ctx.t("keys.groupInfo.failedRequests24h"));
var __VLS_111;
const __VLS_116 = {}.NDivider;
/** @type {[typeof __VLS_components.NDivider, typeof __VLS_components.nDivider, ]} */ ;
// @ts-ignore
const __VLS_117 = __VLS_asFunctionalComponent(__VLS_116, new __VLS_116({
    vertical: true,
}));
const __VLS_118 = __VLS_117({
    vertical: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_117));
const __VLS_120 = {}.NTooltip;
/** @type {[typeof __VLS_components.NTooltip, typeof __VLS_components.nTooltip, typeof __VLS_components.NTooltip, typeof __VLS_components.nTooltip, ]} */ ;
// @ts-ignore
const __VLS_121 = __VLS_asFunctionalComponent(__VLS_120, new __VLS_120({
    trigger: "hover",
}));
const __VLS_122 = __VLS_121({
    trigger: "hover",
}, ...__VLS_functionalComponentArgsRest(__VLS_121));
__VLS_123.slots.default;
{
    const { trigger: __VLS_thisSlot } = __VLS_123.slots;
    const __VLS_124 = {}.NGradientText;
    /** @type {[typeof __VLS_components.NGradientText, typeof __VLS_components.nGradientText, typeof __VLS_components.NGradientText, typeof __VLS_components.nGradientText, ]} */ ;
    // @ts-ignore
    const __VLS_125 = __VLS_asFunctionalComponent(__VLS_124, new __VLS_124({
        type: "error",
        size: "20",
    }));
    const __VLS_126 = __VLS_125({
        type: "error",
        size: "20",
    }, ...__VLS_functionalComponentArgsRest(__VLS_125));
    __VLS_127.slots.default;
    (__VLS_ctx.formatPercentage(__VLS_ctx.stats?.daily_stats?.failure_rate ?? 0));
    var __VLS_127;
}
(__VLS_ctx.t("keys.groupInfo.failureRate24h"));
var __VLS_123;
var __VLS_107;
var __VLS_103;
const __VLS_128 = {}.NGridItem;
/** @type {[typeof __VLS_components.NGridItem, typeof __VLS_components.nGridItem, typeof __VLS_components.NGridItem, typeof __VLS_components.nGridItem, ]} */ ;
// @ts-ignore
const __VLS_129 = __VLS_asFunctionalComponent(__VLS_128, new __VLS_128({
    span: "1",
}));
const __VLS_130 = __VLS_129({
    span: "1",
}, ...__VLS_functionalComponentArgsRest(__VLS_129));
__VLS_131.slots.default;
const __VLS_132 = {}.NStatistic;
/** @type {[typeof __VLS_components.NStatistic, typeof __VLS_components.nStatistic, typeof __VLS_components.NStatistic, typeof __VLS_components.nStatistic, ]} */ ;
// @ts-ignore
const __VLS_133 = __VLS_asFunctionalComponent(__VLS_132, new __VLS_132({
    label: (__VLS_ctx.t('keys.groupInfo.requests7d', {
        count: __VLS_ctx.formatNumber(__VLS_ctx.stats?.weekly_stats?.total_requests ?? 0),
    })),
}));
const __VLS_134 = __VLS_133({
    label: (__VLS_ctx.t('keys.groupInfo.requests7d', {
        count: __VLS_ctx.formatNumber(__VLS_ctx.stats?.weekly_stats?.total_requests ?? 0),
    })),
}, ...__VLS_functionalComponentArgsRest(__VLS_133));
__VLS_135.slots.default;
const __VLS_136 = {}.NTooltip;
/** @type {[typeof __VLS_components.NTooltip, typeof __VLS_components.nTooltip, typeof __VLS_components.NTooltip, typeof __VLS_components.nTooltip, ]} */ ;
// @ts-ignore
const __VLS_137 = __VLS_asFunctionalComponent(__VLS_136, new __VLS_136({
    trigger: "hover",
}));
const __VLS_138 = __VLS_137({
    trigger: "hover",
}, ...__VLS_functionalComponentArgsRest(__VLS_137));
__VLS_139.slots.default;
{
    const { trigger: __VLS_thisSlot } = __VLS_139.slots;
    const __VLS_140 = {}.NGradientText;
    /** @type {[typeof __VLS_components.NGradientText, typeof __VLS_components.nGradientText, typeof __VLS_components.NGradientText, typeof __VLS_components.nGradientText, ]} */ ;
    // @ts-ignore
    const __VLS_141 = __VLS_asFunctionalComponent(__VLS_140, new __VLS_140({
        type: "error",
        size: "20",
    }));
    const __VLS_142 = __VLS_141({
        type: "error",
        size: "20",
    }, ...__VLS_functionalComponentArgsRest(__VLS_141));
    __VLS_143.slots.default;
    (__VLS_ctx.formatNumber(__VLS_ctx.stats?.weekly_stats?.failed_requests ?? 0));
    var __VLS_143;
}
(__VLS_ctx.t("keys.groupInfo.failedRequests7d"));
var __VLS_139;
const __VLS_144 = {}.NDivider;
/** @type {[typeof __VLS_components.NDivider, typeof __VLS_components.nDivider, ]} */ ;
// @ts-ignore
const __VLS_145 = __VLS_asFunctionalComponent(__VLS_144, new __VLS_144({
    vertical: true,
}));
const __VLS_146 = __VLS_145({
    vertical: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_145));
const __VLS_148 = {}.NTooltip;
/** @type {[typeof __VLS_components.NTooltip, typeof __VLS_components.nTooltip, typeof __VLS_components.NTooltip, typeof __VLS_components.nTooltip, ]} */ ;
// @ts-ignore
const __VLS_149 = __VLS_asFunctionalComponent(__VLS_148, new __VLS_148({
    trigger: "hover",
}));
const __VLS_150 = __VLS_149({
    trigger: "hover",
}, ...__VLS_functionalComponentArgsRest(__VLS_149));
__VLS_151.slots.default;
{
    const { trigger: __VLS_thisSlot } = __VLS_151.slots;
    const __VLS_152 = {}.NGradientText;
    /** @type {[typeof __VLS_components.NGradientText, typeof __VLS_components.nGradientText, typeof __VLS_components.NGradientText, typeof __VLS_components.nGradientText, ]} */ ;
    // @ts-ignore
    const __VLS_153 = __VLS_asFunctionalComponent(__VLS_152, new __VLS_152({
        type: "error",
        size: "20",
    }));
    const __VLS_154 = __VLS_153({
        type: "error",
        size: "20",
    }, ...__VLS_functionalComponentArgsRest(__VLS_153));
    __VLS_155.slots.default;
    (__VLS_ctx.formatPercentage(__VLS_ctx.stats?.weekly_stats?.failure_rate ?? 0));
    var __VLS_155;
}
(__VLS_ctx.t("keys.groupInfo.failureRate7d"));
var __VLS_151;
var __VLS_135;
var __VLS_131;
var __VLS_43;
var __VLS_39;
const __VLS_156 = {}.NDivider;
/** @type {[typeof __VLS_components.NDivider, typeof __VLS_components.nDivider, ]} */ ;
// @ts-ignore
const __VLS_157 = __VLS_asFunctionalComponent(__VLS_156, new __VLS_156({
    ...{ style: {} },
}));
const __VLS_158 = __VLS_157({
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_157));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "details-section" },
});
const __VLS_160 = {}.NCollapse;
/** @type {[typeof __VLS_components.NCollapse, typeof __VLS_components.nCollapse, typeof __VLS_components.NCollapse, typeof __VLS_components.nCollapse, ]} */ ;
// @ts-ignore
const __VLS_161 = __VLS_asFunctionalComponent(__VLS_160, new __VLS_160({
    accordion: true,
    expandedNames: (__VLS_ctx.expandedName),
}));
const __VLS_162 = __VLS_161({
    accordion: true,
    expandedNames: (__VLS_ctx.expandedName),
}, ...__VLS_functionalComponentArgsRest(__VLS_161));
__VLS_163.slots.default;
const __VLS_164 = {}.NCollapseItem;
/** @type {[typeof __VLS_components.NCollapseItem, typeof __VLS_components.nCollapseItem, typeof __VLS_components.NCollapseItem, typeof __VLS_components.nCollapseItem, ]} */ ;
// @ts-ignore
const __VLS_165 = __VLS_asFunctionalComponent(__VLS_164, new __VLS_164({
    title: (__VLS_ctx.t('keys.groupInfo.details')),
    name: "details",
}));
const __VLS_166 = __VLS_165({
    title: (__VLS_ctx.t('keys.groupInfo.details')),
    name: "details",
}, ...__VLS_functionalComponentArgsRest(__VLS_165));
__VLS_167.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "details-content" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "detail-section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({
    ...{ class: "section-title" },
});
(__VLS_ctx.t("keys.groupInfo.basicInfo"));
const __VLS_168 = {}.NForm;
/** @type {[typeof __VLS_components.NForm, typeof __VLS_components.nForm, typeof __VLS_components.NForm, typeof __VLS_components.nForm, ]} */ ;
// @ts-ignore
const __VLS_169 = __VLS_asFunctionalComponent(__VLS_168, new __VLS_168({
    labelPlacement: "left",
    labelWidth: "85px",
    labelAlign: "right",
}));
const __VLS_170 = __VLS_169({
    labelPlacement: "left",
    labelWidth: "85px",
    labelAlign: "right",
}, ...__VLS_functionalComponentArgsRest(__VLS_169));
__VLS_171.slots.default;
const __VLS_172 = {}.NGrid;
/** @type {[typeof __VLS_components.NGrid, typeof __VLS_components.nGrid, typeof __VLS_components.NGrid, typeof __VLS_components.nGrid, ]} */ ;
// @ts-ignore
const __VLS_173 = __VLS_asFunctionalComponent(__VLS_172, new __VLS_172({
    cols: (2),
}));
const __VLS_174 = __VLS_173({
    cols: (2),
}, ...__VLS_functionalComponentArgsRest(__VLS_173));
__VLS_175.slots.default;
const __VLS_176 = {}.NGridItem;
/** @type {[typeof __VLS_components.NGridItem, typeof __VLS_components.nGridItem, typeof __VLS_components.NGridItem, typeof __VLS_components.nGridItem, ]} */ ;
// @ts-ignore
const __VLS_177 = __VLS_asFunctionalComponent(__VLS_176, new __VLS_176({}));
const __VLS_178 = __VLS_177({}, ...__VLS_functionalComponentArgsRest(__VLS_177));
__VLS_179.slots.default;
const __VLS_180 = {}.NFormItem;
/** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.nFormItem, typeof __VLS_components.NFormItem, typeof __VLS_components.nFormItem, ]} */ ;
// @ts-ignore
const __VLS_181 = __VLS_asFunctionalComponent(__VLS_180, new __VLS_180({
    label: (__VLS_ctx.t('keys.groupInfo.groupName')),
}));
const __VLS_182 = __VLS_181({
    label: (__VLS_ctx.t('keys.groupInfo.groupName')),
}, ...__VLS_functionalComponentArgsRest(__VLS_181));
__VLS_183.slots.default;
(__VLS_ctx.group?.name || "-");
var __VLS_183;
var __VLS_179;
const __VLS_184 = {}.NGridItem;
/** @type {[typeof __VLS_components.NGridItem, typeof __VLS_components.nGridItem, typeof __VLS_components.NGridItem, typeof __VLS_components.nGridItem, ]} */ ;
// @ts-ignore
const __VLS_185 = __VLS_asFunctionalComponent(__VLS_184, new __VLS_184({}));
const __VLS_186 = __VLS_185({}, ...__VLS_functionalComponentArgsRest(__VLS_185));
__VLS_187.slots.default;
const __VLS_188 = {}.NFormItem;
/** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.nFormItem, typeof __VLS_components.NFormItem, typeof __VLS_components.nFormItem, ]} */ ;
// @ts-ignore
const __VLS_189 = __VLS_asFunctionalComponent(__VLS_188, new __VLS_188({
    label: (__VLS_ctx.t('keys.groupInfo.displayName')),
}));
const __VLS_190 = __VLS_189({
    label: (__VLS_ctx.t('keys.groupInfo.displayName')),
}, ...__VLS_functionalComponentArgsRest(__VLS_189));
__VLS_191.slots.default;
(__VLS_ctx.group?.display_name || "-");
var __VLS_191;
var __VLS_187;
const __VLS_192 = {}.NGridItem;
/** @type {[typeof __VLS_components.NGridItem, typeof __VLS_components.nGridItem, typeof __VLS_components.NGridItem, typeof __VLS_components.nGridItem, ]} */ ;
// @ts-ignore
const __VLS_193 = __VLS_asFunctionalComponent(__VLS_192, new __VLS_192({}));
const __VLS_194 = __VLS_193({}, ...__VLS_functionalComponentArgsRest(__VLS_193));
__VLS_195.slots.default;
const __VLS_196 = {}.NFormItem;
/** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.nFormItem, typeof __VLS_components.NFormItem, typeof __VLS_components.nFormItem, ]} */ ;
// @ts-ignore
const __VLS_197 = __VLS_asFunctionalComponent(__VLS_196, new __VLS_196({
    label: (__VLS_ctx.t('keys.groupInfo.channelType')),
}));
const __VLS_198 = __VLS_197({
    label: (__VLS_ctx.t('keys.groupInfo.channelType')),
}, ...__VLS_functionalComponentArgsRest(__VLS_197));
__VLS_199.slots.default;
(__VLS_ctx.group?.channel_type || "-");
var __VLS_199;
var __VLS_195;
const __VLS_200 = {}.NGridItem;
/** @type {[typeof __VLS_components.NGridItem, typeof __VLS_components.nGridItem, typeof __VLS_components.NGridItem, typeof __VLS_components.nGridItem, ]} */ ;
// @ts-ignore
const __VLS_201 = __VLS_asFunctionalComponent(__VLS_200, new __VLS_200({}));
const __VLS_202 = __VLS_201({}, ...__VLS_functionalComponentArgsRest(__VLS_201));
__VLS_203.slots.default;
const __VLS_204 = {}.NFormItem;
/** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.nFormItem, typeof __VLS_components.NFormItem, typeof __VLS_components.nFormItem, ]} */ ;
// @ts-ignore
const __VLS_205 = __VLS_asFunctionalComponent(__VLS_204, new __VLS_204({
    label: (__VLS_ctx.t('keys.groupInfo.testModel')),
}));
const __VLS_206 = __VLS_205({
    label: (__VLS_ctx.t('keys.groupInfo.testModel')),
}, ...__VLS_functionalComponentArgsRest(__VLS_205));
__VLS_207.slots.default;
(__VLS_ctx.group?.test_model || "-");
var __VLS_207;
var __VLS_203;
const __VLS_208 = {}.NGridItem;
/** @type {[typeof __VLS_components.NGridItem, typeof __VLS_components.nGridItem, typeof __VLS_components.NGridItem, typeof __VLS_components.nGridItem, ]} */ ;
// @ts-ignore
const __VLS_209 = __VLS_asFunctionalComponent(__VLS_208, new __VLS_208({}));
const __VLS_210 = __VLS_209({}, ...__VLS_functionalComponentArgsRest(__VLS_209));
__VLS_211.slots.default;
const __VLS_212 = {}.NFormItem;
/** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.nFormItem, typeof __VLS_components.NFormItem, typeof __VLS_components.nFormItem, ]} */ ;
// @ts-ignore
const __VLS_213 = __VLS_asFunctionalComponent(__VLS_212, new __VLS_212({
    label: (__VLS_ctx.t('keys.groupInfo.sort')),
}));
const __VLS_214 = __VLS_213({
    label: (__VLS_ctx.t('keys.groupInfo.sort')),
}, ...__VLS_functionalComponentArgsRest(__VLS_213));
__VLS_215.slots.default;
(__VLS_ctx.group?.sort || 0);
var __VLS_215;
var __VLS_211;
const __VLS_216 = {}.NGridItem;
/** @type {[typeof __VLS_components.NGridItem, typeof __VLS_components.nGridItem, typeof __VLS_components.NGridItem, typeof __VLS_components.nGridItem, ]} */ ;
// @ts-ignore
const __VLS_217 = __VLS_asFunctionalComponent(__VLS_216, new __VLS_216({}));
const __VLS_218 = __VLS_217({}, ...__VLS_functionalComponentArgsRest(__VLS_217));
__VLS_219.slots.default;
const __VLS_220 = {}.NFormItem;
/** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.nFormItem, typeof __VLS_components.NFormItem, typeof __VLS_components.nFormItem, ]} */ ;
// @ts-ignore
const __VLS_221 = __VLS_asFunctionalComponent(__VLS_220, new __VLS_220({
    label: (__VLS_ctx.t('keys.groupInfo.description')),
}));
const __VLS_222 = __VLS_221({
    label: (__VLS_ctx.t('keys.groupInfo.description')),
}, ...__VLS_functionalComponentArgsRest(__VLS_221));
__VLS_223.slots.default;
(__VLS_ctx.group?.description || "-");
var __VLS_223;
var __VLS_219;
var __VLS_175;
var __VLS_171;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "detail-section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({
    ...{ class: "section-title" },
});
(__VLS_ctx.t("keys.groupInfo.upstreamAddresses"));
const __VLS_224 = {}.NForm;
/** @type {[typeof __VLS_components.NForm, typeof __VLS_components.nForm, typeof __VLS_components.NForm, typeof __VLS_components.nForm, ]} */ ;
// @ts-ignore
const __VLS_225 = __VLS_asFunctionalComponent(__VLS_224, new __VLS_224({
    labelPlacement: "left",
    labelWidth: "100px",
}));
const __VLS_226 = __VLS_225({
    labelPlacement: "left",
    labelWidth: "100px",
}, ...__VLS_functionalComponentArgsRest(__VLS_225));
__VLS_227.slots.default;
for (const [upstream, index] of __VLS_getVForSourceType((__VLS_ctx.group?.upstreams ?? []))) {
    const __VLS_228 = {}.NFormItem;
    /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.nFormItem, typeof __VLS_components.NFormItem, typeof __VLS_components.nFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_229 = __VLS_asFunctionalComponent(__VLS_228, new __VLS_228({
        key: (index),
        ...{ class: "upstream-item" },
        label: (__VLS_ctx.t('keys.groupInfo.upstream', { index: index + 1 })),
    }));
    const __VLS_230 = __VLS_229({
        key: (index),
        ...{ class: "upstream-item" },
        label: (__VLS_ctx.t('keys.groupInfo.upstream', { index: index + 1 })),
    }, ...__VLS_functionalComponentArgsRest(__VLS_229));
    __VLS_231.slots.default;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "upstream-weight" },
    });
    const __VLS_232 = {}.NTag;
    /** @type {[typeof __VLS_components.NTag, typeof __VLS_components.nTag, typeof __VLS_components.NTag, typeof __VLS_components.nTag, ]} */ ;
    // @ts-ignore
    const __VLS_233 = __VLS_asFunctionalComponent(__VLS_232, new __VLS_232({
        size: "small",
        type: "info",
    }));
    const __VLS_234 = __VLS_233({
        size: "small",
        type: "info",
    }, ...__VLS_functionalComponentArgsRest(__VLS_233));
    __VLS_235.slots.default;
    (__VLS_ctx.t("keys.groupInfo.weight", { weight: upstream.weight }));
    var __VLS_235;
    const __VLS_236 = {}.NInput;
    /** @type {[typeof __VLS_components.NInput, typeof __VLS_components.nInput, ]} */ ;
    // @ts-ignore
    const __VLS_237 = __VLS_asFunctionalComponent(__VLS_236, new __VLS_236({
        ...{ class: "upstream-url" },
        value: (upstream.url),
        readonly: true,
        size: "small",
    }));
    const __VLS_238 = __VLS_237({
        ...{ class: "upstream-url" },
        value: (upstream.url),
        readonly: true,
        size: "small",
    }, ...__VLS_functionalComponentArgsRest(__VLS_237));
    var __VLS_231;
}
var __VLS_227;
if ((__VLS_ctx.group?.config && Object.keys(__VLS_ctx.group.config).length > 0) || __VLS_ctx.group?.param_overrides) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "detail-section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({
        ...{ class: "section-title" },
    });
    (__VLS_ctx.t("keys.groupInfo.advancedConfig"));
    const __VLS_240 = {}.NForm;
    /** @type {[typeof __VLS_components.NForm, typeof __VLS_components.nForm, typeof __VLS_components.NForm, typeof __VLS_components.nForm, ]} */ ;
    // @ts-ignore
    const __VLS_241 = __VLS_asFunctionalComponent(__VLS_240, new __VLS_240({
        labelPlacement: "left",
    }));
    const __VLS_242 = __VLS_241({
        labelPlacement: "left",
    }, ...__VLS_functionalComponentArgsRest(__VLS_241));
    __VLS_243.slots.default;
    for (const [value, key] of __VLS_getVForSourceType((__VLS_ctx.group?.config || {}))) {
        const __VLS_244 = {}.NFormItem;
        /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.nFormItem, typeof __VLS_components.NFormItem, typeof __VLS_components.nFormItem, ]} */ ;
        // @ts-ignore
        const __VLS_245 = __VLS_asFunctionalComponent(__VLS_244, new __VLS_244({
            key: (key),
            label: (`${key}:`),
        }));
        const __VLS_246 = __VLS_245({
            key: (key),
            label: (`${key}:`),
        }, ...__VLS_functionalComponentArgsRest(__VLS_245));
        __VLS_247.slots.default;
        (value || "-");
        var __VLS_247;
    }
    if (__VLS_ctx.group?.param_overrides) {
        const __VLS_248 = {}.NFormItem;
        /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.nFormItem, typeof __VLS_components.NFormItem, typeof __VLS_components.nFormItem, ]} */ ;
        // @ts-ignore
        const __VLS_249 = __VLS_asFunctionalComponent(__VLS_248, new __VLS_248({
            label: (__VLS_ctx.t('keys.groupInfo.paramOverrides')),
            span: (2),
        }));
        const __VLS_250 = __VLS_249({
            label: (__VLS_ctx.t('keys.groupInfo.paramOverrides')),
            span: (2),
        }, ...__VLS_functionalComponentArgsRest(__VLS_249));
        __VLS_251.slots.default;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.pre, __VLS_intrinsicElements.pre)({
            ...{ class: "config-json" },
        });
        (JSON.stringify(__VLS_ctx.group?.param_overrides || "", null, 2));
        var __VLS_251;
    }
    var __VLS_243;
}
var __VLS_167;
var __VLS_163;
var __VLS_3;
/** @type {[typeof GroupFormModal, ]} */ ;
// @ts-ignore
const __VLS_252 = __VLS_asFunctionalComponent(GroupFormModal, new GroupFormModal({
    ...{ 'onSuccess': {} },
    show: (__VLS_ctx.showEditModal),
    group: (__VLS_ctx.group),
}));
const __VLS_253 = __VLS_252({
    ...{ 'onSuccess': {} },
    show: (__VLS_ctx.showEditModal),
    group: (__VLS_ctx.group),
}, ...__VLS_functionalComponentArgsRest(__VLS_252));
let __VLS_255;
let __VLS_256;
let __VLS_257;
const __VLS_258 = {
    onSuccess: (__VLS_ctx.handleGroupEdited)
};
var __VLS_254;
/** @type {__VLS_StyleScopedClasses['group-info-container']} */ ;
/** @type {__VLS_StyleScopedClasses['group-info-card']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['header-left']} */ ;
/** @type {__VLS_StyleScopedClasses['group-title']} */ ;
/** @type {__VLS_StyleScopedClasses['group-url']} */ ;
/** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-summary']} */ ;
/** @type {__VLS_StyleScopedClasses['details-section']} */ ;
/** @type {__VLS_StyleScopedClasses['details-content']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['upstream-item']} */ ;
/** @type {__VLS_StyleScopedClasses['upstream-weight']} */ ;
/** @type {__VLS_StyleScopedClasses['upstream-url']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['config-json']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            getGroupDisplayName: getGroupDisplayName,
            Pencil: Pencil,
            Trash: Trash,
            NButton: NButton,
            NCard: NCard,
            NCollapse: NCollapse,
            NCollapseItem: NCollapseItem,
            NForm: NForm,
            NFormItem: NFormItem,
            NGrid: NGrid,
            NGridItem: NGridItem,
            NSpin: NSpin,
            NTag: NTag,
            GroupFormModal: GroupFormModal,
            t: t,
            stats: stats,
            loading: loading,
            showEditModal: showEditModal,
            expandedName: expandedName,
            handleEdit: handleEdit,
            handleGroupEdited: handleGroupEdited,
            handleDelete: handleDelete,
            formatNumber: formatNumber,
            formatPercentage: formatPercentage,
            copyUrl: copyUrl,
        };
    },
    __typeEmits: {},
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeEmits: {},
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
