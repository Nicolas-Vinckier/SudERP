import { useEffect, useMemo, useState } from 'react';
import { createKpi, deleteKpi, getKpis, updateKpi } from '../../services/kpiPilotageApi';

const KPI_FAMILIES = [
  { id: 'technical', label: 'Technique', description: 'Disponibilite, MTTR, MTBF, temps de reponse, stockage, incidents critiques.' },
  { id: 'cybersecurity', label: 'Cybersecurite', description: 'Taux MFA, patching, vulnerabilites critiques, incidents securite.' },
  { id: 'business', label: 'Metiers / utilisateurs', description: 'Satisfaction, adoption, delais de traitement, tickets helpdesk.' },
  { id: 'financial', label: 'Financier', description: 'Budget consomme, cout par utilisateur, cout poste, depassement previsionnel.' }
];

const FORMULA_DEFINITIONS = {
  manual: { label: 'Saisie manuelle', resultLabel: 'Valeur observee', inputs: [] },
  availability: {
    label: 'Disponibilite',
    resultLabel: 'Disponibilite calculee',
    inputs: [
      { key: 'totalHours', label: 'Temps total observe (h)', placeholder: '720' },
      { key: 'downtimeHours', label: 'Temps d arret (h)', placeholder: '2' }
    ]
  },
  mttr: {
    label: 'MTTR',
    resultLabel: 'MTTR calcule',
    inputs: [
      { key: 'resolutionHours', label: 'Duree totale resolution (h)', placeholder: '40' },
      { key: 'incidentCount', label: 'Nombre d incidents', placeholder: '10' }
    ]
  },
  mtbf: {
    label: 'MTBF',
    resultLabel: 'MTBF calcule',
    inputs: [
      { key: 'operatingHours', label: 'Temps de fonctionnement (h)', placeholder: '500' },
      { key: 'failureCount', label: 'Nombre de pannes', placeholder: '5' }
    ]
  }
};

const EXPORT_SECTIONS = [
  { id: 'overview', label: 'Synthese KPI', description: 'Vue CODIR avec volumes, statuts et couverture des familles.' },
  { id: 'dashboard', label: 'Dashboard par famille', description: 'KPI regroupes par technique, cybersecurite, metiers et financier.' },
  { id: 'sla', label: 'SLA par service', description: 'Niveaux de service, cible, criticite et arret annuel maximal.' },
  { id: 'pilotage', label: 'Pilotage operationnel', description: 'Responsables, sources, frequences, tendances et actions correctives.' },
  { id: 'actions', label: 'Plan d action', description: 'KPI en alerte et corrections a mener en priorite.' }
];

const INITIAL_EXPORT_SELECTION = EXPORT_SECTIONS.reduce((selection, section) => ({ ...selection, [section.id]: true }), {});

const INITIAL_KPI = {
  name: '',
  family: 'technical',
  service: '',
  objective: '',
  description: '',
  owner: '',
  source: '',
  frequency: 'Mensuelle',
  unit: '%',
  comparator: 'gte',
  targetValue: '',
  observedValue: '',
  period: '',
  trend: 'stable',
  formulaType: 'manual',
  formulaInputs: {},
  isSla: false,
  slaTarget: '',
  criticality: 'Moyenne',
  actionPlan: '',
  displayOrder: 0
};

const comparatorLabels = {
  gte: '>= cible',
  lte: '<= cible'
};

const statusLabels = {
  green: 'Atteint',
  orange: 'A surveiller',
  red: 'A corriger',
  neutral: 'Non evalue'
};

const trendLabels = {
  up: 'En hausse',
  stable: 'Stable',
  down: 'En baisse'
};

