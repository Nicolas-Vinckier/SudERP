import {
  getRiskLevel,
  getRisksForCell,
  getScore,
  IMPACT_LEVELS,
  PROBABILITY_LEVELS,
  RISK_LEVELS,
} from './riskMatrix';

const LEVEL_LABELS = {
  [RISK_LEVELS.LOW]: 'Faible',
  [RISK_LEVELS.MEDIUM]: 'Moyen',
  [RISK_LEVELS.HIGH]: 'Eleve',
};

const LEVEL_COLORS = {
  [RISK_LEVELS.LOW]: '#10b981',
  [RISK_LEVELS.MEDIUM]: '#f59e0b',
  [RISK_LEVELS.HIGH]: '#ef4444',
};

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatText(value, fallback = '-') {
  const normalized = String(value ?? '').trim();
  if (!normalized) return `<span class="muted">${escapeHtml(fallback)}</span>`;
  return escapeHtml(normalized).replace(/\n/g, '<br>');
}

function formatNumber(value, maximumFractionDigits = 1) {
  return new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits,
  }).format(Number(value || 0));
}

function buildRiskChips(risks, compact = false) {
  if (risks.length === 0) return '<span class="cell-empty">-</span>';

  return risks.map((risk) => {
    const score = getScore(risk);
    const level = getRiskLevel(score);
    return `<article class="risk-chip ${compact ? 'risk-chip-compact' : ''}">
      <div class="risk-chip-head">
        <strong>${formatText(risk.description, 'Risque sans description')}</strong>
        <span class="score-badge score-${level}">${score}</span>
      </div>
      <div class="risk-chip-meta">
        <span>${escapeHtml(risk.cia_pillar || '-')}</span>
        <span>${formatText(risk.mitigation, 'Mesure a completer')}</span>
      </div>
    </article>`;
  }).join('');
}

function buildMatrixRows(risksByCell) {
  return IMPACT_LEVELS.map((impact) => `<tr>
    <th scope="row">I ${impact}</th>
    ${PROBABILITY_LEVELS.map((probability) => {
      const score = probability * impact;
      const level = getRiskLevel(score);
      const cellRisks = getRisksForCell(risksByCell, probability, impact);
      return `<td class="matrix-cell matrix-cell-${level}">
        <div class="cell-score">${score}</div>
        <div class="cell-risks">${buildRiskChips(cellRisks, true)}</div>
      </td>`;
    }).join('')}
  </tr>`).join('');
}

function buildRiskRows(risks) {
  if (risks.length === 0) {
    return '<tr><td colspan="7">Aucun risque renseigne.</td></tr>';
  }

  return risks.map((risk, index) => {
    const score = getScore(risk);
    const level = getRiskLevel(score);
    return `<tr>
      <td>#${index + 1}</td>
      <td><strong>${formatText(risk.description, 'Risque sans description')}</strong></td>
      <td>${risk.probability}</td>
      <td>${risk.impact}</td>
      <td><span class="score-badge score-${level}">${score}</span><small>${LEVEL_LABELS[level]}</small></td>
      <td>${escapeHtml(risk.cia_pillar || '-')}</td>
      <td>${formatText(risk.mitigation, 'Mesure a completer')}</td>
    </tr>`;
  }).join('');
}

function buildCiaRows(risks) {
  const ciaCounts = risks.reduce((acc, risk) => {
    const pillar = String(risk.cia_pillar || 'Non renseigne').trim() || 'Non renseigne';
    acc[pillar] = (acc[pillar] || 0) + 1;
    return acc;
  }, {});

  const entries = Object.entries(ciaCounts).sort((a, b) => b[1] - a[1]);

  if (entries.length === 0) {
    return '<tr><td colspan="3">Aucun pilier CIA renseigne.</td></tr>';
  }

  return entries.map(([pillar, count]) => {
    const percent = risks.length === 0 ? 0 : (count / risks.length) * 100;
    return `<tr>
      <td><strong>${escapeHtml(pillar)}</strong></td>
      <td>${count}</td>
      <td><div class="bar-line"><span style="width: ${Math.max(percent, 4)}%"></span></div><small>${formatNumber(percent)} %</small></td>
    </tr>`;
  }).join('');
}

