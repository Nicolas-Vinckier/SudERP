import { useEffect, useMemo, useRef, useState } from 'react';
import {
  createRoadmapProject,
  deleteRoadmapProject,
  getRoadmapContext,
  getRoadmapProjects,
  updateRoadmapContext,
  updateRoadmapProject
} from '../../services/strategicRoadmapApi';

const PHASES = [
  { id: 'year-1', label: 'Annee 1', theme: 'Securiser', guidance: 'Quick wins, cybersecurite, sauvegardes, documentation.' },
  { id: 'year-2', label: 'Annee 2', theme: 'Fiabiliser', guidance: 'Infrastructure, continuite, supervision, cloud progressif.' },
  { id: 'year-3', label: 'Annee 3', theme: 'Transformer', guidance: 'ERP, automatisation, innovation, portail metier.' }
];

const QUADRANTS = ['Quick win', 'Strategique', 'Gain secondaire', 'A arbitrer'];

const EXPORT_SECTIONS = [
  { id: 'cadrage', label: 'Cadrage', description: 'Etat actuel, vision cible, objectifs metier et gouvernance.' },
  { id: 'matrix', label: 'Matrice valeur / effort', description: 'Positionnement des projets par quadrant.' },
  { id: 'timeline', label: 'Timeline 3 ans', description: 'Trajectoire sequentielle sur une ligne de temps.' },
  { id: 'summary', label: 'Synthese CODIR', description: 'Tableau consolidable pour la direction.' }
];

const INITIAL_EXPORT_SELECTION = EXPORT_SECTIONS.reduce((selection, section) => ({ ...selection, [section.id]: true }), {});

const INITIAL_CONTEXT = { currentState: '', targetVision: '', businessObjectives: '', governance: '' };

const INITIAL_PROJECT = {
  name: '', scope: '', benefit: '', budget: '', value: 3, risk: 3, cost: 3, complexity: 3, phase: 'year-1', owner: '', kpi: ''
};

const scoreLabels = { 1: 'Tres faible', 2: 'Faible', 3: 'Moyen', 4: 'Fort', 5: 'Tres fort' };

function getEffort(project) {
  return Math.round((Number(project.cost) + Number(project.complexity)) / 2);
}

function getPriorityScore(project) {
  return Number(project.value) * 2 + Number(project.risk) * 2 - getEffort(project);
}

function getQuadrant(project) {
  const highValue = Number(project.value) >= 4 || Number(project.risk) >= 4;
  const lowEffort = getEffort(project) <= 3;
  if (highValue && lowEffort) return 'Quick win';
  if (highValue) return 'Strategique';
  if (lowEffort) return 'Gain secondaire';
  return 'A arbitrer';
}

