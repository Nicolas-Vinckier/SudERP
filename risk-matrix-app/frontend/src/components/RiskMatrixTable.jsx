import DeleteRiskIcon from './DeleteRiskIcon';
import {
  getCellClass,
  getRiskLevel,
  getRisksForCell,
  getScoreClass,
  IMPACT_LEVELS,
  PROBABILITY_LEVELS
} from '../utils/riskMatrix';

function RiskChip({ risk, score, onDeleteRisk }) {
  return (
    <article className="matrix-risk-chip">
      <div className="chip-header">
        <span className="chip-title">{risk.description}</span>
        <span className={`chip-score ${getScoreClass(score)}`}>{score}</span>
      </div>
      <div className="chip-meta">
        <span>{risk.cia_pillar}</span>
        <span>{risk.mitigation}</span>
      </div>
      <button
        type="button"
        className="chip-delete-btn"
        onClick={() => onDeleteRisk(risk.id)}
        aria-label={`Delete risk: ${risk.description}`}
        title="Delete risk"
      >
        <DeleteRiskIcon />
      </button>
    </article>
  );
}

function RiskMatrixCell({ probability, impact, risksByCell, onDeleteRisk }) {
  const score = probability * impact;
  const cellRisks = getRisksForCell(risksByCell, probability, impact);

  return (
    <td className={getCellClass(probability, impact)} data-risk-level={getRiskLevel(score)}>
      <div className="cell-score">{score}</div>
      <div className="cell-risks">
        {cellRisks.length === 0 ? (
          <span className="cell-empty">-</span>
        ) : (
          cellRisks.map((risk) => (
            <RiskChip
              key={risk.id}
              risk={risk}
              score={score}
              onDeleteRisk={onDeleteRisk}
            />
          ))
        )}
      </div>
    </td>
  );
}

export default function RiskMatrixTable({ risksByCell, onDeleteRisk }) {
  return (
    <div className="risk-matrix-wrapper">
      <table className="risk-matrix-table" aria-label="Risk matrix by impact and probability">
        <caption>Impact and probability matrix. Each cell contains the risks matching its score.</caption>
        <thead>
          <tr>
            <th scope="col" className="axis-corner">
              <span>Impact</span>
              <span>Probability</span>
            </th>
            {PROBABILITY_LEVELS.map((probability) => (
              <th key={probability} scope="col">P {probability}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {IMPACT_LEVELS.map((impact) => (
            <tr key={impact}>
              <th scope="row">I {impact}</th>
              {PROBABILITY_LEVELS.map((probability) => (
                <RiskMatrixCell
                  key={`${impact}-${probability}`}
                  probability={probability}
                  impact={impact}
                  risksByCell={risksByCell}
                  onDeleteRisk={onDeleteRisk}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
