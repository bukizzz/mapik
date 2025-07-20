import { getDashboardStats } from "@/api/dashboard";
import { NCard, NGrid, NGridItem, NSpace, NTag, NTooltip } from "naive-ui";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
const { t } = useI18n();
// Reaktivna referenca za statistiku kontrolne table.
const stats = ref(null);
const loading = ref(true);
const animatedValues = ref({});
// Formatira numeričku vrednost za prikaz, opcionalno kao procenat.
const formatValue = (value, type = "count") => {
    if (type === "rate") {
        return `${value.toFixed(2)}%`;
    }
    if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
};
// Formatira vrednost trenda za prikaz, dodajući prefiks znaka.
const formatTrend = (trend) => {
    const sign = trend >= 0 ? "+" : "";
    return `${sign}${trend.toFixed(1)}%`;
};
// Dobavlja statistiku kontrolne table sa API-ja.
const fetchStats = async () => {
    try {
        loading.value = true;
        const response = await getDashboardStats();
        stats.value = response.data;
        // Dodaje efekat animacije na vrednosti statistike.
        setTimeout(() => {
            animatedValues.value = {
                key_count: (stats.value?.key_count?.value ?? 0) /
                    ((stats.value?.key_count?.value ?? 1) + (stats.value?.key_count?.sub_value ?? 1)),
                group_count: 1,
                request_count: Math.min(100 + (stats.value?.request_count?.trend ?? 0), 100) / 100,
                error_rate: (100 - (stats.value?.error_rate?.value ?? 0)) / 100,
            };
        }, 0);
    }
    catch (error) {
        console.error(t("dashboard.stats.fetchStatsFailed"), error);
    }
    finally {
        loading.value = false;
    }
};
onMounted(() => {
    fetchStats();
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-trend']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stats-container" },
});
const __VLS_0 = {}.NSpace;
/** @type {[typeof __VLS_components.NSpace, typeof __VLS_components.nSpace, typeof __VLS_components.NSpace, typeof __VLS_components.nSpace, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    vertical: true,
    size: "medium",
}));
const __VLS_2 = __VLS_1({
    vertical: true,
    size: "medium",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_3.slots.default;
const __VLS_4 = {}.NGrid;
/** @type {[typeof __VLS_components.NGrid, typeof __VLS_components.nGrid, typeof __VLS_components.NGrid, typeof __VLS_components.nGrid, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
    cols: (4),
    xGap: (20),
    yGap: (20),
    responsive: "screen",
}));
const __VLS_6 = __VLS_5({
    cols: (4),
    xGap: (20),
    yGap: (20),
    responsive: "screen",
}, ...__VLS_functionalComponentArgsRest(__VLS_5));
__VLS_7.slots.default;
const __VLS_8 = {}.NGridItem;
/** @type {[typeof __VLS_components.NGridItem, typeof __VLS_components.nGridItem, typeof __VLS_components.NGridItem, typeof __VLS_components.nGridItem, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    span: "1",
}));
const __VLS_10 = __VLS_9({
    span: "1",
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
__VLS_11.slots.default;
const __VLS_12 = {}.NCard;
/** @type {[typeof __VLS_components.NCard, typeof __VLS_components.nCard, typeof __VLS_components.NCard, typeof __VLS_components.nCard, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    bordered: (false),
    ...{ class: "stat-card" },
    ...{ style: {} },
}));
const __VLS_14 = __VLS_13({
    bordered: (false),
    ...{ class: "stat-card" },
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
__VLS_15.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stat-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stat-icon key-icon" },
});
if (__VLS_ctx.stats?.key_count.sub_value) {
    const __VLS_16 = {}.NTooltip;
    /** @type {[typeof __VLS_components.NTooltip, typeof __VLS_components.nTooltip, typeof __VLS_components.NTooltip, typeof __VLS_components.nTooltip, ]} */ ;
    // @ts-ignore
    const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
        trigger: "hover",
    }));
    const __VLS_18 = __VLS_17({
        trigger: "hover",
    }, ...__VLS_functionalComponentArgsRest(__VLS_17));
    __VLS_19.slots.default;
    {
        const { trigger: __VLS_thisSlot } = __VLS_19.slots;
        const __VLS_20 = {}.NTag;
        /** @type {[typeof __VLS_components.NTag, typeof __VLS_components.nTag, typeof __VLS_components.NTag, typeof __VLS_components.nTag, ]} */ ;
        // @ts-ignore
        const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
            type: "error",
            size: "small",
            ...{ class: "stat-trend" },
        }));
        const __VLS_22 = __VLS_21({
            type: "error",
            size: "small",
            ...{ class: "stat-trend" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_21));
        __VLS_23.slots.default;
        (__VLS_ctx.stats.key_count.sub_value);
        var __VLS_23;
    }
    (__VLS_ctx.stats.key_count.sub_value_tip);
    var __VLS_19;
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stat-content" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stat-value" },
});
(__VLS_ctx.stats?.key_count?.value ?? 0);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stat-title" },
});
(__VLS_ctx.t("dashboard.stats.keyCount"));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stat-bar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
    ...{ class: "stat-bar-fill key-bar" },
    ...{ style: ({
            width: `${(__VLS_ctx.animatedValues.key_count ?? 0) * 100}%`,
        }) },
});
var __VLS_15;
var __VLS_11;
const __VLS_24 = {}.NGridItem;
/** @type {[typeof __VLS_components.NGridItem, typeof __VLS_components.nGridItem, typeof __VLS_components.NGridItem, typeof __VLS_components.nGridItem, ]} */ ;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
    span: "1",
}));
const __VLS_26 = __VLS_25({
    span: "1",
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
__VLS_27.slots.default;
const __VLS_28 = {}.NCard;
/** @type {[typeof __VLS_components.NCard, typeof __VLS_components.nCard, typeof __VLS_components.NCard, typeof __VLS_components.nCard, ]} */ ;
// @ts-ignore
const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
    bordered: (false),
    ...{ class: "stat-card" },
    ...{ style: {} },
}));
const __VLS_30 = __VLS_29({
    bordered: (false),
    ...{ class: "stat-card" },
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_29));
__VLS_31.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stat-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stat-icon group-icon" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stat-content" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stat-value" },
});
(__VLS_ctx.stats?.group_count?.value ?? 0);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stat-title" },
});
(__VLS_ctx.t("dashboard.stats.groupCount"));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stat-bar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
    ...{ class: "stat-bar-fill group-bar" },
    ...{ style: ({
            width: `${(__VLS_ctx.animatedValues.group_count ?? 0) * 100}%`,
        }) },
});
var __VLS_31;
var __VLS_27;
const __VLS_32 = {}.NGridItem;
/** @type {[typeof __VLS_components.NGridItem, typeof __VLS_components.nGridItem, typeof __VLS_components.NGridItem, typeof __VLS_components.nGridItem, ]} */ ;
// @ts-ignore
const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
    span: "1",
}));
const __VLS_34 = __VLS_33({
    span: "1",
}, ...__VLS_functionalComponentArgsRest(__VLS_33));
__VLS_35.slots.default;
const __VLS_36 = {}.NCard;
/** @type {[typeof __VLS_components.NCard, typeof __VLS_components.nCard, typeof __VLS_components.NCard, typeof __VLS_components.nCard, ]} */ ;
// @ts-ignore
const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
    bordered: (false),
    ...{ class: "stat-card" },
    ...{ style: {} },
}));
const __VLS_38 = __VLS_37({
    bordered: (false),
    ...{ class: "stat-card" },
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_37));
__VLS_39.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stat-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stat-icon request-icon" },
});
if (__VLS_ctx.stats?.request_count && __VLS_ctx.stats.request_count.trend !== undefined) {
    const __VLS_40 = {}.NTag;
    /** @type {[typeof __VLS_components.NTag, typeof __VLS_components.nTag, typeof __VLS_components.NTag, typeof __VLS_components.nTag, ]} */ ;
    // @ts-ignore
    const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
        type: (__VLS_ctx.stats?.request_count.trend_is_growth ? 'success' : 'error'),
        size: "small",
        ...{ class: "stat-trend" },
    }));
    const __VLS_42 = __VLS_41({
        type: (__VLS_ctx.stats?.request_count.trend_is_growth ? 'success' : 'error'),
        size: "small",
        ...{ class: "stat-trend" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_41));
    __VLS_43.slots.default;
    (__VLS_ctx.stats ? __VLS_ctx.formatTrend(__VLS_ctx.stats.request_count.trend) : "--");
    var __VLS_43;
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stat-content" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stat-value" },
});
(__VLS_ctx.stats ? __VLS_ctx.formatValue(__VLS_ctx.stats.request_count.value) : "--");
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stat-title" },
});
(__VLS_ctx.t("dashboard.stats.requests24h"));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stat-bar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
    ...{ class: "stat-bar-fill request-bar" },
    ...{ style: ({
            width: `${(__VLS_ctx.animatedValues.request_count ?? 0) * 100}%`,
        }) },
});
var __VLS_39;
var __VLS_35;
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
const __VLS_48 = {}.NCard;
/** @type {[typeof __VLS_components.NCard, typeof __VLS_components.nCard, typeof __VLS_components.NCard, typeof __VLS_components.nCard, ]} */ ;
// @ts-ignore
const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
    bordered: (false),
    ...{ class: "stat-card" },
    ...{ style: {} },
}));
const __VLS_50 = __VLS_49({
    bordered: (false),
    ...{ class: "stat-card" },
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_49));
__VLS_51.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stat-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stat-icon error-icon" },
});
if (__VLS_ctx.stats?.error_rate.trend !== 0) {
    const __VLS_52 = {}.NTag;
    /** @type {[typeof __VLS_components.NTag, typeof __VLS_components.nTag, typeof __VLS_components.NTag, typeof __VLS_components.nTag, ]} */ ;
    // @ts-ignore
    const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
        type: (__VLS_ctx.stats?.error_rate.trend_is_growth ? 'success' : 'error'),
        size: "small",
        ...{ class: "stat-trend" },
    }));
    const __VLS_54 = __VLS_53({
        type: (__VLS_ctx.stats?.error_rate.trend_is_growth ? 'success' : 'error'),
        size: "small",
        ...{ class: "stat-trend" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_53));
    __VLS_55.slots.default;
    (__VLS_ctx.stats ? __VLS_ctx.formatTrend(__VLS_ctx.stats.error_rate.trend) : "--");
    var __VLS_55;
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stat-content" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stat-value" },
});
(__VLS_ctx.stats ? __VLS_ctx.formatValue(__VLS_ctx.stats.error_rate.value ?? 0, "rate") : "--");
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stat-title" },
});
(__VLS_ctx.t("dashboard.stats.errorRate24h"));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stat-bar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
    ...{ class: "stat-bar-fill error-bar" },
    ...{ style: ({
            width: `${(__VLS_ctx.animatedValues.error_rate ?? 0) * 100}%`,
        }) },
});
var __VLS_51;
var __VLS_47;
var __VLS_7;
var __VLS_3;
/** @type {__VLS_StyleScopedClasses['stats-container']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-header']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['key-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-trend']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-content']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-title']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-bar-fill']} */ ;
/** @type {__VLS_StyleScopedClasses['key-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-header']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['group-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-content']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-title']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-bar-fill']} */ ;
/** @type {__VLS_StyleScopedClasses['group-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-header']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['request-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-trend']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-content']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-title']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-bar-fill']} */ ;
/** @type {__VLS_StyleScopedClasses['request-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-header']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['error-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-trend']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-content']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-title']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-bar-fill']} */ ;
/** @type {__VLS_StyleScopedClasses['error-bar']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            NCard: NCard,
            NGrid: NGrid,
            NGridItem: NGridItem,
            NSpace: NSpace,
            NTag: NTag,
            NTooltip: NTooltip,
            t: t,
            stats: stats,
            animatedValues: animatedValues,
            formatValue: formatValue,
            formatTrend: formatTrend,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