function numberOrZero(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getFamily(kpi) {
  return KPI_FAMILIES.find((family) => family.id === kpi.family) || KPI_FAMILIES[0];
}

function calculateFormula(formulaType, formulaInputs) {
  const inputs = formulaInputs || {};
  if (formulaType === 'availability') {
    const totalHours = numberOrZero(inputs.totalHours);
    const downtimeHours = numberOrZero(inputs.downtimeHours);
    if (totalHours <= 0) return null;
    return Math.max(0, ((totalHours - downtimeHours) / totalHours) * 100);
  }
  if (formulaType === 'mttr') {
    const resolutionHours = numberOrZero(inputs.resolutionHours);
    const incidentCount = numberOrZero(inputs.incidentCount);
    if (incidentCount <= 0) return null;
    return resolutionHours / incidentCount;
  }
  if (formulaType === 'mtbf') {
    const operatingHours = numberOrZero(inputs.operatingHours);
    const failureCount = numberOrZero(inputs.failureCount);
    if (failureCount <= 0) return null;
    return operatingHours / failureCount;
  }
  return null;
}

function formatValue(value, unit) {
  const number = numberOrZero(value);
  const formatted = number.toLocaleString('fr-FR', { maximumFractionDigits: unit === '%' ? 2 : 1 });
  return `${formatted}${unit ? ` ${unit}` : ''}`;
}

function getKpiStatus(kpi) {
  const target = numberOrZero(kpi.targetValue);
  const observed = numberOrZero(kpi.observedValue);

  if (!kpi.name || (!target && target !== 0)) return 'neutral';
  if (kpi.comparator === 'lte') {
    if (observed <= target) return 'green';
    const tolerance = target === 0 ? 1 : target * 1.1;
    if (observed <= tolerance) return 'orange';
    return 'red';
  }

  if (observed >= target) return 'green';
  const tolerance = target === 0 ? 0 : target * 0.9;
  if (observed >= tolerance) return 'orange';
  return 'red';
}

function getGapLabel(kpi) {
  const target = numberOrZero(kpi.targetValue);
  const observed = numberOrZero(kpi.observedValue);
  const diff = kpi.comparator === 'lte' ? observed - target : target - observed;
  if (diff <= 0) return 'Cible respectee';
  return `Ecart: ${formatValue(diff, kpi.unit)}`;
}

function calculateAnnualDowntime(slaTarget) {
  const target = numberOrZero(slaTarget);
  if (target <= 0 || target > 100) return 'SLA a definir';
  const downtimeHours = 8760 * (1 - target / 100);
  if (downtimeHours < 1) return `${Math.round(downtimeHours * 60)} min/an`;
  if (downtimeHours < 24) return `${downtimeHours.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} h/an`;
  const downtimeDays = downtimeHours / 24;
  return `${downtimeDays.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} j/an`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatParagraphs(value, fallback = 'A completer') {
  const normalizedValue = String(value ?? '').trim();
  if (!normalizedValue) return `<p class="muted">${escapeHtml(fallback)}</p>`;
  return normalizedValue
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

function getStatusClass(status) {
  if (status === 'green') return 'ok';
  if (status === 'orange') return 'watch';
  if (status === 'red') return 'risk';
  return 'neutral';
}

function downloadFile(filename, content) {
  const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function buildKpiReportHtml({ sortedKpis, summary, exportSelection, autoPrint = false }) {
  const reportDate = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date());
  const selectedSections = EXPORT_SECTIONS.filter((section) => exportSelection[section.id]);
  const selectedLabels = selectedSections.map((section) => section.label).join(' - ');
  const alertKpis = sortedKpis.filter((kpi) => ['orange', 'red'].includes(getKpiStatus(kpi)));
  const slaKpis = sortedKpis.filter((kpi) => kpi.isSla);

  const overviewSection = exportSelection.overview ? `
    <section class="report-section overview-section">
      <div class="section-title"><span>01</span><div><h2>Synthese KPI</h2><p>Lecture CODIR du pilotage SI : performance, alertes, SLA et couverture du dashboard.</p></div></div>
      <div class="summary-grid">
        <article class="summary-card"><span>KPI suivis</span><strong>${summary.total}</strong><small>Indicateurs actifs dans le dashboard.</small></article>
        <article class="summary-card ok"><span>Cibles atteintes</span><strong>${summary.byStatus.green || 0}</strong><small>KPI conformes a la cible.</small></article>
        <article class="summary-card watch"><span>A surveiller</span><strong>${summary.byStatus.orange || 0}</strong><small>Ecart limite, suivi requis.</small></article>
        <article class="summary-card risk"><span>A corriger</span><strong>${summary.byStatus.red || 0}</strong><small>Action corrective attendue.</small></article>
        <article class="summary-card"><span>SLA suivis</span><strong>${summary.slaCount}</strong><small>Services avec engagement formalise.</small></article>
        <article class="summary-card"><span>Familles couvertes</span><strong>${summary.familyCoverage}/4</strong><small>Technique, cyber, metiers, financier.</small></article>
      </div>
    </section>` : '';

  const dashboardSection = exportSelection.dashboard ? `
    <section class="report-section">
      <div class="section-title"><span>02</span><div><h2>Dashboard par famille</h2><p>Les KPI sont regroupes selon les quatre dimensions attendues d'un tableau de bord DSI.</p></div></div>
      <div class="family-grid">
        ${KPI_FAMILIES.map((family) => {
          const familyKpis = sortedKpis.filter((kpi) => kpi.family === family.id);
          return `<article class="family-panel">
            <header><div><strong>${escapeHtml(family.label)}</strong><small>${escapeHtml(family.description)}</small></div><span>${familyKpis.length}</span></header>
            <div class="kpi-list">
              ${familyKpis.length === 0 ? '<p class="muted">Aucun KPI renseigne.</p>' : familyKpis.map((kpi) => {
                const status = getKpiStatus(kpi);
                return `<div class="kpi-row ${getStatusClass(status)}">
                  <div><strong>${escapeHtml(kpi.name)}</strong><small>${escapeHtml(kpi.service || kpi.objective || 'Service ou objectif a preciser.')}</small></div>
                  <div class="kpi-numbers"><strong>${escapeHtml(formatValue(kpi.observedValue, kpi.unit))}</strong><small>Cible ${escapeHtml(comparatorLabels[kpi.comparator])} ${escapeHtml(formatValue(kpi.targetValue, kpi.unit))}</small></div>
                  <span>${escapeHtml(statusLabels[status])}</span>
                </div>`;
              }).join('')}
            </div>
          </article>`;
        }).join('')}
      </div>
    </section>` : '';

  const slaSection = exportSelection.sla ? `
    <section class="report-section">
      <div class="section-title"><span>03</span><div><h2>SLA par service</h2><p>Les engagements de service restent proportionnes a la criticite metier.</p></div></div>
      <table class="export-table">
        <thead><tr><th>Service</th><th>KPI</th><th>SLA cible</th><th>Valeur observee</th><th>Arret annuel max.</th><th>Criticite</th><th>Statut</th></tr></thead>
        <tbody>
          ${slaKpis.length === 0 ? '<tr><td colspan="7">Aucun SLA renseigne.</td></tr>' : slaKpis.map((kpi) => {
            const status = getKpiStatus(kpi);
            return `<tr>
              <td>${escapeHtml(kpi.service || 'Service a definir')}</td>
              <td><strong>${escapeHtml(kpi.name)}</strong><small>${escapeHtml(kpi.objective || '')}</small></td>
              <td>${escapeHtml(formatValue(kpi.slaTarget || kpi.targetValue, '%'))}</td>
              <td>${escapeHtml(formatValue(kpi.observedValue, kpi.unit))}</td>
              <td>${escapeHtml(calculateAnnualDowntime(kpi.slaTarget || kpi.targetValue))}</td>
              <td>${escapeHtml(kpi.criticality)}</td>
              <td><span class="status-chip ${getStatusClass(status)}">${escapeHtml(statusLabels[status])}</span></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </section>` : '';

  const pilotageSection = exportSelection.pilotage ? `
    <section class="report-section">
      <div class="section-title"><span>04</span><div><h2>Pilotage operationnel</h2><p>Chaque KPI est relie a un responsable, une source, une frequence et une tendance.</p></div></div>
      <table class="export-table">
        <thead><tr><th>KPI</th><th>Famille</th><th>Responsable</th><th>Source</th><th>Frequence</th><th>Periode</th><th>Tendance</th></tr></thead>
        <tbody>
          ${sortedKpis.length === 0 ? '<tr><td colspan="7">Aucun KPI a exporter.</td></tr>' : sortedKpis.map((kpi) => `<tr>
            <td><strong>${escapeHtml(kpi.name)}</strong><small>${escapeHtml(kpi.description || kpi.objective || 'Description a preciser.')}</small></td>
            <td>${escapeHtml(getFamily(kpi).label)}</td>
            <td>${escapeHtml(kpi.owner || 'A definir')}</td>
            <td>${escapeHtml(kpi.source || 'A definir')}</td>
            <td>${escapeHtml(kpi.frequency)}</td>
            <td>${escapeHtml(kpi.period || 'A definir')}</td>
            <td>${escapeHtml(trendLabels[kpi.trend])}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </section>` : '';

  const actionsSection = exportSelection.actions ? `
    <section class="report-section action-section">
      <div class="section-title"><span>05</span><div><h2>Plan d action</h2><p>Priorisation des actions correctives sur les KPI en orange ou rouge.</p></div></div>
      <div class="action-list">
        ${alertKpis.length === 0 ? '<p class="muted">Aucune action corrective prioritaire : les KPI suivis sont dans la cible ou non evalues.</p>' : alertKpis.map((kpi) => {
          const status = getKpiStatus(kpi);
          return `<article class="action-card ${getStatusClass(status)}">
            <header><strong>${escapeHtml(kpi.name)}</strong><span>${escapeHtml(statusLabels[status])}</span></header>
            <div class="action-copy">${formatParagraphs(kpi.actionPlan, 'Action corrective a formaliser.')}</div>
            <footer><small>${escapeHtml(getGapLabel(kpi))}</small><small>${escapeHtml(kpi.owner || 'Responsable a definir')}</small></footer>
          </article>`;
        }).join('')}
      </div>
    </section>` : '';

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>KPI et pilotage du SI - Export</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #eef3fb; color: #14213d; font-family: Inter, Arial, sans-serif; }
    .report { max-width: 1180px; margin: 0 auto; padding: 36px; }
    .hero { background: linear-gradient(135deg, #0f172a, #1d4ed8 48%, #4f46e5); color: #fff; border-radius: 28px; padding: 34px; box-shadow: 0 24px 60px rgba(15, 23, 42, 0.22); }
    .hero p { color: rgba(255,255,255,0.78); margin: 0; }
    .hero h1 { font-size: 34px; line-height: 1.1; margin: 8px 0 16px; }
    .hero-grid { display: grid; gap: 16px; grid-template-columns: repeat(5, minmax(0, 1fr)); margin-top: 26px; }
    .hero-card { background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.18); border-radius: 18px; padding: 16px; }
    .hero-card span { display: block; font-size: 12px; font-weight: 800; letter-spacing: .08em; margin-bottom: 8px; text-transform: uppercase; color: rgba(255,255,255,0.72); }
    .hero-card strong { display: block; font-size: 24px; }
    .report-section { background: #fff; border: 1px solid rgba(15, 23, 42, .08); border-radius: 24px; box-shadow: 0 18px 44px rgba(15, 23, 42, .08); margin-top: 22px; padding: 28px; page-break-inside: avoid; }
    .section-title { align-items: flex-start; display: flex; gap: 14px; margin-bottom: 22px; }
    .section-title > span { align-items: center; background: #2563eb; border-radius: 14px; color: white; display: inline-flex; font-weight: 900; height: 42px; justify-content: center; min-width: 42px; }
    .section-title h2 { font-size: 24px; line-height: 1; margin: 0 0 8px; }
    .section-title p { color: #64748b; margin: 0; }
    .summary-grid { display: grid; gap: 16px; grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 18px; padding: 18px; }
    .summary-card span { color: #64748b; display: block; font-size: 12px; font-weight: 900; letter-spacing: .06em; text-transform: uppercase; }
    .summary-card strong { display: block; font-size: 30px; margin: 8px 0; }
    .summary-card small { color: #64748b; line-height: 1.4; }
    .summary-card.ok { box-shadow: inset 6px 0 0 #10b981; }
    .summary-card.watch { box-shadow: inset 6px 0 0 #f59e0b; }
    .summary-card.risk { box-shadow: inset 6px 0 0 #ef4444; }
    .family-grid { display: grid; gap: 16px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .family-panel { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 20px; padding: 18px; }
    .family-panel:nth-child(1) { box-shadow: inset 6px 0 0 #2563eb; }
    .family-panel:nth-child(2) { box-shadow: inset 6px 0 0 #ef4444; }
    .family-panel:nth-child(3) { box-shadow: inset 6px 0 0 #10b981; }
    .family-panel:nth-child(4) { box-shadow: inset 6px 0 0 #f59e0b; }
    .family-panel header { align-items: flex-start; display: flex; gap: 12px; justify-content: space-between; margin-bottom: 14px; }
    .family-panel header strong { display: block; font-size: 16px; margin-bottom: 5px; }
    .family-panel header small { color: #64748b; line-height: 1.4; }
    .family-panel header > span { align-items: center; background: #2563eb; border-radius: 999px; color: #fff; display: inline-flex; font-weight: 900; height: 30px; justify-content: center; min-width: 30px; padding: 0 9px; }
    .kpi-list, .action-list { display: flex; flex-direction: column; gap: 10px; }
    .kpi-row { align-items: center; background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; display: grid; gap: 12px; grid-template-columns: 1fr 0.7fr auto; padding: 13px; }
    .kpi-row.ok, .action-card.ok { box-shadow: inset 5px 0 0 #10b981; }
    .kpi-row.watch, .action-card.watch { box-shadow: inset 5px 0 0 #f59e0b; }
    .kpi-row.risk, .action-card.risk { box-shadow: inset 5px 0 0 #ef4444; }
    .kpi-row.neutral, .action-card.neutral { box-shadow: inset 5px 0 0 #94a3b8; }
    .kpi-row strong, .kpi-row small, .kpi-numbers strong, .kpi-numbers small { display: block; }
    .kpi-row small, .kpi-numbers small { color: #64748b; line-height: 1.35; margin-top: 4px; }
    .kpi-row > span, .status-chip { background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 999px; color: #3730a3; display: inline-flex; font-size: 12px; font-weight: 900; justify-content: center; padding: 6px 10px; white-space: nowrap; }
    .status-chip.ok { background: #ecfdf5; border-color: #a7f3d0; color: #047857; }
    .status-chip.watch { background: #fffbeb; border-color: #fde68a; color: #b45309; }
    .status-chip.risk { background: #fef2f2; border-color: #fecaca; color: #b91c1c; }
    .export-table { border-collapse: separate; border-spacing: 0; overflow: hidden; width: 100%; }
    .export-table th { background: #1d4ed8; color: white; font-size: 12px; letter-spacing: .05em; padding: 13px; text-align: left; text-transform: uppercase; }
    .export-table td { background: #fff; border-bottom: 1px solid #e2e8f0; color: #334155; padding: 13px; vertical-align: top; }
    .export-table tr:nth-child(even) td { background: #f8fafc; }
    .export-table strong, .export-table small { display: block; }
    .export-table small { color: #64748b; margin-top: 4px; }
    .action-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 18px; padding: 18px; }
    .action-card header, .action-card footer { align-items: center; display: flex; justify-content: space-between; gap: 12px; }
    .action-card header span { background: #fff; border: 1px solid #e2e8f0; border-radius: 999px; color: #334155; font-size: 12px; font-weight: 900; padding: 6px 10px; }
    .action-card .action-copy { color: #475569; line-height: 1.55; margin: 12px 0; } .action-card .action-copy p { margin: 0 0 8px; }
    .action-card footer small { color: #64748b; font-weight: 800; }
    .muted { color: #94a3b8; font-style: italic; }
    .print-helper { background: rgba(255,255,255,.96); border: 1px solid #e2e8f0; border-radius: 999px; bottom: 22px; box-shadow: 0 14px 34px rgba(15, 23, 42, .18); display: flex; gap: 10px; padding: 10px; position: fixed; right: 22px; z-index: 20; }
    .print-helper button { background: #2563eb; border: 0; border-radius: 999px; color: #fff; cursor: pointer; font-weight: 900; padding: 10px 16px; }
    @media print { body { background: white; } .report { padding: 0; } .hero, .report-section { box-shadow: none; } .print-helper { display: none; } }
    @media (max-width: 900px) { .hero-grid, .summary-grid, .family-grid, .kpi-row { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <main class="report">
    <header class="hero">
      <p>KPI & Pilotage du SI - Export selectionne</p>
      <h1>Dashboard DSI operationnel</h1>
      <p>${escapeHtml(selectedLabels || 'Aucune section selectionnee')} - Genere le ${escapeHtml(reportDate)}</p>
      <div class="hero-grid">
        <div class="hero-card"><span>KPI</span><strong>${summary.total}</strong></div>
        <div class="hero-card"><span>Atteints</span><strong>${summary.byStatus.green || 0}</strong></div>
        <div class="hero-card"><span>A surveiller</span><strong>${summary.byStatus.orange || 0}</strong></div>
        <div class="hero-card"><span>A corriger</span><strong>${summary.byStatus.red || 0}</strong></div>
        <div class="hero-card"><span>SLA</span><strong>${summary.slaCount}</strong></div>
      </div>
    </header>
    ${overviewSection}
    ${dashboardSection}
    ${slaSection}
    ${pilotageSection}
    ${actionsSection}
  </main>
  <div class="print-helper"><button type="button" onclick="window.print()">Exporter en PDF</button></div>
  ${autoPrint ? `<script>
    window.addEventListener('load', function () {
      window.setTimeout(function () {
        window.focus();
        window.print();
      }, 500);
    });
  </script>` : ''}
</body>
</html>`;
}

export default function KpiPilotageTool() {
  const [kpis, setKpis] = useState([]);
  const [draft, setDraft] = useState(INITIAL_KPI);
  const [editingKpiId, setEditingKpiId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportSelection, setExportSelection] = useState(INITIAL_EXPORT_SELECTION);
  const [message, setMessage] = useState('');

  const calculatedValue = useMemo(() => calculateFormula(draft.formulaType, draft.formulaInputs), [draft.formulaInputs, draft.formulaType]);

  const sortedKpis = useMemo(
    () => [...kpis].sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0) || a.name.localeCompare(b.name)),
    [kpis]
  );

  const summary = useMemo(() => {
    const total = sortedKpis.length;
    const byStatus = sortedKpis.reduce((acc, kpi) => {
      const status = getKpiStatus(kpi);
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    const slaCount = sortedKpis.filter((kpi) => kpi.isSla).length;
    const familyCoverage = KPI_FAMILIES.filter((family) => sortedKpis.some((kpi) => kpi.family === family.id)).length;

    return { total, byStatus, slaCount, familyCoverage };
  }, [sortedKpis]);

  const selectedExportCount = useMemo(() => EXPORT_SECTIONS.filter((section) => exportSelection[section.id]).length, [exportSelection]);

  useEffect(() => {
    const loadKpis = async () => {
      setIsLoading(true);
      setMessage('');
      try {
        const loadedKpis = await getKpis();
        setKpis(loadedKpis);
      } catch {
        setMessage('Impossible de charger les KPI sauvegardes.');
      } finally {
        setIsLoading(false);
      }
    };

    loadKpis();
  }, []);

  const updateDraft = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const updateFormulaInput = (key, value) => {
    setDraft((current) => ({
      ...current,
      formulaInputs: { ...current.formulaInputs, [key]: value }
    }));
  };

  const resetDraft = () => {
    setDraft(INITIAL_KPI);
    setEditingKpiId(null);
  };

  const updateExportSelection = (sectionId) => {
    setExportSelection((current) => ({ ...current, [sectionId]: !current[sectionId] }));
  };

  const getReportHtml = (options = {}) => buildKpiReportHtml({ sortedKpis, summary, exportSelection, ...options });

  const exportHtmlReport = () => {
    if (selectedExportCount === 0) return;
    downloadFile('kpi-pilotage-si-dashboard.html', getReportHtml());
    setIsExportModalOpen(false);
  };

  const previewPrintableReport = () => {
    if (selectedExportCount === 0) return;

    const html = getReportHtml({ autoPrint: true });
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const previewWindow = window.open(url, '_blank', 'width=1200,height=900');

    if (!previewWindow) {
      URL.revokeObjectURL(url);
      setMessage('Le navigateur a bloque l ouverture de l apercu PDF. Autorise les popups ou utilise l export HTML.');
      return;
    }

    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    setIsExportModalOpen(false);
  };

  const saveKpi = async (event) => {
    event.preventDefault();
    if (!draft.name.trim()) return;

    const observedValue = calculatedValue !== null && draft.formulaType !== 'manual' ? calculatedValue : numberOrZero(draft.observedValue);
    const normalizedKpi = {
      ...draft,
      name: draft.name.trim(),
      service: draft.service.trim(),
      objective: draft.objective.trim(),
      description: draft.description.trim(),
      owner: draft.owner.trim(),
      source: draft.source.trim(),
      period: draft.period.trim(),
      actionPlan: draft.actionPlan.trim(),
      observedValue,
      targetValue: numberOrZero(draft.targetValue),
      slaTarget: draft.isSla ? numberOrZero(draft.slaTarget || draft.targetValue) : 0,
      displayOrder: numberOrZero(draft.displayOrder)
    };

    setIsSaving(true);
    setMessage('');
    try {
      if (editingKpiId === null) {
        const createdKpi = await createKpi(normalizedKpi);
        setKpis((current) => [...current, createdKpi]);
      } else {
        const updatedKpi = await updateKpi(editingKpiId, normalizedKpi);
        setKpis((current) => current.map((kpi) => (kpi.id === editingKpiId ? updatedKpi : kpi)));
      }
      resetDraft();
    } catch {
      setMessage('Impossible de sauvegarder ce KPI en base.');
    } finally {
      setIsSaving(false);
    }
  };

  const editKpi = (kpi) => {
    setDraft({
      ...kpi,
      targetValue: String(kpi.targetValue),
      observedValue: String(kpi.observedValue),
      slaTarget: String(kpi.slaTarget),
      displayOrder: Number(kpi.displayOrder || 0)
    });
    setEditingKpiId(kpi.id ?? null);
  };

  const removeKpi = async (kpi) => {
    if (!kpi.id) {
      setKpis((current) => current.filter((item) => item !== kpi));
      resetDraft();
      return;
    }

    setIsSaving(true);
    setMessage('');
    try {
      await deleteKpi(kpi.id);
      setKpis((current) => current.filter((item) => item.id !== kpi.id));
      if (editingKpiId === kpi.id) resetDraft();
    } catch {
      setMessage('Impossible de supprimer ce KPI en base.');
    } finally {
      setIsSaving(false);
    }
  };

  const formulaDefinition = FORMULA_DEFINITIONS[draft.formulaType] || FORMULA_DEFINITIONS.manual;

  return (
    <div className="kpi-pilotage-tool">
      <section className="budget-toolbar glass-panel kpi-toolbar">
        <div>
          <p className="eyebrow">KPI & Pilotage du SI</p>
          <h2>Dashboard DSI</h2>
          <p>Construis un tableau de bord actionnable : KPI techniques, cybersecurite, metiers, financiers, SLA et plan d action.</p>
        </div>
        <div className="budget-actions-panel kpi-toolbar-actions">
          <small>{isLoading ? 'Chargement des KPI sauvegardes...' : isSaving ? 'Operation en base en cours...' : 'KPI sauvegardes en base MongoDB.'}</small>
          <small className="dashboard-rule">Cible recommandee : 10 a 15 KPI maximum.</small>
          <button className="btn export-btn" type="button" onClick={() => setIsExportModalOpen(true)}>Exporter</button>
        </div>
      </section>

      {message && <p className="roadmap-error-message">{message}</p>}

      <section className="budget-summary kpi-summary">
        <article className="summary-positive"><span>KPI suivis</span><strong>{summary.total}</strong></article>
        <article className="summary-positive"><span>Cibles atteintes</span><strong>{summary.byStatus.green || 0}</strong></article>
        <article className="summary-negative"><span>A corriger</span><strong>{summary.byStatus.red || 0}</strong></article>
        <article><span>Familles couvertes</span><strong>{summary.familyCoverage}/4</strong></article>
      </section>

      <section className="kpi-layout">
        <form className="glass-panel kpi-form-panel" onSubmit={saveKpi}>
          <div className="section-heading">
            <h2>{editingKpiId === null ? 'Ajouter un KPI' : 'Modifier le KPI'}</h2>
            <p>Un KPI doit avoir une cible, une valeur observee, une tendance et une action corrective possible.</p>
          </div>

          <div className="form-grid two-columns">
            <div className="form-group"><label htmlFor="kpiName">Nom du KPI</label><input id="kpiName" value={draft.name} onChange={(event) => updateDraft('name', event.target.value)} placeholder="Ex. Disponibilite ERP" required /></div>
            <div className="form-group"><label htmlFor="kpiFamily">Famille</label><select id="kpiFamily" value={draft.family} onChange={(event) => updateDraft('family', event.target.value)}>{KPI_FAMILIES.map((family) => <option key={family.id} value={family.id}>{family.label}</option>)}</select></div>
          </div>

          <div className="form-grid two-columns">
            <div className="form-group"><label htmlFor="kpiService">Service / processus</label><input id="kpiService" value={draft.service} onChange={(event) => updateDraft('service', event.target.value)} placeholder="ERP, support, M365, reseau..." /></div>
            <div className="form-group"><label htmlFor="kpiOwner">Responsable</label><input id="kpiOwner" value={draft.owner} onChange={(event) => updateDraft('owner', event.target.value)} placeholder="DSI, RSSI, support, finance..." /></div>
          </div>

          <div className="form-group"><label htmlFor="kpiObjective">Objectif pilote</label><textarea id="kpiObjective" value={draft.objective} onChange={(event) => updateDraft('objective', event.target.value)} placeholder="Objectif operationnel ou strategique suivi par ce KPI." /></div>
          <div className="form-group"><label htmlFor="kpiDescription">Description / lecture metier</label><textarea id="kpiDescription" value={draft.description} onChange={(event) => updateDraft('description', event.target.value)} placeholder="Pourquoi cet indicateur est utile, quelle decision il permet de prendre." /></div>
          <div className="form-group"><label htmlFor="kpiAction">Action corrective si alerte</label><textarea id="kpiAction" value={draft.actionPlan} onChange={(event) => updateDraft('actionPlan', event.target.value)} placeholder="Runbook, escalade, comite, plan de remediation..." /></div>

          <div className="form-grid three-columns">
            <div className="form-group"><label htmlFor="formulaType">Mode de calcul</label><select id="formulaType" value={draft.formulaType} onChange={(event) => updateDraft('formulaType', event.target.value)}>{Object.entries(FORMULA_DEFINITIONS).map(([id, definition]) => <option key={id} value={id}>{definition.label}</option>)}</select></div>
            <div className="form-group"><label htmlFor="targetValue">Cible</label><input id="targetValue" type="number" step="0.01" value={draft.targetValue} onChange={(event) => updateDraft('targetValue', event.target.value)} placeholder="99.9" /></div>
            <div className="form-group"><label htmlFor="observedValue">Valeur observee</label><input id="observedValue" type="number" step="0.01" value={draft.observedValue} onChange={(event) => updateDraft('observedValue', event.target.value)} placeholder="99.5" disabled={draft.formulaType !== 'manual'} /></div>
          </div>

          {formulaDefinition.inputs.length > 0 && (
            <fieldset className="score-fieldset kpi-formula-fieldset">
              <legend>Formule {formulaDefinition.label}</legend>
              <div className="form-grid two-columns">
                {formulaDefinition.inputs.map((input) => (
                  <div className="form-group compact-form-group" key={input.key}>
                    <label htmlFor={input.key}>{input.label}</label>
                    <input id={input.key} type="number" step="0.01" value={draft.formulaInputs[input.key] ?? ''} onChange={(event) => updateFormulaInput(input.key, event.target.value)} placeholder={input.placeholder} />
                  </div>
                ))}
              </div>
              <div className="calculation-preview"><span>{formulaDefinition.resultLabel}: <strong>{calculatedValue === null ? 'A calculer' : formatValue(calculatedValue, draft.unit)}</strong></span></div>
            </fieldset>
          )}

          <div className="form-grid four-columns">
            <div className="form-group"><label htmlFor="unit">Unite</label><input id="unit" value={draft.unit} onChange={(event) => updateDraft('unit', event.target.value)} placeholder="%, h, EUR, tickets" /></div>
            <div className="form-group"><label htmlFor="comparator">Sens de lecture</label><select id="comparator" value={draft.comparator} onChange={(event) => updateDraft('comparator', event.target.value)}><option value="gte">Superieur ou egal</option><option value="lte">Inferieur ou egal</option></select></div>
            <div className="form-group"><label htmlFor="trend">Tendance</label><select id="trend" value={draft.trend} onChange={(event) => updateDraft('trend', event.target.value)}><option value="up">En hausse</option><option value="stable">Stable</option><option value="down">En baisse</option></select></div>
            <div className="form-group"><label htmlFor="frequency">Frequence</label><select id="frequency" value={draft.frequency} onChange={(event) => updateDraft('frequency', event.target.value)}><option>Hebdomadaire</option><option>Mensuelle</option><option>Trimestrielle</option><option>Annuelle</option></select></div>
          </div>

          <div className="form-grid four-columns">
            <div className="form-group"><label htmlFor="period">Periode</label><input id="period" value={draft.period} onChange={(event) => updateDraft('period', event.target.value)} placeholder="Mai 2026, T2 2026..." /></div>
            <div className="form-group"><label htmlFor="source">Source de donnees</label><input id="source" value={draft.source} onChange={(event) => updateDraft('source', event.target.value)} placeholder="Grafana, ITSM, Metabase..." /></div>
            <div className="form-group"><label htmlFor="criticality">Criticite</label><select id="criticality" value={draft.criticality} onChange={(event) => updateDraft('criticality', event.target.value)}><option>Faible</option><option>Moyenne</option><option>Elevee</option><option>Critique</option></select></div>
            <div className="form-group"><label htmlFor="displayOrder">Ordre</label><input id="displayOrder" type="number" step="1" value={draft.displayOrder} onChange={(event) => updateDraft('displayOrder', event.target.value)} placeholder="0" /></div>
          </div>

          <label className="kpi-checkbox" htmlFor="isSla"><input id="isSla" type="checkbox" checked={draft.isSla} onChange={(event) => updateDraft('isSla', event.target.checked)} /> <span>Ce KPI porte un SLA de service</span></label>
          {draft.isSla && <div className="form-group"><label htmlFor="slaTarget">SLA cible (%)</label><input id="slaTarget" type="number" min="0" max="100" step="0.001" value={draft.slaTarget} onChange={(event) => updateDraft('slaTarget', event.target.value)} placeholder="99.9" /></div>}

          <div className="calculation-preview">
            <span>Statut: <strong>{statusLabels[getKpiStatus({ ...draft, observedValue: calculatedValue !== null && draft.formulaType !== 'manual' ? calculatedValue : draft.observedValue })]}</strong></span>
            <span>Regle: <strong>{comparatorLabels[draft.comparator]}</strong></span>
            {draft.isSla && <span>Arret max: <strong>{calculateAnnualDowntime(draft.slaTarget || draft.targetValue)}</strong></span>}
          </div>

          <div className="form-actions"><button className="btn" type="submit" disabled={isSaving}>{isSaving ? 'Sauvegarde...' : editingKpiId === null ? 'Ajouter au dashboard' : 'Enregistrer'}</button>{editingKpiId !== null && <button className="btn secondary-btn" type="button" onClick={resetDraft}>Annuler</button>}</div>
        </form>

        <div className="kpi-guidance-column">
          <section className="glass-panel kpi-guidance-panel">
            <div className="section-heading"><h2>Familles de KPI</h2><p>Un dashboard DSI equilibre couvre quatre dimensions.</p></div>
            <div className="kpi-family-list">
              {KPI_FAMILIES.map((family) => <article key={family.id}><strong>{family.label}</strong><p>{family.description}</p></article>)}
            </div>
          </section>
          <section className="glass-panel kpi-guidance-panel">
            <div className="section-heading"><h2>Formules integrees</h2><p>Disponibilite, MTTR et MTBF sont calculables directement depuis les donnees d exploitation.</p></div>
            <div className="kpi-formula-list">
              <span>Disponibilite = (temps total - arret) / temps total x 100</span>
              <span>MTTR = duree totale de resolution / nombre d incidents</span>
              <span>MTBF = temps total de fonctionnement / nombre de pannes</span>
            </div>
          </section>
        </div>
      </section>

      <section className="glass-panel kpi-dashboard-panel">
        <div className="section-heading"><h2>Tableau de bord DSI</h2><p>Vue par famille avec statut, cible, tendance et action corrective. Chaque carte est modifiable et supprimable.</p></div>
        <div className="kpi-dashboard-grid">
          {KPI_FAMILIES.map((family) => {
            const familyKpis = sortedKpis.filter((kpi) => kpi.family === family.id);
            return (
              <article className="kpi-family-panel" key={family.id}>
                <header><strong>{family.label}</strong><span>{familyKpis.length}</span></header>
                <div className="kpi-card-list">
                  {familyKpis.length === 0 ? <p className="empty-state">Aucun KPI renseigne.</p> : familyKpis.map((kpi) => {
                    const status = getKpiStatus(kpi);
                    return (
                      <article className={`kpi-card kpi-card-${status}`} key={kpi.id}>
                        <div className="kpi-card-header"><strong>{kpi.name}</strong><span>{statusLabels[status]}</span></div>
                        <div className="kpi-card-values"><span>{formatValue(kpi.observedValue, kpi.unit)}</span><small>Cible {comparatorLabels[kpi.comparator]} {formatValue(kpi.targetValue, kpi.unit)}</small></div>
                        <p>{kpi.service || kpi.objective || 'Service ou objectif a preciser.'}</p>
                        <footer><small>{trendLabels[kpi.trend]}</small><small>{getGapLabel(kpi)}</small></footer>
                        <div className="kpi-card-actions"><button className="small-btn" type="button" onClick={() => editKpi(kpi)}>Modifier</button><button className="small-btn danger-btn" type="button" onClick={() => removeKpi(kpi)}>Supprimer</button></div>
                      </article>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="kpi-bottom-layout">
        <div className="glass-panel kpi-sla-panel">
          <div className="section-heading"><h2>SLA par service</h2><p>Les SLA doivent rester proportionnels a la criticite metier.</p></div>
          <div className="responsive-table">
            <table className="budget-project-table kpi-table">
              <caption>SLA declares dans le dashboard KPI</caption>
              <thead><tr><th>Service</th><th>KPI</th><th>SLA cible</th><th>Arret annuel max.</th><th>Criticite</th><th></th></tr></thead>
              <tbody>
                {sortedKpis.filter((kpi) => kpi.isSla).length === 0 ? <tr><td colSpan="6" className="empty-state">Aucun SLA renseigne.</td></tr> : sortedKpis.filter((kpi) => kpi.isSla).map((kpi) => (
                  <tr key={kpi.id}><td>{kpi.service || 'Service a definir'}</td><td>{kpi.name}</td><td>{formatValue(kpi.slaTarget || kpi.targetValue, '%')}</td><td>{calculateAnnualDowntime(kpi.slaTarget || kpi.targetValue)}</td><td>{kpi.criticality}</td><td className="table-actions"><button className="small-btn" type="button" onClick={() => editKpi(kpi)}>Modifier</button><button className="small-btn danger-btn" type="button" onClick={() => removeKpi(kpi)}>Supprimer</button></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-panel kpi-pilotage-panel">
          <div className="section-heading"><h2>Pilotage operationnel</h2><p>Responsable, source, frequence, tendance et action corrective.</p></div>
          <div className="responsive-table">
            <table className="budget-project-table kpi-table">
              <caption>Plan de pilotage des KPI</caption>
              <thead><tr><th>KPI</th><th>Responsable</th><th>Source</th><th>Frequence</th><th>Action corrective</th><th></th></tr></thead>
              <tbody>
                {sortedKpis.length === 0 ? <tr><td colSpan="6" className="empty-state">Ajoute un premier KPI pour alimenter le pilotage.</td></tr> : sortedKpis.map((kpi) => (
                  <tr key={kpi.id}>
                    <td><strong>{kpi.name}</strong><small>{getFamily(kpi).label}</small></td>
                    <td>{kpi.owner || 'A definir'}</td>
                    <td>{kpi.source || 'A definir'}</td>
                    <td>{kpi.frequency}</td>
                    <td>{kpi.actionPlan || 'Action a formaliser'}</td>
                    <td className="table-actions"><button className="small-btn" type="button" onClick={() => editKpi(kpi)}>Modifier</button><button className="small-btn danger-btn" type="button" onClick={() => removeKpi(kpi)}>Supprimer</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {isExportModalOpen && (
        <div className="export-modal-backdrop" role="presentation">
          <section className="export-modal glass-panel" role="dialog" aria-modal="true" aria-labelledby="kpiExportModalTitle">
            <div className="export-modal-header">
              <div>
                <p className="eyebrow">Export</p>
                <h2 id="kpiExportModalTitle">Exporter le dashboard KPI</h2>
                <p>Selectionne les blocs a inclure. Le rendu HTML est imprimable directement en PDF avec une mise en page CODIR.</p>
              </div>
              <button className="modal-close-btn" type="button" aria-label="Fermer" onClick={() => setIsExportModalOpen(false)}>x</button>
            </div>
            <div className="export-selection-list">
              {EXPORT_SECTIONS.map((section) => (
                <label className="export-selection-item" key={section.id} htmlFor={`kpi-export-${section.id}`}>
                  <input id={`kpi-export-${section.id}`} type="checkbox" checked={exportSelection[section.id]} onChange={() => updateExportSelection(section.id)} />
                  <span><strong>{section.label}</strong><small>{section.description}</small></span>
                </label>
              ))}
            </div>
            <div className="export-modal-preview">
              <strong>Ordre du rendu</strong>
              <span>Synthese KPI</span>
              <span>Dashboard par famille</span>
              <span>SLA par service</span>
              <span>Pilotage operationnel</span>
              <span>Plan d action</span>
            </div>
            <div className="export-modal-actions">
              <button className="btn secondary-btn" type="button" onClick={() => setIsExportModalOpen(false)}>Annuler</button>
              <button className="btn secondary-btn" type="button" onClick={previewPrintableReport} disabled={selectedExportCount === 0}>Apercu PDF</button>
              <button className="btn" type="button" onClick={exportHtmlReport} disabled={selectedExportCount === 0}>Exporter HTML</button>
            </div>
            {selectedExportCount === 0 && <p className="export-warning">Selectionne au moins une section pour lancer l export.</p>}
          </section>
        </div>
      )}
    </div>
  );
}
