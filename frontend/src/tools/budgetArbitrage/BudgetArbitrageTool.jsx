import { useCallback, useEffect, useMemo, useState } from 'react';
import BudgetArbitragePlan from './BudgetArbitragePlan';
import BudgetContextPanel from './BudgetContextPanel';
import BudgetEmployeeManager from './BudgetEmployeeManager';
import BudgetExpenseManager from './BudgetExpenseManager';
import BudgetForecastPanel from './BudgetForecastPanel';
import BudgetProjectForm from './BudgetProjectForm';
import BudgetProjectTable from './BudgetProjectTable';
import BudgetSummary from './BudgetSummary';
import BudgetVisualizations from './BudgetVisualizations';
import {
  DECISIONS,
  DEFAULT_BUDGET_SETTINGS,
  BILLING_FREQUENCIES,
  buildArbitragePlan,
  getBudgetForecast,
  getPortfolioSummary,
  normalizeSettings,
  sortProjectsForArbitrage
} from '../../utils/budgetArbitrage';
import {
  getBudgetSettings,
  updateBudgetSettings
} from '../../services/budgetSettingsApi';
import {
  createBudgetProject,
  deleteBudgetProject,
  getBudgetProjects,
  updateBudgetProject
} from '../../services/budgetProjectsApi';
import {
  createBudgetEmployee,
  deleteBudgetEmployee,
  getBudgetEmployees,
  updateBudgetEmployee
} from '../../services/budgetEmployeesApi';
import {
  createBudgetExpense,
  deleteBudgetExpense,
  getBudgetExpenses,
  updateBudgetExpense
} from '../../services/budgetExpensesApi';

const COURSE_CASE_PROJECTS = [
  {
    name: 'MFA',
    description: 'Deploiement de l authentification multi-facteurs sur tous les acces.',
    category: 'Securite',
    budget_type: 'OPEX',
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
    justification: 'Exige par l assurance cyber et tres fort levier de reduction du risque.',
    accepted_risk: 'Risque accru de compromission de comptes si reporte.'
  },
  {
    name: 'EDR',
    description: 'Solution de detection et reponse sur les endpoints pour 300 postes.',
    category: 'Securite',
    budget_type: 'OPEX',
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
    justification: 'Priorite securite apres incident observe dans le secteur.',
    accepted_risk: 'Detection tardive des attaques endpoint si non finance.'
  },
  {
    name: 'ERP',
    description: 'Remplacement du systeme de gestion vieillissant.',
    category: 'Metier',
    budget_type: 'Mixte',
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
    justification: 'Obsolescence forte et impact metier direct.',
    accepted_risk: 'Maintien de processus manuels, dette applicative et risque de rupture de support.'
  },
  {
    name: 'Migration Azure',
    description: 'Migration des serveurs on-premise vers Azure.',
    category: 'Cloud & Hebergement',
    budget_type: 'OPEX',
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
    justification: 'Projet interessant, mais a piloter avec FinOps pour eviter la derive cloud.',
    accepted_risk: 'Maintien temporaire de la salle serveur et de la maintenance materielle.'
  },
  {
    name: 'SIEM',
    description: 'Supervision de securite centralisee des logs et alertes.',
    category: 'Securite',
    budget_type: 'OPEX',
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
    justification: 'Forte valeur securite mais budget et complexite eleves.',
    accepted_risk: 'Visibilite limitee sur les signaux faibles de compromission.'
  },
  {
    name: 'Site web',
    description: 'Refonte du site web et du tunnel de vente en ligne.',
    category: 'Metier',
    budget_type: 'CAPEX',
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
    justification: 'Projet business attractif, a arbitrer apres les chantiers cyber.',
    accepted_risk: 'Conversion web sous-optimale pendant la periode de report.'
  }
];

