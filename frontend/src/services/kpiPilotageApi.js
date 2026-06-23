import { apiClient } from './apiClient';

const toApiKpi = (kpi) => ({
  name: kpi.name ?? '',
  family: kpi.family ?? 'technical',
  service: kpi.service ?? '',
  objective: kpi.objective ?? '',
  description: kpi.description ?? '',
  owner: kpi.owner ?? '',
  source: kpi.source ?? '',
  frequency: kpi.frequency ?? 'Mensuelle',
  unit: kpi.unit ?? '%',
  comparator: kpi.comparator ?? 'gte',
  target_value: Number(kpi.targetValue) || 0,
  observed_value: Number(kpi.observedValue) || 0,
  period: kpi.period ?? '',
  trend: kpi.trend ?? 'stable',
  formula_type: kpi.formulaType ?? 'manual',
  formula_inputs: kpi.formulaInputs ?? {},
  is_sla: Boolean(kpi.isSla),
  sla_target: Number(kpi.slaTarget) || 0,
  criticality: kpi.criticality ?? 'Moyenne',
  action_plan: kpi.actionPlan ?? '',
  display_order: Number(kpi.displayOrder) || 0
});

const fromApiKpi = (kpi) => ({
  id: kpi.id,
  name: kpi.name ?? '',
  family: kpi.family ?? 'technical',
  service: kpi.service ?? '',
  objective: kpi.objective ?? '',
  description: kpi.description ?? '',
  owner: kpi.owner ?? '',
  source: kpi.source ?? '',
  frequency: kpi.frequency ?? 'Mensuelle',
  unit: kpi.unit ?? '%',
  comparator: kpi.comparator ?? 'gte',
  targetValue: Number(kpi.target_value) || 0,
  observedValue: Number(kpi.observed_value) || 0,
  period: kpi.period ?? '',
  trend: kpi.trend ?? 'stable',
  formulaType: kpi.formula_type ?? 'manual',
  formulaInputs: kpi.formula_inputs ?? {},
  isSla: Boolean(kpi.is_sla),
  slaTarget: Number(kpi.sla_target) || 0,
  criticality: kpi.criticality ?? 'Moyenne',
  actionPlan: kpi.action_plan ?? '',
  displayOrder: Number(kpi.display_order) || 0
});

export async function getKpis() {
  const response = await apiClient.get('/kpi-indicators/');
  return response.data.map(fromApiKpi);
}

export async function createKpi(kpi) {
  const response = await apiClient.post('/kpi-indicators/', toApiKpi(kpi));
  return fromApiKpi(response.data);
}

export async function updateKpi(id, kpi) {
  const response = await apiClient.put(`/kpi-indicators/${id}`, toApiKpi(kpi));
  return fromApiKpi(response.data);
}

export const deleteKpi = (id) => apiClient.delete(`/kpi-indicators/${id}`);
