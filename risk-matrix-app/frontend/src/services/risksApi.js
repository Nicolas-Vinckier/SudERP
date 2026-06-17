import axios from 'axios';

const API_URL = 'http://localhost:8000/risks/';

export const deleteRisk = (id) => axios.delete(`${API_URL}${id}`);
