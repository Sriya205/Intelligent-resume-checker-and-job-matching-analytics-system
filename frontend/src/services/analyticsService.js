import API from "./api";

// Get dashboard stats
export const getDashboardStats = async () => {
    const response = await API.get("/analytics/dashboard");
    return response.data;
};

// Get reports
export const getReports = async () => {
    const response = await API.get("/analytics/reports");
    return response.data;
};