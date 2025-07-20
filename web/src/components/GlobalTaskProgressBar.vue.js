import { keysApi } from "@/api/keys";
import { appState } from "@/utils/app-state";
import { NButton, NCard, NProgress, NText, useMessage } from "naive-ui";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
const taskInfo = ref({ is_running: false, task_type: "KEY_VALIDATION" });
const visible = ref(false);
let pollTimer = null;
let isPolling = false; // Dodata zastavica
const message = useMessage();
onMounted(() => {
    startPolling();
});
watch(() => appState.taskPollingTrigger, () => {
    startPolling();
});
onBeforeUnmount(() => {
    stopPolling();
});
function startPolling() {
    stopPolling();
    isPolling = true;
    pollOnce();
}
async function pollOnce() {
    if (!isPolling) {
        return;
    }
    try {
        const task = await keysApi.getTaskStatus();
        taskInfo.value = task;
        visible.value = task.is_running;
        if (!task.is_running) {
            stopPolling();
            if (task.result) {
                const lastTask = localStorage.getItem("last_closed_task");
                if (lastTask !== task.finished_at) {
                    let msg = "Task completed.";
                    if (task.task_type === "KEY_VALIDATION") {
                        const result = task.result;
                        msg = `Key validation completed, processed ${result.total_keys} keys, ${result.valid_keys} valid, ${result.invalid_keys} invalid.`;
                    }
                    else if (task.task_type === "KEY_IMPORT") {
                        const result = task.result;
                        msg = `Key import completed, successfully added ${result.added_count} keys, ignored ${result.ignored_count}.`;
                    }
                    message.info(msg, {
                        closable: true,
                        duration: 0,
                        onClose: () => {
                            localStorage.setItem("last_closed_task", task.finished_at || "");
                        },
                    });
                }
            }
            return;
        }
    }
    catch (_error) {
        // Greška je zabeležena
    }
    // Ako je i dalje u stanju prozivanja, pokreni sledeći zahtev nakon 1 sekunde
    if (isPolling) {
        pollTimer = setTimeout(pollOnce, 1000);
    }
}
function stopPolling() {
    isPolling = false;
    if (pollTimer) {
        clearTimeout(pollTimer);
        pollTimer = null;
    }
}
function getProgressPercentage() {
    if (!taskInfo.value.total || taskInfo.value.total === 0) {
        return 0;
    }
    return Math.round(((taskInfo.value.processed || 0) / taskInfo.value.total) * 100);
}
function getProgressText() {
    const { processed = 0, total = 0 } = taskInfo.value;
    return `${processed}/${total}`;
}
function handleClose() {
    visible.value = false;
}
function getTaskTitle() {
    if (!taskInfo.value) {
        return "Processing task...";
    }
    switch (taskInfo.value.task_type) {
        case "KEY_VALIDATION":
            return `Validating keys for group [${taskInfo.value.group_name}]`;
        case "KEY_IMPORT":
            return `Importing keys to group [${taskInfo.value.group_name}]`;
        default:
            return "Processing task...";
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
if (__VLS_ctx.visible) {
    const __VLS_0 = {}.NCard;
    /** @type {[typeof __VLS_components.NCard, typeof __VLS_components.nCard, typeof __VLS_components.NCard, typeof __VLS_components.nCard, ]} */ ;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
        ...{ class: "global-task-progress" },
        bordered: (false),
        size: "small",
    }));
    const __VLS_2 = __VLS_1({
        ...{ class: "global-task-progress" },
        bordered: (false),
        size: "small",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    var __VLS_4 = {};
    __VLS_3.slots.default;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "progress-container" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "progress-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "progress-info" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "progress-icon" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "progress-details" },
    });
    const __VLS_5 = {}.NText;
    /** @type {[typeof __VLS_components.NText, typeof __VLS_components.nText, typeof __VLS_components.NText, typeof __VLS_components.nText, ]} */ ;
    // @ts-ignore
    const __VLS_6 = __VLS_asFunctionalComponent(__VLS_5, new __VLS_5({
        strong: true,
        ...{ class: "progress-title" },
    }));
    const __VLS_7 = __VLS_6({
        strong: true,
        ...{ class: "progress-title" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_6));
    __VLS_8.slots.default;
    (__VLS_ctx.getTaskTitle());
    var __VLS_8;
    const __VLS_9 = {}.NText;
    /** @type {[typeof __VLS_components.NText, typeof __VLS_components.nText, typeof __VLS_components.NText, typeof __VLS_components.nText, ]} */ ;
    // @ts-ignore
    const __VLS_10 = __VLS_asFunctionalComponent(__VLS_9, new __VLS_9({
        depth: "3",
        ...{ class: "progress-subtitle" },
    }));
    const __VLS_11 = __VLS_10({
        depth: "3",
        ...{ class: "progress-subtitle" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_10));
    __VLS_12.slots.default;
    (__VLS_ctx.getProgressText());
    (__VLS_ctx.getProgressPercentage());
    var __VLS_12;
    const __VLS_13 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_14 = __VLS_asFunctionalComponent(__VLS_13, new __VLS_13({
        ...{ 'onClick': {} },
        quaternary: true,
        circle: true,
        size: "small",
        title: "Hide progress bar",
    }));
    const __VLS_15 = __VLS_14({
        ...{ 'onClick': {} },
        quaternary: true,
        circle: true,
        size: "small",
        title: "Hide progress bar",
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
        __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
            width: "14",
            height: "14",
            viewBox: "0 0 24 24",
            fill: "currentColor",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
            d: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
        });
    }
    var __VLS_16;
    const __VLS_21 = {}.NProgress;
    /** @type {[typeof __VLS_components.NProgress, typeof __VLS_components.nProgress, ]} */ ;
    // @ts-ignore
    const __VLS_22 = __VLS_asFunctionalComponent(__VLS_21, new __VLS_21({
        percentage: (__VLS_ctx.getProgressPercentage()),
        showIndicator: (false),
        processing: true,
        type: "line",
        height: (6),
        borderRadius: "3px",
        ...{ class: "progress-bar" },
    }));
    const __VLS_23 = __VLS_22({
        percentage: (__VLS_ctx.getProgressPercentage()),
        showIndicator: (false),
        processing: true,
        type: "line",
        height: (6),
        borderRadius: "3px",
        ...{ class: "progress-bar" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_22));
    var __VLS_3;
}
/** @type {__VLS_StyleScopedClasses['global-task-progress']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-container']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-header']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-info']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-details']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-title']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-bar']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            NButton: NButton,
            NCard: NCard,
            NProgress: NProgress,
            NText: NText,
            visible: visible,
            getProgressPercentage: getProgressPercentage,
            getProgressText: getProgressText,
            handleClose: handleClose,
            getTaskTitle: getTaskTitle,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
