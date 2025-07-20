import type { ApiResponse, Group, LogFilter, LogsResponse } from "@/types/models";
export declare const logApi: {
    getLogs: (params: LogFilter) => Promise<ApiResponse<LogsResponse>>;
    getGroups: () => Promise<ApiResponse<Group[]>>;
    exportLogs: (params: Omit<LogFilter, "page" | "page_size">) => void;
};
