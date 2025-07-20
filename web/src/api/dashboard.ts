import type { ChartData, DashboardStatsResponse, Group } from "@/types/models";
import http from "@/utils/http";

/**
 * Dobavlja osnovne statističke podatke za kontrolnu tablu.
 */
export const getDashboardStats = () => {
  return http.get<DashboardStatsResponse>("/dashboard/stats");
};

/**
 * Dobavlja podatke grafikona za kontrolnu tablu.
 * @param groupId Opcioni ID grupe
 */
export const getDashboardChart = (groupId?: number) => {
  return http.get<ChartData>("/dashboard/chart", {
    params: groupId ? { groupId } : {},
  });
};

/**
 * Dobavlja listu grupa za filtriranje.
 */
export const getGroupList = () => {
  return http.get<Group[]>("/groups/list");
};