function getPhase(project) {
  return PHASES.find((phase) => phase.id === project.phase) || PHASES[0];
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

function formatCurrency(value) {
  return `${Number(value || 0).toLocaleString('fr-FR')} EUR`;
}

function buildReportHtml({ context, sortedProjects, roadmapByPhase, summary, exportSelection, autoPrint = false }) {
  const reportDate = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date());
  const selectedSections = EXPORT_SECTIONS.filter((section) => exportSelection[section.id]);
  const selectedLabels = selectedSections.map((section) => section.label).join(' - ');

  const cadrageSection = exportSelection.cadrage ? `
    <section class="report-section framing-section">
      <div class="section-title">
        <span>01</span>
        <div><h2>Cadrage</h2><p>Les quatre blocs de cadrage du schema directeur SI.</p></div>
      </div>
      <div class="framing-grid">
        <article><h3>Etat actuel du SI</h3>${formatParagraphs(context.currentState)}</article>
        <article><h3>Vision cible 3 ans</h3>${formatParagraphs(context.targetVision)}</article>
        <article><h3>Objectifs metier</h3>${formatParagraphs(context.businessObjectives)}</article>
        <article><h3>Pilotage et gouvernance</h3>${formatParagraphs(context.governance)}</article>
      </div>
    </section>` : '';

  const matrixSection = exportSelection.matrix ? `
    <section class="report-section">
      <div class="section-title">
        <span>02</span>
        <div><h2>Matrice valeur / effort</h2><p>Lecture rapide des arbitrages : valeur, risque couvert, cout et complexite.</p></div>
      </div>
      <div class="export-matrix">
        ${QUADRANTS.map((quadrant) => {
          const quadrantProjects = sortedProjects.filter((project) => getQuadrant(project) === quadrant);
          return `<article class="export-quadrant export-quadrant-${escapeHtml(quadrant).toLowerCase().replace(/\s+/g, '-')}">
            <header><strong>${escapeHtml(quadrant)}</strong><span>${quadrantProjects.length}</span></header>
            <div class="export-quadrant-list">
              ${quadrantProjects.length === 0 ? '<p class="muted">Aucun projet.</p>' : quadrantProjects.map((project) => `<div class="export-project-pill">
                <div><strong>${escapeHtml(project.name)}</strong><small>${escapeHtml(getPhase(project).label)} - ${escapeHtml(getPhase(project).theme)}</small></div>
                <span>${getPriorityScore(project)}</span>
              </div>`).join('')}
            </div>
          </article>`;
        }).join('')}
      </div>
    </section>` : '';

  const timelineSection = exportSelection.timeline ? `
    <section class="report-section">
      <div class="section-title">
        <span>03</span>
        <div><h2>Timeline 3 ans</h2><p>Les projets sont positionnes sur une trajectoire progressive.</p></div>
      </div>
      <div class="export-timeline">
        ${roadmapByPhase.map((phase, index) => `<article class="export-timeline-phase">
          <div class="export-timeline-marker">${index + 1}</div>
          <div class="export-phase-card">
            <p>${escapeHtml(phase.label)}</p>
            <h3>${escapeHtml(phase.theme)}</h3>
            <small>${escapeHtml(phase.guidance)}</small>
            <div class="export-phase-projects">
              ${phase.projects.length === 0 ? '<span class="muted">Aucun projet affecte.</span>' : phase.projects.map((project) => `<div>
                <strong>${escapeHtml(project.name)}</strong>
                <span>${formatCurrency(project.budget)}</span>
                <small>${escapeHtml(project.benefit || project.scope || 'Benefice a preciser.')}</small>
              </div>`).join('')}
            </div>
          </div>
        </article>`).join('')}
      </div>
    </section>` : '';

  const summarySection = exportSelection.summary ? `
    <section class="report-section codir-section">
      <div class="section-title">
        <span>04</span>
        <div><h2>Synthese CODIR</h2><p>Synthese operationnelle a presenter en comite de direction.</p></div>
      </div>
      <table class="export-table">
        <thead><tr><th>Projet</th><th>Phase</th><th>Quadrant</th><th>Budget</th><th>Valeur / Risque</th><th>Effort</th><th>KPI</th></tr></thead>
        <tbody>
          ${sortedProjects.length === 0 ? '<tr><td colspan="7">Aucun projet a exporter.</td></tr>' : sortedProjects.map((project) => `<tr>
            <td><strong>${escapeHtml(project.name)}</strong><small>${escapeHtml(project.owner ? `Portage: ${project.owner}` : 'Portage a definir')}</small></td>
            <td>${escapeHtml(getPhase(project).label)}</td>
            <td><span class="quadrant-chip">${escapeHtml(getQuadrant(project))}</span></td>
            <td>${formatCurrency(project.budget)}</td>
            <td>${escapeHtml(scoreLabels[project.value])} / ${escapeHtml(scoreLabels[project.risk])}</td>
            <td>${getEffort(project)}/5</td>
            <td>${escapeHtml(project.kpi || 'A definir')}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </section>` : '';

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Schema directeur SI - Export</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #eef3fb; color: #14213d; font-family: Inter, Arial, sans-serif; }
    .report { max-width: 1180px; margin: 0 auto; padding: 36px; }
    .hero { background: linear-gradient(135deg, #1d4ed8, #4f46e5 52%, #0f172a); color: #fff; border-radius: 28px; padding: 34px; box-shadow: 0 24px 60px rgba(15, 23, 42, 0.22); }
    .hero p { color: rgba(255,255,255,0.78); margin: 0; }
    .hero h1 { font-size: 34px; line-height: 1.1; margin: 8px 0 16px; }
    .hero-grid { display: grid; gap: 16px; grid-template-columns: 1.4fr repeat(3, minmax(0, 1fr)); margin-top: 26px; }
    .hero-card { background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.18); border-radius: 18px; padding: 16px; }
    .hero-card span { display: block; font-size: 12px; font-weight: 800; letter-spacing: .08em; margin-bottom: 8px; text-transform: uppercase; color: rgba(255,255,255,0.72); }
    .hero-card strong { display: block; font-size: 22px; }
    .report-section { background: #fff; border: 1px solid rgba(15, 23, 42, .08); border-radius: 24px; box-shadow: 0 18px 44px rgba(15, 23, 42, .08); margin-top: 22px; padding: 28px; page-break-inside: avoid; }
    .section-title { align-items: flex-start; display: flex; gap: 14px; margin-bottom: 22px; }
    .section-title > span { align-items: center; background: #2563eb; border-radius: 14px; color: white; display: inline-flex; font-weight: 900; height: 42px; justify-content: center; min-width: 42px; }
    .section-title h2 { font-size: 24px; line-height: 1; margin: 0 0 8px; }
    .section-title p { color: #64748b; margin: 0; }
    .framing-grid { display: grid; gap: 16px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .framing-grid article { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 18px; padding: 18px; }
    .framing-grid h3 { color: #1d4ed8; font-size: 16px; margin: 0 0 10px; }
    .framing-grid p, .export-phase-card small, .export-phase-projects small { color: #475569; line-height: 1.58; margin: 0 0 8px; }
    .export-matrix { display: grid; gap: 16px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .export-quadrant { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 20px; min-height: 190px; padding: 18px; }
    .export-quadrant:nth-child(1) { box-shadow: inset 6px 0 0 #10b981; }
    .export-quadrant:nth-child(2) { box-shadow: inset 6px 0 0 #2563eb; }
    .export-quadrant:nth-child(3) { box-shadow: inset 6px 0 0 #f59e0b; }
    .export-quadrant:nth-child(4) { box-shadow: inset 6px 0 0 #ef4444; }
    .export-quadrant header { align-items: center; display: flex; justify-content: space-between; margin-bottom: 14px; }
    .export-quadrant header strong { font-size: 16px; }
    .export-quadrant header span, .export-project-pill > span { align-items: center; background: #2563eb; border-radius: 999px; color: #fff; display: inline-flex; font-weight: 900; height: 28px; justify-content: center; min-width: 28px; padding: 0 8px; }
    .export-quadrant-list { display: flex; flex-direction: column; gap: 10px; }
    .export-project-pill { align-items: center; background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; display: flex; justify-content: space-between; padding: 12px; }
    .export-project-pill strong, .export-table strong { display: block; }
    .export-project-pill small, .export-table small { color: #64748b; display: block; margin-top: 4px; }
    .export-timeline { display: grid; gap: 20px; grid-template-columns: repeat(3, minmax(0, 1fr)); padding-top: 56px; position: relative; }
    .export-timeline:before { background: linear-gradient(90deg, #10b981, #2563eb, #7c3aed); border-radius: 999px; content: ''; height: 7px; left: 7%; position: absolute; right: 7%; top: 21px; }
    .export-timeline-phase { position: relative; }
    .export-timeline-marker { align-items: center; background: #fff; border: 6px solid #2563eb; border-radius: 999px; box-shadow: 0 10px 24px rgba(37,99,235,.22); color: #1d4ed8; display: flex; font-size: 18px; font-weight: 900; height: 48px; justify-content: center; left: 50%; position: absolute; top: -58px; transform: translateX(-50%); width: 48px; z-index: 2; }
    .export-phase-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 20px; min-height: 230px; padding: 18px; }
    .export-phase-card p { color: #2563eb; font-size: 12px; font-weight: 900; letter-spacing: .08em; margin: 0 0 8px; text-transform: uppercase; }
    .export-phase-card h3 { font-size: 20px; margin: 0 0 10px; }
    .export-phase-projects { display: flex; flex-direction: column; gap: 10px; margin-top: 16px; }
    .export-phase-projects div { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 12px; }
    .export-phase-projects span { color: #1d4ed8; display: block; font-size: 13px; font-weight: 900; margin-top: 4px; }
    .export-table { border-collapse: separate; border-spacing: 0; overflow: hidden; width: 100%; }
    .export-table th { background: #1d4ed8; color: white; font-size: 12px; letter-spacing: .05em; padding: 13px; text-align: left; text-transform: uppercase; }
    .export-table td { background: #fff; border-bottom: 1px solid #e2e8f0; color: #334155; padding: 13px; vertical-align: top; }
    .export-table tr:nth-child(even) td { background: #f8fafc; }
    .quadrant-chip { background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 999px; color: #3730a3; display: inline-flex; font-size: 12px; font-weight: 900; padding: 6px 10px; }
    .muted { color: #94a3b8; font-style: italic; }
    .print-helper { background: rgba(255,255,255,.96); border: 1px solid #e2e8f0; border-radius: 999px; bottom: 22px; box-shadow: 0 14px 34px rgba(15, 23, 42, .18); display: flex; gap: 10px; padding: 10px; position: fixed; right: 22px; z-index: 20; }
    .print-helper button { background: #2563eb; border: 0; border-radius: 999px; color: #fff; cursor: pointer; font-weight: 900; padding: 10px 16px; }
    @media print { body { background: white; } .report { padding: 0; } .hero, .report-section { box-shadow: none; } .print-helper { display: none; } }
    @media (max-width: 900px) { .hero-grid, .framing-grid, .export-matrix, .export-timeline { grid-template-columns: 1fr; } .export-timeline:before { bottom: 0; height: auto; left: 23px; right: auto; top: 20px; width: 7px; } .export-timeline-marker { left: 24px; top: -45px; } }
  </style>
</head>
<body>
  <main class="report">
    <header class="hero">
      <p>Schema directeur SI - Export selectionne</p>
      <h1>Roadmap de transformation SI</h1>
      <p>${escapeHtml(selectedLabels || 'Aucune section selectionnee')} - Genere le ${escapeHtml(reportDate)}</p>
      <div class="hero-grid">
        <div class="hero-card"><span>Trajectoire</span><strong>3 ans</strong></div>
        <div class="hero-card"><span>Projets</span><strong>${sortedProjects.length}</strong></div>
        <div class="hero-card"><span>Budget total</span><strong>${formatCurrency(summary.totalBudget)}</strong></div>
        <div class="hero-card"><span>Quick wins</span><strong>${summary.quickWins}</strong></div>
      </div>
    </header>
    ${cadrageSection}
    ${matrixSection}
    ${timelineSection}
    ${summarySection}
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

export default function StrategicRoadmapTool() {
  const [context, setContext] = useState(INITIAL_CONTEXT);
  const [projectDraft, setProjectDraft] = useState(INITIAL_PROJECT);
  const [projects, setProjects] = useState([]);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportSelection, setExportSelection] = useState(INITIAL_EXPORT_SELECTION);
  const [isLoadingRoadmap, setIsLoadingRoadmap] = useState(true);
  const [isSavingContext, setIsSavingContext] = useState(false);
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [roadmapError, setRoadmapError] = useState('');
  const hasLoadedRoadmap = useRef(false);
  const contextAutosaveTimer = useRef(null);

  const sortedProjects = useMemo(() => [...projects].sort((a, b) => getPriorityScore(b) - getPriorityScore(a)), [projects]);
  const roadmapByPhase = useMemo(() => PHASES.map((phase) => ({ ...phase, projects: sortedProjects.filter((project) => project.phase === phase.id) })), [sortedProjects]);
  const summary = useMemo(() => ({
    totalBudget: projects.reduce((sum, project) => sum + (Number(project.budget) || 0), 0),
    criticalProjects: projects.filter((project) => Number(project.risk) >= 4).length,
    quickWins: projects.filter((project) => getQuadrant(project) === 'Quick win').length
  }), [projects]);
  const selectedExportCount = useMemo(() => EXPORT_SECTIONS.filter((section) => exportSelection[section.id]).length, [exportSelection]);

  useEffect(() => {
    let isMounted = true;

    async function loadRoadmap() {
      setIsLoadingRoadmap(true);
      setRoadmapError('');
      try {
        const [storedContext, storedProjects] = await Promise.all([getRoadmapContext(), getRoadmapProjects()]);
        if (!isMounted) return;
        setContext(storedContext);
        setProjects(storedProjects);
        hasLoadedRoadmap.current = true;
      } catch {
        if (isMounted) setRoadmapError('Impossible de charger les donnees du schema directeur depuis la base.');
      } finally {
        if (isMounted) setIsLoadingRoadmap(false);
      }
    }

    loadRoadmap();

    return () => {
      isMounted = false;
      if (contextAutosaveTimer.current) window.clearTimeout(contextAutosaveTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedRoadmap.current) return undefined;
    if (contextAutosaveTimer.current) window.clearTimeout(contextAutosaveTimer.current);

    contextAutosaveTimer.current = window.setTimeout(async () => {
      setIsSavingContext(true);
      setRoadmapError('');
      try {
        await updateRoadmapContext(context);
      } catch {
        setRoadmapError('La sauvegarde automatique du cadrage a echoue.');
      } finally {
        setIsSavingContext(false);
      }
    }, 700);

    return () => {
      if (contextAutosaveTimer.current) window.clearTimeout(contextAutosaveTimer.current);
    };
  }, [context]);

  const saveContextNow = async () => {
    if (contextAutosaveTimer.current) window.clearTimeout(contextAutosaveTimer.current);
    setIsSavingContext(true);
    setRoadmapError('');
    try {
      await updateRoadmapContext(context);
    } catch {
      setRoadmapError('Impossible de sauvegarder le cadrage.');
    } finally {
      setIsSavingContext(false);
    }
  };

  const updateContext = (field, value) => setContext((current) => ({ ...current, [field]: value }));
  const updateDraft = (field, value) => setProjectDraft((current) => ({ ...current, [field]: value }));
  const resetDraft = () => { setProjectDraft(INITIAL_PROJECT); setEditingProjectId(null); };
  const updateExportSelection = (sectionId) => {
    setExportSelection((current) => ({ ...current, [sectionId]: !current[sectionId] }));
  };

  const getReportHtml = (options = {}) => buildReportHtml({ context, sortedProjects, roadmapByPhase, summary, exportSelection, ...options });

  const exportHtmlReport = () => {
    if (selectedExportCount === 0) return;
    downloadFile('schema-directeur-si-roadmap.html', getReportHtml());
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
      setRoadmapError('Le navigateur a bloque l ouverture de l apercu PDF. Autorise les popups ou utilise l export HTML.');
      return;
    }

    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    setIsExportModalOpen(false);
  };

  const saveProject = async (event) => {
    event.preventDefault();
    const normalizedProject = {
      ...projectDraft,
      name: projectDraft.name.trim(),
      scope: projectDraft.scope.trim(),
      benefit: projectDraft.benefit.trim(),
      owner: projectDraft.owner.trim(),
      kpi: projectDraft.kpi.trim(),
      budget: Number(projectDraft.budget) || 0,
      value: Number(projectDraft.value),
      risk: Number(projectDraft.risk),
      cost: Number(projectDraft.cost),
      complexity: Number(projectDraft.complexity)
    };
    if (!normalizedProject.name) return;

    setIsSavingProject(true);
    setRoadmapError('');
    try {
      if (editingProjectId === null) {
        const createdProject = await createRoadmapProject(normalizedProject);
        setProjects((current) => [...current, createdProject]);
      } else {
        const updatedProject = await updateRoadmapProject(editingProjectId, normalizedProject);
        setProjects((current) => current.map((project) => (project.id === editingProjectId ? updatedProject : project)));
      }
      resetDraft();
    } catch {
      setRoadmapError('Impossible de sauvegarder le projet dans la base.');
    } finally {
      setIsSavingProject(false);
    }
  };

  const editProject = (project) => { setProjectDraft(project); setEditingProjectId(project.id ?? null); };
  const deleteProject = async (project) => {
    if (!project.id) {
      setProjects((current) => current.filter((item) => item !== project));
      resetDraft();
      return;
    }

    setIsSavingProject(true);
    setRoadmapError('');
    try {
      await deleteRoadmapProject(project.id);
      setProjects((current) => current.filter((item) => item.id !== project.id));
      resetDraft();
    } catch {
      setRoadmapError('Impossible de supprimer le projet en base.');
    } finally {
      setIsSavingProject(false);
    }
  };

  return (
    <div className="strategic-roadmap-tool">
      <section className="budget-toolbar glass-panel roadmap-toolbar">
        <div>
          <p className="eyebrow">Schema directeur SI</p>
          <h2>Roadmap de transformation</h2>
          <p>Construis une trajectoire SI en reliant diagnostic, vision cible, priorisation valeur / effort et planning 3 ans.</p>
        </div>
        <div className="budget-actions-panel roadmap-toolbar-actions">
          <small>{isLoadingRoadmap ? 'Chargement des donnees sauvegardees...' : isSavingContext || isSavingProject ? 'Sauvegarde en cours...' : 'Donnees sauvegardees en base MongoDB.'}</small>
          <button className="btn export-btn" type="button" onClick={() => setIsExportModalOpen(true)}>Exporter</button>
        </div>
      </section>

      {roadmapError && <p className="roadmap-error-message">{roadmapError}</p>}

      <section className="budget-summary">
        <article className="summary-positive"><span>Projets</span><strong>{projects.length}</strong></article>
        <article><span>Budget total</span><strong>{summary.totalBudget.toLocaleString('fr-FR')} €</strong></article>
        <article className="summary-negative"><span>Risques critiques</span><strong>{summary.criticalProjects}</strong></article>
        <article className="summary-positive"><span>Quick wins</span><strong>{summary.quickWins}</strong></article>
      </section>

      <section className="roadmap-layout">
        <div className="glass-panel roadmap-form-panel">
          <div className="section-heading roadmap-cadrage-heading"><div><h2>Cadrage</h2><p>Formalise les trois questions du schema directeur : etat actuel, cible et trajectoire.</p></div><button className="small-btn" type="button" onClick={saveContextNow} disabled={isSavingContext}>{isSavingContext ? 'Sauvegarde...' : 'Enregistrer'}</button></div>
          <div className="form-grid">
            <div className="form-group"><label htmlFor="currentState">Etat actuel du SI</label><textarea id="currentState" value={context.currentState} onChange={(event) => updateContext('currentState', event.target.value)} onBlur={saveContextNow} placeholder="Applications, infrastructure, processus, dette technique, risques..." /></div>
            <div className="form-group"><label htmlFor="targetVision">Vision cible 3 ans</label><textarea id="targetVision" value={context.targetVision} onChange={(event) => updateContext('targetVision', event.target.value)} onBlur={saveContextNow} placeholder="Capacites attendues, architecture cible, niveaux de service, securite..." /></div>
            <div className="form-group"><label htmlFor="businessObjectives">Objectifs metier</label><textarea id="businessObjectives" value={context.businessObjectives} onChange={(event) => updateContext('businessObjectives', event.target.value)} onBlur={saveContextNow} placeholder="Productivite, delais, qualite, experience utilisateur, conformite..." /></div>
            <div className="form-group"><label htmlFor="governance">Pilotage et gouvernance</label><textarea id="governance" value={context.governance} onChange={(event) => updateContext('governance', event.target.value)} onBlur={saveContextNow} placeholder="Comite de pilotage, KPI, frequence de revue, sponsors..." /></div>
          </div>
        </div>

        <form className="glass-panel roadmap-project-form" onSubmit={saveProject}>
          <div className="section-heading"><h2>{editingProjectId === null ? 'Ajouter un projet' : 'Modifier le projet'}</h2><p>Renseigne les criteres d arbitrage pour alimenter la matrice et la roadmap.</p></div>
          <div className="form-grid two-columns">
            <div className="form-group"><label htmlFor="projectName">Nom du projet</label><input id="projectName" value={projectDraft.name} onChange={(event) => updateDraft('name', event.target.value)} placeholder="Ex. MFA, PRA, refonte ERP" required /></div>
            <div className="form-group"><label htmlFor="projectOwner">Portage</label><input id="projectOwner" value={projectDraft.owner} onChange={(event) => updateDraft('owner', event.target.value)} placeholder="DSI, RSSI, metier, finance..." /></div>
          </div>
          <div className="form-group"><label htmlFor="projectScope">Perimetre</label><textarea id="projectScope" value={projectDraft.scope} onChange={(event) => updateDraft('scope', event.target.value)} placeholder="Ce que le projet couvre concretement." /></div>
          <div className="form-group"><label htmlFor="projectBenefit">Benefice attendu</label><textarea id="projectBenefit" value={projectDraft.benefit} onChange={(event) => updateDraft('benefit', event.target.value)} placeholder="Gain metier, risque reduit, conformite, continuite..." /></div>
          <div className="form-grid three-columns">
            <div className="form-group"><label htmlFor="projectBudget">Budget estime (€)</label><input id="projectBudget" type="number" min="0" value={projectDraft.budget} onChange={(event) => updateDraft('budget', event.target.value)} placeholder="40000" /></div>
            <div className="form-group"><label htmlFor="projectPhase">Phase</label><select id="projectPhase" value={projectDraft.phase} onChange={(event) => updateDraft('phase', event.target.value)}>{PHASES.map((phase) => <option key={phase.id} value={phase.id}>{phase.label} - {phase.theme}</option>)}</select></div>
            <div className="form-group"><label htmlFor="projectKpi">KPI cible</label><input id="projectKpi" value={projectDraft.kpi} onChange={(event) => updateDraft('kpi', event.target.value)} placeholder="Ex. disponibilite 99,5 %" /></div>
          </div>
          <fieldset className="score-fieldset">
            <legend>Criteres de priorisation</legend>
            <div className="form-grid four-columns">
              {[['value', 'Valeur metier'], ['risk', 'Risque couvert'], ['cost', 'Cout'], ['complexity', 'Complexite']].map(([field, label]) => (
                <div className="form-group compact-form-group" key={field}>
                  <label htmlFor={field}>{label}: {scoreLabels[projectDraft[field]]}</label>
                  <input id={field} type="range" min="1" max="5" value={projectDraft[field]} onChange={(event) => updateDraft(field, event.target.value)} />
                </div>
              ))}
            </div>
          </fieldset>
          <div className="calculation-preview"><span>Quadrant: <strong>{getQuadrant(projectDraft)}</strong></span><span>Effort: <strong>{getEffort(projectDraft)}/5</strong></span><span>Score: <strong>{getPriorityScore(projectDraft)}</strong></span></div>
          <div className="form-actions"><button className="btn" type="submit" disabled={isSavingProject}>{isSavingProject ? 'Sauvegarde...' : editingProjectId === null ? 'Ajouter a la roadmap' : 'Enregistrer'}</button>{editingProjectId !== null && <button className="btn secondary-btn" type="button" onClick={resetDraft}>Annuler</button>}</div>
        </form>
      </section>

      <section className="roadmap-results">
        <div className="glass-panel value-effort-panel">
          <div className="section-heading"><h2>Matrice valeur / effort</h2><p>Positionnement des projets selon la valeur metier et l effort estime.</p></div>
          <div className="value-effort-matrix" aria-label="Matrice valeur effort">
            {QUADRANTS.map((quadrant) => (
              <div className="matrix-quadrant" key={quadrant}>
                <strong>{quadrant}</strong>
                <div className="quadrant-projects">
                  {sortedProjects.filter((project) => getQuadrant(project) === quadrant).map((project) => <button key={project.id ?? `${project.name}-${project.phase}`} type="button" onClick={() => editProject(project)}>{project.name}<span>{getPriorityScore(project)}</span></button>)}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-panel roadmap-timeline-panel">
          <div className="section-heading"><h2>Timeline 3 ans</h2><p>Sequencement progressif : securiser, fiabiliser, transformer.</p></div>
          <div className="roadmap-timeline">
            {roadmapByPhase.map((phase, index) => (
              <article key={phase.id} className="timeline-phase">
                <div className="timeline-marker">{index + 1}</div><span>{phase.label}</span><h3>{phase.theme}</h3><small>{phase.guidance}</small>
                <div className="timeline-projects">
                  {phase.projects.length === 0 ? <p className="manager-empty">Aucun projet affecte.</p> : phase.projects.map((project) => (
                    <div className="timeline-project-card" key={project.id ?? `${phase.id}-${project.name}`}>
                      <div><strong>{project.name}</strong><span>{project.budget.toLocaleString('fr-FR')} €</span></div>
                      <p>{project.benefit || project.scope || 'Benefice a preciser.'}</p>
                      <div className="table-actions"><button type="button" className="small-btn" onClick={() => editProject(project)}>Modifier</button><button type="button" className="small-btn danger-btn" onClick={() => deleteProject(project)}>Supprimer</button></div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="glass-panel roadmap-export-panel">
        <div className="section-heading"><h2>Synthese CODIR</h2><p>Vue consolidable dans une presentation de schema directeur SI.</p></div>
        <div className="responsive-table">
          <table className="budget-project-table roadmap-table">
            <caption>Synthese des projets de schema directeur</caption>
            <thead><tr><th>Projet</th><th>Phase</th><th>Priorite</th><th>Budget</th><th>Valeur / Risque</th><th>Effort</th><th>KPI</th></tr></thead>
            <tbody>
              {sortedProjects.length === 0 ? <tr><td colSpan="7" className="empty-state">Ajoute un premier projet pour generer la synthese.</td></tr> : sortedProjects.map((project) => (
                <tr key={project.id ?? `${project.name}-${project.phase}-${project.budget}`}>
                  <td className="project-title-cell"><strong>{project.name}</strong><span>{project.scope || 'Perimetre a preciser.'}</span>{project.owner && <small>Portage: {project.owner}</small>}</td>
                  <td>{getPhase(project).label}</td><td><span className="score-pill decision-neutral">{getPriorityScore(project)}</span></td><td>{project.budget.toLocaleString('fr-FR')} €</td><td>{scoreLabels[project.value]} / {scoreLabels[project.risk]}</td><td>{getEffort(project)}/5</td><td>{project.kpi || 'A definir'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {isExportModalOpen && (
        <div className="export-modal-backdrop" role="presentation">
          <section className="export-modal glass-panel" role="dialog" aria-modal="true" aria-labelledby="exportModalTitle">
            <div className="export-modal-header">
              <div>
                <p className="eyebrow">Export</p>
                <h2 id="exportModalTitle">Exporter le schema directeur</h2>
                <p>Selectionne les blocs a inclure. Le rendu garde le cadrage en haut, la timeline sur un trait et la synthese CODIR en bas.</p>
              </div>
              <button className="modal-close-btn" type="button" aria-label="Fermer" onClick={() => setIsExportModalOpen(false)}>x</button>
            </div>
            <div className="export-selection-list">
              {EXPORT_SECTIONS.map((section) => (
                <label className="export-selection-item" key={section.id} htmlFor={`export-${section.id}`}>
                  <input id={`export-${section.id}`} type="checkbox" checked={exportSelection[section.id]} onChange={() => updateExportSelection(section.id)} />
                  <span><strong>{section.label}</strong><small>{section.description}</small></span>
                </label>
              ))}
            </div>
            <div className="export-modal-preview">
              <strong>Ordre du rendu</strong>
              <span>Cadrage</span>
              <span>Matrice valeur / effort</span>
              <span>Timeline 3 ans</span>
              <span>Synthese CODIR</span>
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
