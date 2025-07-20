import AppFooter from "@/components/AppFooter.vue"; // Uvozi komponentu AppFooter
import { useAuthService } from "@/services/auth"; // Uvozi servis za autentifikaciju
import { GlobeOutline, LockClosedSharp } from "@vicons/ionicons5"; // Uvozi ikone iz Ionicons 5
import { NButton, NCard, NDropdown, NIcon, NInput, NSpace, useMessage } from "naive-ui"; // Uvozi komponente iz Naive UI
import { computed, ref } from "vue"; // Uvozi funkcije iz Vue
import { useI18n } from "vue-i18n"; // Uvozi useI18n za internacionalizaciju
import { useRouter } from "vue-router"; // Uvozi useRouter iz Vue Routera
const { t, locale } = useI18n(); // Inicijalizuje funkciju za prevođenje i lokalizaciju
const authKey = ref(""); // Reaktivna referenca za ključ autentifikacije
const loading = ref(false); // Reaktivna referenca za status učitavanja
const router = useRouter(); // Instanca Vue Routera
const message = useMessage(); // Instanca za poruke
const { login } = useAuthService(); // Funkcija za prijavu iz servisa za autentifikaciju
const handleLogin = async () => {
    if (!authKey.value) {
        message.error(t("login.authKeyRequired")); // Prikazuje grešku ako ključ nije unet
        return;
    }
    loading.value = true; // Postavlja status učitavanja na true
    const success = await login(authKey.value); // Pokušava prijavu
    loading.value = false; // Postavlja status učitavanja na false
    if (success) {
        router.push("/"); // Preusmerava na početnu stranicu ako je prijava uspešna
    }
};
const languageOptions = computed(() => [
    {
        label: t("languages.en"), // Opcija za engleski jezik
        key: "en",
    },
    {
        label: t("languages.zh"), // Opcija za kineski jezik
        key: "zh",
    },
    {
        label: t("languages.sr"), // Opcija za srpski jezik
        key: "sr",
    },
]);
const handleLanguageChange = (key) => {
    locale.value = key; // Menja lokalizaciju aplikacije
};
const currentLanguageLabel = computed(() => {
    const current = languageOptions.value.find(option => option.key === locale.value);
    return current ? current.label : ""; // Prikazuje trenutno odabrani jezik
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['login-btn']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "login-container" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "login-background" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
    ...{ class: "login-decoration" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
    ...{ class: "login-decoration-2" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "login-content" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "login-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ class: "login-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "login-subtitle" },
});
(__VLS_ctx.t("login.subtitle"));
const __VLS_0 = {}.NCard;
/** @type {[typeof __VLS_components.NCard, typeof __VLS_components.nCard, typeof __VLS_components.NCard, typeof __VLS_components.nCard, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ class: "login-card modern-card" },
    bordered: (false),
}));
const __VLS_2 = __VLS_1({
    ...{ class: "login-card modern-card" },
    bordered: (false),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_3.slots.default;
{
    const { header: __VLS_thisSlot } = __VLS_3.slots;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "card-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
        ...{ class: "card-title" },
    });
    (__VLS_ctx.t("login.welcome"));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "card-subtitle" },
    });
    (__VLS_ctx.t("login.authKeyPrompt"));
}
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
const __VLS_8 = {}.NInput;
/** @type {[typeof __VLS_components.NInput, typeof __VLS_components.nInput, typeof __VLS_components.NInput, typeof __VLS_components.nInput, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    ...{ 'onKeyup': {} },
    value: (__VLS_ctx.authKey),
    type: "password",
    size: "large",
    placeholder: (__VLS_ctx.t('login.authKeyPlaceholder')),
    ...{ class: "modern-input" },
}));
const __VLS_10 = __VLS_9({
    ...{ 'onKeyup': {} },
    value: (__VLS_ctx.authKey),
    type: "password",
    size: "large",
    placeholder: (__VLS_ctx.t('login.authKeyPlaceholder')),
    ...{ class: "modern-input" },
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
let __VLS_12;
let __VLS_13;
let __VLS_14;
const __VLS_15 = {
    onKeyup: (__VLS_ctx.handleLogin)
};
__VLS_11.slots.default;
{
    const { prefix: __VLS_thisSlot } = __VLS_11.slots;
    const __VLS_16 = {}.NIcon;
    /** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.nIcon, ]} */ ;
    // @ts-ignore
    const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
        component: (__VLS_ctx.LockClosedSharp),
    }));
    const __VLS_18 = __VLS_17({
        component: (__VLS_ctx.LockClosedSharp),
    }, ...__VLS_functionalComponentArgsRest(__VLS_17));
}
var __VLS_11;
const __VLS_20 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
    ...{ 'onClick': {} },
    ...{ class: "login-btn modern-button" },
    type: "primary",
    size: "large",
    block: true,
    loading: (__VLS_ctx.loading),
    disabled: (__VLS_ctx.loading),
}));
const __VLS_22 = __VLS_21({
    ...{ 'onClick': {} },
    ...{ class: "login-btn modern-button" },
    type: "primary",
    size: "large",
    block: true,
    loading: (__VLS_ctx.loading),
    disabled: (__VLS_ctx.loading),
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
let __VLS_24;
let __VLS_25;
let __VLS_26;
const __VLS_27 = {
    onClick: (__VLS_ctx.handleLogin)
};
__VLS_23.slots.default;
if (!__VLS_ctx.loading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t("login.loginButton"));
}
var __VLS_23;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "language-switcher" },
});
const __VLS_28 = {}.NDropdown;
/** @type {[typeof __VLS_components.NDropdown, typeof __VLS_components.nDropdown, typeof __VLS_components.NDropdown, typeof __VLS_components.nDropdown, ]} */ ;
// @ts-ignore
const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
    ...{ 'onSelect': {} },
    trigger: "click",
    options: (__VLS_ctx.languageOptions),
}));
const __VLS_30 = __VLS_29({
    ...{ 'onSelect': {} },
    trigger: "click",
    options: (__VLS_ctx.languageOptions),
}, ...__VLS_functionalComponentArgsRest(__VLS_29));
let __VLS_32;
let __VLS_33;
let __VLS_34;
const __VLS_35 = {
    onSelect: (__VLS_ctx.handleLanguageChange)
};
__VLS_31.slots.default;
const __VLS_36 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
    text: true,
}));
const __VLS_38 = __VLS_37({
    text: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_37));
