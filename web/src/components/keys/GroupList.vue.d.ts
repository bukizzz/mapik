import type { Group } from "@/types/models";
interface Props {
    groups: Group[];
    selectedGroup: Group | null;
    loading?: boolean;
}
declare const _default: import("vue").DefineComponent<Props, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {} & {
    refresh: () => any;
    "group-select": (group: Group) => any;
}, string, import("vue").PublicProps, Readonly<Props> & Readonly<{
    onRefresh?: (() => any) | undefined;
    "onGroup-select"?: ((group: Group) => any) | undefined;
}>, {
    loading: boolean;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, false, {}, any>;
export default _default;
