import type { Group } from "@/types/models";
interface Props {
    group: Group | null;
}
declare const _default: import("vue").DefineComponent<Props, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {} & {
    delete: (value: Group) => any;
    refresh: (value: Group) => any;
}, string, import("vue").PublicProps, Readonly<Props> & Readonly<{
    onDelete?: ((value: Group) => any) | undefined;
    onRefresh?: ((value: Group) => any) | undefined;
}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, false, {}, any>;
export default _default;
