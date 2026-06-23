import { useState } from 'react';
import {
  DEFAULT_BUDGET_EMPLOYEE,
  formatCurrency,
  formatPercent,
  getEmployeeAllocatedAnnualCost,
  getEmployeeGrossAnnualCost,
  getEmployeeLoadedAnnualCost
} from '../../utils/budgetArbitrage';

const numericFields = new Set([
  'weekly_hours',
  'hourly_rate',
  'workload_rate',
  'employer_charge_rate',
  'annual_bonus',
  'project_allocation_rate'
]);

const getBlankEmployee = () => ({ ...DEFAULT_BUDGET_EMPLOYEE });

export default function BudgetEmployeeManager({ employees, isSaving, onCreate, onUpdate, onDelete }) {
  const [formData, setFormData] = useState(getBlankEmployee);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previousData) => ({
      ...previousData,
      [name]: numericFields.has(name) ? Number(value) : value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (formData.id) {
      await onUpdate(formData.id, formData);
    } else {
      await onCreate(formData);
    }

    setFormData(getBlankEmployee());
  };

  const handleEdit = (employee) => {
    setFormData(employee);
  };

  const handleReset = () => {
    setFormData(getBlankEmployee());
  };

  return (
    <details className="budget-manager glass-panel" open>
      <summary>
        <span>
          <strong>Gestion RH</strong>
          <small>Salaires calcules via temps de travail, taux horaire, charges et allocation projet.</small>
        </span>
      </summary>

      <form className="budget-inline-form" onSubmit={handleSubmit}>
        <div className="form-grid three-columns">
          <div className="form-group compact-form-group">
            <label htmlFor="employee-full-name">Employe</label>
            <input
              id="employee-full-name"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Nom prenom"
              required
            />
          </div>
          <div className="form-group compact-form-group">
            <label htmlFor="employee-role">Role</label>
            <input
              id="employee-role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              placeholder="Admin, dev, support..."
            />
          </div>
          <div className="form-group compact-form-group">
            <label htmlFor="employee-department">Equipe</label>
            <input
              id="employee-department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              placeholder="DSI, support..."
            />
          </div>
        </div>

        <div className="form-grid six-columns">
          <div className="form-group compact-form-group">
            <label htmlFor="employee-weekly-hours">h/semaine</label>
            <input id="employee-weekly-hours" name="weekly_hours" type="number" min="0" max="80" step="0.5" value={formData.weekly_hours} onChange={handleChange} />
          </div>
          <div className="form-group compact-form-group">
            <label htmlFor="employee-hourly-rate">Taux horaire</label>
            <input id="employee-hourly-rate" name="hourly_rate" type="number" min="0" step="1" value={formData.hourly_rate} onChange={handleChange} />
          </div>
          <div className="form-group compact-form-group">
            <label htmlFor="employee-workload-rate">ETP</label>
            <input id="employee-workload-rate" name="workload_rate" type="number" min="0" max="1" step="0.05" value={formData.workload_rate} onChange={handleChange} />
          </div>
          <div className="form-group compact-form-group">
            <label htmlFor="employee-charge-rate">Charges</label>
            <input id="employee-charge-rate" name="employer_charge_rate" type="number" min="0" max="3" step="0.01" value={formData.employer_charge_rate} onChange={handleChange} />
          </div>
          <div className="form-group compact-form-group">
            <label htmlFor="employee-annual-bonus">Prime annuelle</label>
            <input id="employee-annual-bonus" name="annual_bonus" type="number" min="0" step="500" value={formData.annual_bonus} onChange={handleChange} />
          </div>
          <div className="form-group compact-form-group">
            <label htmlFor="employee-allocation-rate">Allocation projet</label>
            <input id="employee-allocation-rate" name="project_allocation_rate" type="number" min="0" max="1" step="0.05" value={formData.project_allocation_rate} onChange={handleChange} />
          </div>
        </div>

        <div className="form-grid three-columns">
          <div className="form-group compact-form-group">
            <label htmlFor="employee-start-date">Debut</label>
            <input id="employee-start-date" name="start_date" type="date" value={formData.start_date || ''} onChange={handleChange} />
          </div>
          <div className="form-group compact-form-group">
            <label htmlFor="employee-end-date">Fin</label>
            <input id="employee-end-date" name="end_date" type="date" value={formData.end_date || ''} onChange={handleChange} />
          </div>
          <div className="form-group compact-form-group">
            <label htmlFor="employee-notes">Notes</label>
            <input id="employee-notes" name="notes" value={formData.notes} onChange={handleChange} placeholder="Mission, projet, contrainte..." />
          </div>
        </div>

        <div className="calculation-preview">
          <span>Brut annuel : <strong>{formatCurrency(getEmployeeGrossAnnualCost(formData))}</strong></span>
          <span>Cout charge : <strong>{formatCurrency(getEmployeeLoadedAnnualCost(formData))}</strong></span>
          <span>Cout alloue : <strong>{formatCurrency(getEmployeeAllocatedAnnualCost(formData))}</strong></span>
        </div>

        <div className="form-actions compact-actions">
          <button type="submit" className="btn" disabled={isSaving}>
            {formData.id ? 'Enregistrer RH' : 'Ajouter RH'}
          </button>
          {formData.id ? (
            <button type="button" className="btn secondary-btn" onClick={handleReset}>Annuler</button>
          ) : null}
        </div>
      </form>

      {employees.length > 0 ? (
        <div className="responsive-table compact-table-wrapper">
          <table className="budget-project-table compact-table">
            <thead>
              <tr>
                <th>Employe</th>
                <th>Temps</th>
                <th>Couts</th>
                <th>Periode</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id}>
                  <td>
                    <strong>{employee.full_name}</strong>
                    <small>{employee.role} · {employee.department}</small>
                    {employee.notes ? <small>{employee.notes}</small> : null}
                  </td>
                  <td>
                    <strong>{employee.weekly_hours} h/sem</strong>
                    <small>ETP {formatPercent(employee.workload_rate * 100)}</small>
                    <small>Allocation {formatPercent(employee.project_allocation_rate * 100)}</small>
                  </td>
                  <td>
                    <strong>{formatCurrency(getEmployeeAllocatedAnnualCost(employee))}</strong>
                    <small>Charge total {formatCurrency(getEmployeeLoadedAnnualCost(employee))}</small>
                    <small>Taux {formatCurrency(employee.hourly_rate)}/h · charges {formatPercent(employee.employer_charge_rate * 100)}</small>
                  </td>
                  <td>
                    <small>Debut {employee.start_date || '-'}</small>
                    <small>Fin {employee.end_date || '-'}</small>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button type="button" className="small-btn" onClick={() => handleEdit(employee)}>Modifier</button>
                      <button type="button" className="small-btn danger-btn" onClick={() => onDelete(employee.id)}>Supprimer</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="manager-empty">Aucun cout RH saisi.</p>
      )}
    </details>
  );
}
