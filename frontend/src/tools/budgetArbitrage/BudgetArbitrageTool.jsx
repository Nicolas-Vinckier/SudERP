import { useCallback, useEffect, useMemo, useState } from "react";
import BudgetArbitragePlan from "./BudgetArbitragePlan";
import BudgetContextPanel from "./BudgetContextPanel";
import BudgetEmployeeManager from "./BudgetEmployeeManager";
import BudgetExpenseManager from "./BudgetExpenseManager";
import BudgetForecastPanel from "./BudgetForecastPanel";
import BudgetProjectForm from "./BudgetProjectForm";
import BudgetProjectTable from "./BudgetProjectTable";
import BudgetSummary from "./BudgetSummary";
import BudgetVisualizations from "./BudgetVisualizations";
import {
  DECISIONS,
  DECISION_LABELS,
  DEFAULT_BUDGET_SETTINGS,
  BILLING_FREQUENCIES,
  BILLING_FREQUENCY_LABELS,
  buildArbitragePlan,
  formatCurrency,
  formatDecimal,
  formatPercent,
  getBudgetForecast,
  getCostBreakdown,
  getBudgetScore,
  getEmployeeAllocatedAnnualCost,
  getExpenseAnnualCost,
  getExpenseTco,
  getFundingNeed,
  getPaybackMonths,
  getPortfolioSummary,
  getProjectAuthorization,
  getRoi,
  getTco,
  normalizeSettings,
  sortProjectsForArbitrage,
} from "../../utils/budgetArbitrage";
import {
  getBudgetSettings,
  updateBudgetSettings,
} from "../../services/budgetSettingsApi";
import {
  createBudgetProject,
  deleteBudgetProject,
  getBudgetProjects,
  updateBudgetProject,
} from "../../services/budgetProjectsApi";
import {
  createBudgetEmployee,
  deleteBudgetEmployee,
  getBudgetEmployees,
  updateBudgetEmployee,
} from "../../services/budgetEmployeesApi";
import {
  createBudgetExpense,
  deleteBudgetExpense,
  getBudgetExpenses,
  updateBudgetExpense,
} from "../../services/budgetExpensesApi";

const COURSE_CASE_PROJECTS = [
  {
    name: "MFA",
    description:
      "Deploiement de l authentification multi-facteurs sur tous les acces.",
    category: "Securite",
    budget_type: "OPEX",
    requested_budget: 30000,
    capex_amount: 5000,
    opex_amount_annual: 8000,
    hidden_costs: 3000,
    expected_gain_annual: 18000,
    roi_horizon_years: 3,
    business_value: 3,
    risk_reduction: 5,
    roi_score: 4,
    complexity_score: 5,
    is_mandatory: true,
    decision: DECISIONS.FUND,
    justification:
      "Exige par l assurance cyber et tres fort levier de reduction du risque.",
    accepted_risk: "Risque accru de compromission de comptes si reporte.",
  },
  {
    name: "EDR",
    description:
      "Solution de detection et reponse sur les endpoints pour 300 postes.",
    category: "Securite",
    budget_type: "OPEX",
    requested_budget: 50000,
    capex_amount: 8000,
    opex_amount_annual: 16000,
    hidden_costs: 5000,
    expected_gain_annual: 25000,
    roi_horizon_years: 3,
    business_value: 4,
    risk_reduction: 5,
    roi_score: 4,
    complexity_score: 4,
    is_mandatory: true,
    decision: DECISIONS.FUND,
    justification: "Priorite securite apres incident observe dans le secteur.",
    accepted_risk: "Detection tardive des attaques endpoint si non finance.",
  },
  {
    name: "ERP",
    description: "Remplacement du systeme de gestion vieillissant.",
    category: "Metier",
    budget_type: "Mixte",
    requested_budget: 150000,
    capex_amount: 90000,
    opex_amount_annual: 28000,
    hidden_costs: 25000,
    expected_gain_annual: 85000,
    roi_horizon_years: 5,
    business_value: 5,
    risk_reduction: 3,
    roi_score: 4,
    complexity_score: 2,
    is_mandatory: false,
    decision: DECISIONS.FUND,
    justification: "Obsolescence forte et impact metier direct.",
    accepted_risk:
      "Maintien de processus manuels, dette applicative et risque de rupture de support.",
  },
  {
    name: "Migration Azure",
    description: "Migration des serveurs on-premise vers Azure.",
    category: "Cloud & Hebergement",
    budget_type: "OPEX",
    requested_budget: 100000,
    capex_amount: 15000,
    opex_amount_annual: 42000,
    hidden_costs: 15000,
    expected_gain_annual: 50000,
    roi_horizon_years: 4,
    business_value: 3,
    risk_reduction: 3,
    roi_score: 3,
    complexity_score: 3,
    is_mandatory: false,
    decision: DECISIONS.POSTPONE,
    justification:
      "Projet interessant, mais a piloter avec FinOps pour eviter la derive cloud.",
    accepted_risk:
      "Maintien temporaire de la salle serveur et de la maintenance materielle.",
  },
  {
    name: "SIEM",
    description: "Supervision de securite centralisee des logs et alertes.",
    category: "Securite",
    budget_type: "OPEX",
    requested_budget: 120000,
    capex_amount: 20000,
    opex_amount_annual: 45000,
    hidden_costs: 18000,
    expected_gain_annual: 35000,
    roi_horizon_years: 3,
    business_value: 3,
    risk_reduction: 5,
    roi_score: 2,
    complexity_score: 2,
    is_mandatory: false,
    decision: DECISIONS.POSTPONE,
    justification: "Forte valeur securite mais budget et complexite eleves.",
    accepted_risk:
      "Visibilite limitee sur les signaux faibles de compromission.",
  },
  {
    name: "Site web",
    description: "Refonte du site web et du tunnel de vente en ligne.",
    category: "Metier",
    budget_type: "CAPEX",
    requested_budget: 80000,
    capex_amount: 65000,
    opex_amount_annual: 8000,
    hidden_costs: 7000,
    expected_gain_annual: 60000,
    roi_horizon_years: 3,
    business_value: 4,
    risk_reduction: 1,
    roi_score: 4,
    complexity_score: 4,
    is_mandatory: false,
    decision: DECISIONS.POSTPONE,
    justification:
      "Projet business attractif, a arbitrer apres les chantiers cyber.",
    accepted_risk: "Conversion web sous-optimale pendant la periode de report.",
  },
];

