import { formatCurrency } from '../../utils/budgetArbitrage';

export default function BudgetForecastPanel({ forecast }) {
  const recommendation = forecast.canPlanLargerProject
    ? 'Projection favorable : un projet plus important peut etre planifie si le cash previsionnel se confirme.'
    : 'Projection prudente : conserver le budget actuel ou phaser les projets plus lourds.';

  return (
    <section className="glass-panel budget-forecast-panel" aria-labelledby="budget-forecast-title">
      <div className="section-heading">
        <p className="eyebrow">Algo de budget futur</p>
        <h2 id="budget-forecast-title">Capacite de financement previsionnelle</h2>
        <p>
          Projection basee sur la date cible, les rentrees d argent, les couts actuels,
          la tresorerie, la reserve minimale et la marge de securite.
        </p>
      </div>

      <div className="forecast-grid">
        <article>
          <span>Horizon</span>
          <strong>{forecast.months} mois</strong>
        </article>
        <article>
          <span>Cash-flow mensuel initial</span>
          <strong>{formatCurrency(forecast.monthlyNetCashflow)}</strong>
        </article>
        <article>
          <span>Cash cible projete</span>
          <strong>{formatCurrency(forecast.projectedCash)}</strong>
        </article>
        <article className={forecast.canPlanLargerProject ? 'summary-positive' : 'summary-negative'}>
          <span>Budget projet prudent</span>
          <strong>{formatCurrency(forecast.affordableBudget)}</strong>
        </article>
      </div>

      <p className="forecast-recommendation">{recommendation}</p>
      <p className="forecast-delta">
        Ecart vs budget courant : <strong>{formatCurrency(forecast.largerProjectDelta)}</strong>
      </p>
    </section>
  );
}
