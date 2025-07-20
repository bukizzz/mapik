import { appState } from "@/utils/app-state";
import { NConfigProvider, NDialogProvider, NLoadingBarProvider, NMessageProvider, useLoadingBar, useMessage, } from "naive-ui";
import { defineComponent, watch } from "vue";
// Prilagođena konfiguracija teme
const themeOverrides = {
    common: {
        primaryColor: "#667eea",
        primaryColorHover: "#5a6fd8",
        primaryColorPressed: "#4c63d2",
        primaryColorSuppl: "#8b9df5",
        borderRadius: "12px",
        borderRadiusSmall: "8px",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    Card: {
        paddingMedium: "24px",
    },
    Button: {
        fontWeight: "600",
        heightMedium: "40px",
        heightLarge: "48px",
    },
    Input: {
        heightMedium: "40px",
        heightLarge: "48px",
    },
    Menu: {
        itemHeight: "42px",
    },
};
function useGlobalMessage() {
    window.$message = useMessage();
}
const LoadingBar = defineComponent({
    setup() {
        const loadingBar = useLoadingBar();
        watch(() => appState.loading, loading => {
            if (loading) {
                loadingBar.start();
            }
            else {
                loadingBar.finish();
            }
        });
        return () => null;
    },
});
const Message = defineComponent({
    setup() {
        useGlobalMessage();
        return () => null;
    },
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
const __VLS_0 = {}.NConfigProvider;
/** @type {[typeof __VLS_components.NConfigProvider, typeof __VLS_components.nConfigProvider, typeof __VLS_components.NConfigProvider, typeof __VLS_components.nConfigProvider, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    themeOverrides: (__VLS_ctx.themeOverrides),
}));
const __VLS_2 = __VLS_1({
    themeOverrides: (__VLS_ctx.themeOverrides),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_4 = {};
__VLS_3.slots.default;
const __VLS_5 = {}.NLoadingBarProvider;
/** @type {[typeof __VLS_components.NLoadingBarProvider, typeof __VLS_components.nLoadingBarProvider, typeof __VLS_components.NLoadingBarProvider, typeof __VLS_components.nLoadingBarProvider, ]} */ ;
// @ts-ignore
const __VLS_6 = __VLS_asFunctionalComponent(__VLS_5, new __VLS_5({}));
const __VLS_7 = __VLS_6({}, ...__VLS_functionalComponentArgsRest(__VLS_6));
__VLS_8.slots.default;
const __VLS_9 = {}.NMessageProvider;
/** @type {[typeof __VLS_components.NMessageProvider, typeof __VLS_components.nMessageProvider, typeof __VLS_components.NMessageProvider, typeof __VLS_components.nMessageProvider, ]} */ ;
// @ts-ignore
const __VLS_10 = __VLS_asFunctionalComponent(__VLS_9, new __VLS_9({
    placement: "top-right",
}));
const __VLS_11 = __VLS_10({
    placement: "top-right",
}, ...__VLS_functionalComponentArgsRest(__VLS_10));
__VLS_12.slots.default;
const __VLS_13 = {}.NDialogProvider;
/** @type {[typeof __VLS_components.NDialogProvider, typeof __VLS_components.nDialogProvider, typeof __VLS_components.NDialogProvider, typeof __VLS_components.nDialogProvider, ]} */ ;
// @ts-ignore
const __VLS_14 = __VLS_asFunctionalComponent(__VLS_13, new __VLS_13({}));
const __VLS_15 = __VLS_14({}, ...__VLS_functionalComponentArgsRest(__VLS_14));
__VLS_16.slots.default;
var __VLS_17 = {};
const __VLS_19 = {}.LoadingBar;
/** @type {[typeof __VLS_components.LoadingBar, typeof __VLS_components.loadingBar, ]} */ ;
// @ts-ignore
const __VLS_20 = __VLS_asFunctionalComponent(__VLS_19, new __VLS_19({}));
const __VLS_21 = __VLS_20({}, ...__VLS_functionalComponentArgsRest(__VLS_20));
const __VLS_23 = {}.message;
/** @type {[typeof __VLS_components.Message, typeof __VLS_components.message, ]} */ ;
// @ts-ignore
const __VLS_24 = __VLS_asFunctionalComponent(__VLS_23, new __VLS_23({}));
const __VLS_25 = __VLS_24({}, ...__VLS_functionalComponentArgsRest(__VLS_24));
var __VLS_16;
var __VLS_12;
var __VLS_8;
var __VLS_3;
// @ts-ignore
var __VLS_18 = __VLS_17;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            NConfigProvider: NConfigProvider,
            NDialogProvider: NDialogProvider,
            NLoadingBarProvider: NLoadingBarProvider,
            NMessageProvider: NMessageProvider,
            themeOverrides: themeOverrides,
            LoadingBar: LoadingBar,
            Message: Message,
        };
    },
});
const __VLS_component = (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
export default {};
; /* PartiallyEnd: #4569/main.vue */
