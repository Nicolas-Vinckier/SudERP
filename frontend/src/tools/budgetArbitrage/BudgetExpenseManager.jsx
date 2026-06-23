import { useState } from 'react';
import {
  BILLING_FREQUENCIES,
  BILLING_FREQUENCY_LABELS,
  DEFAULT_BUDGET_EXPENSE,
  EXPENSE_TYPES,
  formatCurrency,
  getExpenseAnnualCost,
  getExpenseOneTimeCost,
  getExpenseTco
} from '../../utils/budgetArbitrage';

const numericFields = new Set(['unit_cost', 'quantity']);

const getBlankExpense = () => ({ ...DEFAULT_BUDGET_EXPENSE });

export default function BudgetExpenseManager({ expenses, isSaving, onCreate, onUpdate, onDelete }) {
  const [formData, setFormData] = useState(getBlankExpense);

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

    if (formData.id) {
      await onUpdate(formData.id, formData);
    } else {
      await onCreate(formData);
    }

    setFormData(getBlankExpense());
  };

  const handleEdit = (expense) => {
    setFormData(expense);
  };

  const handleReset = () => {
    setFormData(getBlankExpense());
  };

  return (
    <details className="budget-manager glass-panel" open>
      <summary>
        <span>
          <strong>Licences & abonnements</strong>
          <small>Licences ponctuelles, mensuelles, annuelles, hebergement, logiciel et prestataires.</small>
        </span>
      </summary>

      <form className="budget-inline-form" onSubmit={handleSubmit}>
        <div className="form-grid three-columns">
          <div className="form-group compact-form-group">
            <label htmlFor="expense-name">Nom</label>
            <input
              id="expense-name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Microsoft 365, Azure, infogerance..."
              required
            />
          </div>
          <div className="form-group compact-form-group">
            <label htmlFor="expense-type">Type</label>
            <select id="expense-type" name="expense_type" value={formData.expense_type} onChange={handleChange}>
              {EXPENSE_TYPES.map((expenseType) => (
                <option key={expenseType} value={expenseType}>{expenseType}</option>
              ))}
            </select>
          </div>
          <div className="form-group compact-form-group">
            <label htmlFor="expense-frequency">Periodicite</label>
            <select id="expense-frequency" name="billing_frequency" value={formData.billing_frequency} onChange={handleChange}>
              {Object.values(BILLING_FREQUENCIES).map((frequency) => (
                <option key={frequency} value={frequency}>{BILLING_FREQUENCY_LABELS[frequency]}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-grid six-columns">
          <div className="form-group compact-form-group">
            <label htmlFor="expense-unit-cost">Prix unitaire</label>
            <input id="expense-unit-cost" name="unit_cost" type="number" min="0" step="100" value={formData.unit_cost} onChange={handleChange} />
          </div>
          <div className="form-group compact-form-group">
            <label htmlFor="expense-quantity">Quantite</label>
            <input id="expense-quantity" name="quantity" type="number" min="0" step="1" value={formData.quantity} onChange={handleChange} />
          </div>
          <div className="form-group compact-form-group">
            <label htmlFor="expense-vendor">Fournisseur</label>
            <input id="expense-vendor" name="vendor" value={formData.vendor} onChange={handleChange} placeholder="Editeur, ESN..." />
          </div>
          <div className="form-group compact-form-group">
            <label htmlFor="expense-owner">Responsable</label>
            <input id="expense-owner" name="owner" value={formData.owner} onChange={handleChange} placeholder="Equipe ou owner" />
          </div>
          <div className="form-group compact-form-group">
            <label htmlFor="expense-start-date">Debut</label>
            <input id="expense-start-date" name="start_date" type="date" value={formData.start_date || ''} onChange={handleChange} />
          </div>
          <div className="form-group compact-form-group">
            <label htmlFor="expense-end-date">Fin / renouvellement</label>
            <input id="expense-end-date" name="end_date" type="date" value={formData.end_date || ''} onChange={handleChange} />
          </div>
        </div>

        <div className="form-grid two-columns">
          <label className="checkbox-card compact-checkbox" htmlFor="expense-is-critical">
            <input id="expense-is-critical" name="is_critical" type="checkbox" checked={formData.is_critical} onChange={handleChange} />
            <span>
              <strong>Critique SI</strong>
              <small>A conserver dans les arbitrages budgetaires.</small>
            </span>
          </label>
          <div className="form-group compact-form-group">
            <label htmlFor="expense-notes">Notes</label>
            <input id="expense-notes" name="notes" value={formData.notes} onChange={handleChange} placeholder="Contrat, renouvellement, engagement..." />
          </div>
        </div>

        <div className="calculation-preview">
          <span>Annuel recurrent : <strong>{formatCurrency(getExpenseAnnualCost(formData))}</strong></span>
          <span>Ponctuel : <strong>{formatCurrency(getExpenseOneTimeCost(formData))}</strong></span>
          <span>TCO 3 ans : <strong>{formatCurrency(getExpenseTco(formData, 3))}</strong></span>
        </div>

        <div className="form-actions compact-actions">
          <button type="submit" className="btn" disabled={isSaving}>
            {formData.id ? 'Enregistrer depense' : 'Ajouter depense'}
          </button>
          {formData.id ? (
            <button type="button" className="btn secondary-btn" onClick={handleReset}>Annuler</button>
          ) : null}
        </div>
      </form>

      {expenses.length > 0 ? (
        <div className="responsive-table compact-table-wrapper">
          <table className="budget-project-table compact-table">
            <thead>
              <tr>
                <th>Depense</th>
                <th>Facturation</th>
                <th>Couts</th>
                <th>Contrat</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id}>
                  <td>
                    <strong>{expense.name}</strong>
                    <small>{expense.expense_type} · {expense.vendor || 'Fournisseur libre'}</small>
                    {expense.is_critical ? <em className="critical-pill">Critique</em> : null}
                    {expense.notes ? <small>{expense.notes}</small> : null}
                  </td>
                  <td>
                    <strong>{BILLING_FREQUENCY_LABELS[expense.billing_frequency]}</strong>
                    <small>{expense.quantity} × {formatCurrency(expense.unit_cost)}</small>
                    <small>Owner {expense.owner || '-'}</small>
                  </td>
                  <td>
                    <strong>{formatCurrency(getExpenseAnnualCost(expense))}/an</strong>
                    <small>Ponctuel {formatCurrency(getExpenseOneTimeCost(expense))}</small>
                    <small>TCO 3 ans {formatCurrency(getExpenseTco(expense, 3))}</small>
                  </td>
                  <td>
                    <small>Debut {expense.start_date || '-'}</small>
                    <small>Fin {expense.end_date || '-'}</small>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button type="button" className="small-btn" onClick={() => handleEdit(expense)}>Modifier</button>
                      <button type="button" className="small-btn danger-btn" onClick={() => onDelete(expense.id)}>Supprimer</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="manager-empty">Aucune licence ou abonnement saisi.</p>
      )}
    </details>
  );
}
