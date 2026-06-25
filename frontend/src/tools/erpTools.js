import { createElement } from 'react';
import BudgetArbitrageTool from './budgetArbitrage/BudgetArbitrageTool';
import RiskMatrixTool from './riskMatrix/RiskMatrixTool';
import StrategicRoadmapTool from './strategicRoadmap/StrategicRoadmapTool';
import KpiPilotageTool from './kpiPilotage/KpiPilotageTool';
import StructuredCourseTool from './courseBlocks/StructuredCourseTool';
import { courseToolConfigs } from './courseBlocks/courseToolConfigs';

const makeCourseTool = (config) => function CourseToolWrapper() {
  return createElement(StructuredCourseTool, { config });
};

export const erpTools = [
  {
    id: 'strategy-pilotage',
    title: courseToolConfigs['strategy-pilotage'].title,
    shortTitle: courseToolConfigs['strategy-pilotage'].shortTitle,
    description: courseToolConfigs['strategy-pilotage'].description,
    component: makeCourseTool(courseToolConfigs['strategy-pilotage'])
  },
  {
    id: 'si-cartography',
    title: courseToolConfigs['si-cartography'].title,
    shortTitle: courseToolConfigs['si-cartography'].shortTitle,
    description: courseToolConfigs['si-cartography'].description,
    component: makeCourseTool(courseToolConfigs['si-cartography'])
  },
  {
    id: 'si-diagnostic',
    title: courseToolConfigs['si-diagnostic'].title,
    shortTitle: courseToolConfigs['si-diagnostic'].shortTitle,
    description: courseToolConfigs['si-diagnostic'].description,
    component: makeCourseTool(courseToolConfigs['si-diagnostic'])
  },
  {
    id: 'si-governance',
    title: courseToolConfigs['si-governance'].title,
    shortTitle: courseToolConfigs['si-governance'].shortTitle,
    description: courseToolConfigs['si-governance'].description,
    component: makeCourseTool(courseToolConfigs['si-governance'])
  },
  {
    id: 'risk-matrix',
    title: 'Risk Matrix',
    shortTitle: 'Matrice de risque',
    description: 'Evaluation visuelle des risques par probabilite et impact.',
    component: RiskMatrixTool
  },
  {
    id: 'budget-arbitrage',
    title: 'Budget & Arbitrage',
    shortTitle: 'Budget & Arbitrage',
    description: 'Budgetisation IT, TCO, ROI et arbitrage multicriteres.',
    component: BudgetArbitrageTool
  },
  {
    id: 'strategic-roadmap',
    title: 'Schema directeur & Roadmap',
    shortTitle: 'Schema directeur',
    description: 'Vision cible, priorisation valeur / effort et trajectoire SI 3 ans.',
    component: StrategicRoadmapTool
  },
  {
    id: 'kpi-pilotage',
    title: 'KPI & Pilotage du SI',
    shortTitle: 'KPI & Pilotage',
    description: 'Dashboard DSI, SLA, MTTR, MTBF, disponibilite et plans d action.',
    component: KpiPilotageTool
  }
];
