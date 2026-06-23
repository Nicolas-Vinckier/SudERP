import { apiClient } from './apiClient';

export const getRisks = () => apiClient.get('/risks/');

export const createRisk = (risk) => apiClient.post('/risks/', risk);

export const deleteRisk = (id) => apiClient.delete(`/risks/${id}`);
