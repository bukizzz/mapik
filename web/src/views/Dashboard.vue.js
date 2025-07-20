import BaseInfoCard from "@/components/BaseInfoCard.vue"; // Uvozi BaseInfoCard komponentu
import LineChart from "@/components/LineChart.vue"; // Uvozi LineChart komponentu
import { NSpace } from "naive-ui"; // Uvozi NSpace komponentu iz Naive UI
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "dashboard-container" },
});
const __VLS_0 = {}.NSpace;
/** @type {[typeof __VLS_components.NSpace, typeof __VLS_components.nSpace, typeof __VLS_components.NSpace, typeof __VLS_components.nSpace, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    vertical: true,
    size: "large",
}));
const __VLS_2 = __VLS_1({
    vertical: true,
    size: "large",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_3.slots.default;
const __VLS_4 = {}.NSpace;
/** @type {[typeof __VLS_components.NSpace, typeof __VLS_components.nSpace, typeof __VLS_components.NSpace, typeof __VLS_components.nSpace, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
    vertical: true,
    size: "large",
}));
const __VLS_6 = __VLS_5({
    vertical: true,
    size: "large",
}, ...__VLS_functionalComponentArgsRest(__VLS_5));
__VLS_7.slots.default;
/** @type {[typeof BaseInfoCard, ]} */ ;
// @ts-ignore
const __VLS_8 = __VLS_asFunctionalComponent(BaseInfoCard, new BaseInfoCard({}));
const __VLS_9 = __VLS_8({}, ...__VLS_functionalComponentArgsRest(__VLS_8));
/** @type {[typeof LineChart, ]} */ ;
// @ts-ignore
const __VLS_11 = __VLS_asFunctionalComponent(LineChart, new LineChart({
    ...{ class: "dashboard-chart" },
}));
const __VLS_12 = __VLS_11({
    ...{ class: "dashboard-chart" },
}, ...__VLS_functionalComponentArgsRest(__VLS_11));
var __VLS_7;
var __VLS_3;
/** @type {__VLS_StyleScopedClasses['dashboard-container']} */ ;
/** @type {__VLS_StyleScopedClasses['dashboard-chart']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            BaseInfoCard: BaseInfoCard,
            LineChart: LineChart,
            NSpace: NSpace,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
