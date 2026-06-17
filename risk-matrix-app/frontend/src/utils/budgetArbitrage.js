export const DEFAULT_BUDGET_AVAILABLE = 300000;

export const BUDGET_TYPES = ['CAPEX', 'OPEX', 'Mixte'];

export const BUDGET_CATEGORIES = [
  'Infrastructure',
  'Logiciels & Licences',
  'Securite',
  'Ressources Humaines',
  'Cloud & Hebergement',
  'Metier',
  'Conformite'
];

export const DECISIONS = {
  TO_ARBITRATE: 'a_arbitrer',
  FUND: 'a_financer',
  POSTPONE: 'reporte',
  REJECT: 'rejete'
};

export const DECISION_LABELS = {
  [DECISIONS.TO_ARBITRATE]: 'A arbitrer',
  [DECISIONS.FUND]: 'A financer',
  [DECISIONS.POSTPONE]: 'Reporte',
  [DECISIONS.REJECT]: 'Rejete'
};

export const EXPENSE_TYPES = [
  'Licence ponctuelle',
  'Licence annuelle',
  'Licence mensuelle',
  'Abonnement logiciel',
  'Hebergement',
  'Cloud',
  'Prestataire',
  'Maintenance',
  'Telecom',
  'Autre'
];

export const BILLING_FREQUENCIES = {
  ONE_TIME: 'one_time',
  MONTHLY: 'monthly',
  ANNUAL: 'annual'
};

export const BILLING_FREQUENCY_LABELS = {
  [BILLING_FREQUENCIES.ONE_TIME]: 'Ponctuel',
  [BILLING_FREQUENCIES.MONTHLY]: 'Mensuel',
  [BILLING_FREQUENCIES.ANNUAL]: 'Annuel'
};

export const AUTHORIZATION_STATUS = {
  APPROVED: 'approved',
  WATCH: 'watch',
  RISKY: 'risky',
  BLOCKED: 'blocked'
};

export const AUTHORIZATION_LABELS = {
  [AUTHORIZATION_STATUS.APPROVED]: 'Autorise',
  [AUTHORIZATION_STATUS.WATCH]: 'Sous controle',
  [AUTHORIZATION_STATUS.RISKY]: 'Risque eleve',
  [AUTHORIZATION_STATUS.BLOCKED]: 'A bloquer'
};

export const DEFAULT_BUDGET_SETTINGS = {
  available_budget: DEFAULT_BUDGET_AVAILABLE,
  annual_revenue: 2500000,
  current_annual_costs: 0,
  cash_reserve: 0,
  forecast_monthly_revenue: 0,
  forecast_monthly_costs: 0,
  forecast_target_date: '',
  safety_margin_percent: 15,
  minimum_cash_buffer: 0,
  max_project_cost_revenue_ratio: 8,
  monthly_revenue_growth_percent: 0,
  monthly_cost_growth_percent: 0
};

export const DEFAULT_BUDGET_PROJECT = {
  name: '',
  description: '',
  category: BUDGET_CATEGORIES[0],
  budget_type: BUDGET_TYPES[0],
  requested_budget: 0,
  capex_amount: 0,
  opex_amount_annual: 0,
  hidden_costs: 0,
  expected_gain_annual: 0,
  roi_horizon_years: 3,
  business_value: 3,
  risk_reduction: 3,
  roi_score: 3,
  complexity_score: 3,
  is_mandatory: false,
  decision: DECISIONS.TO_ARBITRATE,
  justification: '',
  accepted_risk: ''
};

export const DEFAULT_BUDGET_EMPLOYEE = {
  full_name: '',
  role: 'Equipe IT',
  department: 'DSI',
  weekly_hours: 35,
  hourly_rate: 0,
  workload_rate: 1,
  employer_charge_rate: 0.45,
  annual_bonus: 0,
  project_allocation_rate: 1,
  start_date: '',
  end_date: '',
  notes: ''
};

export const DEFAULT_BUDGET_EXPENSE = {
  name: '',
  expense_type: EXPENSE_TYPES[3],
  billing_frequency: BILLING_FREQUENCIES.MONTHLY,
  unit_cost: 0,
  quantity: 1,
  start_date: '',
  end_date: '',
  owner: '',
  vendor: '',
  is_critical: false,
  notes: ''
};

const toNumber = (value) => Number(value || 0);

export const normalizeSettings = (settings = {}) => ({
  ...DEFAULT_BUDGET_SETTINGS,
  ...settings
});

export const getBudgetScore = (project) =>
  toNumber(project.business_value) +
  toNumber(project.risk_reduction) +
  toNumber(project.roi_score) +
  toNumber(project.complexity_score);

