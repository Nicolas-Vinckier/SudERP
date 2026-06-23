import BudgetArbitrageTool from './budgetArbitrage/BudgetArbitrageTool';
import RiskMatrixTool from './riskMatrix/RiskMatrixTool';
import StrategicRoadmapTool from './strategicRoadmap/StrategicRoadmapTool';

export const erpTools = [
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
  }
];
