import { RISK_LEVELS } from '../utils/riskMatrix';

export default function RiskSummary({ totalRisks, riskCountByLevel }) {
  return (
    <div className="risk-summary" aria-label="Risk distribution by level">
      <span><strong>{totalRisks}</strong> total risks</span>
      <span className="summary-low"><strong>{riskCountByLevel[RISK_LEVELS.LOW]}</strong> low</span>
      <span className="summary-medium"><strong>{riskCountByLevel[RISK_LEVELS.MEDIUM]}</strong> medium</span>
      <span className="summary-high"><strong>{riskCountByLevel[RISK_LEVELS.HIGH]}</strong> high</span>
    </div>
  );
}