export const getTco = (project) =>
  toNumber(project.capex_amount) +
  toNumber(project.hidden_costs) +
  toNumber(project.opex_amount_annual) *
    toNumber(project.roi_horizon_years ?? 1);

export const getTotalGain = (project) =>
  toNumber(project.expected_gain_annual) *
  toNumber(project.roi_horizon_years ?? 1);

export const getRoi = (project) => {
  const tco = getTco(project);
  if (tco === 0) return 0;
  return ((getTotalGain(project) - tco) / tco) * 100;
};

export const getPaybackMonths = (project) => {
  const annualGain = toNumber(project.expected_gain_annual);
  if (annualGain === 0) return null;
  return (getTco(project) / annualGain) * 12;
};

export const getFundingNeed = (project) => toNumber(project.requested_budget);

export const getScoreStatus = (score) => {
  if (score > 14) return 'fund';
  if (score >= 10) return 'postpone';
  return 'reject';
};

export const getScoreLabel = (score) => {
  if (score > 14) return 'Financer';
  if (score >= 10) return 'Reporter';
  return 'Rejeter ou revoir le scope';
};

export const getEmployeeGrossAnnualCost = (employee) =>
  toNumber(employee.weekly_hours) *
    52 *
    toNumber(employee.hourly_rate) *
    toNumber(employee.workload_rate ?? 1) +
  toNumber(employee.annual_bonus);

export const getEmployeeLoadedAnnualCost = (employee) =>
  getEmployeeGrossAnnualCost(employee) *
  (1 + toNumber(employee.employer_charge_rate));

export const getEmployeeAllocatedAnnualCost = (employee) =>
  getEmployeeLoadedAnnualCost(employee) *
  toNumber(employee.project_allocation_rate ?? 1);

export const getExpenseAnnualCost = (expense) => {
  const baseCost = toNumber(expense.unit_cost) * toNumber(expense.quantity ?? 1);

  if (expense.billing_frequency === BILLING_FREQUENCIES.MONTHLY) {
    return baseCost * 12;
  }

  if (expense.billing_frequency === BILLING_FREQUENCIES.ANNUAL) {
    return baseCost;
  }

  return 0;
};

export const getExpenseOneTimeCost = (expense) => {
  if (expense.billing_frequency !== BILLING_FREQUENCIES.ONE_TIME) return 0;
  return toNumber(expense.unit_cost) * toNumber(expense.quantity ?? 1);
};

export const getExpenseTco = (expense, horizonYears = 3) =>
  getExpenseOneTimeCost(expense) + getExpenseAnnualCost(expense) * horizonYears;

export const getFundedProjects = (projects) =>
  projects.filter((project) => project.decision === DECISIONS.FUND);

export const getProjectSortValue = (project, settings) => ({
  mandatory: project.is_mandatory ? 1 : 0,
  score: getBudgetScore(project),
  risk: toNumber(project.risk_reduction),
  business: toNumber(project.business_value),
  authorizationWeight: getProjectAuthorization(project, settings).weight,
  roi: getRoi(project),
  budget: getFundingNeed(project)
});

export const sortProjectsForArbitrage = (projects, settings = DEFAULT_BUDGET_SETTINGS) =>
  [...projects].sort((a, b) => {
    const left = getProjectSortValue(a, settings);
    const right = getProjectSortValue(b, settings);

    return (
      right.mandatory - left.mandatory ||
      right.authorizationWeight - left.authorizationWeight ||
      right.score - left.score ||
      right.risk - left.risk ||
      right.business - left.business ||
      right.roi - left.roi ||
      left.budget - right.budget
    );
  });

