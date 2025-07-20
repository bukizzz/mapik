import type { ChartData, DashboardStatsResponse, Group } from "@/types/models";
/**
 * Dobavlja osnovne statističke podatke za kontrolnu tablu.
 */
export declare const getDashboardStats: () => Promise<import("axios").AxiosResponse<DashboardStatsResponse, any>>;
/**
 * Dobavlja podatke grafikona za kontrolnu tablu.
 * @param groupId Opcioni ID grupe
 */
export declare const getDashboardChart: (groupId?: number) => Promise<import("axios").AxiosResponse<ChartData, any>>;
/**
 * Dobavlja listu grupa za filtriranje.
 */
export declare const getGroupList: () => Promise<import("axios").AxiosResponse<Group[], any>>;