export function downloadRiskMatrixHtml(filename, html) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function buildRiskMatrixReportHtml({
  risks,
  risksByCell,
  riskCountByLevel,
  autoPrint = false,
}) {
  const reportDate = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date());
  const highestScore = risks.length === 0 ? 0 : Math.max(...risks.map(getScore));
  const averageScore = risks.length === 0
    ? 0
    : risks.reduce((sum, risk) => sum + getScore(risk), 0) / risks.length;
  const highRiskCount = riskCountByLevel[RISK_LEVELS.HIGH] || 0;
  const mediumRiskCount = riskCountByLevel[RISK_LEVELS.MEDIUM] || 0;
  const lowRiskCount = riskCountByLevel[RISK_LEVELS.LOW] || 0;
  const matrixRows = buildMatrixRows(risksByCell);
  const riskRows = buildRiskRows(risks);
  const ciaRows = buildCiaRows(risks);
  const highShare = risks.length === 0 ? 0 : (highRiskCount / risks.length) * 100;
  const highGaugeWidth = `${Math.min(Math.max(highShare, 0), 100)}%`;

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Matrice de risque - Export</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #eef3fb; color: #14213d; font-family: Inter, Arial, sans-serif; }
    .report { max-width: 1280px; margin: 0 auto; padding: 36px; }
    .hero { background: linear-gradient(135deg, #0f172a, #1d4ed8 52%, #7c3aed); color: #fff; border-radius: 28px; padding: 34px; box-shadow: 0 24px 60px rgba(15, 23, 42, 0.22); }
    .hero p { color: rgba(255,255,255,0.78); line-height: 1.55; margin: 0; }
    .hero h1 { font-size: 34px; line-height: 1.1; margin: 8px 0 16px; }
    .hero-grid { display: grid; gap: 16px; grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: 26px; }
    .hero-card { background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.18); border-radius: 18px; padding: 16px; }
    .hero-card span { display: block; font-size: 12px; font-weight: 800; letter-spacing: .08em; margin-bottom: 8px; text-transform: uppercase; color: rgba(255,255,255,0.72); }
    .hero-card strong { display: block; font-size: 22px; }
    .report-section { background: #fff; border: 1px solid rgba(15, 23, 42, .08); border-radius: 24px; box-shadow: 0 18px 40px rgba(15, 23, 42, .1); margin-top: 24px; padding: 28px; page-break-inside: avoid; }
    .section-title { align-items: flex-start; display: flex; gap: 18px; margin-bottom: 22px; }
    .section-title > span { align-items: center; background: #dbeafe; border-radius: 16px; color: #1d4ed8; display: inline-flex; font-size: 22px; font-weight: 900; height: 56px; justify-content: center; width: 56px; }
    .section-title h2 { font-size: 24px; line-height: 1; margin: 0 0 8px; }
    .section-title p, .muted, small { color: #64748b; }
    .summary-grid { display: grid; gap: 14px; grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 18px; padding: 16px; }
    .summary-card span { color: #64748b; display: block; font-size: 12px; font-weight: 800; letter-spacing: .05em; margin-bottom: 8px; text-transform: uppercase; }
    .summary-card strong { display: block; font-size: 22px; }
    .visual-card { background: linear-gradient(135deg, #f8fafc, #eff6ff); border: 1px solid #dbeafe; border-radius: 20px; margin-bottom: 18px; padding: 18px; }
    .visual-card h3 { color: #1d4ed8; font-size: 22px; margin: 0 0 12px; }
    .metric-highlight { align-items: baseline; display: flex; gap: 10px; margin-bottom: 12px; }
    .metric-highlight strong { color: #020617; font-size: 30px; }
    .export-gauge { background: #fee2e2; border-radius: 999px; height: 16px; overflow: hidden; }
    .export-gauge span { background: linear-gradient(90deg, #10b981, #f59e0b, #ef4444); border-radius: inherit; display: block; height: 100%; }
    .risk-matrix-export { border-collapse: separate; border-spacing: 0; table-layout: fixed; width: 100%; }
    .risk-matrix-export th, .risk-matrix-export td { border-bottom: 1px solid rgba(15,23,42,.12); border-right: 1px solid rgba(15,23,42,.12); vertical-align: top; }
    .risk-matrix-export thead th, .risk-matrix-export tbody th { background: #f1f5f9; color: #020617; font-size: 12px; font-weight: 900; letter-spacing: .06em; padding: 12px; text-align: center; text-transform: uppercase; }
    .axis-corner span { display: block; }
    .axis-corner span:last-child { color: #64748b; font-size: 10px; margin-top: 4px; }
    .matrix-cell { height: 132px; padding: 8px; position: relative; }
    .matrix-cell-low { background: linear-gradient(135deg, rgba(16,185,129,.18), rgba(16,185,129,.05)); }
    .matrix-cell-medium { background: linear-gradient(135deg, rgba(245,158,11,.22), rgba(245,158,11,.06)); }
    .matrix-cell-high { background: linear-gradient(135deg, rgba(239,68,68,.24), rgba(239,68,68,.07)); }
    .cell-score { align-items: center; background: #fff; border: 1px solid rgba(15,23,42,.14); border-radius: 999px; display: inline-flex; font-size: 12px; font-weight: 900; height: 28px; justify-content: center; min-width: 28px; padding: 0 8px; }
    .cell-risks { display: flex; flex-direction: column; gap: 6px; margin-top: 8px; }
    .cell-empty { align-items: center; color: #94a3b8; display: flex; height: 70px; justify-content: center; }
    .risk-chip { background: rgba(255,255,255,.94); border: 1px solid rgba(15,23,42,.12); border-radius: 12px; padding: 9px; }
    .risk-chip-compact { padding: 7px; }
    .risk-chip-head { align-items: flex-start; display: flex; gap: 8px; justify-content: space-between; }
    .risk-chip-head strong { color: #020617; display: block; font-size: 11px; line-height: 1.25; }
    .risk-chip-meta { color: #475569; display: flex; flex-direction: column; font-size: 10px; gap: 3px; line-height: 1.25; margin-top: 5px; }
    .score-badge { border-radius: 999px; color: #fff; display: inline-flex; flex: 0 0 auto; font-size: 11px; font-weight: 900; justify-content: center; min-width: 28px; padding: 3px 8px; }
    .score-low { background: ${LEVEL_COLORS[RISK_LEVELS.LOW]}; }
    .score-medium { background: ${LEVEL_COLORS[RISK_LEVELS.MEDIUM]}; }
    .score-high { background: ${LEVEL_COLORS[RISK_LEVELS.HIGH]}; }
    .export-table { border-collapse: separate; border-spacing: 0; overflow: hidden; width: 100%; }
    .export-table th { background: #1d4ed8; color: white; font-size: 12px; letter-spacing: .05em; padding: 12px; text-align: left; text-transform: uppercase; }
    .export-table td { background: #fff; border-bottom: 1px solid #e2e8f0; color: #334155; padding: 12px; vertical-align: top; }
    .export-table tr:nth-child(even) td { background: #f8fafc; }
    .export-table strong, .export-table small { display: block; }
    .export-table small { line-height: 1.45; margin-top: 4px; }
    .bar-line { background: #e2e8f0; border-radius: 999px; height: 10px; overflow: hidden; width: 100%; }
    .bar-line span { background: #1d4ed8; border-radius: inherit; display: block; height: 100%; }
    .print-helper { background: rgba(255,255,255,.96); border: 1px solid #e2e8f0; border-radius: 999px; bottom: 22px; box-shadow: 0 14px 34px rgba(15, 23, 42, .18); display: flex; gap: 10px; padding: 10px; position: fixed; right: 22px; z-index: 20; }
    .print-helper button { background: #2563eb; border: 0; border-radius: 999px; color: #fff; cursor: pointer; font-weight: 900; padding: 10px 16px; }
    @media print { body { background: white; } .report { padding: 0; max-width: none; } .hero, .report-section { box-shadow: none; } .print-helper { display: none; } .matrix-cell { height: auto; min-height: 118px; } }
    @media (max-width: 900px) { .hero-grid, .summary-grid { grid-template-columns: 1fr; } .report { padding: 18px; } .risk-matrix-scroll { overflow-x: auto; } .risk-matrix-export { min-width: 900px; } }
  </style>
</head>
<body>
  <main class="report">
    <section class="hero">
      <p>SudERP - Bloc 5</p>
      <h1>Matrice de risque du SI</h1>
      <p>Export de synthese : repartition des risques par probabilite, impact, score, pilier CIA et mesures de mitigation.</p>
      <div class="hero-grid">
        <article class="hero-card"><span>Date export</span><strong>${escapeHtml(reportDate)}</strong></article>
        <article class="hero-card"><span>Risques suivis</span><strong>${risks.length}</strong></article>
        <article class="hero-card"><span>Risques eleves</span><strong>${highRiskCount}</strong></article>
        <article class="hero-card"><span>Score maximum</span><strong>${highestScore}/25</strong></article>
      </div>
    </section>

    <section class="report-section">
      <div class="section-title"><span>01</span><div><h2>Synthese du risque</h2><p>Vue consolidée de l'exposition actuelle.</p></div></div>
      <article class="visual-card">
        <h3>Part des risques eleves</h3>
        <div class="metric-highlight"><strong>${formatNumber(highShare)} %</strong><span>${highRiskCount} risque(s) avec un score superieur ou egal a 15</span></div>
        <div class="export-gauge"><span style="width: ${highGaugeWidth}"></span></div>
      </article>
      <div class="summary-grid">
        <article class="summary-card"><span>Total risques</span><strong>${risks.length}</strong></article>
        <article class="summary-card"><span>Faibles</span><strong>${lowRiskCount}</strong></article>
        <article class="summary-card"><span>Moyens</span><strong>${mediumRiskCount}</strong></article>
        <article class="summary-card"><span>Eleves</span><strong>${highRiskCount}</strong></article>
        <article class="summary-card"><span>Score moyen</span><strong>${formatNumber(averageScore)}</strong></article>
        <article class="summary-card"><span>Score max</span><strong>${highestScore}</strong></article>
        <article class="summary-card"><span>Probabilites</span><strong>P1 a P5</strong></article>
        <article class="summary-card"><span>Impacts</span><strong>I1 a I5</strong></article>
      </div>
    </section>

    <section class="report-section">
      <div class="section-title"><span>02</span><div><h2>Matrice probabilite / impact</h2><p>Chaque cellule positionne les risques selon leur score P x I.</p></div></div>
      <div class="risk-matrix-scroll">
        <table class="risk-matrix-export">
          <thead>
            <tr>
              <th class="axis-corner"><span>Impact</span><span>Probabilite</span></th>
              ${PROBABILITY_LEVELS.map((probability) => `<th>P ${probability}</th>`).join('')}
            </tr>
          </thead>
          <tbody>${matrixRows}</tbody>
        </table>
      </div>
    </section>

    <section class="report-section">
      <div class="section-title"><span>03</span><div><h2>Registre des risques</h2><p>Liste triee du score le plus eleve au plus faible.</p></div></div>
      <table class="export-table">
        <thead><tr><th>Rang</th><th>Risque</th><th>Prob.</th><th>Impact</th><th>Score</th><th>CIA</th><th>Mitigation</th></tr></thead>
        <tbody>${riskRows}</tbody>
      </table>
    </section>

    <section class="report-section">
      <div class="section-title"><span>04</span><div><h2>Repartition CIA</h2><p>Lecture des risques par pilier de securite touche.</p></div></div>
      <table class="export-table">
        <thead><tr><th>Pilier CIA</th><th>Nombre de risques</th><th>Part</th></tr></thead>
        <tbody>${ciaRows}</tbody>
      </table>
    </section>
  </main>
  <div class="print-helper"><button type="button" onclick="window.print()">Exporter en PDF</button></div>
  ${autoPrint ? '<script>window.addEventListener("load", () => { window.print(); });</script>' : ''}
</body>
</html>`;
}
