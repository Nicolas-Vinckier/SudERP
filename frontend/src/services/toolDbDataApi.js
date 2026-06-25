import { apiClient } from './apiClient';

export const getToolDbData = (toolId) => apiClient.get(`/tools/${toolId}/db-data`);

export const importToolDbData = (toolId, data, replaceExisting = true) => apiClient.post(
  `/tools/${toolId}/db-data/import`,
  {
    replace_existing: replaceExisting,
    data
  }
);
