import { apiClient } from './apiClient';

export const getBudgetProjects = () => apiClient.get('/budget-projects/');

export const createBudgetProject = (project) => apiClient.post('/budget-projects/', project);

export const updateBudgetProject = (id, project) => apiClient.put(`/budget-projects/${id}`, project);

export const deleteBudgetProject = (id) => apiClient.delete(`/budget-projects/${id}`);