const COURSE_CASE_EMPLOYEES = [
  {
    full_name: 'Responsable SI',
    role: 'Pilotage portefeuille et fournisseurs',
    department: 'DSI',
    weekly_hours: 35,
    hourly_rate: 55,
    workload_rate: 1,
    employer_charge_rate: 0.45,
    annual_bonus: 4000,
    project_allocation_rate: 0.35,
    start_date: '',
    end_date: '',
    notes: 'Temps de pilotage alloue aux projets budgetaires.'
  },
  {
    full_name: 'Administrateur systemes',
    role: 'Infrastructure, M365, securite',
    department: 'DSI',
    weekly_hours: 35,
    hourly_rate: 38,
    workload_rate: 1,
    employer_charge_rate: 0.45,
    annual_bonus: 2500,
    project_allocation_rate: 0.45,
    start_date: '',
    end_date: '',
    notes: 'Charge interne de deploiement et maintien en conditions operationnelles.'
  }
];

const COURSE_CASE_EXPENSES = [
  {
    name: 'Microsoft 365 Business Premium',
    expense_type: 'Abonnement logiciel',
    billing_frequency: BILLING_FREQUENCIES.MONTHLY,
    unit_cost: 20,
    quantity: 250,
    start_date: '',
    end_date: '',
    owner: 'DSI',
    vendor: 'Microsoft',
    is_critical: true,
    notes: 'Suite collaborative, identite, MDM et securite endpoint de base.'
  },
  {
    name: 'Hebergement cloud applicatif',
    expense_type: 'Hebergement',
    billing_frequency: BILLING_FREQUENCIES.MONTHLY,
    unit_cost: 3000,
    quantity: 1,
    start_date: '',
    end_date: '',
    owner: 'Infrastructure',
    vendor: 'Azure',
    is_critical: true,
    notes: 'A surveiller avec FinOps pour limiter les derives.'
  },
  {
    name: 'Infogerance support N2',
    expense_type: 'Prestataire',
    billing_frequency: BILLING_FREQUENCIES.ANNUAL,
    unit_cost: 45000,
    quantity: 1,
    start_date: '',
    end_date: '',
    owner: 'Support',
    vendor: 'ESN',
    is_critical: false,
    notes: 'Renfort support et administration recurrente.'
  }
];

