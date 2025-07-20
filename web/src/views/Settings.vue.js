import { settingsApi } from "@/api/settings"; // Uvozi API za podešavanja i tip SettingCategory
import { HelpCircle, Save } from "@vicons/ionicons5"; // Uvozi ikone iz Ionicons 5
import { NButton, NCard, NForm, NFormItem, NGrid, NGridItem, NIcon, NInput, NInputNumber, NSpace, NTooltip, useMessage, } from "naive-ui"; // Uvozi komponente iz Naive UI
import { ref } from "vue"; // Uvozi funkciju ref iz Vue
import { useI18n } from "vue-i18n"; // Uvozi useI18n za internacionalizaciju
const settingList = ref([]); // Reaktivna referenca za listu kategorija podešavanja
const formRef = ref(); // Referenca na formu
const form = ref({}); // Reaktivna referenca za podatke forme
const isSaving = ref(false); // Reaktivna referenca za status čuvanja
const message = useMessage(); // Instanca za poruke
const { t } = useI18n(); // Inicijalizuje funkciju za prevođenje
// Dohvata podešavanja sa API-ja.
fetchSettings();
async function fetchSettings() {
    try {
        const data = await settingsApi.getSettings(); // Dohvata podešavanja
        settingList.value = data || []; // Postavlja listu podešavanja
        initForm(); // Inicijalizuje formu
    }
    catch (_error) {
        message.error(t("settings.fetchFailed")); // Prikazuje grešku ako dohvatanje ne uspe
    }
}
function initForm() {
    form.value = settingList.value.reduce((acc, category) => {
        category.settings?.forEach(setting => {
            acc[setting.key] = setting.value; // Popunjava formu sa vrednostima podešavanja
        });
        return acc;
    }, {});
}
// Obrađuje slanje forme za ažuriranje podešavanja.
async function handleSubmit() {
    if (isSaving.value) {
        return; // Sprečava višestruko slanje
    }
    try {
        await formRef.value.validate(); // Validira formu
        isSaving.value = true; // Postavlja status čuvanja na true
        try {
            await settingsApi.updateSettings(form.value); // Ažurira podešavanja putem API-ja
            message.success(t("settings.updateSuccess")); // Prikazuje poruku o uspehu
            await fetchSettings(); // Ponovo dohvata podešavanja
        }
        catch (_error) {
            message.error(t("settings.updateFailed")); // Prikazuje grešku ako ažuriranje ne uspe
        }
    }
    finally {
        isSaving.value = false; // Postavlja status čuvanja na false
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
const __VLS_0 = {}.NSpace;
/** @type {[typeof __VLS_components.NSpace, typeof __VLS_components.nSpace, typeof __VLS_components.NSpace, typeof __VLS_components.nSpace, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    vertical: true,
}));
const __VLS_2 = __VLS_1({
    vertical: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_4 = {};
__VLS_3.slots.default;
const __VLS_5 = {}.NForm;
/** @type {[typeof __VLS_components.NForm, typeof __VLS_components.nForm, typeof __VLS_components.NForm, typeof __VLS_components.nForm, ]} */ ;
// @ts-ignore
const __VLS_6 = __VLS_asFunctionalComponent(__VLS_5, new __VLS_5({
    ref: "formRef",
    model: (__VLS_ctx.form),
    labelPlacement: "top",
}));
const __VLS_7 = __VLS_6({
    ref: "formRef",
    model: (__VLS_ctx.form),
    labelPlacement: "top",
}, ...__VLS_functionalComponentArgsRest(__VLS_6));
/** @type {typeof __VLS_ctx.formRef} */ ;
var __VLS_9 = {};
__VLS_8.slots.default;
const __VLS_11 = {}.NSpace;
/** @type {[typeof __VLS_components.NSpace, typeof __VLS_components.nSpace, typeof __VLS_components.NSpace, typeof __VLS_components.nSpace, ]} */ ;
// @ts-ignore
const __VLS_12 = __VLS_asFunctionalComponent(__VLS_11, new __VLS_11({
    vertical: true,
}));
const __VLS_13 = __VLS_12({
    vertical: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_12));
__VLS_14.slots.default;
for (const [category] of __VLS_getVForSourceType((__VLS_ctx.settingList))) {
    const __VLS_15 = {}.NCard;
    /** @type {[typeof __VLS_components.NCard, typeof __VLS_components.nCard, typeof __VLS_components.NCard, typeof __VLS_components.nCard, ]} */ ;
    // @ts-ignore
    const __VLS_16 = __VLS_asFunctionalComponent(__VLS_15, new __VLS_15({
        size: "small",
        key: (category.category_name),
        title: (__VLS_ctx.t(`settings.categories.${category.category_name.replace(/ /g, '')}`)),
        hoverable: true,
        bordered: true,
    }));
    const __VLS_17 = __VLS_16({
        size: "small",
        key: (category.category_name),
        title: (__VLS_ctx.t(`settings.categories.${category.category_name.replace(/ /g, '')}`)),
        hoverable: true,
        bordered: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_16));
    __VLS_18.slots.default;
    const __VLS_19 = {}.NGrid;
    /** @type {[typeof __VLS_components.NGrid, typeof __VLS_components.nGrid, typeof __VLS_components.NGrid, typeof __VLS_components.nGrid, ]} */ ;
    // @ts-ignore
    const __VLS_20 = __VLS_asFunctionalComponent(__VLS_19, new __VLS_19({
        xGap: (24),
        yGap: (24),
        responsive: "screen",
        cols: "1 s:2 m:2 l:3 xl:4",
    }));
    const __VLS_21 = __VLS_20({
        xGap: (24),
        yGap: (24),
        responsive: "screen",
        cols: "1 s:2 m:2 l:3 xl:4",
    }, ...__VLS_functionalComponentArgsRest(__VLS_20));
    __VLS_22.slots.default;
    for (const [item] of __VLS_getVForSourceType((category.settings))) {
        const __VLS_23 = {}.NGridItem;
        /** @type {[typeof __VLS_components.NGridItem, typeof __VLS_components.nGridItem, typeof __VLS_components.NGridItem, typeof __VLS_components.nGridItem, ]} */ ;
        // @ts-ignore
        const __VLS_24 = __VLS_asFunctionalComponent(__VLS_23, new __VLS_23({
            key: (item.key),
        }));
        const __VLS_25 = __VLS_24({
            key: (item.key),
        }, ...__VLS_functionalComponentArgsRest(__VLS_24));
        __VLS_26.slots.default;
        const __VLS_27 = {}.NFormItem;
        /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.nFormItem, typeof __VLS_components.NFormItem, typeof __VLS_components.nFormItem, ]} */ ;
        // @ts-ignore
        const __VLS_28 = __VLS_asFunctionalComponent(__VLS_27, new __VLS_27({
            path: (item.key),
            rule: ({
                required: true,
                message: __VLS_ctx.t('settings.inputRequired', { name: item.name }),
            }),
        }));
        const __VLS_29 = __VLS_28({
            path: (item.key),
            rule: ({
                required: true,
                message: __VLS_ctx.t('settings.inputRequired', { name: item.name }),
            }),
        }, ...__VLS_functionalComponentArgsRest(__VLS_28));
        __VLS_30.slots.default;
        {
            const { label: __VLS_thisSlot } = __VLS_30.slots;
            const __VLS_31 = {}.NSpace;
            /** @type {[typeof __VLS_components.NSpace, typeof __VLS_components.nSpace, typeof __VLS_components.NSpace, typeof __VLS_components.nSpace, ]} */ ;
            // @ts-ignore
            const __VLS_32 = __VLS_asFunctionalComponent(__VLS_31, new __VLS_31({
                align: "center",
                size: (4),
                wrapItem: (false),
            }));
            const __VLS_33 = __VLS_32({
                align: "center",
                size: (4),
                wrapItem: (false),
            }, ...__VLS_functionalComponentArgsRest(__VLS_32));
            __VLS_34.slots.default;
            const __VLS_35 = {}.NTooltip;
            /** @type {[typeof __VLS_components.NTooltip, typeof __VLS_components.nTooltip, typeof __VLS_components.NTooltip, typeof __VLS_components.nTooltip, ]} */ ;
            // @ts-ignore
            const __VLS_36 = __VLS_asFunctionalComponent(__VLS_35, new __VLS_35({
                trigger: "hover",
                placement: "top",
            }));
            const __VLS_37 = __VLS_36({
                trigger: "hover",
                placement: "top",
            }, ...__VLS_functionalComponentArgsRest(__VLS_36));
            __VLS_38.slots.default;
            {
                const { trigger: __VLS_thisSlot } = __VLS_38.slots;
                const __VLS_39 = {}.NIcon;
                /** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.nIcon, ]} */ ;
                // @ts-ignore
                const __VLS_40 = __VLS_asFunctionalComponent(__VLS_39, new __VLS_39({
                    component: (__VLS_ctx.HelpCircle),
                    size: (16),
                    ...{ style: {} },
                }));
                const __VLS_41 = __VLS_40({
                    component: (__VLS_ctx.HelpCircle),
                    size: (16),
                    ...{ style: {} },
                }, ...__VLS_functionalComponentArgsRest(__VLS_40));
            }
            (item.description);
            var __VLS_38;
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (__VLS_ctx.t(`settings.fields.${item.name}`));
            var __VLS_34;
        }
        if (item.type === 'int') {
            const __VLS_43 = {}.NInputNumber;
            /** @type {[typeof __VLS_components.NInputNumber, typeof __VLS_components.nInputNumber, ]} */ ;
            // @ts-ignore
            const __VLS_44 = __VLS_asFunctionalComponent(__VLS_43, new __VLS_43({
                value: __VLS_ctx.form[item.key],
                min: (item.min_value !== undefined && item.min_value >= 0 ? item.min_value : undefined),
                placeholder: (__VLS_ctx.t('settings.inputPlaceholder')),
                clearable: true,
                ...{ style: {} },
                size: "small",
            }));
            const __VLS_45 = __VLS_44({
                value: __VLS_ctx.form[item.key],
                min: (item.min_value !== undefined && item.min_value >= 0 ? item.min_value : undefined),
                placeholder: (__VLS_ctx.t('settings.inputPlaceholder')),
                clearable: true,
                ...{ style: {} },
                size: "small",
            }, ...__VLS_functionalComponentArgsRest(__VLS_44));
        }
        else {
            const __VLS_47 = {}.NInput;
            /** @type {[typeof __VLS_components.NInput, typeof __VLS_components.nInput, ]} */ ;
            // @ts-ignore
            const __VLS_48 = __VLS_asFunctionalComponent(__VLS_47, new __VLS_47({
                value: __VLS_ctx.form[item.key],
                placeholder: (__VLS_ctx.t('settings.inputContentPlaceholder')),
                clearable: true,
                size: "small",
            }));
            const __VLS_49 = __VLS_48({
                value: __VLS_ctx.form[item.key],
                placeholder: (__VLS_ctx.t('settings.inputContentPlaceholder')),
                clearable: true,
                size: "small",
            }, ...__VLS_functionalComponentArgsRest(__VLS_48));
        }
        var __VLS_30;
        var __VLS_26;
    }
    var __VLS_22;
    var __VLS_18;
}
var __VLS_14;
var __VLS_8;
if (__VLS_ctx.settingList.length > 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    const __VLS_51 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_52 = __VLS_asFunctionalComponent(__VLS_51, new __VLS_51({
        ...{ 'onClick': {} },
        type: "primary",
        size: "large",
        loading: (__VLS_ctx.isSaving),
        disabled: (__VLS_ctx.isSaving),
        ...{ style: {} },
    }));
    const __VLS_53 = __VLS_52({
        ...{ 'onClick': {} },
        type: "primary",
        size: "large",
        loading: (__VLS_ctx.isSaving),
        disabled: (__VLS_ctx.isSaving),
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_52));
    let __VLS_55;
    let __VLS_56;
    let __VLS_57;
    const __VLS_58 = {
        onClick: (__VLS_ctx.handleSubmit)
    };
    __VLS_54.slots.default;
    {
        const { icon: __VLS_thisSlot } = __VLS_54.slots;
        const __VLS_59 = {}.NIcon;
        /** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.nIcon, ]} */ ;
        // @ts-ignore
        const __VLS_60 = __VLS_asFunctionalComponent(__VLS_59, new __VLS_59({
            component: (__VLS_ctx.Save),
        }));
        const __VLS_61 = __VLS_60({
            component: (__VLS_ctx.Save),
        }, ...__VLS_functionalComponentArgsRest(__VLS_60));
    }
    (__VLS_ctx.isSaving ? __VLS_ctx.t("settings.saving") : __VLS_ctx.t("settings.save"));
    var __VLS_54;
}
var __VLS_3;
// @ts-ignore
var __VLS_10 = __VLS_9;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            HelpCircle: HelpCircle,
            Save: Save,
            NButton: NButton,
            NCard: NCard,
            NForm: NForm,
            NFormItem: NFormItem,
            NGrid: NGrid,
            NGridItem: NGridItem,
            NIcon: NIcon,
            NInput: NInput,
            NInputNumber: NInputNumber,
            NSpace: NSpace,
            NTooltip: NTooltip,
            settingList: settingList,
            formRef: formRef,
            form: form,
            isSaving: isSaving,
            t: t,
            handleSubmit: handleSubmit,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
