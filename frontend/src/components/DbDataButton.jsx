import { useRef, useState } from 'react';
import { getToolDbData, importToolDbData } from '../services/toolDbDataApi';

function buildJsonFileName(toolId) {
  const date = new Date().toISOString().slice(0, 10);
  return `sud-erp-${toolId}-db-data-${date}.json`;
}

function downloadJsonFile(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function readJsonFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

export default function DbDataButton({ tool, onImported }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [importPayload, setImportPayload] = useState('');
  const fileInputRef = useRef(null);

  const resetFeedback = () => {
    setMessage('');
    setErrorMessage('');
  };

  const handleExport = async () => {
    resetFeedback();
    setIsBusy(true);
    try {
      const response = await getToolDbData(tool.id);
      downloadJsonFile(buildJsonFileName(tool.id), response.data);
      setMessage('Sauvegarde JSON generee.');
    } catch (error) {
      console.error('Failed to export tool DB data', error);
      setErrorMessage('Impossible de generer la sauvegarde JSON.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleFileChange = async (event) => {
    const [file] = event.target.files || [];
    if (!file) return;

    resetFeedback();
    try {
      const content = await readJsonFile(file);
      JSON.parse(content);
      setImportPayload(content);
      setMessage(`Fichier ${file.name} charge. Lance l import pour remplacer les donnees de cet outil.`);
    } catch (error) {
      console.error('Invalid JSON file', error);
      setErrorMessage('Le fichier selectionne contient un JSON invalide.');
    } finally {
      event.target.value = '';
    }
  };

  const getDataFromImportPayload = () => {
    const parsedPayload = JSON.parse(importPayload);

    if (parsedPayload.tool_id && parsedPayload.tool_id !== tool.id) {
      throw new Error(`Ce fichier concerne l outil ${parsedPayload.tool_id}.`);
    }

    return parsedPayload.data || parsedPayload;
  };

  const handleImport = async () => {
    resetFeedback();

    if (!importPayload.trim()) {
      setErrorMessage('Colle un JSON ou selectionne un fichier avant de lancer l import.');
      return;
    }

    let data;
    try {
      data = getDataFromImportPayload();
    } catch (error) {
      setErrorMessage(error.message || 'JSON invalide.');
      return;
    }

    const shouldImport = window.confirm(
      `Importer ces donnees JSON dans "${tool.title}" ? Les donnees actuelles de cet outil seront remplacees.`
    );
    if (!shouldImport) return;

    setIsBusy(true);
    try {
      await importToolDbData(tool.id, data, true);
      setMessage('Import termine. Les donnees de l outil ont ete rechargees.');
      setImportPayload('');
      onImported?.();
    } catch (error) {
      console.error('Failed to import tool DB data', error);
      setErrorMessage(error.response?.data?.detail || 'Impossible d importer les donnees JSON.');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="btn db-data-button no-print"
        onClick={() => {
          resetFeedback();
          setIsOpen(true);
        }}
      >
        db data
      </button>

      {isOpen ? (
        <div className="db-data-modal-backdrop no-print" role="presentation">
          <section className="db-data-modal glass-panel" role="dialog" aria-modal="true" aria-labelledby="dbDataModalTitle">
            <div className="db-data-modal-header">
              <div>
                <p className="eyebrow">Donnees DB</p>
                <h2 id="dbDataModalTitle">{tool.title}</h2>
                <p>Sauvegarde ou restaure les donnees MongoDB de cet outil au format JSON.</p>
              </div>
              <button type="button" className="icon-btn" onClick={() => setIsOpen(false)} aria-label="Fermer">
                x
              </button>
            </div>

            {message ? <p className="tool-message success-message">{message}</p> : null}
            {errorMessage ? <p className="tool-message error-message">{errorMessage}</p> : null}

            <div className="db-data-grid">
              <article className="db-data-card">
                <h3>Sauvegarde</h3>
                <p>Exporte uniquement les informations de cet outil. Le fichier contient aussi un identifiant d outil pour eviter les imports croises.</p>
                <button type="button" className="btn" onClick={handleExport} disabled={isBusy}>
                  Telecharger le JSON
                </button>
              </article>

              <article className="db-data-card">
                <h3>Importation</h3>
                <p>L import remplace les donnees actuelles de cet outil par celles du JSON fourni.</p>
                <div className="db-data-import-actions">
                  <button type="button" className="btn secondary-btn" onClick={() => fileInputRef.current?.click()} disabled={isBusy}>
                    Choisir un fichier JSON
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json,.json"
                    className="visually-hidden"
                    onChange={handleFileChange}
                  />
                </div>
                <label className="db-data-textarea-label" htmlFor="dbDataImportPayload">
                  JSON a importer
                </label>
                <textarea
                  id="dbDataImportPayload"
                  value={importPayload}
                  onChange={(event) => setImportPayload(event.target.value)}
                  placeholder="Colle ici le contenu JSON exporte depuis db data."
                  rows={10}
                />
                <button type="button" className="btn danger-outline-btn" onClick={handleImport} disabled={isBusy}>
                  Importer et remplacer
                </button>
              </article>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
