import { apiClient } from './apiClient';

const toApiContext = (context) => ({
  current_state: context.currentState ?? '',
  target_vision: context.targetVision ?? '',
  business_objectives: context.businessObjectives ?? '',
  governance: context.governance ?? ''
});

const fromApiContext = (context) => ({
  currentState: context?.current_state ?? '',
  targetVision: context?.target_vision ?? '',
  businessObjectives: context?.business_objectives ?? '',
  governance: context?.governance ?? ''
});

const toApiProject = (project) => ({
  name: project.name ?? '',
  scope: project.scope ?? '',
  benefit: project.benefit ?? '',
  budget: Number(project.budget) || 0,
  value: Number(project.value) || 3,
  risk: Number(project.risk) || 3,
  cost: Number(project.cost) || 3,
  complexity: Number(project.complexity) || 3,
  phase: project.phase ?? 'year-1',
  owner: project.owner ?? '',
  kpi: project.kpi ?? ''
});

const fromApiProject = (project) => ({
  id: project.id,
  name: project.name ?? '',
  scope: project.scope ?? '',
  benefit: project.benefit ?? '',
  budget: Number(project.budget) || 0,
  value: Number(project.value) || 3,
  risk: Number(project.risk) || 3,
  cost: Number(project.cost) || 3,
  complexity: Number(project.complexity) || 3,
  phase: project.phase ?? 'year-1',
  owner: project.owner ?? '',
  kpi: project.kpi ?? ''
});

export async function getRoadmapContext() {
  const response = await apiClient.get('/strategic-roadmap/context');
  return fromApiContext(response.data);
}

export async function updateRoadmapContext(context) {
  const response = await apiClient.put('/strategic-roadmap/context', toApiContext(context));
  return fromApiContext(response.data);
}

export async function getRoadmapProjects() {
  const response = await apiClient.get('/strategic-roadmap/projects/');
  return response.data.map(fromApiProject);
}

export async function createRoadmapProject(project) {
  const response = await apiClient.post('/strategic-roadmap/projects/', toApiProject(project));
  return fromApiProject(response.data);
}

export async function updateRoadmapProject(id, project) {
  const response = await apiClient.put(`/strategic-roadmap/projects/${id}`, toApiProject(project));
  return fromApiProject(response.data);
}

export const deleteRoadmapProject = (id) => apiClient.delete(`/strategic-roadmap/projects/${id}`);
