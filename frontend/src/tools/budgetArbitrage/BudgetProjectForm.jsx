import { useState } from 'react';
import {
  BUDGET_CATEGORIES,
  BUDGET_TYPES,
  DECISION_LABELS,
  DECISIONS,
  DEFAULT_BUDGET_PROJECT
} from '../../utils/budgetArbitrage';

const numericFields = new Set([
  'requested_budget',
  'capex_amount',
  'opex_amount_annual',
  'hidden_costs',
  'expected_gain_annual',
  'roi_horizon_years',
  'business_value',
  'risk_reduction',
  'roi_score',
  'complexity_score'
]);

const scoreFields = [
  ['business_value', 'Valeur metier'],
  ['risk_reduction', 'Risque reduit'],
  ['roi_score', 'ROI estime'],
  ['complexity_score', 'Complexite inverse']
];

export default function BudgetProjectForm({
  editingProject,
  isSaving,
  onCancelEdit,
  onSubmitProject
}) {
  const [formData, setFormData] = useState(() => editingProject || DEFAULT_BUDGET_PROJECT);

  const handleChange = (event) => {
    const { checked, name, type, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: type === 'checkbox'
        ? checked
        : numericFields.has(name)
          ? Number(value)
          : value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSubmitProject(formData);

    if (!editingProject) {
      setFormData(DEFAULT_BUDGET_PROJECT);
    }
  };

  const handleReset = () => {
    setFormData(DEFAULT_BUDGET_PROJECT);
    onCancelEdit();
  };

  return (
    <section className="glass-panel budget-form-panel" aria-labelledby="budget-form-title">
      <div className="section-heading">
        <p className="eyebrow">Budgetisation</p>
        <h2 id="budget-form-title">
          {editingProject ? 'Modifier un projet' : 'Nouveau projet IT'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="budget-project-form">
        <div className="form-group">
          <label htmlFor="budget-name">Nom du projet</label>
          <input
            id="budget-name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Ex. MFA, ERP, Migration Azure..."
          />
        </div>

        <div className="form-group">
          <label htmlFor="budget-description">Description</label>
          <textarea
            id="budget-description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            placeholder="Objectif, perimetre, contexte metier..."
          />
        </div>

        <div className="form-grid two-columns">
          <div className="form-group">
            <label htmlFor="budget-category">Poste de depense</label>
            <select
              id="budget-category"
              name="category"
              value={formData.category}
              onChange={handleChange}
            >
              {BUDGET_CATEGORIES.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="budget-type">Nature budgetaire</label>
            <select
              id="budget-type"
              name="budget_type"
              value={formData.budget_type}
              onChange={handleChange}
            >
              {BUDGET_TYPES.map((budgetType) => (
                <option key={budgetType} value={budgetType}>{budgetType}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-grid two-columns">
          <div className="form-group">
            <label htmlFor="requested-budget">Budget demande</label>
            <input
              id="requested-budget"
              name="requested_budget"
              type="number"
              min="0"
              step="1000"
              value={formData.requested_budget}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="roi-horizon-years">Horizon ROI/TCO</label>
            <input
              id="roi-horizon-years"
              name="roi_horizon_years"
              type="number"
              min="1"
              max="10"
              value={formData.roi_horizon_years}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-grid three-columns">
          <div className="form-group">
            <label htmlFor="capex-amount">CAPEX</label>
            <input
              id="capex-amount"
              name="capex_amount"
              type="number"
              min="0"
              step="1000"
              value={formData.capex_amount}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="opex-amount-annual">OPEX annuel</label>
            <input
              id="opex-amount-annual"
              name="opex_amount_annual"
              type="number"
              min="0"
              step="1000"
              value={formData.opex_amount_annual}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="hidden-costs">Couts caches</label>
            <input
              id="hidden-costs"
              name="hidden_costs"
              type="number"
              min="0"
              step="1000"
              value={formData.hidden_costs}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="expected-gain-annual">Gain annuel attendu</label>
          <input
            id="expected-gain-annual"
            name="expected_gain_annual"
            type="number"
            min="0"
            step="1000"
            value={formData.expected_gain_annual}
            onChange={handleChange}
          />
        </div>

        <fieldset className="score-fieldset">
          <legend>Grille de scoring multicriteres /20</legend>
          <div className="form-grid two-columns">
            {scoreFields.map(([fieldName, label]) => (
              <div className="form-group" key={fieldName}>
                <label htmlFor={fieldName}>{label} /5</label>
                <input
                  id={fieldName}
                  name={fieldName}
                  type="number"
                  min="1"
                  max="5"
                  value={formData[fieldName]}
                  onChange={handleChange}
                  required
                />
              </div>
            ))}
          </div>
        </fieldset>

        <div className="form-grid two-columns">
          <div className="form-group">
            <label htmlFor="budget-decision">Decision</label>
            <select
              id="budget-decision"
              name="decision"
              value={formData.decision}
              onChange={handleChange}
            >
              {Object.values(DECISIONS).map((decision) => (
                <option key={decision} value={decision}>{DECISION_LABELS[decision]}</option>
              ))}
            </select>
          </div>

          <label className="checkbox-card" htmlFor="is-mandatory">
            <input
              id="is-mandatory"
              name="is_mandatory"
              type="checkbox"
              checked={formData.is_mandatory}
              onChange={handleChange}
            />
            <span>
              <strong>Projet non negociable</strong>
              <small>Obligation reglementaire, securite critique ou continuite d activite.</small>
            </span>
          </label>
        </div>

        <div className="form-group">
          <label htmlFor="justification">Justification d arbitrage</label>
          <textarea
            id="justification"
            name="justification"
            value={formData.justification}
            onChange={handleChange}
            placeholder="Pourquoi financer, reporter ou revoir le scope ?"
          />
        </div>

        <div className="form-group">
          <label htmlFor="accepted-risk">Risque accepte si projet reporte</label>
          <textarea
            id="accepted-risk"
            name="accepted_risk"
            value={formData.accepted_risk}
            onChange={handleChange}
            placeholder="Risque assume et message a communiquer a la direction."
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn" disabled={isSaving}>
            {editingProject ? 'Enregistrer' : 'Ajouter au portefeuille'}
          </button>
          {editingProject ? (
            <button type="button" className="btn secondary-btn" onClick={handleReset}>
              Annuler
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}
