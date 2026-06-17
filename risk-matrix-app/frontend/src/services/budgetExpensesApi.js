import { apiClient } from './apiClient';

export const getBudgetExpenses = () => apiClient.get('/budget-expenses/');

export const createBudgetExpense = (expense) => apiClient.post('/budget-expenses/', expense);

export const updateBudgetExpense = (id, expense) => apiClient.put(`/budget-expenses/${id}`, expense);

export const deleteBudgetExpense = (id) => apiClient.delete(`/budget-expenses/${id}`);
