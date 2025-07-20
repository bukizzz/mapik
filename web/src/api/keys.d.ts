import type { APIKey, Group, GroupConfigOption, GroupStatsResponse, KeyStatus, TaskInfo } from "@/types/models";
export declare const keysApi: {
    getGroups(): Promise<Group[]>;
    createGroup(group: Partial<Group>): Promise<Group>;
    updateGroup(groupId: number, group: Partial<Group>): Promise<Group>;
    deleteGroup(groupId: number): Promise<void>;
    getGroupStats(groupId: number): Promise<GroupStatsResponse>;
    getGroupConfigOptions(): Promise<GroupConfigOption[]>;
    getGroupKeys(params: {
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
    }>;
    addMultipleKeys(group_id: number, keys_text: string): Promise<{
        added_count: number;
        ignored_count: number;
        total_in_group: number;
    }>;
    addKeysAsync(group_id: number, keys_text: string): Promise<TaskInfo>;
    testKeys(group_id: number, keys_text: string): Promise<{
        key_value: string;
        is_valid: boolean;
        error: string;
    }[]>;
    deleteKeys(group_id: number, keys_text: string): Promise<{
        deleted_count: number;
        ignored_count: number;
        total_in_group: number;
    }>;
    restoreKeys(group_id: number, keys_text: string): Promise<null>;
    restoreAllInvalidKeys(group_id: number): Promise<void>;
    clearAllInvalidKeys(group_id: number): Promise<{
        data: {
            message: string;
        };
    }>;
    exportKeys(groupId: number, status?: "all" | "active" | "invalid"): void;
    validateGroupKeys(groupId: number): Promise<{
        is_running: boolean;
        group_name: string;
        processed: number;
        total: number;
        started_at: string;
    }>;
    getTaskStatus(): Promise<TaskInfo>;
};
