import { useCallback, useMemo, useState } from 'react';
import RiskMatrixTable from './RiskMatrixTable';
import RiskSummary from './RiskSummary';
import { deleteRisk } from '../services/risksApi';
import { exportRiskMatrixPng } from '../utils/exportRiskMatrixPng';
import {
  buildRiskMatrixReportHtml,
  downloadRiskMatrixHtml,
} from '../utils/exportRiskMatrixReport';
import {
  countRisksByLevel,
  groupRisksByCell,
  sortRisksByScore
} from '../utils/riskMatrix';

export default function RiskMatrix({ risks, onRiskDeleted }) {
  const [exportError, setExportError] = useState('');
  const sortedRisks = useMemo(() => sortRisksByScore(risks), [risks]);
  const riskCountByLevel = useMemo(() => countRisksByLevel(sortedRisks), [sortedRisks]);
  const risksByCell = useMemo(() => groupRisksByCell(sortedRisks), [sortedRisks]);

  const handleDelete = useCallback(async (id) => {
    try {
      await deleteRisk(id);
      onRiskDeleted();
    } catch (error) {
      console.error('Error deleting risk', error);
    }
  }, [onRiskDeleted]);

  const reportHtml = useCallback((options = {}) => buildRiskMatrixReportHtml({
    risks: sortedRisks,
    riskCountByLevel,
    risksByCell,
    ...options,
  }), [riskCountByLevel, risksByCell, sortedRisks]);

  const handleExportPng = useCallback(() => {
    setExportError('');
    exportRiskMatrixPng({
      risks: sortedRisks,
      riskCountByLevel,
      risksByCell
    });
  }, [riskCountByLevel, risksByCell, sortedRisks]);

  const handleExportHtml = useCallback(() => {
    setExportError('');
    downloadRiskMatrixHtml('sud-erp-matrice-risque-synthese.html', reportHtml());
  }, [reportHtml]);

  const handleExportPdf = useCallback(() => {
    const html = reportHtml({ autoPrint: true });
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const previewWindow = window.open(url, '_blank', 'width=1200,height=900');

    if (!previewWindow) {
      URL.revokeObjectURL(url);
      setExportError('Le navigateur a bloque l ouverture de l apercu PDF. Autorise les popups ou utilise l export HTML.');
      return;
    }

    setExportError('');
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  }, [reportHtml]);

  return (
    <section className="glass-panel risk-panel" aria-labelledby="risk-matrix-title">
      <div className="matrix-header">
        <div>
          <p className="eyebrow">Visual assessment</p>
          <h2 id="risk-matrix-title">Risk Matrix</h2>
        </div>
        <div className="matrix-export-actions">
          <button type="button" className="btn export-btn" onClick={handleExportPdf}>
            Export PDF
          </button>
          <button type="button" className="btn secondary-btn export-btn" onClick={handleExportHtml}>
            Export HTML
          </button>
          <button type="button" className="btn secondary-btn export-btn" onClick={handleExportPng}>
            Export PNG
          </button>
        </div>
      </div>

      {exportError ? <p className="tool-message">{exportError}</p> : null}

      <RiskSummary totalRisks={sortedRisks.length} riskCountByLevel={riskCountByLevel} />
      <RiskMatrixTable risksByCell={risksByCell} onDeleteRisk={handleDelete} />
    </section>
  );
}
