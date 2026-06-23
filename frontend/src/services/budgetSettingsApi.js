import { apiClient } from "./apiClient";

export const getBudgetSettings = async () => {
  const response = await apiClient.get("/settings/budget");
  return response.data;
};

export const updateBudgetSettings = async (settingsData) => {
  const response = await apiClient.put("/settings/budget", settingsData);
  return response.data;
};