export default function BudgetArbitrageTool() {
  const [settings, setSettings] = useState(DEFAULT_BUDGET_SETTINGS);
  const [budgetProjects, setBudgetProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [editingProject, setEditingProject] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchBudgetProjects = useCallback(async () => {
    try {
      const response = await getBudgetProjects();
      setBudgetProjects(response.data);
      setErrorMessage('');
    } catch (error) {
      console.error('Failed to fetch budget projects', error);
      setErrorMessage('Impossible de charger les projets budgetaires.');
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      const response = await getBudgetEmployees();
      setEmployees(response.data);
    } catch (error) {
      console.error('Failed to fetch budget employees', error);
      setErrorMessage('Impossible de charger les donnees RH.');
    }
  }, []);

  const fetchExpenses = useCallback(async () => {
    try {
      const response = await getBudgetExpenses();
      setExpenses(response.data);
    } catch (error) {
      console.error('Failed to fetch budget expenses', error);
      setErrorMessage('Impossible de charger les licences et abonnements.');
    }
  }, []);

  const fetchBudgetSettings = useCallback(async () => {
    try {
      const fetchedSettings = await getBudgetSettings();
      setSettings(normalizeSettings(fetchedSettings));
    } catch (error) {
      console.error('Failed to fetch budget settings', error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchBudgetProjects(),
        fetchEmployees(),
        fetchExpenses(),
        fetchBudgetSettings()
      ]);
    };

    loadData();
  }, [fetchBudgetProjects, fetchBudgetSettings, fetchEmployees, fetchExpenses]);

  const sortedProjects = useMemo(
    () => sortProjectsForArbitrage(budgetProjects, settings),
    [budgetProjects, settings]
  );

  const summary = useMemo(
    () => getPortfolioSummary({
      projects: budgetProjects,
      availableBudget: settings.available_budget,
      settings,
      employees,
      expenses
    }),
    [budgetProjects, employees, expenses, settings]
  );

  const arbitragePlan = useMemo(
    () => buildArbitragePlan(budgetProjects, settings.available_budget, settings),
    [budgetProjects, settings]
  );

  const forecast = useMemo(
    () => getBudgetForecast({ settings, employees, expenses, projects: budgetProjects }),
    [budgetProjects, employees, expenses, settings]
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
        console.error('Failed to save budget project', error);
        setErrorMessage('Impossible d enregistrer le projet budgetaire.');
      } finally {
        setIsSaving(false);
      }
    },
    [fetchBudgetProjects]
  );

  const handleDeleteProject = useCallback(
    async (id) => {
      const shouldDelete = window.confirm('Supprimer ce projet budgetaire ?');
      if (!shouldDelete) return;

      try {
        await deleteBudgetProject(id);
        await fetchBudgetProjects();
      } catch (error) {
        console.error('Failed to delete budget project', error);
        setErrorMessage('Impossible de supprimer le projet budgetaire.');
      }
    },
    [fetchBudgetProjects]
  );

  const handleSaveSettings = async () => {
    try {
      await updateBudgetSettings(settings);
    } catch (error) {
      console.error('Failed to save budget settings', error);
      setErrorMessage('Impossible de sauvegarder le contexte financier.');
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

  const deleteItem = async (deleteFn, refreshFn, id, confirmText, errorText) => {
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
    const shouldLoad = window.confirm('Charger le cas pratique avec projets, RH, licences et abonnements ?');
    if (!shouldLoad) return;

    setIsSaving(true);
    try {
      await Promise.all([
        ...COURSE_CASE_PROJECTS.map((project) => createBudgetProject(project)),
        ...COURSE_CASE_EMPLOYEES.map((employee) => createBudgetEmployee(employee)),
        ...COURSE_CASE_EXPENSES.map((expense) => createBudgetExpense(expense))
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
        max_project_cost_revenue_ratio: 8
      });
      await Promise.all([
        fetchBudgetProjects(),
        fetchEmployees(),
        fetchExpenses(),
        fetchBudgetSettings()
      ]);
    } catch (error) {
      console.error('Failed to load course case', error);
      setErrorMessage('Impossible de charger le cas pratique.');
    } finally {
      setIsSaving(false);
    }
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
        <div className="budget-actions-panel">
          <button type="button" className="btn" onClick={handleLoadCourseCase} disabled={isSaving}>
            Charger le cas pratique enrichi
          </button>
          <small>
            Ajoute les projets du cours, une base RH et des abonnements exemples pour tester la calculette.
          </small>
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
          key={editingProject?.id || 'new-budget-project'}
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
        onCreate={(employee) => createItem(createBudgetEmployee, fetchEmployees, employee, 'Impossible d enregistrer la ressource RH.')}
        onDelete={(id) => deleteItem(deleteBudgetEmployee, fetchEmployees, id, 'Supprimer cette ressource RH ?', 'Impossible de supprimer la ressource RH.')}
        onUpdate={(id, employee) => updateItem(updateBudgetEmployee, fetchEmployees, id, employee, 'Impossible de modifier la ressource RH.')}
      />

      <BudgetExpenseManager
        expenses={expenses}
        isSaving={isSaving}
        onCreate={(expense) => createItem(createBudgetExpense, fetchExpenses, expense, 'Impossible d enregistrer la licence ou l abonnement.')}
        onDelete={(id) => deleteItem(deleteBudgetExpense, fetchExpenses, id, 'Supprimer cette licence ou cet abonnement ?', 'Impossible de supprimer la depense.')}
        onUpdate={(id, expense) => updateItem(updateBudgetExpense, fetchExpenses, id, expense, 'Impossible de modifier la depense.')}
      />
    </div>
  );
}