__VLS_39.slots.default;
{
    const { icon: __VLS_thisSlot } = __VLS_39.slots;
    const __VLS_40 = {}.NIcon;
    /** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.nIcon, ]} */ ;
    // @ts-ignore
    const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
        component: (__VLS_ctx.GlobeOutline),
    }));
    const __VLS_42 = __VLS_41({
        component: (__VLS_ctx.GlobeOutline),
    }, ...__VLS_functionalComponentArgsRest(__VLS_41));
}
(__VLS_ctx.currentLanguageLabel);
var __VLS_39;
var __VLS_31;
var __VLS_7;
var __VLS_3;
/** @type {[typeof AppFooter, ]} */ ;
// @ts-ignore
const __VLS_44 = __VLS_asFunctionalComponent(AppFooter, new AppFooter({}));
const __VLS_45 = __VLS_44({}, ...__VLS_functionalComponentArgsRest(__VLS_44));
/** @type {__VLS_StyleScopedClasses['login-container']} */ ;
/** @type {__VLS_StyleScopedClasses['login-background']} */ ;
/** @type {__VLS_StyleScopedClasses['login-decoration']} */ ;
/** @type {__VLS_StyleScopedClasses['login-decoration-2']} */ ;
/** @type {__VLS_StyleScopedClasses['login-content']} */ ;
/** @type {__VLS_StyleScopedClasses['login-header']} */ ;
/** @type {__VLS_StyleScopedClasses['login-title']} */ ;
/** @type {__VLS_StyleScopedClasses['login-subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['login-card']} */ ;
/** @type {__VLS_StyleScopedClasses['modern-card']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['card-title']} */ ;
/** @type {__VLS_StyleScopedClasses['card-subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['modern-input']} */ ;
/** @type {__VLS_StyleScopedClasses['login-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['modern-button']} */ ;
/** @type {__VLS_StyleScopedClasses['language-switcher']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            AppFooter: AppFooter,
            GlobeOutline: GlobeOutline,
            LockClosedSharp: LockClosedSharp,
            NButton: NButton,
            NCard: NCard,
            NDropdown: NDropdown,
            NIcon: NIcon,
            NInput: NInput,
            NSpace: NSpace,
            t: t,
            authKey: authKey,
            loading: loading,
            handleLogin: handleLogin,
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
