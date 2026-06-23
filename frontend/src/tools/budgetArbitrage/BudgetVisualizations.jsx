import {
  formatCurrency,
  formatPercent,
  getCostBreakdown
} from '../../utils/budgetArbitrage';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const buildPieGradient = (items) => {
  if (items.length === 0) {
    return 'conic-gradient(var(--surface-muted-color) 0deg 360deg)';
  }

  let cursor = 0;
  const stops = items.map((item, index) => {
    const start = cursor;
    cursor += item.percent * 3.6;
    return `${CHART_COLORS[index % CHART_COLORS.length]} ${start}deg ${cursor}deg`;
  });

  return `conic-gradient(${stops.join(', ')})`;
};

export default function BudgetVisualizations({ summary, forecast }) {
  const costBreakdown = getCostBreakdown(summary);
  const pieGradient = buildPieGradient(costBreakdown);
  const roiGaugeWidth = `${Math.min(Math.max(summary.globalRoi, 0), 150) / 150 * 100}%`;
  const marginGaugeWidth = summary.annualRevenue === 0
    ? '0%'
    : `${Math.min(Math.max((summary.operatingMargin / summary.annualRevenue) * 100, 0), 100)}%`;
  const maxForecastCash = Math.max(...forecast.points.map((point) => point.projectedCash), forecast.projectedCash, 1);

  return (
    <section className="budget-visualizations" aria-label="Visualisations budgetaires">
      <article className="glass-panel visualization-card">
        <div className="section-heading">
          <p className="eyebrow">ROI</p>
          <h2>Retour portefeuille</h2>
        </div>
        <div className="metric-highlight">
          <strong>{formatPercent(summary.globalRoi)}</strong>
          <span>ROI global des projets finances</span>
        </div>
        <div className="gauge">
          <span style={{ width: roiGaugeWidth }} />
        </div>
        <div className="chart-metrics">
          <span>TCO finance <strong>{formatCurrency(summary.fundedTco)}</strong></span>
          <span>Gains finances <strong>{formatCurrency(summary.fundedGain)}</strong></span>
        </div>
      </article>

      <article className="glass-panel visualization-card">
        <div className="section-heading">
          <p className="eyebrow">Camembert</p>
          <h2>Structure des couts annuels</h2>
        </div>
        <div className="pie-chart-layout">
          <div className="pie-chart" style={{ background: pieGradient }} aria-hidden="true" />
          <div className="pie-legend">
            {costBreakdown.length > 0 ? costBreakdown.map((item, index) => (
              <span key={item.label}>
                <i style={{ background: CHART_COLORS[index % CHART_COLORS.length] }} />
                {item.label} · {formatPercent(item.percent)} · {formatCurrency(item.value)}
              </span>
            )) : <span>Aucun cout annuel a afficher.</span>}
          </div>
        </div>
      </article>

      <article className="glass-panel visualization-card">
        <div className="section-heading">
          <p className="eyebrow">Run rate</p>
          <h2>Marge operationnelle</h2>
        </div>
        <div className="metric-highlight">
          <strong>{formatCurrency(summary.operatingMargin)}</strong>
          <span>CA annuel - couts annuels actuels</span>
        </div>
        <div className="gauge margin-gauge">
          <span style={{ width: marginGaugeWidth }} />
        </div>
        <div className="chart-metrics">
          <span>CA annuel <strong>{formatCurrency(summary.annualRevenue)}</strong></span>
          <span>Burn ratio <strong>{formatPercent(summary.burnRatio)}</strong></span>
        </div>
      </article>

      <article className="glass-panel visualization-card">
        <div className="section-heading">
          <p className="eyebrow">Projection</p>
          <h2>Cash previsionnel</h2>
        </div>
        <div className="forecast-mini-chart">
          {forecast.points.slice(-12).map((point) => (
            <span
              key={point.monthIndex}
              title={`${point.date} - ${formatCurrency(point.projectedCash)}`}
              style={{ height: `${Math.max((point.projectedCash / maxForecastCash) * 100, 4)}%` }}
            />
          ))}
        </div>
        <div className="chart-metrics">
          <span>Budget prudent futur <strong>{formatCurrency(forecast.affordableBudget)}</strong></span>
          <span>Cash cible <strong>{formatCurrency(forecast.projectedCash)}</strong></span>
        </div>
      </article>
    </section>
  );
}
