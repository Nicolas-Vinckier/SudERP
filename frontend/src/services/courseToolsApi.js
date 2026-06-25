import { apiClient } from './apiClient';

export async function getCourseTool(toolId) {
  const response = await apiClient.get(`/course-tools/${toolId}`);
  return response.data;
}

export async function updateCourseToolContext(toolId, context) {
  const response = await apiClient.put(`/course-tools/${toolId}/context`, { context });
  return response.data;
}

export async function createCourseToolItem(toolId, collectionName, data) {
  const response = await apiClient.post(`/course-tools/${toolId}/items/${collectionName}`, { data });
  return response.data;
}

export async function updateCourseToolItem(toolId, collectionName, itemId, data) {
  const response = await apiClient.put(`/course-tools/${toolId}/items/${collectionName}/${itemId}`, { data });
  return response.data;
}

export async function deleteCourseToolItem(toolId, collectionName, itemId) {
  return apiClient.delete(`/course-tools/${toolId}/items/${collectionName}/${itemId}`);
}