const COURSE_CASE_EMPLOYEES = [
  {
    full_name: "Responsable SI",
    role: "Pilotage portefeuille et fournisseurs",
    department: "DSI",
    weekly_hours: 35,
    hourly_rate: 55,
    workload_rate: 1,
    employer_charge_rate: 0.45,
    annual_bonus: 4000,
    project_allocation_rate: 0.35,
    start_date: "",
    end_date: "",
    notes: "Temps de pilotage alloue aux projets budgetaires.",
  },
  {
    full_name: "Administrateur systemes",
    role: "Infrastructure, M365, securite",
    department: "DSI",
    weekly_hours: 35,
    hourly_rate: 38,
    workload_rate: 1,
    employer_charge_rate: 0.45,
    annual_bonus: 2500,
    project_allocation_rate: 0.45,
    start_date: "",
    end_date: "",
    notes:
      "Charge interne de deploiement et maintien en conditions operationnelles.",
  },
];

const COURSE_CASE_EXPENSES = [
  {
    name: "Microsoft 365 Business Premium",
    expense_type: "Abonnement logiciel",
    billing_frequency: BILLING_FREQUENCIES.MONTHLY,
    unit_cost: 20,
    quantity: 250,
    start_date: "",
    end_date: "",
    owner: "DSI",
    vendor: "Microsoft",
    is_critical: true,
    notes: "Suite collaborative, identite, MDM et securite endpoint de base.",
  },
  {
    name: "Hebergement cloud applicatif",
    expense_type: "Hebergement",
    billing_frequency: BILLING_FREQUENCIES.MONTHLY,
    unit_cost: 3000,
    quantity: 1,
    start_date: "",
    end_date: "",
    owner: "Infrastructure",
    vendor: "Azure",
    is_critical: true,
    notes: "A surveiller avec FinOps pour limiter les derives.",
  },
  {
    name: "Infogerance support N2",
    expense_type: "Prestataire",
    billing_frequency: BILLING_FREQUENCIES.ANNUAL,
    unit_cost: 45000,
    quantity: 1,
    start_date: "",
    end_date: "",
    owner: "Support",
    vendor: "ESN",
    is_critical: false,
    notes: "Renfort support et administration recurrente.",
  },
];

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatText(value, fallback = "A completer") {
  const normalized = String(value ?? "").trim();
  if (!normalized) return `<span class="muted">${escapeHtml(fallback)}</span>`;
  return escapeHtml(normalized).replace(/\n/g, "<br>");
}

function downloadHtml(filename, html) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const EXPORT_CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

function buildExportPieGradient(items) {
  if (items.length === 0) {
    return "conic-gradient(#e2e8f0 0deg 360deg)";
  }

  let cursor = 0;
  const stops = items.map((item, index) => {
    const start = cursor;
    cursor += item.percent * 3.6;
    return `${EXPORT_CHART_COLORS[index % EXPORT_CHART_COLORS.length]} ${start}deg ${cursor}deg`;
  });

  return `conic-gradient(${stops.join(", ")})`;
}

function clampPercent(value, min = 0, max = 100) {
  return Math.min(Math.max(Number(value || 0), min), max);
}

