import { versionService } from "@/services/version";
import { BugOutline, CheckmarkCircleOutline, DocumentTextOutline, LogoGithub, TimeOutline, WarningOutline, } from "@vicons/ionicons5";
import { NIcon, NTooltip } from "naive-ui";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
const { t } = useI18n();
const versionInfo = ref({
    currentVersion: "0.1.0",
    latestVersion: null,
    isLatest: false,
    hasUpdate: false,
    releaseUrl: null,
    lastCheckTime: 0,
    status: "checking",
});
const isChecking = ref(false);
// Konfiguracija statusa verzije
const statusConfig = {
    checking: {
        color: "#0066cc",
        icon: TimeOutline,
        text: t("footer.version.checking"),
    },
    latest: {
        color: "#18a058",
        icon: CheckmarkCircleOutline,
        text: t("footer.version.latest"),
    },
    "update-available": {
        color: "#f0a020",
        icon: WarningOutline,
        text: t("footer.version.updateAvailable"),
    },
    error: {
        color: "#d03050",
        icon: WarningOutline,
        text: t("footer.version.error"),
    },
};
const formatVersion = (version) => {
    return version.startsWith("v") ? version : `v${version}`;
};
const checkVersion = async () => {
    if (isChecking.value) {
        return;
    }
    isChecking.value = true;
    try {
        const result = await versionService.checkForUpdates();
        versionInfo.value = result;
    }
    catch (error) {
        console.warn("Version check failed:", error);
    }
    finally {
        isChecking.value = false;
    }
};
const handleVersionClick = () => {
    if ((versionInfo.value.status === "update-available" || versionInfo.value.status === "latest") &&
        versionInfo.value.releaseUrl) {
        window.open(versionInfo.value.releaseUrl, "_blank", "noopener,noreferrer");
    }
};
onMounted(() => {
    checkVersion();
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['project-info']} */ ;
/** @type {__VLS_StyleScopedClasses['project-info']} */ ;
/** @type {__VLS_StyleScopedClasses['version-clickable']} */ ;
/** @type {__VLS_StyleScopedClasses['footer-link']} */ ;
/** @type {__VLS_StyleScopedClasses['author-link']} */ ;
/** @type {__VLS_StyleScopedClasses['app-footer']} */ ;
/** @type {__VLS_StyleScopedClasses['footer-main']} */ ;
/** @type {__VLS_StyleScopedClasses['links-container']} */ ;
/** @type {__VLS_StyleScopedClasses['footer-main']} */ ;
/** @type {__VLS_StyleScopedClasses['links-container']} */ ;
/** @type {__VLS_StyleScopedClasses['project-info']} */ ;
/** @type {__VLS_StyleScopedClasses['footer-link']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.footer, __VLS_intrinsicElements.footer)({
    ...{ class: "app-footer" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "footer-container" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "footer-main" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "project-info" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
    href: "https://github.com/bukizzz/MAPIK",
    target: "_blank",
    rel: "noopener noreferrer",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
const __VLS_0 = {}.NDivider;
/** @type {[typeof __VLS_components.NDivider, typeof __VLS_components.nDivider, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    vertical: true,
}));
const __VLS_2 = __VLS_1({
    vertical: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onClick: (__VLS_ctx.handleVersionClick) },
    ...{ class: "version-container" },
    ...{ class: ({
            'version-clickable': __VLS_ctx.versionInfo.status === 'update-available' || __VLS_ctx.versionInfo.status === 'latest',
            'version-checking': __VLS_ctx.isChecking,
        }) },
});
if (__VLS_ctx.statusConfig[__VLS_ctx.versionInfo.status].icon) {
    const __VLS_4 = {}.NIcon;
    /** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.nIcon, ]} */ ;
    // @ts-ignore
    const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
        component: (__VLS_ctx.statusConfig[__VLS_ctx.versionInfo.status].icon),
        color: (__VLS_ctx.statusConfig[__VLS_ctx.versionInfo.status].color),
        size: (14),
        ...{ class: "version-icon" },
    }));
    const __VLS_6 = __VLS_5({
        component: (__VLS_ctx.statusConfig[__VLS_ctx.versionInfo.status].icon),
        color: (__VLS_ctx.statusConfig[__VLS_ctx.versionInfo.status].color),
        size: (14),
        ...{ class: "version-icon" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_5));
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "version-text" },
});
(__VLS_ctx.formatVersion(__VLS_ctx.versionInfo.currentVersion));
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ style: ({ color: __VLS_ctx.statusConfig[__VLS_ctx.versionInfo.status].color }) },
});
(__VLS_ctx.statusConfig[__VLS_ctx.versionInfo.status].text);
if (__VLS_ctx.versionInfo.status === 'update-available') {
    (__VLS_ctx.formatVersion(__VLS_ctx.versionInfo.latestVersion || ""));
}
const __VLS_8 = {}.NDivider;
/** @type {[typeof __VLS_components.NDivider, typeof __VLS_components.nDivider, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    vertical: true,
}));
const __VLS_10 = __VLS_9({
    vertical: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "links-container" },
});
const __VLS_12 = {}.NTooltip;
/** @type {[typeof __VLS_components.NTooltip, typeof __VLS_components.nTooltip, typeof __VLS_components.NTooltip, typeof __VLS_components.nTooltip, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    trigger: "hover",
    placement: "top",
}));
const __VLS_14 = __VLS_13({
    trigger: "hover",
    placement: "top",
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
__VLS_15.slots.default;
{
    const { trigger: __VLS_thisSlot } = __VLS_15.slots;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
        href: "https://github.com/bukizzz/MAPIK/README.md",
        target: "_blank",
        rel: "noopener noreferrer",
        ...{ class: "footer-link" },
    });
    const __VLS_16 = {}.NIcon;
    /** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.nIcon, ]} */ ;
    // @ts-ignore
    const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
        component: (__VLS_ctx.DocumentTextOutline),
        size: (14),
        ...{ class: "link-icon" },
    }));
    const __VLS_18 = __VLS_17({
        component: (__VLS_ctx.DocumentTextOutline),
        size: (14),
        ...{ class: "link-icon" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_17));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t("footer.links.docs"));
}
(__VLS_ctx.t("footer.tooltips.docs"));
var __VLS_15;
const __VLS_20 = {}.NTooltip;
/** @type {[typeof __VLS_components.NTooltip, typeof __VLS_components.nTooltip, typeof __VLS_components.NTooltip, typeof __VLS_components.nTooltip, ]} */ ;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
    trigger: "hover",
    placement: "top",
}));
const __VLS_22 = __VLS_21({
    trigger: "hover",
    placement: "top",
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
__VLS_23.slots.default;
{
    const { trigger: __VLS_thisSlot } = __VLS_23.slots;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
        href: "https://github.com/bukizzz/MAPIK",
        target: "_blank",
        rel: "noopener noreferrer",
        ...{ class: "footer-link" },
    });
    const __VLS_24 = {}.NIcon;
    /** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.nIcon, ]} */ ;
    // @ts-ignore
    const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
        component: (__VLS_ctx.LogoGithub),
        size: (14),
        ...{ class: "link-icon" },
    }));
    const __VLS_26 = __VLS_25({
        component: (__VLS_ctx.LogoGithub),
        size: (14),
        ...{ class: "link-icon" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_25));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t("footer.links.github"));
}
(__VLS_ctx.t("footer.tooltips.github"));
var __VLS_23;
const __VLS_28 = {}.NTooltip;
/** @type {[typeof __VLS_components.NTooltip, typeof __VLS_components.nTooltip, typeof __VLS_components.NTooltip, typeof __VLS_components.nTooltip, ]} */ ;
// @ts-ignore
const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
    trigger: "hover",
    placement: "top",
}));
const __VLS_30 = __VLS_29({
    trigger: "hover",
    placement: "top",
}, ...__VLS_functionalComponentArgsRest(__VLS_29));
__VLS_31.slots.default;
{
    const { trigger: __VLS_thisSlot } = __VLS_31.slots;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
        href: "https://github.com/bukizzz/MAPIK/issues",
        target: "_blank",
        rel: "noopener noreferrer",
        ...{ class: "footer-link" },
    });
    const __VLS_32 = {}.NIcon;
    /** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.nIcon, ]} */ ;
    // @ts-ignore
    const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
        component: (__VLS_ctx.BugOutline),
        size: (14),
        ...{ class: "link-icon" },
    }));
    const __VLS_34 = __VLS_33({
        component: (__VLS_ctx.BugOutline),
        size: (14),
        ...{ class: "link-icon" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_33));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t("footer.links.feedback"));
}
(__VLS_ctx.t("footer.tooltips.feedback"));
var __VLS_31;
const __VLS_36 = {}.NDivider;
/** @type {[typeof __VLS_components.NDivider, typeof __VLS_components.nDivider, ]} */ ;
// @ts-ignore
const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
    vertical: true,
}));
const __VLS_38 = __VLS_37({
    vertical: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_37));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "copyright-container" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "copyright-text" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
    href: "https://github.com/bukizzz",
    target: "_blank",
    rel: "noopener noreferrer",
    ...{ class: "author-link" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "license-text" },
});
/** @type {__VLS_StyleScopedClasses['app-footer']} */ ;
/** @type {__VLS_StyleScopedClasses['footer-container']} */ ;
/** @type {__VLS_StyleScopedClasses['footer-main']} */ ;
/** @type {__VLS_StyleScopedClasses['project-info']} */ ;
/** @type {__VLS_StyleScopedClasses['version-container']} */ ;
/** @type {__VLS_StyleScopedClasses['version-clickable']} */ ;
/** @type {__VLS_StyleScopedClasses['version-checking']} */ ;
/** @type {__VLS_StyleScopedClasses['version-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['version-text']} */ ;
/** @type {__VLS_StyleScopedClasses['links-container']} */ ;
/** @type {__VLS_StyleScopedClasses['footer-link']} */ ;
/** @type {__VLS_StyleScopedClasses['link-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['footer-link']} */ ;
/** @type {__VLS_StyleScopedClasses['link-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['footer-link']} */ ;
/** @type {__VLS_StyleScopedClasses['link-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['copyright-container']} */ ;
/** @type {__VLS_StyleScopedClasses['copyright-text']} */ ;
/** @type {__VLS_StyleScopedClasses['author-link']} */ ;
/** @type {__VLS_StyleScopedClasses['license-text']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            BugOutline: BugOutline,
            DocumentTextOutline: DocumentTextOutline,
            LogoGithub: LogoGithub,
            NIcon: NIcon,
            NTooltip: NTooltip,
            t: t,
            versionInfo: versionInfo,
            isChecking: isChecking,
            statusConfig: statusConfig,
            formatVersion: formatVersion,
            handleVersionClick: handleVersionClick,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
