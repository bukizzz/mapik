export interface Setting {
    key: string;
    name: string;
    value: string | number;
    type: "int" | "string";
    min_value?: number;
    description: string;
}
export interface SettingCategory {
    category_name: string;
    settings: Setting[];
}
export type SettingsUpdatePayload = Record<string, string | number>;
export declare const settingsApi: {
    getSettings(): Promise<SettingCategory[]>;
    updateSettings(data: SettingsUpdatePayload): Promise<void>;
    getChannelTypes(): Promise<string[]>;
};
