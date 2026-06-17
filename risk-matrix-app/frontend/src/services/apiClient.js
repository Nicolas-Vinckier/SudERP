import axios from 'axios';

const DEFAULT_API_BASE_URL = '/api';
const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;
const normalizedApiBaseUrl = rawApiBaseUrl.replace(/\/$/, '');

export const apiClient = axios.create({
  baseURL: normalizedApiBaseUrl
});
