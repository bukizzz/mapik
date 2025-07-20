import type { ApiResponse, Group, LogFilter, LogsResponse } from "@/types/models";
import http from "@/utils/http";

export const logApi = {
  // Dobavlja listu logova
  getLogs: (params: LogFilter): Promise<ApiResponse<LogsResponse>> => {
    return http.get("/logs", { params });
  },

  // Dobavlja listu grupa (za filtriranje)
  getGroups: (): Promise<ApiResponse<Group[]>> => {
    return http.get("/groups");
  },

  // Izvozi logove
  exportLogs: (params: Omit<LogFilter, "page" | "page_size">) => {
    const authKey = localStorage.getItem("authKey");
    if (!authKey) {
      window.$message.error("Nije pronađena informacija o autentifikaciji, ne može se izvesti.");
      return;
    }

    const queryParams = new URLSearchParams(
      Object.entries(params).reduce(
        (acc, [key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            acc[key] = String(value);
          }
          return acc;
        },
        {} as Record<string, string>
      )
    );
    queryParams.append("auth_key", authKey);

    const url = `${http.defaults.baseURL}/logs/export?${queryParams.toString()}`;

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `logs-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};
