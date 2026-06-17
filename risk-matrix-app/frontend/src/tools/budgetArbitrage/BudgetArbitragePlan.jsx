import BudgetDecisionBadge from './BudgetDecisionBadge';
import {
  formatCurrency,
  getScoreLabel,
  getScoreStatus
} from '../../utils/budgetArbitrage';

export default function BudgetArbitragePlan({ plan }) {
  if (plan.length === 0) return null;

  return (
    <section className="arbitrage-plan" aria-labelledby="arbitrage-plan-title">
      <div className="section-heading">
        <p className="eyebrow">Aide a la decision</p>
        <h2 id="arbitrage-plan-title">Arbitrage automatique</h2>
        <p>
          Les projets sont classes par caractere non negociable, score, reduction du risque,
          valeur metier, ROI puis budget demande.
        </p>
      </div>

      <div className="arbitrage-list">
        {plan.map((project, index) => (
          <article className="arbitrage-card" key={project.id}>
            <div className="arbitrage-rank">#{index + 1}</div>
            <div>
              <div className="arbitrage-card-header">
                <strong>{project.name}</strong>
                <BudgetDecisionBadge decision={project.recommendedDecision} />
              </div>
              <p>{project.recommendationReason}</p>
              <div className="arbitrage-meta">
                <span className={`score-pill score-pill-${getScoreStatus(project.score)}`}>
                  {project.score}/20 - {getScoreLabel(project.score)}
                </span>
                <span>{formatCurrency(project.fundingNeed)}</span>
                <span>Reste apres decision : {formatCurrency(project.remainingBudgetAfterDecision)}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
