import { keysApi } from "@/api/keys";
import { settingsApi } from "@/api/settings";
import { Add, Close, Remove } from "@vicons/ionicons5";
import { NButton, NCard, NCollapse, NCollapseItem, NForm, NFormItem, NInput, NInputNumber, NModal, NSelect, useMessage, } from "naive-ui";
import { computed, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
const { t } = useI18n();
const props = withDefaults(defineProps(), {
    group: null,
});
const emit = defineEmits();
const message = useMessage();
const loading = ref(false);
const formRef = ref();
// Reaktivni objekat podataka forme.
const formData = reactive({
    name: "",
    display_name: "",
    description: "",
    upstreams: [
        {
            url: "",
            weight: 1,
        },
    ],
    channel_type: "openai",
    sort: 1,
    test_model: "",
    param_overrides: "",
    config: {},
    configItems: [],
});
const channelTypeOptions = ref([]);
const configOptions = ref([]);
const channelTypesFetched = ref(false);
const configOptionsFetched = ref(false);
// Dinamički generiše tekst čuvara mesta za unos test modela na osnovu izabranog tipa kanala.
const testModelPlaceholder = computed(() => {
    switch (formData.channel_type) {
        case "openai":
            return t("keys.groupForm.testModelOpenAIPlaceholder");
        case "gemini":
            return t("keys.groupForm.testModelGeminiPlaceholder");
        case "anthropic":
            return t("keys.groupForm.testModelAnthropicPlaceholder");
        default:
            return t("keys.groupForm.testModelDefaultPlaceholder");
    }
});
const upstreamPlaceholder = computed(() => {
    switch (formData.channel_type) {
        case "openai":
            return "https://api.openai.com";
        case "gemini":
            return "https://generativelanguage.googleapis.com";
        case "anthropic":
            return "https://api.anthropic.com";
        default:
            return t("keys.groupForm.upstreamDefaultPlaceholder");
    }
});
// Pravila validacije za polja forme.
const rules = {
    name: [
        {
            required: true,
            message: t("keys.groupForm.nameRequired"),
            trigger: ["blur", "input"],
        },
        {
            pattern: /^[a-z0-9_-]{3,30}$/,
            message: t("keys.groupForm.namePattern"),
            trigger: ["blur", "input"],
        },
    ],
    channel_type: [
        {
            required: true,
            message: t("keys.groupForm.channelTypeRequired"),
            trigger: ["blur", "change"],
        },
    ],
    test_model: [
        {
            required: true,
            message: t("keys.groupForm.testModelRequired"),
            trigger: ["blur", "input"],
        },
    ],
    upstreams: [
        {
            type: "array",
            min: 1,
            message: t("keys.groupForm.upstreamsMin"),
            trigger: ["blur", "change"],
        },
    ],
};
// Prati promene u vidljivosti modala.
watch(() => props.show, show => {
    if (show) {
        if (!channelTypesFetched.value) {
            fetchChannelTypes();
        }
        if (!configOptionsFetched.value) {
            fetchGroupConfigOptions();
        }
        resetForm();
        if (props.group) {
            loadGroupData();
        }
    }
});
// Resetuje formu na početno stanje.
function resetForm() {
    Object.assign(formData, {
        name: "",
        display_name: "",
        description: "",
        upstreams: [{ url: "", weight: 1 }],
        channel_type: "openai",
        sort: 1,
        test_model: "",
        param_overrides: "",
        config: {},
        configItems: [],
    });
}
// Učitava podatke grupe u formu kada je u režimu uređivanja.
function loadGroupData() {
    if (!props.group) {
        return;
    }
    const configItems = Object.entries(props.group.config || {}).map(([key, value]) => ({
        key,
        value: Number(value) || 0,
    }));
    Object.assign(formData, {
        name: props.group.name || "",
        display_name: props.group.display_name || "",
        description: props.group.description || "",
        upstreams: props.group.upstreams?.length
            ? [...props.group.upstreams]
            : [{ url: "", weight: 1 }],
        channel_type: props.group.channel_type || "openai",
        sort: props.group.sort || 1,
        test_model: props.group.test_model || "",
        param_overrides: JSON.stringify(props.group.param_overrides || {}, null, 2),
        config: {},
        configItems,
    });
}
async function fetchChannelTypes() {
    const options = (await settingsApi.getChannelTypes()) || [];
    channelTypeOptions.value =
        options?.map((type) => ({
            label: type,
            value: type,
        })) || [];
    channelTypesFetched.value = true;
}
// Dodaje novo polje za upstream URL.
function addUpstream() {
    formData.upstreams.push({
        url: "",
        weight: 1,
    });
}
// Uklanja polje za upstream URL.
function removeUpstream(index) {
    if (formData.upstreams.length > 1) {
        formData.upstreams.splice(index, 1);
    }
}
async function fetchGroupConfigOptions() {
    const options = await keysApi.getGroupConfigOptions();
    configOptions.value = options || [];
    configOptionsFetched.value = true;
}
// Dodaje novo polje za konfiguracionu stavku.
function addConfigItem() {
    formData.configItems.push({
        key: "",
        value: 0,
    });
}
// Uklanja polje za konfiguracionu stavku.
function removeConfigItem(index) {
    formData.configItems.splice(index, 1);
}
// Postavlja podrazumevanu vrednost za konfiguracionu stavku kada se njen ključ promeni.
function handleConfigKeyChange(index, key) {
    const option = configOptions.value.find(opt => opt.key === key);
    if (option) {
        formData.configItems[index].value = option.default_value || 0;
    }
}
// Zatvara modal.
function handleClose() {
    emit("update:show", false);
}
// Obrađuje slanje forme.
async function handleSubmit() {
    if (loading.value) {
        return;
    }
    try {
        await formRef.value?.validate();
        loading.value = true;
        // Validira JSON format za premošćavanje parametara.
        let paramOverrides = {};
        if (formData.param_overrides) {
            try {
                paramOverrides = JSON.parse(formData.param_overrides);
            }
            catch {
                message.error(t("keys.groupForm.paramOverridesInvalidJson"));
                return;
            }
        }
        // Konvertuje configItems u config objekat.
        const config = {};
        formData.configItems.forEach((item) => {
            if (item.key && item.key.trim()) {
                config[item.key] = item.value;
            }
        });
        // Izgradi objekat podataka za slanje.
        const submitData = {
            name: formData.name,
            display_name: formData.display_name,
            description: formData.description,
            upstreams: formData.upstreams.filter((upstream) => upstream.url.trim()),
            channel_type: formData.channel_type,
            sort: formData.sort,
            test_model: formData.test_model,
            param_overrides: formData.param_overrides ? paramOverrides : undefined,
            config,
        };
        let res;
        if (props.group?.id) {
            // Režim uređivanja
            res = await keysApi.updateGroup(props.group.id, submitData);
        }
        else {
            // Režim kreiranja
            res = await keysApi.createGroup(submitData);
        }
        emit("success", res);
        handleClose();
    }
    finally {
        loading.value = false;
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_withDefaultsArg = (function (t) { return t; })({
    group: null,
});
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
    ...{ class: "group-form-modal" },
}));
const __VLS_2 = __VLS_1({
    ...{ 'onUpdate:show': {} },
    show: (__VLS_ctx.show),
    ...{ class: "group-form-modal" },
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
    title: (__VLS_ctx.group ? __VLS_ctx.t('keys.groupForm.editTitle') : __VLS_ctx.t('keys.groupForm.createTitle')),
    bordered: (false),
    size: "huge",
    role: "dialog",
    'aria-modal': "true",
}));
const __VLS_11 = __VLS_10({
    ...{ style: {} },
    title: (__VLS_ctx.group ? __VLS_ctx.t('keys.groupForm.editTitle') : __VLS_ctx.t('keys.groupForm.createTitle')),
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
const __VLS_25 = {}.NForm;
/** @type {[typeof __VLS_components.NForm, typeof __VLS_components.nForm, typeof __VLS_components.NForm, typeof __VLS_components.nForm, ]} */ ;
// @ts-ignore
const __VLS_26 = __VLS_asFunctionalComponent(__VLS_25, new __VLS_25({
    ref: "formRef",
    model: (__VLS_ctx.formData),
    rules: (__VLS_ctx.rules),
    labelPlacement: "left",
    labelWidth: "120px",
    requireMarkPlacement: "right-hanging",
}));
const __VLS_27 = __VLS_26({
    ref: "formRef",
    model: (__VLS_ctx.formData),
    rules: (__VLS_ctx.rules),
    labelPlacement: "left",
    labelWidth: "120px",
    requireMarkPlacement: "right-hanging",
}, ...__VLS_functionalComponentArgsRest(__VLS_26));
/** @type {typeof __VLS_ctx.formRef} */ ;
var __VLS_29 = {};
__VLS_28.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "form-section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({
    ...{ class: "section-title" },
});
(__VLS_ctx.t("keys.groupForm.baseInfo"));
const __VLS_31 = {}.NFormItem;
/** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.nFormItem, typeof __VLS_components.NFormItem, typeof __VLS_components.nFormItem, ]} */ ;
// @ts-ignore
const __VLS_32 = __VLS_asFunctionalComponent(__VLS_31, new __VLS_31({
    label: (__VLS_ctx.t('keys.groupForm.nameLabel')),
    path: "name",
}));
const __VLS_33 = __VLS_32({
    label: (__VLS_ctx.t('keys.groupForm.nameLabel')),
    path: "name",
}, ...__VLS_functionalComponentArgsRest(__VLS_32));
__VLS_34.slots.default;
const __VLS_35 = {}.NInput;
/** @type {[typeof __VLS_components.NInput, typeof __VLS_components.nInput, ]} */ ;
// @ts-ignore
const __VLS_36 = __VLS_asFunctionalComponent(__VLS_35, new __VLS_35({
    value: (__VLS_ctx.formData.name),
    placeholder: (__VLS_ctx.t('keys.groupForm.namePlaceholder')),
}));
const __VLS_37 = __VLS_36({
    value: (__VLS_ctx.formData.name),
    placeholder: (__VLS_ctx.t('keys.groupForm.namePlaceholder')),
}, ...__VLS_functionalComponentArgsRest(__VLS_36));
var __VLS_34;
const __VLS_39 = {}.NFormItem;
/** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.nFormItem, typeof __VLS_components.NFormItem, typeof __VLS_components.nFormItem, ]} */ ;
// @ts-ignore
const __VLS_40 = __VLS_asFunctionalComponent(__VLS_39, new __VLS_39({
    label: (__VLS_ctx.t('keys.groupForm.displayNameLabel')),
    path: "display_name",
}));
const __VLS_41 = __VLS_40({
    label: (__VLS_ctx.t('keys.groupForm.displayNameLabel')),
    path: "display_name",
}, ...__VLS_functionalComponentArgsRest(__VLS_40));
__VLS_42.slots.default;
const __VLS_43 = {}.NInput;
/** @type {[typeof __VLS_components.NInput, typeof __VLS_components.nInput, ]} */ ;
// @ts-ignore
const __VLS_44 = __VLS_asFunctionalComponent(__VLS_43, new __VLS_43({
    value: (__VLS_ctx.formData.display_name),
    placeholder: (__VLS_ctx.t('keys.groupForm.displayNamePlaceholder')),
}));
const __VLS_45 = __VLS_44({
    value: (__VLS_ctx.formData.display_name),
    placeholder: (__VLS_ctx.t('keys.groupForm.displayNamePlaceholder')),
}, ...__VLS_functionalComponentArgsRest(__VLS_44));
var __VLS_42;
const __VLS_47 = {}.NFormItem;
/** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.nFormItem, typeof __VLS_components.NFormItem, typeof __VLS_components.nFormItem, ]} */ ;
// @ts-ignore
const __VLS_48 = __VLS_asFunctionalComponent(__VLS_47, new __VLS_47({
    label: (__VLS_ctx.t('keys.groupForm.channelTypeLabel')),
    path: "channel_type",
}));
const __VLS_49 = __VLS_48({
    label: (__VLS_ctx.t('keys.groupForm.channelTypeLabel')),
    path: "channel_type",
}, ...__VLS_functionalComponentArgsRest(__VLS_48));
__VLS_50.slots.default;
const __VLS_51 = {}.NSelect;
/** @type {[typeof __VLS_components.NSelect, typeof __VLS_components.nSelect, ]} */ ;
// @ts-ignore
const __VLS_52 = __VLS_asFunctionalComponent(__VLS_51, new __VLS_51({
    value: (__VLS_ctx.formData.channel_type),
    options: (__VLS_ctx.channelTypeOptions),
    placeholder: (__VLS_ctx.t('keys.groupForm.channelTypePlaceholder')),
}));
const __VLS_53 = __VLS_52({
    value: (__VLS_ctx.formData.channel_type),
    options: (__VLS_ctx.channelTypeOptions),
    placeholder: (__VLS_ctx.t('keys.groupForm.channelTypePlaceholder')),
}, ...__VLS_functionalComponentArgsRest(__VLS_52));
var __VLS_50;
const __VLS_55 = {}.NFormItem;
/** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.nFormItem, typeof __VLS_components.NFormItem, typeof __VLS_components.nFormItem, ]} */ ;
// @ts-ignore
const __VLS_56 = __VLS_asFunctionalComponent(__VLS_55, new __VLS_55({
    label: (__VLS_ctx.t('keys.groupForm.testModelLabel')),
    path: "test_model",
}));
const __VLS_57 = __VLS_56({
    label: (__VLS_ctx.t('keys.groupForm.testModelLabel')),
    path: "test_model",
}, ...__VLS_functionalComponentArgsRest(__VLS_56));
__VLS_58.slots.default;
const __VLS_59 = {}.NInput;
/** @type {[typeof __VLS_components.NInput, typeof __VLS_components.nInput, ]} */ ;
// @ts-ignore
const __VLS_60 = __VLS_asFunctionalComponent(__VLS_59, new __VLS_59({
    value: (__VLS_ctx.formData.test_model),
    placeholder: (__VLS_ctx.testModelPlaceholder),
}));
const __VLS_61 = __VLS_60({
    value: (__VLS_ctx.formData.test_model),
    placeholder: (__VLS_ctx.testModelPlaceholder),
}, ...__VLS_functionalComponentArgsRest(__VLS_60));
var __VLS_58;
const __VLS_63 = {}.NFormItem;
/** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.nFormItem, typeof __VLS_components.NFormItem, typeof __VLS_components.nFormItem, ]} */ ;
// @ts-ignore
const __VLS_64 = __VLS_asFunctionalComponent(__VLS_63, new __VLS_63({
    label: (__VLS_ctx.t('keys.groupForm.sortLabel')),
    path: "sort",
}));
const __VLS_65 = __VLS_64({
    label: (__VLS_ctx.t('keys.groupForm.sortLabel')),
    path: "sort",
}, ...__VLS_functionalComponentArgsRest(__VLS_64));
__VLS_66.slots.default;
const __VLS_67 = {}.NInputNumber;
/** @type {[typeof __VLS_components.NInputNumber, typeof __VLS_components.nInputNumber, ]} */ ;
// @ts-ignore
const __VLS_68 = __VLS_asFunctionalComponent(__VLS_67, new __VLS_67({
    value: (__VLS_ctx.formData.sort),
    min: (0),
    placeholder: (__VLS_ctx.t('keys.groupForm.sortPlaceholder')),
}));
const __VLS_69 = __VLS_68({
    value: (__VLS_ctx.formData.sort),
    min: (0),
    placeholder: (__VLS_ctx.t('keys.groupForm.sortPlaceholder')),
}, ...__VLS_functionalComponentArgsRest(__VLS_68));
var __VLS_66;
const __VLS_71 = {}.NFormItem;
/** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.nFormItem, typeof __VLS_components.NFormItem, typeof __VLS_components.nFormItem, ]} */ ;
// @ts-ignore
const __VLS_72 = __VLS_asFunctionalComponent(__VLS_71, new __VLS_71({
    label: (__VLS_ctx.t('keys.groupForm.descriptionLabel')),
    path: "description",
}));
const __VLS_73 = __VLS_72({
    label: (__VLS_ctx.t('keys.groupForm.descriptionLabel')),
    path: "description",
}, ...__VLS_functionalComponentArgsRest(__VLS_72));
__VLS_74.slots.default;
const __VLS_75 = {}.NInput;
/** @type {[typeof __VLS_components.NInput, typeof __VLS_components.nInput, ]} */ ;
// @ts-ignore
const __VLS_76 = __VLS_asFunctionalComponent(__VLS_75, new __VLS_75({
    value: (__VLS_ctx.formData.description),
    type: "textarea",
    placeholder: (__VLS_ctx.t('keys.groupForm.descriptionPlaceholder')),
    rows: (2),
    autosize: ({ minRows: 2, maxRows: 2 }),
    ...{ style: {} },
}));
const __VLS_77 = __VLS_76({
    value: (__VLS_ctx.formData.description),
    type: "textarea",
    placeholder: (__VLS_ctx.t('keys.groupForm.descriptionPlaceholder')),
    rows: (2),
    autosize: ({ minRows: 2, maxRows: 2 }),
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_76));
var __VLS_74;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "form-section" },
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({
    ...{ class: "section-title" },
});
(__VLS_ctx.t("keys.groupForm.upstreams"));
for (const [upstream, index] of __VLS_getVForSourceType((__VLS_ctx.formData.upstreams))) {
    const __VLS_79 = {}.NFormItem;
    /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.nFormItem, typeof __VLS_components.NFormItem, typeof __VLS_components.nFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_80 = __VLS_asFunctionalComponent(__VLS_79, new __VLS_79({
        key: (index),
        label: (__VLS_ctx.t('keys.groupForm.upstreamLabel', { index: index + 1 })),
        path: (`upstreams[${index}].url`),
        rule: ({
            required: true,
            message: '',
            trigger: ['blur', 'input'],
        }),
    }));
    const __VLS_81 = __VLS_80({
        key: (index),
        label: (__VLS_ctx.t('keys.groupForm.upstreamLabel', { index: index + 1 })),
        path: (`upstreams[${index}].url`),
        rule: ({
            required: true,
            message: '',
            trigger: ['blur', 'input'],
        }),
    }, ...__VLS_functionalComponentArgsRest(__VLS_80));
    __VLS_82.slots.default;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center gap-2" },
        ...{ style: {} },
    });
    const __VLS_83 = {}.NInput;
    /** @type {[typeof __VLS_components.NInput, typeof __VLS_components.nInput, ]} */ ;
    // @ts-ignore
    const __VLS_84 = __VLS_asFunctionalComponent(__VLS_83, new __VLS_83({
        value: (upstream.url),
        placeholder: (__VLS_ctx.upstreamPlaceholder),
        ...{ style: {} },
    }));
    const __VLS_85 = __VLS_84({
        value: (upstream.url),
        placeholder: (__VLS_ctx.upstreamPlaceholder),
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_84));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "form-label" },
    });
    (__VLS_ctx.t("keys.groupForm.weightLabel"));
    const __VLS_87 = {}.NInputNumber;
    /** @type {[typeof __VLS_components.NInputNumber, typeof __VLS_components.nInputNumber, ]} */ ;
    // @ts-ignore
    const __VLS_88 = __VLS_asFunctionalComponent(__VLS_87, new __VLS_87({
        value: (upstream.weight),
        min: (1),
        placeholder: (__VLS_ctx.t('keys.groupForm.weightPlaceholder')),
        ...{ style: {} },
    }));
    const __VLS_89 = __VLS_88({
        value: (upstream.weight),
        min: (1),
        placeholder: (__VLS_ctx.t('keys.groupForm.weightPlaceholder')),
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_88));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    if (__VLS_ctx.formData.upstreams.length > 1) {
        const __VLS_91 = {}.NButton;
        /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
        // @ts-ignore
        const __VLS_92 = __VLS_asFunctionalComponent(__VLS_91, new __VLS_91({
            ...{ 'onClick': {} },
            type: "error",
            quaternary: true,
            circle: true,
            ...{ style: {} },
        }));
        const __VLS_93 = __VLS_92({
            ...{ 'onClick': {} },
            type: "error",
            quaternary: true,
            circle: true,
            ...{ style: {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_92));
        let __VLS_95;
        let __VLS_96;
        let __VLS_97;
        const __VLS_98 = {
            onClick: (...[$event]) => {
                if (!(__VLS_ctx.formData.upstreams.length > 1))
                    return;
                __VLS_ctx.removeUpstream(index);
            }
        };
        __VLS_94.slots.default;
        {
            const { icon: __VLS_thisSlot } = __VLS_94.slots;
            const __VLS_99 = {}.NIcon;
            /** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.nIcon, ]} */ ;
            // @ts-ignore
            const __VLS_100 = __VLS_asFunctionalComponent(__VLS_99, new __VLS_99({
                component: (__VLS_ctx.Remove),
            }));
            const __VLS_101 = __VLS_100({
                component: (__VLS_ctx.Remove),
            }, ...__VLS_functionalComponentArgsRest(__VLS_100));
        }
        var __VLS_94;
    }
    var __VLS_82;
}
const __VLS_103 = {}.NFormItem;
/** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.nFormItem, typeof __VLS_components.NFormItem, typeof __VLS_components.nFormItem, ]} */ ;
// @ts-ignore
const __VLS_104 = __VLS_asFunctionalComponent(__VLS_103, new __VLS_103({}));
const __VLS_105 = __VLS_104({}, ...__VLS_functionalComponentArgsRest(__VLS_104));
__VLS_106.slots.default;
const __VLS_107 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_108 = __VLS_asFunctionalComponent(__VLS_107, new __VLS_107({
    ...{ 'onClick': {} },
    dashed: true,
    ...{ style: {} },
}));
const __VLS_109 = __VLS_108({
    ...{ 'onClick': {} },
    dashed: true,
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_108));
let __VLS_111;
let __VLS_112;
let __VLS_113;
const __VLS_114 = {
    onClick: (__VLS_ctx.addUpstream)
};
__VLS_110.slots.default;
{
    const { icon: __VLS_thisSlot } = __VLS_110.slots;
    const __VLS_115 = {}.NIcon;
    /** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.nIcon, ]} */ ;
    // @ts-ignore
    const __VLS_116 = __VLS_asFunctionalComponent(__VLS_115, new __VLS_115({
        component: (__VLS_ctx.Add),
    }));
    const __VLS_117 = __VLS_116({
        component: (__VLS_ctx.Add),
    }, ...__VLS_functionalComponentArgsRest(__VLS_116));
}
(__VLS_ctx.t("keys.groupForm.addUpstream"));
var __VLS_110;
var __VLS_106;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "form-section" },
    ...{ style: {} },
});
const __VLS_119 = {}.NCollapse;
/** @type {[typeof __VLS_components.NCollapse, typeof __VLS_components.nCollapse, typeof __VLS_components.NCollapse, typeof __VLS_components.nCollapse, ]} */ ;
// @ts-ignore
const __VLS_120 = __VLS_asFunctionalComponent(__VLS_119, new __VLS_119({}));
const __VLS_121 = __VLS_120({}, ...__VLS_functionalComponentArgsRest(__VLS_120));
__VLS_122.slots.default;
const __VLS_123 = {}.NCollapseItem;
/** @type {[typeof __VLS_components.NCollapseItem, typeof __VLS_components.nCollapseItem, typeof __VLS_components.NCollapseItem, typeof __VLS_components.nCollapseItem, ]} */ ;
// @ts-ignore
const __VLS_124 = __VLS_asFunctionalComponent(__VLS_123, new __VLS_123({
    title: (__VLS_ctx.t('keys.groupForm.advancedConfig')),
    name: "advanced",
}));
const __VLS_125 = __VLS_124({
    title: (__VLS_ctx.t('keys.groupForm.advancedConfig')),
    name: "advanced",
}, ...__VLS_functionalComponentArgsRest(__VLS_124));
__VLS_126.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "config-section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h5, __VLS_intrinsicElements.h5)({
    ...{ class: "config-title" },
});
(__VLS_ctx.t("keys.groupForm.groupConfig"));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "config-items" },
});
for (const [configItem, index] of __VLS_getVForSourceType((__VLS_ctx.formData.configItems))) {
    const __VLS_127 = {}.NFormItem;
    /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.nFormItem, typeof __VLS_components.NFormItem, typeof __VLS_components.nFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_128 = __VLS_asFunctionalComponent(__VLS_127, new __VLS_127({
        key: (index),
        ...{ class: "flex config-item" },
        label: (__VLS_ctx.t('keys.groupForm.configLabel', { index: index + 1 })),
        path: (`configItems[${index}].key`),
        rule: ({
            required: true,
            message: '',
            trigger: ['blur', 'change'],
        }),
    }));
    const __VLS_129 = __VLS_128({
        key: (index),
        ...{ class: "flex config-item" },
        label: (__VLS_ctx.t('keys.groupForm.configLabel', { index: index + 1 })),
        path: (`configItems[${index}].key`),
        rule: ({
            required: true,
            message: '',
            trigger: ['blur', 'change'],
        }),
    }, ...__VLS_functionalComponentArgsRest(__VLS_128));
    __VLS_130.slots.default;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center" },
        ...{ style: {} },
    });
    const __VLS_131 = {}.NSelect;
    /** @type {[typeof __VLS_components.NSelect, typeof __VLS_components.nSelect, ]} */ ;
    // @ts-ignore
    const __VLS_132 = __VLS_asFunctionalComponent(__VLS_131, new __VLS_131({
        ...{ 'onUpdate:value': {} },
        value: (configItem.key),
        options: (__VLS_ctx.configOptions.map((opt) => ({
            label: opt.name,
            value: opt.key,
            disabled: __VLS_ctx.formData.configItems
                .map((item) => item.key)
                ?.includes(opt.key) && opt.key !== configItem.key,
        }))),
        placeholder: (__VLS_ctx.t('keys.groupForm.configKeyPlaceholder')),
        ...{ style: {} },
        clearable: true,
    }));
    const __VLS_133 = __VLS_132({
        ...{ 'onUpdate:value': {} },
        value: (configItem.key),
        options: (__VLS_ctx.configOptions.map((opt) => ({
            label: opt.name,
            value: opt.key,
            disabled: __VLS_ctx.formData.configItems
                .map((item) => item.key)
                ?.includes(opt.key) && opt.key !== configItem.key,
        }))),
        placeholder: (__VLS_ctx.t('keys.groupForm.configKeyPlaceholder')),
        ...{ style: {} },
        clearable: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_132));
    let __VLS_135;
    let __VLS_136;
    let __VLS_137;
    const __VLS_138 = {
        'onUpdate:value': ((value) => __VLS_ctx.handleConfigKeyChange(index, value))
    };
    var __VLS_134;
    const __VLS_139 = {}.NInputNumber;
    /** @type {[typeof __VLS_components.NInputNumber, typeof __VLS_components.nInputNumber, ]} */ ;
    // @ts-ignore
    const __VLS_140 = __VLS_asFunctionalComponent(__VLS_139, new __VLS_139({
        value: (configItem.value),
        placeholder: (__VLS_ctx.t('keys.groupForm.configValuePlaceholder')),
        ...{ style: {} },
        precision: (0),
    }));
    const __VLS_141 = __VLS_140({
        value: (configItem.value),
        placeholder: (__VLS_ctx.t('keys.groupForm.configValuePlaceholder')),
        ...{ style: {} },
        precision: (0),
    }, ...__VLS_functionalComponentArgsRest(__VLS_140));
    const __VLS_143 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_144 = __VLS_asFunctionalComponent(__VLS_143, new __VLS_143({
        ...{ 'onClick': {} },
        type: "error",
        quaternary: true,
        circle: true,
        size: "small",
        ...{ style: {} },
    }));
    const __VLS_145 = __VLS_144({
        ...{ 'onClick': {} },
        type: "error",
        quaternary: true,
        circle: true,
        size: "small",
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_144));
    let __VLS_147;
    let __VLS_148;
    let __VLS_149;
    const __VLS_150 = {
        onClick: (...[$event]) => {
            __VLS_ctx.removeConfigItem(index);
        }
    };
    __VLS_146.slots.default;
    {
        const { icon: __VLS_thisSlot } = __VLS_146.slots;
        const __VLS_151 = {}.NIcon;
        /** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.nIcon, ]} */ ;
        // @ts-ignore
        const __VLS_152 = __VLS_asFunctionalComponent(__VLS_151, new __VLS_151({
            component: (__VLS_ctx.Remove),
        }));
        const __VLS_153 = __VLS_152({
            component: (__VLS_ctx.Remove),
        }, ...__VLS_functionalComponentArgsRest(__VLS_152));
    }
    var __VLS_146;
    var __VLS_130;
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: {} },
});
const __VLS_155 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_156 = __VLS_asFunctionalComponent(__VLS_155, new __VLS_155({
    ...{ 'onClick': {} },
    dashed: true,
    ...{ style: {} },
    disabled: (__VLS_ctx.formData.configItems.length >= __VLS_ctx.configOptions.length),
}));
const __VLS_157 = __VLS_156({
    ...{ 'onClick': {} },
    dashed: true,
    ...{ style: {} },
    disabled: (__VLS_ctx.formData.configItems.length >= __VLS_ctx.configOptions.length),
}, ...__VLS_functionalComponentArgsRest(__VLS_156));
let __VLS_159;
let __VLS_160;
let __VLS_161;
const __VLS_162 = {
    onClick: (__VLS_ctx.addConfigItem)
};
__VLS_158.slots.default;
{
    const { icon: __VLS_thisSlot } = __VLS_158.slots;
    const __VLS_163 = {}.NIcon;
    /** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.nIcon, ]} */ ;
    // @ts-ignore
    const __VLS_164 = __VLS_asFunctionalComponent(__VLS_163, new __VLS_163({
        component: (__VLS_ctx.Add),
    }));
    const __VLS_165 = __VLS_164({
        component: (__VLS_ctx.Add),
    }, ...__VLS_functionalComponentArgsRest(__VLS_164));
}
(__VLS_ctx.t("keys.groupForm.addConfig"));
var __VLS_158;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "config-section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h5, __VLS_intrinsicElements.h5)({
    ...{ class: "config-title" },
});
(__VLS_ctx.t("keys.groupForm.paramOverrides"));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "config-items" },
});
const __VLS_167 = {}.NFormItem;
/** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.nFormItem, typeof __VLS_components.NFormItem, typeof __VLS_components.nFormItem, ]} */ ;
// @ts-ignore
const __VLS_168 = __VLS_asFunctionalComponent(__VLS_167, new __VLS_167({
    path: "param_overrides",
}));
const __VLS_169 = __VLS_168({
    path: "param_overrides",
}, ...__VLS_functionalComponentArgsRest(__VLS_168));
__VLS_170.slots.default;
const __VLS_171 = {}.NInput;
/** @type {[typeof __VLS_components.NInput, typeof __VLS_components.nInput, ]} */ ;
// @ts-ignore
const __VLS_172 = __VLS_asFunctionalComponent(__VLS_171, new __VLS_171({
    value: (__VLS_ctx.formData.param_overrides),
    type: "textarea",
    placeholder: (__VLS_ctx.t('keys.groupForm.paramOverridesPlaceholder')),
    rows: (4),
}));
const __VLS_173 = __VLS_172({
    value: (__VLS_ctx.formData.param_overrides),
    type: "textarea",
    placeholder: (__VLS_ctx.t('keys.groupForm.paramOverridesPlaceholder')),
    rows: (4),
}, ...__VLS_functionalComponentArgsRest(__VLS_172));
var __VLS_170;
var __VLS_126;
var __VLS_122;
var __VLS_28;
{
    const { footer: __VLS_thisSlot } = __VLS_12.slots;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    const __VLS_175 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_176 = __VLS_asFunctionalComponent(__VLS_175, new __VLS_175({
        ...{ 'onClick': {} },
    }));
    const __VLS_177 = __VLS_176({
        ...{ 'onClick': {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_176));
    let __VLS_179;
    let __VLS_180;
    let __VLS_181;
    const __VLS_182 = {
        onClick: (__VLS_ctx.handleClose)
    };
    __VLS_178.slots.default;
    (__VLS_ctx.t("keys.groupForm.cancel"));
    var __VLS_178;
    const __VLS_183 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_184 = __VLS_asFunctionalComponent(__VLS_183, new __VLS_183({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.loading),
    }));
    const __VLS_185 = __VLS_184({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.loading),
    }, ...__VLS_functionalComponentArgsRest(__VLS_184));
    let __VLS_187;
    let __VLS_188;
    let __VLS_189;
    const __VLS_190 = {
        onClick: (__VLS_ctx.handleSubmit)
    };
    __VLS_186.slots.default;
    (__VLS_ctx.group ? __VLS_ctx.t("keys.groupForm.update") : __VLS_ctx.t("keys.groupForm.create"));
    var __VLS_186;
}
var __VLS_12;
var __VLS_3;
/** @type {__VLS_StyleScopedClasses['group-form-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['form-section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['form-section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['form-label']} */ ;
/** @type {__VLS_StyleScopedClasses['form-section']} */ ;
/** @type {__VLS_StyleScopedClasses['config-section']} */ ;
/** @type {__VLS_StyleScopedClasses['config-title']} */ ;
/** @type {__VLS_StyleScopedClasses['config-items']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['config-item']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['config-section']} */ ;
/** @type {__VLS_StyleScopedClasses['config-title']} */ ;
/** @type {__VLS_StyleScopedClasses['config-items']} */ ;
// @ts-ignore
var __VLS_30 = __VLS_29;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            Add: Add,
            Close: Close,
            Remove: Remove,
            NButton: NButton,
            NCard: NCard,
            NCollapse: NCollapse,
            NCollapseItem: NCollapseItem,
            NForm: NForm,
            NFormItem: NFormItem,
            NInput: NInput,
            NInputNumber: NInputNumber,
            NModal: NModal,
            NSelect: NSelect,
            t: t,
            loading: loading,
            formRef: formRef,
            formData: formData,
            channelTypeOptions: channelTypeOptions,
            configOptions: configOptions,
            testModelPlaceholder: testModelPlaceholder,
            upstreamPlaceholder: upstreamPlaceholder,
            rules: rules,
            addUpstream: addUpstream,
            removeUpstream: removeUpstream,
            addConfigItem: addConfigItem,
            removeConfigItem: removeConfigItem,
            handleConfigKeyChange: handleConfigKeyChange,
            handleClose: handleClose,
            handleSubmit: handleSubmit,
        };
    },
    __typeEmits: {},
    __typeProps: {},
    props: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeEmits: {},
    __typeProps: {},
    props: {},
});
; /* PartiallyEnd: #4569/main.vue */
