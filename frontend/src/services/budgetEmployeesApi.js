import { apiClient } from './apiClient';

export const getBudgetEmployees = () => apiClient.get('/budget-employees/');

export const createBudgetEmployee = (employee) => apiClient.post('/budget-employees/', employee);

export const updateBudgetEmployee = (id, employee) => apiClient.put(`/budget-employees/${id}`, employee);

export const deleteBudgetEmployee = (id) => apiClient.delete(`/budget-employees/${id}`);
