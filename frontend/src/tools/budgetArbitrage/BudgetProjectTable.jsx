import BudgetDecisionBadge from './BudgetDecisionBadge';
import {
  AUTHORIZATION_STATUS,
  formatCurrency,
  formatDecimal,
  formatPercent,
  getBudgetScore,
  getPaybackMonths,
  getProjectAuthorization,
  getRoi,
  getScoreLabel,
  getScoreStatus,
  getTco
} from '../../utils/budgetArbitrage';

const formatPayback = (value) => {
  if (value === null) return '-';
  return `${Math.round(value)} mois`;
};

function ScorePill({ score }) {
  return (
    <span className={`score-pill score-pill-${getScoreStatus(score)}`}>
      {score}/20 - {getScoreLabel(score)}
    </span>
  );
}

function AuthorizationPill({ authorization }) {
  const className = authorization.status === AUTHORIZATION_STATUS.APPROVED
    ? 'authorization-approved'
    : authorization.status === AUTHORIZATION_STATUS.WATCH
      ? 'authorization-watch'
      : authorization.status === AUTHORIZATION_STATUS.RISKY
        ? 'authorization-risky'
        : 'authorization-blocked';

  return (
    <span className={`authorization-pill ${className}`} title={authorization.reason}>
      {authorization.label}
    </span>
  );
}

export default function BudgetProjectTable({ projects, settings, onDeleteProject, onEditProject }) {
  if (projects.length === 0) {
    return (
      <section className="empty-state glass-panel">
        <h2>Portefeuille vide</h2>
        <p>Ajoute un projet IT ou charge le cas pratique du cours pour commencer l arbitrage.</p>
      </section>
    );
  }

  return (
    <section className="budget-table-wrapper" aria-labelledby="budget-table-title">
      <div className="section-heading inline-heading">
        <div>
          <p className="eyebrow">Portefeuille</p>
          <h2 id="budget-table-title">Projets budgetaires</h2>
        </div>
      </div>

      <div className="responsive-table">
        <table className="budget-project-table">
          <caption>Liste des projets IT, scores financiers et decisions d arbitrage.</caption>
          <thead>
            <tr>
              <th scope="col">Projet</th>
              <th scope="col">Budget</th>
              <th scope="col">TCO / ROI</th>
              <th scope="col">Autorisation</th>
              <th scope="col">Score</th>
              <th scope="col">Decision</th>
              <th scope="col">Risque accepte</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => {
              const score = getBudgetScore(project);
              const paybackMonths = getPaybackMonths(project);
              const authorization = getProjectAuthorization(project, settings);

              return (
                <tr key={project.id}>
                  <td>
                    <div className="project-title-cell">
                      <strong>{project.name}</strong>
                      <span>{project.description}</span>
                      <small>{project.category} · {project.budget_type}</small>
                      {project.is_mandatory ? <em>Non negociable</em> : null}
                    </div>
                  </td>
                  <td>
                    <strong>{formatCurrency(project.requested_budget)}</strong>
                    <small>CAPEX {formatCurrency(project.capex_amount)}</small>
                    <small>OPEX/an {formatCurrency(project.opex_amount_annual)}</small>
                    <small>Couts caches {formatCurrency(project.hidden_costs)}</small>
                  </td>
                  <td>
                    <strong>TCO {formatCurrency(getTco(project))}</strong>
                    <small>ROI {formatPercent(getRoi(project))}</small>
                    <small>Payback {formatPayback(paybackMonths)}</small>
                    <small>Gain total {formatCurrency(project.expected_gain_annual * project.roi_horizon_years)}</small>
                  </td>
                  <td>
                    <AuthorizationPill authorization={authorization} />
                    <small>{formatDecimal(authorization.costToRevenueRatio)} % du CA</small>
                    <small>Seuil {formatDecimal(authorization.maxRatio)} %</small>
                    <small>{authorization.reason}</small>
                  </td>
                  <td>
                    <ScorePill score={score} />
                    <small>
                      VM {project.business_value} · RR {project.risk_reduction} · ROI {project.roi_score} · CX {project.complexity_score}
                    </small>
                  </td>
                  <td>
                    <BudgetDecisionBadge decision={project.decision} />
                    {project.justification ? <small>{project.justification}</small> : null}
                  </td>
                  <td>
                    <span className="accepted-risk-text">{project.accepted_risk || '-'}</span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button type="button" className="small-btn" onClick={() => onEditProject(project)}>
                        Modifier
                      </button>
                      <button type="button" className="small-btn danger-btn" onClick={() => onDeleteProject(project.id)}>
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
