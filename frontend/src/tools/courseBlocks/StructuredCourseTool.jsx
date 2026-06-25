import { useEffect, useMemo, useState } from 'react';
import {
  createCourseToolItem,
  deleteCourseToolItem,
  getCourseTool,
  updateCourseToolContext,
  updateCourseToolItem
} from '../../services/courseToolsApi';

function toNumberOrString(field, value) {
  if (field.type === 'number') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return value ?? '';
}

function buildInitialItem(collection) {
  return collection.fields.reduce((item, field) => {
    if (field.type === 'select') item[field.name] = field.options?.[0] || '';
    else if (field.type === 'number') item[field.name] = field.min || 0;
    else item[field.name] = '';
    return item;
  }, {});
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatText(value, fallback = 'A completer') {
  const normalized = String(value ?? '').trim();
  if (!normalized) return `<p class="muted">${escapeHtml(fallback)}</p>`;
  return normalized
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

function getDisplayName(item) {
  return item.name || item.title || item.component || 'Element sans nom';
}

function downloadHtml(filename, html) {
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

function buildReportHtml({ config, context, collections, autoPrint = false }) {
  const reportDate = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date());
  const totalItems = config.collections.reduce((total, collection) => total + (collections[collection.name] || []).length, 0);

  const contextSection = `
    <section class="report-section">
      <div class="section-title"><span>01</span><div><h2>Cadrage</h2><p>Elements de contexte et de lecture pour ${escapeHtml(config.block)}.</p></div></div>
      <div class="context-grid">
        ${config.contextFields.map((field) => `<article><h3>${escapeHtml(field.label)}</h3>${formatText(context[field.name])}</article>`).join('')}
      </div>
    </section>`;

  const collectionSections = config.collections.map((collection, index) => {
    const items = collections[collection.name] || [];
    return `
      <section class="report-section">
        <div class="section-title"><span>${String(index + 2).padStart(2, '0')}</span><div><h2>${escapeHtml(collection.title)}</h2><p>${escapeHtml(collection.description)}</p></div></div>
        <table class="export-table">
          <thead><tr><th>Element</th>${collection.summaryFields.map((fieldName) => `<th>${escapeHtml(collection.fields.find((field) => field.name === fieldName)?.label || fieldName)}</th>`).join('')}<th>Synthese</th></tr></thead>
          <tbody>
            ${items.length === 0 ? `<tr><td colspan="${collection.summaryFields.length + 2}">Aucune donnee renseignee.</td></tr>` : items.map((item) => {
              const detail = collection.fields
                .filter((field) => !['name', ...collection.summaryFields].includes(field.name))
                .map((field) => item[field.name] ? `<strong>${escapeHtml(field.label)} :</strong> ${escapeHtml(item[field.name])}` : '')
                .filter(Boolean)
                .join('<br>');
              return `<tr>
                <td><strong>${escapeHtml(getDisplayName(item))}</strong></td>
                ${collection.summaryFields.map((fieldName) => `<td>${escapeHtml(item[fieldName] ?? '')}</td>`).join('')}
                <td>${detail || '<span class="muted">A completer</span>'}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </section>`;
  }).join('');

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(config.title)} - Export</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #eef3fb; color: #14213d; font-family: Inter, Arial, sans-serif; }
    .report { max-width: 1180px; margin: 0 auto; padding: 36px; }
    .hero { background: linear-gradient(135deg, #1d4ed8, #4f46e5 52%, #0f172a); color: #fff; border-radius: 28px; padding: 34px; box-shadow: 0 24px 60px rgba(15, 23, 42, 0.22); }
    .hero p { color: rgba(255,255,255,0.78); margin: 0; }
    .hero h1 { font-size: 34px; line-height: 1.1; margin: 8px 0 16px; }
    .hero-grid { display: grid; gap: 16px; grid-template-columns: repeat(3, minmax(0, 1fr)); margin-top: 26px; }
    .hero-card { background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.18); border-radius: 18px; padding: 16px; }
    .hero-card span { display: block; font-size: 12px; font-weight: 800; letter-spacing: .08em; margin-bottom: 8px; text-transform: uppercase; color: rgba(255,255,255,0.72); }
    .hero-card strong { display: block; font-size: 22px; }
    .report-section { background: #fff; border: 1px solid rgba(15, 23, 42, .08); border-radius: 24px; box-shadow: 0 18px 40px rgba(15, 23, 42, .1); margin-top: 24px; padding: 28px; page-break-inside: avoid; }
    .section-title { align-items: flex-start; display: flex; gap: 18px; margin-bottom: 22px; }
    .section-title > span { align-items: center; background: #dbeafe; border-radius: 16px; color: #1d4ed8; display: inline-flex; font-size: 22px; font-weight: 900; height: 56px; justify-content: center; width: 56px; }
    .section-title h2 { font-size: 24px; line-height: 1; margin: 0 0 8px; }
    .section-title p, .muted { color: #64748b; }
    .context-grid { display: grid; gap: 16px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .context-grid article { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 18px; padding: 18px; }
    .context-grid h3 { margin: 0 0 10px; color: #1d4ed8; }
    p { line-height: 1.55; }
    .export-table { border-collapse: separate; border-spacing: 0; overflow: hidden; width: 100%; }
    .export-table th { background: #1d4ed8; color: white; font-size: 12px; letter-spacing: .05em; padding: 13px; text-align: left; text-transform: uppercase; }
    .export-table td { background: #fff; border-bottom: 1px solid #e2e8f0; color: #334155; padding: 13px; vertical-align: top; }
    .export-table tr:nth-child(even) td { background: #f8fafc; }
    .export-table strong { color: #0f172a; }
    @page { margin: 16mm; }
    @media print { body { background: #fff; } .report { padding: 0; max-width: none; } .report-section, .hero { box-shadow: none; } }
  </style>
</head>
<body>
  <main class="report">
    <header class="hero">
      <p>${escapeHtml(config.block)}</p>
      <h1>${escapeHtml(config.title)}</h1>
      <p>${escapeHtml(config.intro)}</p>
      <div class="hero-grid">
        <div class="hero-card"><span>Date export</span><strong>${escapeHtml(reportDate)}</strong></div>
        <div class="hero-card"><span>Sections</span><strong>${config.collections.length}</strong></div>
        <div class="hero-card"><span>Elements</span><strong>${totalItems}</strong></div>
      </div>
    </header>
    ${contextSection}
    ${collectionSections}
  </main>
  ${autoPrint ? '<script>window.addEventListener("load", () => { window.print(); });</script>' : ''}
</body>
</html>`;
}

function FieldInput({ field, value, onChange }) {
  if (field.type === 'textarea') {
    return <textarea value={value ?? ''} onChange={(event) => onChange(event.target.value)} placeholder={field.placeholder || ''} />;
  }
  if (field.type === 'select') {
    return (
      <select value={value ?? field.options?.[0] ?? ''} onChange={(event) => onChange(event.target.value)}>
        {(field.options || []).map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    );
  }
  return (
    <input
      type={field.type || 'text'}
      min={field.min}
      max={field.max}
      value={value ?? ''}
      onChange={(event) => onChange(toNumberOrString(field, event.target.value))}
      placeholder={field.placeholder || ''}
      required={field.required}
    />
  );
}

function ContextPanel({ config, context, setContext, onSave, isSaving }) {
  return (
    <section className="glass-panel structured-context-panel">
      <div className="section-heading">
        <p className="eyebrow">{config.block}</p>
        <h2>{config.title}</h2>
        <p>{config.intro}</p>
      </div>
      <div className="form-grid two-columns">
        {config.contextFields.map((field) => (
          <div className="form-group" key={field.name}>
            <label htmlFor={`${config.id}-${field.name}`}>{field.label}</label>
            <textarea
              id={`${config.id}-${field.name}`}
              value={context[field.name] || ''}
              onChange={(event) => setContext((current) => ({ ...current, [field.name]: event.target.value }))}
              placeholder={field.placeholder || ''}
              rows={4}
            />
          </div>
        ))}
      </div>
      <button className="btn" type="button" onClick={onSave} disabled={isSaving}>Enregistrer le cadrage</button>
    </section>
  );
}

function CollectionManager({ config, collection, items, onCreate, onUpdate, onDelete, isSaving }) {
  const [form, setForm] = useState(buildInitialItem(collection));
  const [editingId, setEditingId] = useState(null);

  const resetForm = () => {
    setForm(buildInitialItem(collection));
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (editingId) await onUpdate(collection.name, editingId, form);
    else await onCreate(collection.name, form);
    resetForm();
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setForm({ ...buildInitialItem(collection), ...item });
  };

  return (
    <section className="glass-panel structured-collection-panel">
      <div className="inline-heading">
        <div>
          <h2>{collection.title}</h2>
          <p>{collection.description}</p>
        </div>
        <span className="score-pill decision-neutral">{items.length}</span>
      </div>

      <form className="structured-item-form" onSubmit={handleSubmit}>
        <div className="form-grid two-columns">
          {collection.fields.map((field) => (
            <div className="form-group" key={field.name}>
              <label htmlFor={`${config.id}-${collection.name}-${field.name}`}>{field.label}</label>
              <FieldInput
                field={field}
                value={form[field.name]}
                onChange={(value) => setForm((current) => ({ ...current, [field.name]: value }))}
              />
            </div>
          ))}
        </div>
        <div className="form-actions">
          <button className="btn" type="submit" disabled={isSaving}>{editingId ? 'Modifier' : 'Ajouter'}</button>
          {editingId ? <button className="btn secondary-btn" type="button" onClick={resetForm}>Annuler</button> : null}
        </div>
      </form>

      <div className="responsive-table structured-table-wrapper">
        <table className="budget-project-table structured-table">
          <thead>
            <tr>
              <th>Element</th>
              {collection.summaryFields.map((fieldName) => <th key={fieldName}>{collection.fields.find((field) => field.name === fieldName)?.label || fieldName}</th>)}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={collection.summaryFields.length + 2} className="empty-state">Aucune donnee renseignee.</td></tr>
            ) : items.map((item) => (
              <tr key={item.id}>
                <td className="project-title-cell">
                  <strong>{getDisplayName(item)}</strong>
                  <span>{item.role || item.description || item.finding || item.rationale || item.impact || ''}</span>
                </td>
                {collection.summaryFields.map((fieldName) => <td key={fieldName}>{item[fieldName] ?? ''}</td>)}
                <td>
                  <div className="table-actions">
                    <button type="button" className="small-btn" onClick={() => handleEdit(item)}>Modifier</button>
                    <button type="button" className="small-btn danger-btn" onClick={() => onDelete(collection.name, item.id)}>Supprimer</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function StructuredCourseTool({ config }) {
  const [context, setContext] = useState({});
  const [collections, setCollections] = useState({});
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadTool = async () => {
    const data = await getCourseTool(config.id);
    setContext(data.context || {});
    setCollections(data.collections || {});
  };

  useEffect(() => {
    loadTool().catch((error) => {
      console.error(`Failed to load ${config.id}`, error);
      setMessage('Impossible de charger les donnees du tool.');
    });
  }, [config.id]);

  const summary = useMemo(() => config.collections.map((collection) => ({
    ...collection,
    count: (collections[collection.name] || []).length
  })), [config.collections, collections]);

  const saveContext = async () => {
    setIsSaving(true);
    setMessage('');
    try {
      const data = await updateCourseToolContext(config.id, context);
      setContext(data.context || {});
      setMessage('Cadrage enregistre.');
    } catch (error) {
      console.error('Failed to save context', error);
      setMessage('Erreur lors de l enregistrement du cadrage.');
    } finally {
      setIsSaving(false);
    }
  };

  const createItem = async (collectionName, item) => {
    setIsSaving(true);
    setMessage('');
    try {
      const created = await createCourseToolItem(config.id, collectionName, item);
      setCollections((current) => ({ ...current, [collectionName]: [...(current[collectionName] || []), created] }));
      setMessage('Element ajoute.');
    } catch (error) {
      console.error('Failed to create item', error);
      setMessage('Erreur lors de l ajout.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateItem = async (collectionName, itemId, item) => {
    setIsSaving(true);
    setMessage('');
    try {
      const updated = await updateCourseToolItem(config.id, collectionName, itemId, item);
      setCollections((current) => ({
        ...current,
        [collectionName]: (current[collectionName] || []).map((existing) => existing.id === itemId ? updated : existing)
      }));
      setMessage('Element modifie.');
    } catch (error) {
      console.error('Failed to update item', error);
      setMessage('Erreur lors de la modification.');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteItem = async (collectionName, itemId) => {
    const shouldDelete = window.confirm('Supprimer cet element ?');
    if (!shouldDelete) return;
    setIsSaving(true);
    setMessage('');
    try {
      await deleteCourseToolItem(config.id, collectionName, itemId);
      setCollections((current) => ({
        ...current,
        [collectionName]: (current[collectionName] || []).filter((item) => item.id !== itemId)
      }));
      setMessage('Element supprime.');
    } catch (error) {
      console.error('Failed to delete item', error);
      setMessage('Erreur lors de la suppression.');
    } finally {
      setIsSaving(false);
    }
  };

  const reportHtml = (options = {}) => buildReportHtml({ config, context, collections, ...options });

  const exportHtml = () => {
    downloadHtml(`sud-erp-${config.id}-synthese.html`, reportHtml());
  };

  const previewPdf = () => {
    const html = reportHtml({ autoPrint: true });
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const previewWindow = window.open(url, '_blank', 'width=1200,height=900');

    if (!previewWindow) {
      URL.revokeObjectURL(url);
      setMessage('Le navigateur a bloque l ouverture de l apercu PDF. Autorise les popups ou utilise l export HTML.');
      return;
    }

    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  return (
    <div className="tool-workspace structured-course-tool">
      <div className="structured-main-column">
        <ContextPanel config={config} context={context} setContext={setContext} onSave={saveContext} isSaving={isSaving} />
        {message ? <p className="tool-message">{message}</p> : null}
        {config.collections.map((collection) => (
          <CollectionManager
            key={collection.name}
            config={config}
            collection={collection}
            items={collections[collection.name] || []}
            onCreate={createItem}
            onUpdate={updateItem}
            onDelete={deleteItem}
            isSaving={isSaving}
          />
        ))}
      </div>

      <aside className="structured-side-column">
        <section className="glass-panel structured-summary-panel">
          <div className="section-heading">
            <p className="eyebrow">Synthese</p>
            <h2>{config.shortTitle}</h2>
            <p>Vue rapide de la couverture du bloc et des donnees saisies.</p>
          </div>
          <div className="structured-summary-list">
            {summary.map((section) => (
              <article key={section.name}>
                <div>
                  <strong>{section.title}</strong>
                  <span>{section.description}</span>
                </div>
                <em>{section.count}</em>
              </article>
            ))}
          </div>
          <div className="structured-export-actions no-print">
            <button type="button" className="btn export-btn" onClick={previewPdf}>Exporter PDF</button>
            <button type="button" className="btn secondary-btn export-btn" onClick={exportHtml}>Exporter HTML</button>
          </div>
        </section>
      </aside>
    </div>
  );
}