export const getProjectAuthorization = (project, rawSettings = DEFAULT_BUDGET_SETTINGS) => {
  const settings = normalizeSettings(rawSettings);
  const annualRevenue = toNumber(settings.annual_revenue);
  const tco = getTco(project);
  const costToRevenueRatio = annualRevenue === 0 ? 100 : (tco / annualRevenue) * 100;
  const maxRatio = toNumber(settings.max_project_cost_revenue_ratio || 8);
  const roi = getRoi(project);
  const paybackMonths = getPaybackMonths(project);
  const horizonMonths = toNumber(project.roi_horizon_years ?? 1) * 12;
  const netValue = getTotalGain(project) - tco;

  let status = AUTHORIZATION_STATUS.APPROVED;
  let reason = 'Cout coherent avec le chiffre d affaires, ROI soutenable et payback acceptable.';
  let weight = 4;

  if (costToRevenueRatio > maxRatio * 1.5 || (roi < -25 && !project.is_mandatory)) {
    status = AUTHORIZATION_STATUS.BLOCKED;
    reason = 'Effort financier trop lourd par rapport au chiffre d affaires ou ROI tres defavorable.';
    weight = 1;
  } else if (costToRevenueRatio > maxRatio || roi < 0 || (paybackMonths && paybackMonths > horizonMonths)) {
    status = AUTHORIZATION_STATUS.RISKY;
    reason = 'Autorisation risquee : cout, ROI ou payback demandent un arbitrage COMEX.';
    weight = 2;
  } else if (costToRevenueRatio > maxRatio * 0.7 || roi < 30 || netValue < tco * 0.2) {
    status = AUTHORIZATION_STATUS.WATCH;
    reason = 'Projet finançable avec suivi : marge de valeur limite ou poids budgetaire significatif.';
    weight = 3;
  }

  if (project.is_mandatory && status !== AUTHORIZATION_STATUS.APPROVED) {
    status = AUTHORIZATION_STATUS.WATCH;
    reason = 'Projet non negociable : financement prioritaire avec pilotage du cout et du scope.';
    weight = 3;
  }

  return {
    status,
    label: AUTHORIZATION_LABELS[status],
    reason,
    costToRevenueRatio,
    maxRatio,
    netValue,
    weight
  };
};

export const buildArbitragePlan = (projects, availableBudget, settings = DEFAULT_BUDGET_SETTINGS) => {
  let remainingBudget = toNumber(availableBudget);

  return sortProjectsForArbitrage(projects, settings).map((project) => {
    const fundingNeed = getFundingNeed(project);
    const score = getBudgetScore(project);
    const scoreStatus = getScoreStatus(score);
    const authorization = getProjectAuthorization(project, settings);
    const canFund = fundingNeed <= remainingBudget;
    const recommendedDecision = canFund && authorization.status !== AUTHORIZATION_STATUS.BLOCKED
      ? DECISIONS.FUND
      : DECISIONS.POSTPONE;
    const recommendationReason = canFund
      ? `${project.is_mandatory ? 'Non negociable, ' : ''}${getScoreLabel(score)} selon le score. ${authorization.reason}`
      : 'Budget insuffisant dans l enveloppe courante.';

    if (recommendedDecision === DECISIONS.FUND) {
      remainingBudget -= fundingNeed;
    }

    return {
      ...project,
      score,
      scoreStatus,
      authorization,
      fundingNeed,
      remainingBudgetAfterDecision: Math.max(remainingBudget, 0),
      recommendedDecision,
      recommendationReason
    };
  });
};

export const getAnnualHrCost = (employees) =>
  employees.reduce((sum, employee) => sum + getEmployeeAllocatedAnnualCost(employee), 0);

export const getAnnualExpenseCost = (expenses) =>
  expenses.reduce((sum, expense) => sum + getExpenseAnnualCost(expense), 0);

export const getOneTimeExpenseCost = (expenses) =>
  expenses.reduce((sum, expense) => sum + getExpenseOneTimeCost(expense), 0);

export const getPortfolioSummary = ({
  projects,
  availableBudget,
  settings,
  employees = [],
  expenses = []
}) => {
  const normalizedSettings = normalizeSettings(settings);
  const fundedProjects = getFundedProjects(projects);
  const committedBudget = fundedProjects.reduce(
    (sum, project) => sum + getFundingNeed(project),
    0
  );
  const totalRequestedBudget = projects.reduce(
    (sum, project) => sum + getFundingNeed(project),
    0
  );
  const fundedTco = fundedProjects.reduce(
    (sum, project) => sum + getTco(project),
    0
  );
  const fundedGain = fundedProjects.reduce(
    (sum, project) => sum + getTotalGain(project),
    0
  );
  const annualHrCost = getAnnualHrCost(employees);
  const annualExpenseCost = getAnnualExpenseCost(expenses);
  const oneTimeExpenseCost = getOneTimeExpenseCost(expenses);
  const fundedProjectOpex = fundedProjects.reduce(
    (sum, project) => sum + toNumber(project.opex_amount_annual),
    0
  );
  const currentAnnualRunRate =
    toNumber(normalizedSettings.current_annual_costs) +
    annualHrCost +
    annualExpenseCost +
    fundedProjectOpex;
  const operatingMargin = toNumber(normalizedSettings.annual_revenue) - currentAnnualRunRate;
  const burnRatio = normalizedSettings.annual_revenue === 0
    ? 100
    : (currentAnnualRunRate / toNumber(normalizedSettings.annual_revenue)) * 100;
  const globalRoi = fundedTco === 0 ? 0 : ((fundedGain - fundedTco) / fundedTco) * 100;

  return {
    totalProjects: projects.length,
    availableBudget: toNumber(availableBudget),
    annualRevenue: toNumber(normalizedSettings.annual_revenue),
    currentAnnualRunRate,
    operatingMargin,
    burnRatio,
    totalRequestedBudget,
    committedBudget,
    remainingBudget: toNumber(availableBudget) - committedBudget,
    fundedProjectsCount: fundedProjects.length,
    fundedTco,
    fundedGain,
    globalRoi,
    annualHrCost,
    annualExpenseCost,
    oneTimeExpenseCost,
    fundedProjectOpex
  };
};

