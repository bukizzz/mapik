import { GlobeOutline } from "@vicons/ionicons5";
import { NButton, NDropdown, NIcon } from "naive-ui";
import { computed, h } from "vue";
import { useI18n } from "vue-i18n";
import { RouterLink, useRoute } from "vue-router";
const { t, locale } = useI18n();
const menuOptions = [
    renderMenuItem("dashboard", t("navbar.dashboard"), "📊"),
    renderMenuItem("keys", t("navbar.keys"), "🔑"),
    renderMenuItem("logs", t("navbar.logs"), "📋"),
    renderMenuItem("settings", t("navbar.settings"), "⚙️"),
];
const route = useRoute();
const activeMenu = computed(() => route.name);
function renderMenuItem(key, label, icon) {
    return {
        label: () => h(RouterLink, {
            to: {
                name: key,
            },
            class: "nav-menu-item",
        }, {
            default: () => [
                h("span", { class: "nav-item-icon" }, icon),
                h("span", { class: "nav-item-text" }, label),
            ],
        }),
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
const handleLanguageChange = (key) => {
    locale.value = key;
};
const currentLanguageLabel = computed(() => {
    const current = languageOptions.value.find(option => option.key === locale.value);
    return current ? current.label : "";
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['n-menu-item']} */ ;
/** @type {__VLS_StyleScopedClasses['n-menu-item--selected']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "navbar-container" },
});
const __VLS_0 = {}.NMenu;
/** @type {[typeof __VLS_components.NMenu, typeof __VLS_components.nMenu, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    mode: "horizontal",
    options: (__VLS_ctx.menuOptions),
    value: (__VLS_ctx.activeMenu),
    responsive: true,
    ...{ class: "modern-menu" },
}));
const __VLS_2 = __VLS_1({
    mode: "horizontal",
    options: (__VLS_ctx.menuOptions),
    value: (__VLS_ctx.activeMenu),
    responsive: true,
    ...{ class: "modern-menu" },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "navbar-actions" },
});
const __VLS_4 = {}.NDropdown;
/** @type {[typeof __VLS_components.NDropdown, typeof __VLS_components.nDropdown, typeof __VLS_components.NDropdown, typeof __VLS_components.nDropdown, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
    ...{ 'onSelect': {} },
    trigger: "click",
    options: (__VLS_ctx.languageOptions),
}));
const __VLS_6 = __VLS_5({
    ...{ 'onSelect': {} },
    trigger: "click",
    options: (__VLS_ctx.languageOptions),
}, ...__VLS_functionalComponentArgsRest(__VLS_5));
let __VLS_8;
let __VLS_9;
let __VLS_10;
const __VLS_11 = {
    onSelect: (__VLS_ctx.handleLanguageChange)
};
__VLS_7.slots.default;
const __VLS_12 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    text: true,
}));
const __VLS_14 = __VLS_13({
    text: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
__VLS_15.slots.default;
{
    const { icon: __VLS_thisSlot } = __VLS_15.slots;
    const __VLS_16 = {}.NIcon;
    /** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.nIcon, ]} */ ;
    // @ts-ignore
    const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
        component: (__VLS_ctx.GlobeOutline),
    }));
    const __VLS_18 = __VLS_17({
        component: (__VLS_ctx.GlobeOutline),
    }, ...__VLS_functionalComponentArgsRest(__VLS_17));
}
(__VLS_ctx.currentLanguageLabel);
var __VLS_15;
var __VLS_7;
/** @type {__VLS_StyleScopedClasses['navbar-container']} */ ;
/** @type {__VLS_StyleScopedClasses['modern-menu']} */ ;
/** @type {__VLS_StyleScopedClasses['navbar-actions']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            GlobeOutline: GlobeOutline,
            NButton: NButton,
            NDropdown: NDropdown,
            NIcon: NIcon,
            menuOptions: menuOptions,
            activeMenu: activeMenu,
            languageOptions: languageOptions,
            handleLanguageChange: handleLanguageChange,
            currentLanguageLabel: currentLanguageLabel,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
