import type { Group } from "@/types/models";
interface Props {
    show: boolean;
    group?: Group | null;
}
declare const _default: import("vue").DefineComponent<Props, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {} & {
    success: (value: Group) => any;
    "update:show": (value: boolean) => any;
}, string, import("vue").PublicProps, Readonly<Props> & Readonly<{
    onSuccess?: ((value: Group) => any) | undefined;
    "onUpdate:show"?: ((value: boolean) => any) | undefined;
}>, {
    group: Group | null;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, false, {}, any>;
export default _default;
