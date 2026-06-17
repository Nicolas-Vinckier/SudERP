import BudgetArbitrageTool from './budgetArbitrage/BudgetArbitrageTool';
import RiskMatrixTool from './riskMatrix/RiskMatrixTool';

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
  }
];
