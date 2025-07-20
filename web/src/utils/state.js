import { isRef, reactive, toRef } from "vue";
const globalState = reactive({});
export function useState(key, init) {
    const state = toRef(globalState, key);
    if (state.value === undefined && init !== undefined) {
        const initialValue = init instanceof Function ? init() : init;
        if (isRef(initialValue)) {
            // vue will unwrap the ref for us
            globalState[key] = initialValue;
            return initialValue;
        }
        state.value = initialValue;
    }
    return state;
}
