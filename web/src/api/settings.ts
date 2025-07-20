import http from "@/utils/http";

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

export const settingsApi = {
  // Dobavlja sve postavke
  async getSettings(): Promise<SettingCategory[]> {
    const response = await http.get("/settings");
    return response.data || [];
  },
  // Ažurira postavke
  updateSettings(data: SettingsUpdatePayload): Promise<void> {
    return http.put("/settings", data);
  },
  // Dobavlja tipove kanala
  async getChannelTypes(): Promise<string[]> {
    const response = await http.get("/channel-types");
    return response.data || [];
  },
};
