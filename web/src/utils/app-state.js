import { reactive } from "vue";
export const appState = reactive({
    loading: false,
    taskPollingTrigger: 0,
});
