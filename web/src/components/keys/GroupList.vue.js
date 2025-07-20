import { getGroupDisplayName } from "@/utils/display";
import { Add, Search } from "@vicons/ionicons5";
import { NButton, NCard, NEmpty, NInput, NSpin, NTag } from "naive-ui";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import GroupFormModal from "./GroupFormModal.vue";
const props = withDefaults(defineProps(), {
    loading: false,
});
const emit = defineEmits();
const { t } = useI18n();
const searchText = ref("");
const showGroupModal = ref(false);
// Izračunata svojina za filtriranu listu grupa na osnovu teksta pretrage.
const filteredGroups = computed(() => {
    if (!searchText.value) {
        return props.groups;
    }
    const search = searchText.value.toLowerCase();
    return props.groups.filter(group => group.name.toLowerCase().includes(search) ||
        (group.display_name && group.display_name.toLowerCase().includes(search)));
});
function handleGroupClick(group) {
    emit("group-select", group);
}
// Određuje tip oznake (boju) na osnovu tipa kanala.
function getChannelTagType(channelType) {
    switch (channelType) {
        case "openai":
            return "success";
        case "gemini":
            return "info";
        case "anthropic":
            return "warning";
        default:
            return "default";
    }
}
function openCreateGroupModal() {
    showGroupModal.value = true;
}
function handleGroupCreated() {
    showGroupModal.value = false;
    emit("refresh");
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_withDefaultsArg = (function (t) { return t; })({
    loading: false,
});
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['group-list-card']} */ ;
/** @type {__VLS_StyleScopedClasses['groups-section']} */ ;
/** @type {__VLS_StyleScopedClasses['group-item']} */ ;
/** @type {__VLS_StyleScopedClasses['group-item']} */ ;
/** @type {__VLS_StyleScopedClasses['group-item']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['group-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['group-item']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['group-id']} */ ;
/** @type {__VLS_StyleScopedClasses['groups-list']} */ ;
/** @type {__VLS_StyleScopedClasses['groups-list']} */ ;
/** @type {__VLS_StyleScopedClasses['groups-list']} */ ;
/** @type {__VLS_StyleScopedClasses['groups-list']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "group-list-container" },
});
const __VLS_0 = {}.NCard;
/** @type {[typeof __VLS_components.NCard, typeof __VLS_components.nCard, typeof __VLS_components.NCard, typeof __VLS_components.nCard, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ class: "group-list-card modern-card" },
    bordered: (false),
    size: "small",
}));
const __VLS_2 = __VLS_1({
    ...{ class: "group-list-card modern-card" },
    bordered: (false),
    size: "small",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_3.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "search-section" },
});
const __VLS_4 = {}.NInput;
/** @type {[typeof __VLS_components.NInput, typeof __VLS_components.nInput, typeof __VLS_components.NInput, typeof __VLS_components.nInput, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
    value: (__VLS_ctx.searchText),
    placeholder: (__VLS_ctx.t('keys.groupList.searchPlaceholder')),
    size: "small",
    clearable: true,
}));
const __VLS_6 = __VLS_5({
    value: (__VLS_ctx.searchText),
    placeholder: (__VLS_ctx.t('keys.groupList.searchPlaceholder')),
    size: "small",
    clearable: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_5));
__VLS_7.slots.default;
{
    const { prefix: __VLS_thisSlot } = __VLS_7.slots;
    const __VLS_8 = {}.NIcon;
    /** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.nIcon, ]} */ ;
    // @ts-ignore
    const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
        component: (__VLS_ctx.Search),
    }));
    const __VLS_10 = __VLS_9({
        component: (__VLS_ctx.Search),
    }, ...__VLS_functionalComponentArgsRest(__VLS_9));
}
var __VLS_7;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "groups-section" },
});
const __VLS_12 = {}.NSpin;
/** @type {[typeof __VLS_components.NSpin, typeof __VLS_components.nSpin, typeof __VLS_components.NSpin, typeof __VLS_components.nSpin, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    show: (__VLS_ctx.loading),
    size: "small",
}));
const __VLS_14 = __VLS_13({
    show: (__VLS_ctx.loading),
    size: "small",
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
__VLS_15.slots.default;
if (__VLS_ctx.filteredGroups.length === 0 && !__VLS_ctx.loading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "empty-container" },
    });
    const __VLS_16 = {}.NEmpty;
    /** @type {[typeof __VLS_components.NEmpty, typeof __VLS_components.nEmpty, ]} */ ;
    // @ts-ignore
    const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
        size: "small",
        description: (__VLS_ctx.searchText ? __VLS_ctx.t('keys.groupList.noResults') : __VLS_ctx.t('keys.groupList.noGroups')),
    }));
    const __VLS_18 = __VLS_17({
        size: "small",
        description: (__VLS_ctx.searchText ? __VLS_ctx.t('keys.groupList.noResults') : __VLS_ctx.t('keys.groupList.noGroups')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_17));
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "groups-list" },
    });
    for (const [group] of __VLS_getVForSourceType((__VLS_ctx.filteredGroups))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.filteredGroups.length === 0 && !__VLS_ctx.loading))
                        return;
                    __VLS_ctx.handleGroupClick(group);
                } },
            key: (group.id),
            ...{ class: "group-item" },
            ...{ class: ({ active: __VLS_ctx.selectedGroup?.id === group.id }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "group-icon" },
        });
        if (group.channel_type === 'openai') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        }
        else if (group.channel_type === 'gemini') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        }
        else if (group.channel_type === 'anthropic') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        }
        else {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "group-content" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "group-name" },
        });
        (__VLS_ctx.getGroupDisplayName(group));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "group-meta" },
        });
        const __VLS_20 = {}.NTag;
        /** @type {[typeof __VLS_components.NTag, typeof __VLS_components.nTag, typeof __VLS_components.NTag, typeof __VLS_components.nTag, ]} */ ;
        // @ts-ignore
        const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
            size: "tiny",
            type: (__VLS_ctx.getChannelTagType(group.channel_type)),
        }));
        const __VLS_22 = __VLS_21({
            size: "tiny",
            type: (__VLS_ctx.getChannelTagType(group.channel_type)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_21));
        __VLS_23.slots.default;
        (group.channel_type);
        var __VLS_23;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "group-id" },
        });
        (group.name);
    }
}
var __VLS_15;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "add-section" },
});
const __VLS_24 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
    ...{ 'onClick': {} },
    type: "primary",
    size: "small",
    block: true,
}));
const __VLS_26 = __VLS_25({
    ...{ 'onClick': {} },
    type: "primary",
    size: "small",
    block: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
let __VLS_28;
let __VLS_29;
let __VLS_30;
const __VLS_31 = {
    onClick: (__VLS_ctx.openCreateGroupModal)
};
__VLS_27.slots.default;
{
    const { icon: __VLS_thisSlot } = __VLS_27.slots;
    const __VLS_32 = {}.NIcon;
    /** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.nIcon, ]} */ ;
    // @ts-ignore
    const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
        component: (__VLS_ctx.Add),
    }));
    const __VLS_34 = __VLS_33({
        component: (__VLS_ctx.Add),
    }, ...__VLS_functionalComponentArgsRest(__VLS_33));
}
(__VLS_ctx.t("keys.groupList.createGroup"));
var __VLS_27;
var __VLS_3;
/** @type {[typeof GroupFormModal, ]} */ ;
// @ts-ignore
const __VLS_36 = __VLS_asFunctionalComponent(GroupFormModal, new GroupFormModal({
    ...{ 'onSuccess': {} },
    show: (__VLS_ctx.showGroupModal),
}));
const __VLS_37 = __VLS_36({
    ...{ 'onSuccess': {} },
    show: (__VLS_ctx.showGroupModal),
}, ...__VLS_functionalComponentArgsRest(__VLS_36));
let __VLS_39;
let __VLS_40;
let __VLS_41;
const __VLS_42 = {
    onSuccess: (__VLS_ctx.handleGroupCreated)
};
var __VLS_38;
/** @type {__VLS_StyleScopedClasses['group-list-container']} */ ;
/** @type {__VLS_StyleScopedClasses['group-list-card']} */ ;
/** @type {__VLS_StyleScopedClasses['modern-card']} */ ;
/** @type {__VLS_StyleScopedClasses['search-section']} */ ;
/** @type {__VLS_StyleScopedClasses['groups-section']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-container']} */ ;
/** @type {__VLS_StyleScopedClasses['groups-list']} */ ;
/** @type {__VLS_StyleScopedClasses['group-item']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['group-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['group-content']} */ ;
/** @type {__VLS_StyleScopedClasses['group-name']} */ ;
/** @type {__VLS_StyleScopedClasses['group-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['group-id']} */ ;
/** @type {__VLS_StyleScopedClasses['add-section']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            getGroupDisplayName: getGroupDisplayName,
            Add: Add,
            Search: Search,
            NButton: NButton,
            NCard: NCard,
            NEmpty: NEmpty,
            NInput: NInput,
            NSpin: NSpin,
            NTag: NTag,
            GroupFormModal: GroupFormModal,
            t: t,
            searchText: searchText,
            showGroupModal: showGroupModal,
            filteredGroups: filteredGroups,
            handleGroupClick: handleGroupClick,
            getChannelTagType: getChannelTagType,
            openCreateGroupModal: openCreateGroupModal,
            handleGroupCreated: handleGroupCreated,
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
