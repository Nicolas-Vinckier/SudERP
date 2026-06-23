import { DEFAULT_BUDGET_SETTINGS } from '../../utils/budgetArbitrage';

const numericFields = new Set([
  'available_budget',
  'annual_revenue',
  'current_annual_costs',
  'cash_reserve',
  'forecast_monthly_revenue',
  'forecast_monthly_costs',
  'safety_margin_percent',
  'minimum_cash_buffer',
  'max_project_cost_revenue_ratio',
  'monthly_revenue_growth_percent',
  'monthly_cost_growth_percent'
]);

const fields = [
  ['available_budget', 'Budget disponible', 10000],
  ['annual_revenue', 'Chiffre d affaires annuel', 50000],
  ['current_annual_costs', 'Couts annuels actuels hors RH/licences', 10000],
  ['cash_reserve', 'Tresorerie disponible', 10000],
  ['forecast_monthly_revenue', 'Rentrees mensuelles prevues', 5000],
  ['forecast_monthly_costs', 'Couts mensuels additionnels prevus', 5000],
  ['minimum_cash_buffer', 'Reserve minimale a conserver', 5000],
  ['safety_margin_percent', 'Marge de securite budgetaire (%)', 1],
  ['max_project_cost_revenue_ratio', 'Seuil cout projet / CA (%)', 1],
  ['monthly_revenue_growth_percent', 'Croissance mensuelle des rentrees (%)', 0.1],
  ['monthly_cost_growth_percent', 'Croissance mensuelle des couts (%)', 0.1]
];

export default function BudgetContextPanel({ settings, onSettingsChange, onSettingsBlur }) {
  const currentSettings = { ...DEFAULT_BUDGET_SETTINGS, ...settings };

  const handleChange = (event) => {
    const { name, value } = event.target;
    onSettingsChange({
      ...currentSettings,
      [name]: numericFields.has(name) ? Number(value) : value
    });
  };

  return (
    <section className="glass-panel budget-context-panel" aria-labelledby="budget-context-title">
      <div className="section-heading">
        <p className="eyebrow">Contexte financier</p>
        <h2 id="budget-context-title">Budget, CA et projection</h2>
        <p>
          Ces donnees pilotent l autorisation automatique des projets, le risque cout / chiffre d affaires
          et la proposition de budget futur.
        </p>
      </div>

      <div className="form-grid four-columns">
        {fields.map(([name, label, step]) => (
          <div className="form-group compact-form-group" key={name}>
            <label htmlFor={`budget-context-${name}`}>{label}</label>
            <input
              id={`budget-context-${name}`}
              name={name}
              type="number"
              min={name.includes('percent') || name.includes('ratio') ? '-50' : '0'}
              step={step}
              value={currentSettings[name]}
              onBlur={onSettingsBlur}
              onChange={handleChange}
            />
          </div>
        ))}

        <div className="form-group compact-form-group">
          <label htmlFor="forecast-target-date">Date cible de projection</label>
          <input
            id="forecast-target-date"
            name="forecast_target_date"
            type="date"
            value={currentSettings.forecast_target_date || ''}
            onBlur={onSettingsBlur}
            onChange={handleChange}
          />
        </div>
      </div>
    </section>
  );
}
