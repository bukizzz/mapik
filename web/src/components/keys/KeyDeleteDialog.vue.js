import { keysApi } from "@/api/keys";
import { Close } from "@vicons/ionicons5";
import { NButton, NCard, NInput, NModal, useMessage } from "naive-ui";
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
const props = defineProps();
const emit = defineEmits();
const { t } = useI18n();
const loading = ref(false);
const keysText = ref("");
const message = useMessage();
// Prati promene u vidljivosti modala.
watch(() => props.show, show => {
    if (show) {
        resetForm();
    }
});
// Resetuje formu na početno stanje.
function resetForm() {
    keysText.value = "";
}
// Zatvara modal.
function handleClose() {
    emit("update:show", false);
}
// Obrađuje slanje forme.
async function handleSubmit() {
    if (loading.value || !keysText.value.trim()) {
        return;
    }
    try {
        loading.value = true;
        const res = await keysApi.deleteKeys(props.groupId, keysText.value);
        const { deleted_count, ignored_count, total_in_group } = res || {};
        const msg = t("keys.keyDelete.deleteSummary", {
            deleted_count,
            ignored_count,
            total_in_group,
        });
        message.info(msg, {
            closable: true,
            duration: 5000,
        });
        emit("success");
        handleClose();
    }
    finally {
        loading.value = false;
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
const __VLS_0 = {}.NModal;
/** @type {[typeof __VLS_components.NModal, typeof __VLS_components.nModal, typeof __VLS_components.NModal, typeof __VLS_components.nModal, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onUpdate:show': {} },
    show: (__VLS_ctx.show),
    ...{ class: "form-modal" },
}));
const __VLS_2 = __VLS_1({
    ...{ 'onUpdate:show': {} },
    show: (__VLS_ctx.show),
    ...{ class: "form-modal" },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    'onUpdate:show': (__VLS_ctx.handleClose)
};
var __VLS_8 = {};
__VLS_3.slots.default;
const __VLS_9 = {}.NCard;
/** @type {[typeof __VLS_components.NCard, typeof __VLS_components.nCard, typeof __VLS_components.NCard, typeof __VLS_components.nCard, ]} */ ;
// @ts-ignore
const __VLS_10 = __VLS_asFunctionalComponent(__VLS_9, new __VLS_9({
    ...{ style: {} },
    title: (__VLS_ctx.t('keys.keyDelete.title', { groupName: __VLS_ctx.groupName || __VLS_ctx.t('keys.keyDelete.currentGroup') })),
    bordered: (false),
    size: "huge",
    role: "dialog",
    'aria-modal': "true",
}));
const __VLS_11 = __VLS_10({
    ...{ style: {} },
    title: (__VLS_ctx.t('keys.keyDelete.title', { groupName: __VLS_ctx.groupName || __VLS_ctx.t('keys.keyDelete.currentGroup') })),
    bordered: (false),
    size: "huge",
    role: "dialog",
    'aria-modal': "true",
}, ...__VLS_functionalComponentArgsRest(__VLS_10));
__VLS_12.slots.default;
{
    const { 'header-extra': __VLS_thisSlot } = __VLS_12.slots;
    const __VLS_13 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_14 = __VLS_asFunctionalComponent(__VLS_13, new __VLS_13({
        ...{ 'onClick': {} },
        quaternary: true,
        circle: true,
    }));
    const __VLS_15 = __VLS_14({
        ...{ 'onClick': {} },
        quaternary: true,
        circle: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_14));
    let __VLS_17;
    let __VLS_18;
    let __VLS_19;
    const __VLS_20 = {
        onClick: (__VLS_ctx.handleClose)
    };
    __VLS_16.slots.default;
    {
        const { icon: __VLS_thisSlot } = __VLS_16.slots;
        const __VLS_21 = {}.NIcon;
        /** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.nIcon, ]} */ ;
        // @ts-ignore
        const __VLS_22 = __VLS_asFunctionalComponent(__VLS_21, new __VLS_21({
            component: (__VLS_ctx.Close),
        }));
        const __VLS_23 = __VLS_22({
            component: (__VLS_ctx.Close),
        }, ...__VLS_functionalComponentArgsRest(__VLS_22));
    }
    var __VLS_16;
}
const __VLS_25 = {}.NInput;
/** @type {[typeof __VLS_components.NInput, typeof __VLS_components.nInput, ]} */ ;
// @ts-ignore
const __VLS_26 = __VLS_asFunctionalComponent(__VLS_25, new __VLS_25({
    value: (__VLS_ctx.keysText),
    type: "textarea",
    placeholder: (__VLS_ctx.t('keys.keyDelete.placeholder')),
    rows: (8),
    ...{ style: {} },
}));
const __VLS_27 = __VLS_26({
    value: (__VLS_ctx.keysText),
    type: "textarea",
    placeholder: (__VLS_ctx.t('keys.keyDelete.placeholder')),
    rows: (8),
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_26));
{
    const { footer: __VLS_thisSlot } = __VLS_12.slots;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    const __VLS_29 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_30 = __VLS_asFunctionalComponent(__VLS_29, new __VLS_29({
        ...{ 'onClick': {} },
    }));
    const __VLS_31 = __VLS_30({
        ...{ 'onClick': {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_30));
    let __VLS_33;
    let __VLS_34;
    let __VLS_35;
    const __VLS_36 = {
        onClick: (__VLS_ctx.handleClose)
    };
    __VLS_32.slots.default;
    (__VLS_ctx.t("keys.keyDelete.cancel"));
    var __VLS_32;
    const __VLS_37 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_38 = __VLS_asFunctionalComponent(__VLS_37, new __VLS_37({
        ...{ 'onClick': {} },
        type: "error",
        loading: (__VLS_ctx.loading),
        disabled: (!__VLS_ctx.keysText),
    }));
    const __VLS_39 = __VLS_38({
        ...{ 'onClick': {} },
        type: "error",
        loading: (__VLS_ctx.loading),
        disabled: (!__VLS_ctx.keysText),
    }, ...__VLS_functionalComponentArgsRest(__VLS_38));
    let __VLS_41;
    let __VLS_42;
    let __VLS_43;
    const __VLS_44 = {
        onClick: (__VLS_ctx.handleSubmit)
    };
    __VLS_40.slots.default;
    (__VLS_ctx.t("keys.keyDelete.delete"));
    var __VLS_40;
}
var __VLS_12;
var __VLS_3;
/** @type {__VLS_StyleScopedClasses['form-modal']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            Close: Close,
            NButton: NButton,
            NCard: NCard,
            NInput: NInput,
            NModal: NModal,
            t: t,
            loading: loading,
            keysText: keysText,
            handleClose: handleClose,
            handleSubmit: handleSubmit,
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
