import { type Ref } from "vue";
type IntializeFunc<T> = () => T | Ref<T>;
type InitializeValue<T> = T | Ref<T> | IntializeFunc<T>;
export declare function useState<T>(key: string, init?: InitializeValue<T>): Ref<T>;
export {};
