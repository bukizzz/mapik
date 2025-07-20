import http from "@/utils/http";
/**
 * Dobavlja osnovne statističke podatke za kontrolnu tablu.
 */
export const getDashboardStats = () => {
    return http.get("/dashboard/stats");
};
/**
 * Dobavlja podatke grafikona za kontrolnu tablu.
 * @param groupId Opcioni ID grupe
 */
export const getDashboardChart = (groupId) => {
    return http.get("/dashboard/chart", {
        params: groupId ? { groupId } : {},
    });
};
/**
 * Dobavlja listu grupa za filtriranje.
 */
export const getGroupList = () => {
    return http.get("/groups/list");
};
