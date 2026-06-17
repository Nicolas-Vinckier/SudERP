export const PROBABILITY_LEVELS = [1, 2, 3, 4, 5];
export const IMPACT_LEVELS = [5, 4, 3, 2, 1];

export const RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
};

export const RISK_LEVEL_LABELS = {
  [RISK_LEVELS.LOW]: 'Low',
  [RISK_LEVELS.MEDIUM]: 'Medium',
  [RISK_LEVELS.HIGH]: 'High'
};

export const getScore = (risk) => Number(risk.probability) * Number(risk.impact);

export const getRiskLevel = (score) => {
  if (score <= 6) return RISK_LEVELS.LOW;
  if (score <= 14) return RISK_LEVELS.MEDIUM;
  return RISK_LEVELS.HIGH;
};

export const getScoreClass = (score) => `score-${getRiskLevel(score)}`;

export const getCellClass = (probability, impact) => (
  `risk-cell risk-cell-${getRiskLevel(Number(probability) * Number(impact))}`
);

export const getCellKey = (probability, impact) => `${probability}-${impact}`;

export const sortRisksByScore = (risks) => (
  [...risks].sort((a, b) => getScore(b) - getScore(a))
);

export const countRisksByLevel = (risks) => (
  risks.reduce((acc, risk) => {
    acc[getRiskLevel(getScore(risk))] += 1;
    return acc;
  }, {
    [RISK_LEVELS.LOW]: 0,
    [RISK_LEVELS.MEDIUM]: 0,
    [RISK_LEVELS.HIGH]: 0
  })
);

export const groupRisksByCell = (risks) => (
  risks.reduce((acc, risk) => {
    const key = getCellKey(risk.probability, risk.impact);
    if (!acc[key]) acc[key] = [];
    acc[key].push(risk);
    return acc;
  }, {})
);

export const getRisksForCell = (risksByCell, probability, impact) => (
  risksByCell[getCellKey(probability, impact)] || []
);

export const getSafeText = (value, fallback = '-') => {
  const normalizedValue = String(value ?? '').trim();
  return normalizedValue || fallback;
};
