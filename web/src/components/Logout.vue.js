import { useAuthService } from "@/services/auth";
import { LogOutOutline } from "@vicons/ionicons5";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
const { t } = useI18n();
const router = useRouter();
const { logout } = useAuthService();
const handleLogout = () => {
    logout();
    router.replace("/login");
};
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['logout-button']} */ ;
// CSS variable injection 
// CSS variable injection end 
const __VLS_0 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onClick': {} },
    quaternary: true,
    round: true,
    ...{ class: "logout-button" },
}));
const __VLS_2 = __VLS_1({
    ...{ 'onClick': {} },
    quaternary: true,
    round: true,
    ...{ class: "logout-button" },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    onClick: (__VLS_ctx.handleLogout)
};
var __VLS_8 = {};
__VLS_3.slots.default;
{
    const { icon: __VLS_thisSlot } = __VLS_3.slots;
    const __VLS_9 = {}.NIcon;
    /** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.nIcon, ]} */ ;
    // @ts-ignore
    const __VLS_10 = __VLS_asFunctionalComponent(__VLS_9, new __VLS_9({
        component: (__VLS_ctx.LogOutOutline),
    }));
    const __VLS_11 = __VLS_10({
        component: (__VLS_ctx.LogOutOutline),
    }, ...__VLS_functionalComponentArgsRest(__VLS_10));
}
(__VLS_ctx.t("navbar.logout"));
var __VLS_3;
/** @type {__VLS_StyleScopedClasses['logout-button']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            LogOutOutline: LogOutOutline,
            t: t,
            handleLogout: handleLogout,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
