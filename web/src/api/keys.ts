import type {
  APIKey,
  Group,
  GroupConfigOption,
  GroupStatsResponse,
  KeyStatus,
  TaskInfo,
} from "@/types/models";
import http from "@/utils/http";

export const keysApi = {
  // Dobavlja sve grupe
  async getGroups(): Promise<Group[]> {
    const res = await http.get("/groups");
    return res.data || [];
  },

  // Kreira grupu
  async createGroup(group: Partial<Group>): Promise<Group> {
    const res = await http.post("/groups", group);
    return res.data;
  },

  // Ažurira grupu
  async updateGroup(groupId: number, group: Partial<Group>): Promise<Group> {
    const res = await http.put(`/groups/${groupId}`, group);
    return res.data;
  },

  // Briše grupu
  deleteGroup(groupId: number): Promise<void> {
    return http.delete(`/groups/${groupId}`);
  },

  // Dobavlja statistiku grupe
  async getGroupStats(groupId: number): Promise<GroupStatsResponse> {
    const res = await http.get(`/groups/${groupId}/stats`);
    return res.data;
  },

  // Dobavlja opcije konfiguracije grupe
  async getGroupConfigOptions(): Promise<GroupConfigOption[]> {
    const res = await http.get("/groups/config-options");
    return res.data || [];
  },

  // Dobavlja listu ključeva za grupu
  async getGroupKeys(params: {
    group_id: number;
    page: number;
    page_size: number;
    key?: string;
    status?: KeyStatus;
  }): Promise<{
    items: APIKey[];
    pagination: {
      total_items: number;
      total_pages: number;
    };
  }> {
    const res = await http.get("/keys", { params });
    return res.data;
  },

  // Masovno dodavanje ključeva - zastarelo
  async addMultipleKeys(
    group_id: number,
    keys_text: string
  ): Promise<{
    added_count: number;
    ignored_count: number;
    total_in_group: number;
  }> {
    const res = await http.post("/keys/add-multiple", {
      group_id,
      keys_text,
    });
    return res.data;
  },

  // Asinhrono masovno dodavanje ključeva
  async addKeysAsync(group_id: number, keys_text: string): Promise<TaskInfo> {
    const res = await http.post("/keys/add-async", {
      group_id,
      keys_text,
    });
    return res.data;
  },

  // Testira ključeve
  async testKeys(
    group_id: number,
    keys_text: string
  ): Promise<
    {
      key_value: string;
      is_valid: boolean;
      error: string;
    }[]
  > {
    const res = await http.post(
      "/keys/test-multiple",
      {
        group_id,
        keys_text,
      },
      {
        hideMessage: true,
      }
    );
    return res.data;
  },

  // Briše ključeve
  async deleteKeys(
    group_id: number,
    keys_text: string
  ): Promise<{ deleted_count: number; ignored_count: number; total_in_group: number }> {
    const res = await http.post("/keys/delete-multiple", {
      group_id,
      keys_text,
    });
    return res.data;
  },

  // Vraća ključeve
  restoreKeys(group_id: number, keys_text: string): Promise<null> {
    return http.post("/keys/restore-multiple", {
      group_id,
      keys_text,
    });
  },

  // Vraća sve nevažeće ključeve
  restoreAllInvalidKeys(group_id: number): Promise<void> {
    return http.post("/keys/restore-all-invalid", { group_id });
  },

  // Briše sve nevažeće ključeve
  clearAllInvalidKeys(group_id: number): Promise<{ data: { message: string } }> {
    return http.post(
      "/keys/clear-all-invalid",
      { group_id },
      {
        hideMessage: true,
      }
    );
  },

  // Izvozi ključeve
  exportKeys(groupId: number, status: "all" | "active" | "invalid" = "all") {
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
  async validateGroupKeys(groupId: number): Promise<{
    is_running: boolean;
    group_name: string;
    processed: number;
    total: number;
    started_at: string;
  }> {
    const res = await http.post("/keys/validate-group", { group_id: groupId });
    return res.data;
  },

  // Dobavlja status zadatka
  async getTaskStatus(): Promise<TaskInfo> {
    const res = await http.get("/tasks/status");
    return res.data;
  },
};