function buildBudgetReportHtml({
  settings,
  projects,
  sortedProjects,
  employees,
  expenses,
  summary,
  arbitragePlan,
  forecast,
  autoPrint = false,
}) {
  const reportDate = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date());
  const fundedProjects = projects.filter((project) => project.decision === DECISIONS.FUND);
  const postponedProjects = projects.filter((project) => project.decision === DECISIONS.POSTPONE);
  const rejectedProjects = projects.filter((project) => project.decision === DECISIONS.REJECT);
  const forecastLastPoint = forecast.points.at(-1);
  const costBreakdown = getCostBreakdown(summary);
  const pieGradient = buildExportPieGradient(costBreakdown);
  const roiGaugeWidth = `${(clampPercent(summary.globalRoi, 0, 150) / 150) * 100}%`;
  const marginGaugeWidth = summary.annualRevenue === 0
    ? "0%"
    : `${clampPercent((summary.operatingMargin / summary.annualRevenue) * 100)}%`;
  const maxForecastCash = Math.max(...forecast.points.map((point) => point.projectedCash), forecast.projectedCash, 1);
  const forecastBars = forecast.points.slice(-12).map((point) => {
    const height = Math.max((point.projectedCash / maxForecastCash) * 100, 4);
    return `<span title="${escapeHtml(point.date)} - ${formatCurrency(point.projectedCash)}" style="height: ${height}%"></span>`;
  }).join("") || '<em class="muted">Aucune projection disponible.</em>';
  const costLegend = costBreakdown.length === 0
    ? '<span class="muted">Aucun cout annuel a afficher.</span>'
    : costBreakdown.map((item, index) => `<span><i style="background: ${EXPORT_CHART_COLORS[index % EXPORT_CHART_COLORS.length]}"></i>${escapeHtml(item.label)} · ${formatPercent(item.percent)} · ${formatCurrency(item.value)}</span>`).join("");

  const projectRows = sortedProjects.length === 0
    ? '<tr><td colspan="9">Aucun projet budgetaire a exporter.</td></tr>'
    : sortedProjects.map((project) => {
      const authorization = getProjectAuthorization(project, settings);
      const payback = getPaybackMonths(project);
      return `<tr>
        <td><strong>${escapeHtml(project.name || "Projet sans nom")}</strong><small>${formatText(project.description, "Description a completer")}</small></td>
        <td>${escapeHtml(project.category || "-")}<small>${escapeHtml(project.budget_type || "-")}</small></td>
        <td>${formatCurrency(getFundingNeed(project))}</td>
        <td>${formatCurrency(getTco(project))}<small>CAPEX ${formatCurrency(project.capex_amount)} / OPEX annuel ${formatCurrency(project.opex_amount_annual)}</small></td>
        <td>${formatPercent(getRoi(project))}<small>${payback ? `${formatDecimal(payback)} mois` : "Payback non calcule"}</small></td>
        <td>${getBudgetScore(project)}/20</td>
        <td>${escapeHtml(authorization.label)}<small>${formatDecimal(authorization.costToRevenueRatio)}% du CA</small></td>
        <td>${escapeHtml(DECISION_LABELS[project.decision] || project.decision || "A arbitrer")}</td>
        <td>${formatText(project.justification, "Justification a completer")}<small><strong>Risque accepte :</strong> ${formatText(project.accepted_risk, "A renseigner")}</small></td>
      </tr>`;
    }).join("");

  const arbitrageRows = arbitragePlan.length === 0
    ? '<tr><td colspan="6">Aucun arbitrage automatique disponible.</td></tr>'
    : arbitragePlan.map((project, index) => `<tr>
        <td>#${index + 1}</td>
        <td><strong>${escapeHtml(project.name || "Projet sans nom")}</strong></td>
        <td>${project.score}/20</td>
        <td>${formatCurrency(project.fundingNeed)}</td>
        <td>${escapeHtml(DECISION_LABELS[project.recommendedDecision] || project.recommendedDecision)}</td>
        <td>${formatText(project.recommendationReason)}</td>
      </tr>`).join("");

  const employeeRows = employees.length === 0
    ? '<tr><td colspan="6">Aucune ressource RH renseignee.</td></tr>'
    : employees.map((employee) => `<tr>
        <td><strong>${escapeHtml(employee.full_name || "Ressource sans nom")}</strong><small>${escapeHtml(employee.role || "-")}</small></td>
        <td>${escapeHtml(employee.department || "-")}</td>
        <td>${formatDecimal(employee.weekly_hours)} h</td>
        <td>${formatCurrency(employee.hourly_rate)} / h</td>
        <td>${formatPercent(Number(employee.project_allocation_rate || 0) * 100)}</td>
        <td>${formatCurrency(getEmployeeAllocatedAnnualCost(employee))}<small>${formatText(employee.notes, "")}</small></td>
      </tr>`).join("");

  const expenseRows = expenses.length === 0
    ? '<tr><td colspan="7">Aucune licence, abonnement ou depense renseignee.</td></tr>'
    : expenses.map((expense) => `<tr>
        <td><strong>${escapeHtml(expense.name || "Depense sans nom")}</strong><small>${formatText(expense.notes, "")}</small></td>
        <td>${escapeHtml(expense.expense_type || "-")}</td>
        <td>${escapeHtml(BILLING_FREQUENCY_LABELS[expense.billing_frequency] || expense.billing_frequency || "-")}</td>
        <td>${formatCurrency(expense.unit_cost)}</td>
        <td>${formatDecimal(expense.quantity)}</td>
        <td>${formatCurrency(getExpenseAnnualCost(expense))}</td>
        <td>${formatCurrency(getExpenseTco(expense, 3))}</td>
      </tr>`).join("");

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Budget & Arbitrage - Export</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #eef3fb; color: #14213d; font-family: Inter, Arial, sans-serif; }
    .report { max-width: 1240px; margin: 0 auto; padding: 36px; }
    .hero { background: linear-gradient(135deg, #1d4ed8, #4f46e5 52%, #0f172a); color: #fff; border-radius: 28px; padding: 34px; box-shadow: 0 24px 60px rgba(15, 23, 42, 0.22); }
    .hero p { color: rgba(255,255,255,0.78); line-height: 1.55; margin: 0; }
    .hero h1 { font-size: 34px; line-height: 1.1; margin: 8px 0 16px; }
    .hero-grid { display: grid; gap: 16px; grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: 26px; }
    .hero-card { background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.18); border-radius: 18px; padding: 16px; }
    .hero-card span { display: block; font-size: 12px; font-weight: 800; letter-spacing: .08em; margin-bottom: 8px; text-transform: uppercase; color: rgba(255,255,255,0.72); }
    .hero-card strong { display: block; font-size: 20px; }
    .report-section { background: #fff; border: 1px solid rgba(15, 23, 42, .08); border-radius: 24px; box-shadow: 0 18px 40px rgba(15, 23, 42, .1); margin-top: 24px; padding: 28px; page-break-inside: avoid; }
    .section-title { align-items: flex-start; display: flex; gap: 18px; margin-bottom: 22px; }
    .section-title > span { align-items: center; background: #dbeafe; border-radius: 16px; color: #1d4ed8; display: inline-flex; font-size: 22px; font-weight: 900; height: 56px; justify-content: center; width: 56px; }
    .section-title h2 { font-size: 24px; line-height: 1; margin: 0 0 8px; }
    .section-title p, .muted, small { color: #64748b; }
    .summary-grid { display: grid; gap: 14px; grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 18px; padding: 16px; }
    .summary-card span { color: #64748b; display: block; font-size: 12px; font-weight: 800; letter-spacing: .05em; margin-bottom: 8px; text-transform: uppercase; }
    .summary-card strong { display: block; font-size: 20px; }
    .export-table { border-collapse: separate; border-spacing: 0; overflow: hidden; width: 100%; }
    .export-table th { background: #1d4ed8; color: white; font-size: 12px; letter-spacing: .05em; padding: 12px; text-align: left; text-transform: uppercase; }
    .export-table td { background: #fff; border-bottom: 1px solid #e2e8f0; color: #334155; padding: 12px; vertical-align: top; }
    .export-table tr:nth-child(even) td { background: #f8fafc; }
    .export-table strong, .export-table small { display: block; }
    .export-table small { line-height: 1.45; margin-top: 4px; }
    .visual-grid { display: grid; gap: 18px; grid-template-columns: repeat(4, minmax(0, 1fr)); margin-bottom: 18px; }
    .visual-card { background: linear-gradient(180deg, #fff, #fbfdff); border: 1px solid #e2e8f0; border-radius: 24px; min-height: 260px; padding: 20px; page-break-inside: avoid; }
    .visual-card .eyebrow { color: #475569; font-size: 12px; font-weight: 900; letter-spacing: .12em; margin: 0 0 10px; text-transform: uppercase; }
    .visual-card h3 { color: #3730a3; font-size: 24px; line-height: 1.1; margin: 0 0 24px; }
    .metric-highlight strong { color: #020617; display: block; font-size: 31px; line-height: 1; margin-bottom: 6px; }
    .metric-highlight span { color: #334155; display: block; font-size: 16px; }
    .export-gauge { background: #e2e8f0; border-radius: 999px; height: 14px; margin: 20px 0 88px; overflow: hidden; }
    .export-gauge span { background: linear-gradient(90deg, #dc2626, #f59e0b, #16a34a); border-radius: inherit; display: block; height: 100%; }
    .margin-gauge { margin-bottom: 88px; }
    .chart-metrics { display: grid; gap: 8px; }
    .chart-metrics span { color: #334155; display: block; font-size: 15px; }
    .chart-metrics strong { color: #020617; font-size: 16px; }
    .pie-chart-layout { align-items: center; display: grid; gap: 18px; grid-template-columns: 140px minmax(0, 1fr); }
    .pie-chart { border-radius: 50%; box-shadow: 0 18px 34px rgba(15, 23, 42, .12); height: 140px; position: relative; width: 140px; }
    .pie-chart::after { background: #fff; border-radius: 50%; content: ''; height: 58px; left: 41px; position: absolute; top: 41px; width: 58px; }
    .pie-legend { display: grid; gap: 9px; }
    .pie-legend span { color: #334155; display: flex; font-size: 14px; gap: 8px; line-height: 1.35; }
    .pie-legend i { border-radius: 999px; flex: 0 0 12px; height: 12px; margin-top: 3px; width: 12px; }
    .forecast-mini-chart { align-items: end; border: 1px solid #e2e8f0; border-radius: 18px; display: flex; gap: 10px; height: 112px; margin: 0 0 70px; padding: 14px; }
    .forecast-mini-chart span { background: linear-gradient(180deg, #3b82f6, #1d4ed8); border-radius: 999px 999px 0 0; flex: 1; min-height: 4px; }
    .decision-grid { display: grid; gap: 14px; grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .decision-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 18px; padding: 16px; }
    .decision-card strong { display: block; font-size: 26px; margin-bottom: 6px; }
    .print-helper { background: rgba(255,255,255,.96); border: 1px solid #e2e8f0; border-radius: 999px; bottom: 22px; box-shadow: 0 14px 34px rgba(15, 23, 42, .18); display: flex; gap: 10px; padding: 10px; position: fixed; right: 22px; z-index: 20; }
    .print-helper button { background: #2563eb; border: 0; border-radius: 999px; color: #fff; cursor: pointer; font-weight: 900; padding: 10px 16px; }
    @media print { body { background: white; } .report { padding: 0; max-width: none; } .hero, .report-section, .visual-card { box-shadow: none; } .print-helper { display: none; } }
    @media (max-width: 1100px) { .visual-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (max-width: 900px) { .hero-grid, .summary-grid, .decision-grid, .visual-grid { grid-template-columns: 1fr; } .report { padding: 18px; } }
  </style>
</head>
<body>
  <main class="report">
    <section class="hero">
      <p>SudERP - Bloc 6</p>
      <h1>Budget & Arbitrage du Systeme d'Information</h1>
      <p>Export de synthese du portefeuille budgetaire : enveloppe disponible, projets, arbitrage multicriteres, ressources RH, depenses recurrentes et projection financiere.</p>
      <div class="hero-grid">
        <article class="hero-card"><span>Date export</span><strong>${escapeHtml(reportDate)}</strong></article>
        <article class="hero-card"><span>Budget disponible</span><strong>${formatCurrency(summary.availableBudget)}</strong></article>
        <article class="hero-card"><span>Budget engage</span><strong>${formatCurrency(summary.committedBudget)}</strong></article>
        <article class="hero-card"><span>Reste a arbitrer</span><strong>${formatCurrency(summary.remainingBudget)}</strong></article>
      </div>
    </section>

    <section class="report-section">
      <div class="section-title"><span>01</span><div><h2>Synthese budgetaire</h2><p>Vue consolidée du budget, des coûts, de la marge et du ROI global.</p></div></div>
      <div class="visual-grid">
        <article class="visual-card">
          <p class="eyebrow">ROI</p>
          <h3>Retour portefeuille</h3>
          <div class="metric-highlight"><strong>${formatPercent(summary.globalRoi)}</strong><span>ROI global des projets finances</span></div>
          <div class="export-gauge"><span style="width: ${roiGaugeWidth}"></span></div>
          <div class="chart-metrics"><span>TCO finance <strong>${formatCurrency(summary.fundedTco)}</strong></span><span>Gains finances <strong>${formatCurrency(summary.fundedGain)}</strong></span></div>
        </article>
        <article class="visual-card">
          <p class="eyebrow">Camembert</p>
          <h3>Structure des couts annuels</h3>
          <div class="pie-chart-layout"><div class="pie-chart" style="background: ${pieGradient}"></div><div class="pie-legend">${costLegend}</div></div>
        </article>
        <article class="visual-card">
          <p class="eyebrow">Run rate</p>
          <h3>Marge operationnelle</h3>
          <div class="metric-highlight"><strong>${formatCurrency(summary.operatingMargin)}</strong><span>CA annuel - couts annuels actuels</span></div>
          <div class="export-gauge margin-gauge"><span style="width: ${marginGaugeWidth}"></span></div>
          <div class="chart-metrics"><span>CA annuel <strong>${formatCurrency(summary.annualRevenue)}</strong></span><span>Burn ratio <strong>${formatPercent(summary.burnRatio)}</strong></span></div>
        </article>
        <article class="visual-card">
          <p class="eyebrow">Projection</p>
          <h3>Cash previsionnel</h3>
          <div class="forecast-mini-chart">${forecastBars}</div>
          <div class="chart-metrics"><span>Budget prudent futur <strong>${formatCurrency(forecast.affordableBudget)}</strong></span><span>Cash cible <strong>${formatCurrency(forecast.projectedCash)}</strong></span></div>
        </article>
      </div>
      <div class="summary-grid">
        <article class="summary-card"><span>Chiffre d'affaires</span><strong>${formatCurrency(summary.annualRevenue)}</strong></article>
        <article class="summary-card"><span>Couts annuels actuels</span><strong>${formatCurrency(summary.currentAnnualRunRate)}</strong></article>
        <article class="summary-card"><span>Marge actuelle</span><strong>${formatCurrency(summary.operatingMargin)}</strong></article>
        <article class="summary-card"><span>ROI global finance</span><strong>${formatPercent(summary.globalRoi)}</strong></article>
        <article class="summary-card"><span>Demandes totales</span><strong>${formatCurrency(summary.totalRequestedBudget)}</strong></article>
        <article class="summary-card"><span>Projets finances</span><strong>${fundedProjects.length}/${projects.length}</strong></article>
        <article class="summary-card"><span>TCO finance</span><strong>${formatCurrency(summary.fundedTco)}</strong></article>
        <article class="summary-card"><span>Burn ratio</span><strong>${formatPercent(summary.burnRatio)}</strong></article>
      </div>
    </section>

    <section class="report-section">
      <div class="section-title"><span>02</span><div><h2>Decision d'arbitrage</h2><p>Repartition des projets selon leur decision actuelle.</p></div></div>
      <div class="decision-grid">
        <article class="decision-card"><strong>${fundedProjects.length}</strong><span>Projets a financer</span><p>${formatCurrency(fundedProjects.reduce((sum, project) => sum + getFundingNeed(project), 0))}</p></article>
        <article class="decision-card"><strong>${postponedProjects.length}</strong><span>Projets reportes</span><p>${formatCurrency(postponedProjects.reduce((sum, project) => sum + getFundingNeed(project), 0))}</p></article>
        <article class="decision-card"><strong>${rejectedProjects.length}</strong><span>Projets rejetes</span><p>${formatCurrency(rejectedProjects.reduce((sum, project) => sum + getFundingNeed(project), 0))}</p></article>
      </div>
    </section>

    <section class="report-section">
      <div class="section-title"><span>03</span><div><h2>Arbitrage automatique</h2><p>Classement selon le caractere obligatoire, le score, la reduction du risque, la valeur metier, le ROI et le budget.</p></div></div>
      <table class="export-table">
        <thead><tr><th>Rang</th><th>Projet</th><th>Score</th><th>Besoin</th><th>Decision recommandee</th><th>Lecture</th></tr></thead>
        <tbody>${arbitrageRows}</tbody>
      </table>
    </section>

    <section class="report-section">
      <div class="section-title"><span>04</span><div><h2>Portefeuille de projets</h2><p>Détail TCO, ROI, score et risque accepté pour chaque projet.</p></div></div>
      <table class="export-table">
        <thead><tr><th>Projet</th><th>Categorie</th><th>Budget demande</th><th>TCO</th><th>ROI / payback</th><th>Score</th><th>Autorisation</th><th>Decision</th><th>Justification</th></tr></thead>
        <tbody>${projectRows}</tbody>
      </table>
    </section>

    <section class="report-section">
      <div class="section-title"><span>05</span><div><h2>Ressources RH allouees</h2><p>Coût annuel chargé et part affectée aux projets SI.</p></div></div>
      <table class="export-table">
        <thead><tr><th>Ressource</th><th>Departement</th><th>Temps</th><th>Taux horaire</th><th>Allocation</th><th>Cout annuel alloue</th></tr></thead>
        <tbody>${employeeRows}</tbody>
      </table>
    </section>

    <section class="report-section">
      <div class="section-title"><span>06</span><div><h2>Licences, abonnements et depenses</h2><p>Dépenses récurrentes et TCO sur 3 ans.</p></div></div>
      <table class="export-table">
        <thead><tr><th>Depense</th><th>Type</th><th>Frequence</th><th>Cout unitaire</th><th>Quantite</th><th>Cout annuel</th><th>TCO 3 ans</th></tr></thead>
        <tbody>${expenseRows}</tbody>
      </table>
    </section>

    <section class="report-section">
      <div class="section-title"><span>07</span><div><h2>Projection financiere</h2><p>Lecture prospective de la capacite de financement et de la tresorerie projetee.</p></div></div>
      <div class="summary-grid">
        <article class="summary-card"><span>Horizon</span><strong>${forecast.months} mois</strong></article>
        <article class="summary-card"><span>Cashflow mensuel</span><strong>${formatCurrency(forecast.monthlyNetCashflow)}</strong></article>
        <article class="summary-card"><span>Tresorerie projetee</span><strong>${formatCurrency(forecast.projectedCash)}</strong></article>
        <article class="summary-card"><span>Budget abordable</span><strong>${formatCurrency(forecast.affordableBudget)}</strong></article>
      </div>
      ${forecastLastPoint ? `<p class="muted">Dernier point de projection : ${escapeHtml(forecastLastPoint.date)} - cash projete ${formatCurrency(forecastLastPoint.projectedCash)}.</p>` : '<p class="muted">Aucune projection temporelle disponible.</p>'}
    </section>
  </main>
  <div class="print-helper"><button type="button" onclick="window.print()">Exporter en PDF</button></div>
  ${autoPrint ? '<script>window.addEventListener("load", () => { window.print(); });</script>' : ''}
</body>
</html>`;
}

export default function BudgetArbitrageTool() {
  const [settings, setSettings] = useState(DEFAULT_BUDGET_SETTINGS);
  const [budgetProjects, setBudgetProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [editingProject, setEditingProject] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchBudgetProjects = useCallback(async () => {
    try {
      const response = await getBudgetProjects();
      setBudgetProjects(response.data);
      setErrorMessage("");
    } catch (error) {
      console.error("Failed to fetch budget projects", error);
      setErrorMessage("Impossible de charger les projets budgetaires.");
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      const response = await getBudgetEmployees();
      setEmployees(response.data);
    } catch (error) {
      console.error("Failed to fetch budget employees", error);
      setErrorMessage("Impossible de charger les donnees RH.");
    }
  }, []);

  const fetchExpenses = useCallback(async () => {
    try {
      const response = await getBudgetExpenses();
      setExpenses(response.data);
    } catch (error) {
      console.error("Failed to fetch budget expenses", error);
      setErrorMessage("Impossible de charger les licences et abonnements.");
    }
  }, []);

  const fetchBudgetSettings = useCallback(async () => {
    try {
      const fetchedSettings = await getBudgetSettings();
      setSettings(normalizeSettings(fetchedSettings));
    } catch (error) {
      console.error("Failed to fetch budget settings", error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchBudgetProjects(),
        fetchEmployees(),
        fetchExpenses(),
        fetchBudgetSettings(),
      ]);
    };

    loadData();
  }, [fetchBudgetProjects, fetchBudgetSettings, fetchEmployees, fetchExpenses]);

  const sortedProjects = useMemo(
    () => sortProjectsForArbitrage(budgetProjects, settings),
    [budgetProjects, settings],
  );

  const summary = useMemo(
    () =>
      getPortfolioSummary({
        projects: budgetProjects,
        availableBudget: settings.available_budget,
        settings,
        employees,
        expenses,
      }),
    [budgetProjects, employees, expenses, settings],
  );

  const arbitragePlan = useMemo(
    () =>
      buildArbitragePlan(budgetProjects, settings.available_budget, settings),
    [budgetProjects, settings],
  );

  const forecast = useMemo(
    () =>
      getBudgetForecast({
        settings,
        employees,
        expenses,
        projects: budgetProjects,
      }),
    [budgetProjects, employees, expenses, settings],
  );

  const handleSubmitProject = useCallback(
    async (project) => {
      setIsSaving(true);
      try {
        if (project.id) {
          await updateBudgetProject(project.id, project);
        } else {
          await createBudgetProject(project);
        }
        setEditingProject(null);
        await fetchBudgetProjects();
      } catch (error) {
        console.error("Failed to save budget project", error);
        setErrorMessage("Impossible d enregistrer le projet budgetaire.");
      } finally {
        setIsSaving(false);
      }
    },
    [fetchBudgetProjects],
  );

  const handleDeleteProject = useCallback(
    async (id) => {
      const shouldDelete = window.confirm("Supprimer ce projet budgetaire ?");
      if (!shouldDelete) return;

      try {
        await deleteBudgetProject(id);
        await fetchBudgetProjects();
      } catch (error) {
        console.error("Failed to delete budget project", error);
        setErrorMessage("Impossible de supprimer le projet budgetaire.");
      }
    },
    [fetchBudgetProjects],
  );

  const handleSaveSettings = async () => {
    try {
      await updateBudgetSettings(settings);
    } catch (error) {
      console.error("Failed to save budget settings", error);
      setErrorMessage("Impossible de sauvegarder le contexte financier.");
    }
  };

  const createItem = async (createFn, refreshFn, payload, errorText) => {
    setIsSaving(true);
    try {
      await createFn(payload);
      await refreshFn();
    } catch (error) {
      console.error(errorText, error);
      setErrorMessage(errorText);
    } finally {
      setIsSaving(false);
    }
  };

  const updateItem = async (updateFn, refreshFn, id, payload, errorText) => {
    setIsSaving(true);
    try {
      await updateFn(id, payload);
      await refreshFn();
    } catch (error) {
      console.error(errorText, error);
      setErrorMessage(errorText);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteItem = async (
    deleteFn,
    refreshFn,
    id,
    confirmText,
    errorText,
  ) => {
    const shouldDelete = window.confirm(confirmText);
    if (!shouldDelete) return;

    try {
      await deleteFn(id);
      await refreshFn();
    } catch (error) {
      console.error(errorText, error);
      setErrorMessage(errorText);
    }
  };

  const handleLoadCourseCase = async () => {
    const shouldLoad = window.confirm(
      "Charger le cas pratique avec projets, RH, licences et abonnements ?",
    );
    if (!shouldLoad) return;

    setIsSaving(true);
    try {
      await Promise.all([
        ...COURSE_CASE_PROJECTS.map((project) => createBudgetProject(project)),
        ...COURSE_CASE_EMPLOYEES.map((employee) =>
          createBudgetEmployee(employee),
        ),
        ...COURSE_CASE_EXPENSES.map((expense) => createBudgetExpense(expense)),
      ]);
      await updateBudgetSettings({
        ...settings,
        available_budget: 300000,
        annual_revenue: 2500000,
        current_annual_costs: 40000,
        cash_reserve: 80000,
        forecast_monthly_revenue: 210000,
        forecast_monthly_costs: 20000,
        safety_margin_percent: 15,
        minimum_cash_buffer: 50000,
        max_project_cost_revenue_ratio: 8,
      });
      await Promise.all([
        fetchBudgetProjects(),
        fetchEmployees(),
        fetchExpenses(),
        fetchBudgetSettings(),
      ]);
    } catch (error) {
      console.error("Failed to load course case", error);
      setErrorMessage("Impossible de charger le cas pratique.");
    } finally {
      setIsSaving(false);
    }
  };


  const reportHtml = (options = {}) => buildBudgetReportHtml({
    settings,
    projects: budgetProjects,
    sortedProjects,
    employees,
    expenses,
    summary,
    arbitragePlan,
    forecast,
    ...options,
  });

  const exportHtmlReport = () => {
    downloadHtml("sud-erp-budget-arbitrage-synthese.html", reportHtml());
  };

  const previewPdfReport = () => {
    const html = reportHtml({ autoPrint: true });
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const previewWindow = window.open(url, "_blank", "width=1200,height=900");

    if (!previewWindow) {
      URL.revokeObjectURL(url);
      setErrorMessage("Le navigateur a bloque l ouverture de l apercu PDF. Autorise les popups ou utilise l export HTML.");
      return;
    }

    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  return (
    <div className="budget-arbitrage-tool">
      <div className="budget-toolbar glass-panel">
        <div>
          <p className="eyebrow">Budget & Arbitrage</p>
          <h2>Calculette de budgetisation SI</h2>
          <p>
            Pilote projets, RH, licences, abonnements, TCO, ROI, autorisation cout / CA
            et prevision de budget futur dans une seule vue.
          </p>
        </div>
        <div className="budget-actions-panel structured-export-actions no-print">
          <button type="button" className="btn export-btn" onClick={previewPdfReport}>
            Exporter PDF
          </button>
          <button type="button" className="btn secondary-btn export-btn" onClick={exportHtmlReport}>
            Exporter HTML
          </button>
          <button type="button" className="btn secondary-btn" onClick={handleLoadCourseCase} disabled={isSaving}>
            Charger le cas pratique enrichi
          </button>
        </div>
      </div>

      {errorMessage ? <p className="tool-message">{errorMessage}</p> : null}

      <BudgetContextPanel
        settings={settings}
        onSettingsBlur={handleSaveSettings}
        onSettingsChange={setSettings}
      />

      <BudgetSummary summary={summary} />
      <BudgetVisualizations summary={summary} forecast={forecast} />
      <BudgetForecastPanel forecast={forecast} />

      <div className="budget-layout">
        <BudgetProjectForm
          key={editingProject?.id || "new-budget-project"}
          editingProject={editingProject}
          isSaving={isSaving}
          onCancelEdit={() => setEditingProject(null)}
          onSubmitProject={handleSubmitProject}
        />

        <div className="budget-results glass-panel">
          <BudgetArbitragePlan plan={arbitragePlan} />
          <BudgetProjectTable
            projects={sortedProjects}
            settings={settings}
            onDeleteProject={handleDeleteProject}
            onEditProject={setEditingProject}
          />
        </div>
      </div>

      <BudgetEmployeeManager
        employees={employees}
        isSaving={isSaving}
        onCreate={(employee) =>
          createItem(
            createBudgetEmployee,
            fetchEmployees,
            employee,
            "Impossible d enregistrer la ressource RH.",
          )
        }
        onDelete={(id) =>
          deleteItem(
            deleteBudgetEmployee,
            fetchEmployees,
            id,
            "Supprimer cette ressource RH ?",
            "Impossible de supprimer la ressource RH.",
          )
        }
        onUpdate={(id, employee) =>
          updateItem(
            updateBudgetEmployee,
            fetchEmployees,
            id,
            employee,
            "Impossible de modifier la ressource RH.",
          )
        }
      />

      <BudgetExpenseManager
        expenses={expenses}
        isSaving={isSaving}
        onCreate={(expense) =>
          createItem(
            createBudgetExpense,
            fetchExpenses,
            expense,
            "Impossible d enregistrer la licence ou l abonnement.",
          )
        }
        onDelete={(id) =>
          deleteItem(
            deleteBudgetExpense,
            fetchExpenses,
            id,
            "Supprimer cette licence ou cet abonnement ?",
            "Impossible de supprimer la depense.",
          )
        }
        onUpdate={(id, expense) =>
          updateItem(
            updateBudgetExpense,
            fetchExpenses,
            id,
            expense,
            "Impossible de modifier la depense.",
          )
        }
      />
    </div>
  );
}