const addMonths = (date, months) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

export const getMonthsUntilTarget = (targetDate) => {
  if (!targetDate) return 12;
  const today = new Date();
  const target = new Date(`${targetDate}T00:00:00`);
  if (Number.isNaN(target.getTime()) || target <= today) return 0;
  return Math.max(0, (target.getFullYear() - today.getFullYear()) * 12 + target.getMonth() - today.getMonth());
};

export const getBudgetForecast = ({
  settings,
  employees = [],
  expenses = [],
  projects = []
}) => {
  const normalizedSettings = normalizeSettings(settings);
  const fundedProjects = getFundedProjects(projects);
  const months = getMonthsUntilTarget(normalizedSettings.forecast_target_date);
  const currentMonthlyRevenue = toNumber(normalizedSettings.forecast_monthly_revenue) ||
    toNumber(normalizedSettings.annual_revenue) / 12;
  const currentMonthlyCosts =
    (toNumber(normalizedSettings.current_annual_costs) +
      getAnnualHrCost(employees) +
      getAnnualExpenseCost(expenses) +
      fundedProjects.reduce((sum, project) => sum + toNumber(project.opex_amount_annual), 0)) / 12 +
    toNumber(normalizedSettings.forecast_monthly_costs);
  const monthlyRevenueGrowth = toNumber(normalizedSettings.monthly_revenue_growth_percent) / 100;
  const monthlyCostGrowth = toNumber(normalizedSettings.monthly_cost_growth_percent) / 100;
  const points = [];
  let projectedCash =
    toNumber(normalizedSettings.cash_reserve) +
    toNumber(normalizedSettings.available_budget) -
    getOneTimeExpenseCost(expenses);

  for (let monthIndex = 1; monthIndex <= months; monthIndex += 1) {
    const revenue = currentMonthlyRevenue * ((1 + monthlyRevenueGrowth) ** (monthIndex - 1));
    const costs = currentMonthlyCosts * ((1 + monthlyCostGrowth) ** (monthIndex - 1));
    const net = revenue - costs;
    projectedCash += net;
    points.push({
      monthIndex,
      date: addMonths(new Date(), monthIndex).toISOString().slice(0, 7),
      revenue,
      costs,
      net,
      projectedCash
    });
  }

  const securityRatio = Math.max(0, 1 - toNumber(normalizedSettings.safety_margin_percent) / 100);
  const affordableBudget = Math.max(
    0,
    (projectedCash - toNumber(normalizedSettings.minimum_cash_buffer)) * securityRatio
  );
  const currentBudget = toNumber(normalizedSettings.available_budget);

  return {
    months,
    points,
    monthlyNetCashflow: currentMonthlyRevenue - currentMonthlyCosts,
    projectedCash,
    affordableBudget,
    canPlanLargerProject: affordableBudget > currentBudget * 1.25,
    largerProjectDelta: affordableBudget - currentBudget
  };
};

export const getCostBreakdown = (summary) => {
  const items = [
    { label: 'RH', value: summary.annualHrCost, className: 'chart-rh' },
    { label: 'Licences & abonnements', value: summary.annualExpenseCost, className: 'chart-expenses' },
    { label: 'OPEX projets finances', value: summary.fundedProjectOpex, className: 'chart-project-opex' },
    { label: 'Autres couts actuels', value: summary.currentAnnualRunRate - summary.annualHrCost - summary.annualExpenseCost - summary.fundedProjectOpex, className: 'chart-other' }
  ].filter((item) => item.value > 0);

  const total = items.reduce((sum, item) => sum + item.value, 0);
  return items.map((item) => ({
    ...item,
    percent: total === 0 ? 0 : (item.value / total) * 100
  }));
};

export const formatCurrency = (value) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(toNumber(value));

export const formatPercent = (value) =>
  `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(toNumber(value))} %`;

export const formatDecimal = (value, maximumFractionDigits = 1) =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits }).format(toNumber(value));
