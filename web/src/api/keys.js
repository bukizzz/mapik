import http from "@/utils/http";
export const keysApi = {
    // Dobavlja sve grupe
    async getGroups() {
        const res = await http.get("/groups");
        return res.data || [];
    },
    // Kreira grupu
    async createGroup(group) {
        const res = await http.post("/groups", group);
        return res.data;
    },
    // Ažurira grupu
    async updateGroup(groupId, group) {
        const res = await http.put(`/groups/${groupId}`, group);
        return res.data;
    },
    // Briše grupu
    deleteGroup(groupId) {
        return http.delete(`/groups/${groupId}`);
    },
    // Dobavlja statistiku grupe
    async getGroupStats(groupId) {
        const res = await http.get(`/groups/${groupId}/stats`);
        return res.data;
    },
    // Dobavlja opcije konfiguracije grupe
    async getGroupConfigOptions() {
        const res = await http.get("/groups/config-options");
        return res.data || [];
    },
    // Dobavlja listu ključeva za grupu
    async getGroupKeys(params) {
        const res = await http.get("/keys", { params });
        return res.data;
    },
    // Masovno dodavanje ključeva - zastarelo
    async addMultipleKeys(group_id, keys_text) {
        const res = await http.post("/keys/add-multiple", {
            group_id,
            keys_text,
        });
        return res.data;
    },
    // Asinhrono masovno dodavanje ključeva
    async addKeysAsync(group_id, keys_text) {
        const res = await http.post("/keys/add-async", {
            group_id,
            keys_text,
        });
        return res.data;
    },
    // Testira ključeve
    async testKeys(group_id, keys_text) {
        const res = await http.post("/keys/test-multiple", {
            group_id,
            keys_text,
        }, {
            hideMessage: true,
        });
        return res.data;
    },
    // Briše ključeve
    async deleteKeys(group_id, keys_text) {
        const res = await http.post("/keys/delete-multiple", {
            group_id,
            keys_text,
        });
        return res.data;
    },
    // Vraća ključeve
    restoreKeys(group_id, keys_text) {
        return http.post("/keys/restore-multiple", {
            group_id,
            keys_text,
        });
    },
    // Vraća sve nevažeće ključeve
    restoreAllInvalidKeys(group_id) {
        return http.post("/keys/restore-all-invalid", { group_id });
    },
    // Briše sve nevažeće ključeve
    clearAllInvalidKeys(group_id) {
        return http.post("/keys/clear-all-invalid", { group_id }, {
            hideMessage: true,
        });
    },
    // Izvozi ključeve
    exportKeys(groupId, status = "all") {
        const authKey = localStorage.getItem("authKey");
        if (!authKey) {
            window.$message.error("Nije pronađena informacija o autentifikaciji, ne može se izvesti.");
            return;
        }
        const params = new URLSearchParams({
            group_id: groupId.toString(),
            auth_key: authKey,
        });
        if (status !== "all") {
            params.append("status", status);
        }
        const url = `${http.defaults.baseURL}/keys/export?${params.toString()}`;
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `keys-group_${groupId}-${status}-${Date.now()}.txt`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },
    // Validira ključeve grupe
    async validateGroupKeys(groupId) {
        const res = await http.post("/keys/validate-group", { group_id: groupId });
        return res.data;
    },
    // Dobavlja status zadatka
    async getTaskStatus() {
        const res = await http.get("/tasks/status");
        return res.data;
    },
};
