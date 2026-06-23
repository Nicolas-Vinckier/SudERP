import { useCallback, useMemo } from 'react';
import RiskMatrixTable from './RiskMatrixTable';
import RiskSummary from './RiskSummary';
import { deleteRisk } from '../services/risksApi';
import { exportRiskMatrixPng } from '../utils/exportRiskMatrixPng';
import {
  countRisksByLevel,
  groupRisksByCell,
  sortRisksByScore
} from '../utils/riskMatrix';

export default function RiskMatrix({ risks, onRiskDeleted }) {
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

  const handleExportPng = useCallback(() => {
    exportRiskMatrixPng({
      risks: sortedRisks,
      riskCountByLevel,
      risksByCell
    });
  }, [riskCountByLevel, risksByCell, sortedRisks]);

  return (
    <section className="glass-panel risk-panel" aria-labelledby="risk-matrix-title">
      <div className="matrix-header">
        <div>
          <p className="eyebrow">Visual assessment</p>
          <h2 id="risk-matrix-title">Risk Matrix</h2>
        </div>
        <button type="button" className="btn export-btn" onClick={handleExportPng}>
          Export PNG
        </button>
      </div>

      <RiskSummary totalRisks={sortedRisks.length} riskCountByLevel={riskCountByLevel} />
      <RiskMatrixTable risksByCell={risksByCell} onDeleteRisk={handleDelete} />
    </section>
  );
}
