import { DECISION_LABELS, DECISIONS } from '../../utils/budgetArbitrage';

const decisionClassNames = {
  [DECISIONS.TO_ARBITRATE]: 'decision-neutral',
  [DECISIONS.FUND]: 'decision-fund',
  [DECISIONS.POSTPONE]: 'decision-postpone',
  [DECISIONS.REJECT]: 'decision-reject'
};

export default function BudgetDecisionBadge({ decision }) {
  return (
    <span className={`decision-badge ${decisionClassNames[decision] || 'decision-neutral'}`}>
      {DECISION_LABELS[decision] || decision}
    </span>
  );
}
