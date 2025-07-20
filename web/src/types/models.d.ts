export interface ApiResponse<T> {
    code: number;
    message: string;
    data: T;
}
export type KeyStatus = "active" | "invalid" | undefined;
export interface APIKey {
    id: number;
    group_id: number;
    key_value: string;
    status: KeyStatus;
    request_count: number;
    failure_count: number;
    last_used_at?: string;
    created_at: string;
    updated_at: string;
}
export type Key = APIKey;
export interface UpstreamInfo {
    url: string;
    weight: number;
}
export interface Group {
    id?: number;
    name: string;
    display_name: string;
    description: string;
    sort: number;
    test_model: string;
    channel_type: "openai" | "gemini" | "anthropic";
    upstreams: UpstreamInfo[];
    config: Record<string, unknown>;
    api_keys?: APIKey[];
    endpoint?: string;
    param_overrides: Record<string, unknown>;
    created_at?: string;
    updated_at?: string;
}
export interface GroupConfigOption {
    key: string;
    name: string;
    description: string;
    default_value: number;
}
export interface GroupStatsResponse {
    key_stats: KeyStats;
    hourly_stats: RequestStats;
    daily_stats: RequestStats;
    weekly_stats: RequestStats;
}
export interface KeyStats {
    total_keys: number;
    active_keys: number;
    invalid_keys: number;
}
export interface RequestStats {
    total_requests: number;
    failed_requests: number;
    failure_rate: number;
}
export type TaskType = "KEY_VALIDATION" | "KEY_IMPORT";
export interface KeyValidationResult {
    invalid_keys: number;
    total_keys: number;
    valid_keys: number;
}
export interface KeyImportResult {
    added_count: number;
    ignored_count: number;
}
export interface TaskInfo {
    task_type: TaskType;
    is_running: boolean;
    group_name?: string;
    processed?: number;
    total?: number;
    started_at?: string;
    finished_at?: string;
    result?: KeyValidationResult | KeyImportResult;
    error?: string;
}
export interface RequestLog {
    id: string;
    timestamp: string;
    group_id: number;
    key_id: number;
    is_success: boolean;
    source_ip: string;
    status_code: number;
    request_path: string;
    duration_ms: number;
    error_message: string;
    user_agent: string;
    retries: number;
    group_name?: string;
    key_value?: string;
    upstream_addr: string;
    is_stream: boolean;
}
export interface Pagination {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
}
export interface LogsResponse {
    items: RequestLog[];
    pagination: Pagination;
}
export interface LogFilter {
    page?: number;
    page_size?: number;
    group_name?: string;
    key_value?: string;
    is_success?: boolean | null;
    status_code?: number | null;
    source_ip?: string;
    error_contains?: string;
    start_time?: string | null;
    end_time?: string | null;
}
export interface DashboardStats {
    total_requests: number;
    success_requests: number;
    success_rate: number;
    group_stats: GroupRequestStat[];
}
export interface GroupRequestStat {
    display_name: string;
    request_count: number;
}
export interface StatCard {
    value: number;
    sub_value?: number;
    sub_value_tip?: string;
    trend: number;
    trend_is_growth: boolean;
}
export interface DashboardStatsResponse {
    key_count: StatCard;
    group_count: StatCard;
    request_count: StatCard;
    error_rate: StatCard;
}
export interface ChartDataset {
    label: string;
    data: number[];
    color: string;
}
export interface ChartData {
    labels: string[];
    datasets: ChartDataset[];
}
