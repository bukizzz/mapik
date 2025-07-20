import http from "@/utils/http";
export const settingsApi = {
    // Dobavlja sve postavke
    async getSettings() {
        const response = await http.get("/settings");
        return response.data || [];
    },
    // Ažurira postavke
    updateSettings(data) {
        return http.put("/settings", data);
    },
    // Dobavlja tipove kanala
    async getChannelTypes() {
        const response = await http.get("/channel-types");
        return response.data || [];
    },
};
