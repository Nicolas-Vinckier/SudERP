import { formatCurrency, formatPercent } from '../../utils/budgetArbitrage';

export default function BudgetSummary({ summary }) {
  const remainingClassName = summary.remainingBudget >= 0
    ? 'summary-positive'
    : 'summary-negative';
  const marginClassName = summary.operatingMargin >= 0
    ? 'summary-positive'
    : 'summary-negative';

  return (
    <section className="budget-summary" aria-label="Synthese budgetaire">
      <article>
        <span>Budget disponible</span>
        <strong>{formatCurrency(summary.availableBudget)}</strong>
      </article>
      <article>
        <span>Chiffre d affaires</span>
        <strong>{formatCurrency(summary.annualRevenue)}</strong>
      </article>
      <article className={marginClassName}>
        <span>Marge actuelle</span>
        <strong>{formatCurrency(summary.operatingMargin)}</strong>
      </article>
      <article>
        <span>Couts annuels actuels</span>
        <strong>{formatCurrency(summary.currentAnnualRunRate)}</strong>
      </article>
      <article>
        <span>RH allouee</span>
        <strong>{formatCurrency(summary.annualHrCost)}</strong>
      </article>
      <article>
        <span>Licences & abonnements</span>
        <strong>{formatCurrency(summary.annualExpenseCost)}</strong>
      </article>
      <article>
        <span>Budget engage</span>
        <strong>{formatCurrency(summary.committedBudget)}</strong>
      </article>
      <article className={remainingClassName}>
        <span>Reste a arbitrer</span>
        <strong>{formatCurrency(summary.remainingBudget)}</strong>
      </article>
      <article>
        <span>Demandes totales</span>
        <strong>{formatCurrency(summary.totalRequestedBudget)}</strong>
      </article>
      <article>
        <span>Projets finances</span>
        <strong>{summary.fundedProjectsCount}/{summary.totalProjects}</strong>
      </article>
      <article>
        <span>TCO finance</span>
        <strong>{formatCurrency(summary.fundedTco)}</strong>
      </article>
      <article>
        <span>ROI global</span>
        <strong>{formatPercent(summary.globalRoi)}</strong>
      </article>
    </section>
  );
}
