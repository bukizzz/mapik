interface Props {
    show: boolean;
    groupId: number;
    groupName?: string;
}
declare const _default: import("vue").DefineComponent<Props, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {} & {
    success: () => any;
    "update:show": (value: boolean) => any;
}, string, import("vue").PublicProps, Readonly<Props> & Readonly<{
    onSuccess?: (() => any) | undefined;
    "onUpdate:show"?: ((value: boolean) => any) | undefined;
}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, false, {}, any>;
export default _default;
