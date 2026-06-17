import { useMemo } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8000/risks/';
const PROBABILITY_LEVELS = [1, 2, 3, 4, 5];
const IMPACT_LEVELS = [5, 4, 3, 2, 1];

const getScore = (risk) => risk.probability * risk.impact;

const getRiskLevel = (score) => {
  if (score <= 6) return 'low';
  if (score <= 14) return 'medium';
  return 'high';
};

const getScoreClass = (score) => `score-${getRiskLevel(score)}`;
const getCellClass = (probability, impact) => `risk-cell risk-cell-${getRiskLevel(probability * impact)}`;

const wrapText = (context, text, maxWidth) => {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';

  words.forEach((word) => {
    const testLine = line ? `${line} ${word}` : word;
    if (context.measureText(testLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  });

  if (line) lines.push(line);
  return lines;
};

export default function RiskMatrix({ risks, onRiskDeleted }) {
  const sortedRisks = useMemo(
    () => [...risks].sort((a, b) => getScore(b) - getScore(a)),
    [risks]
  );

  const riskCountByLevel = useMemo(() => (
    sortedRisks.reduce((acc, risk) => {
      acc[getRiskLevel(getScore(risk))] += 1;
      return acc;
    }, { low: 0, medium: 0, high: 0 })
  ), [sortedRisks]);

  const getRisksForCell = (probability, impact) => (
    sortedRisks.filter((risk) => risk.probability === probability && risk.impact === impact)
  );

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}${id}`);
      onRiskDeleted();
    } catch (error) {
      console.error('Error deleting risk', error);
    }
  };

  const handleExportPng = () => {
    const scale = window.devicePixelRatio || 1;
    const margin = 64;
    const topY = 184;
    const labelWidth = 76;
    const headerHeight = 64;
    const cellWidth = 184;
    const cellHeight = 128;
    const matrixWidth = labelWidth + PROBABILITY_LEVELS.length * cellWidth;
    const matrixHeight = headerHeight + IMPACT_LEVELS.length * cellHeight;
    const matrixGridX = margin + labelWidth;
    const detailsX = margin + matrixWidth + 56;
    const detailsWidth = 760;
    const canvasWidth = detailsX + detailsWidth + margin;
    const detailsInnerWidth = detailsWidth - 36;
    const detailLineHeight = 19;
    const mitigationLineHeight = 18;

    const palette = {
      background: '#0f172a',
      panel: '#182236',
      panelSoft: 'rgba(24, 34, 54, 0.78)',
      grid: 'rgba(255, 255, 255, 0.18)',
      text: '#f8fafc',
      muted: '#cbd5e1',
      faint: 'rgba(203, 213, 225, 0.74)',
      low: '#10b981',
      medium: '#f59e0b',
      high: '#ef4444',
      card: 'rgba(15, 23, 42, 0.86)',
      cardBorder: 'rgba(255, 255, 255, 0.24)'
    };

    const getRiskReference = (index) => `R${index + 1}`;
    const riskReferences = new Map(sortedRisks.map((risk, index) => [risk, getRiskReference(index)]));
    const getSafeText = (value, fallback = '-') => {
      const normalizedValue = String(value ?? '').trim();
      return normalizedValue || fallback;
    };

    const measurementCanvas = document.createElement('canvas');
    const measurementContext = measurementCanvas.getContext('2d');
    measurementContext.font = '400 15px Inter, Arial, sans-serif';

    const detailRows = sortedRisks.map((risk, index) => {
      const descriptionLines = wrapText(
        measurementContext,
        getSafeText(risk.description, 'Untitled risk'),
        detailsInnerWidth
      );
      measurementContext.font = '400 14px Inter, Arial, sans-serif';
      const mitigationLines = wrapText(
        measurementContext,
        getSafeText(risk.mitigation, 'No mitigation measure provided'),
        detailsInnerWidth
      );
      measurementContext.font = '600 15px Inter, Arial, sans-serif';
      const metaLines = wrapText(
        measurementContext,
        `Proba: ${risk.probability} | Impact: ${risk.impact} | CIA: ${getSafeText(risk.cia_pillar)}`,
        detailsInnerWidth - 92
      );
      measurementContext.font = '400 15px Inter, Arial, sans-serif';

      return {
        risk,
        reference: getRiskReference(index),
        descriptionLines,
        mitigationLines,
        metaLines,
        height: 34 + descriptionLines.length * detailLineHeight + 12 + metaLines.length * detailLineHeight + 26 + mitigationLines.length * mitigationLineHeight + 22
      };
    });

    const detailsHeaderHeight = 42;
    const detailsCardsHeight = detailRows.reduce((total, row) => total + row.height + 14, 0);
    const canvasHeight = Math.max(
      topY + matrixHeight + 112,
      topY + detailsHeaderHeight + detailsCardsHeight + 64
    );

    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth * scale;
    canvas.height = canvasHeight * scale;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;

    const context = canvas.getContext('2d');
    context.scale(scale, scale);

    const drawRoundedRect = (x, y, width, height, radius) => {
      const normalizedRadius = Math.min(radius, width / 2, height / 2);
      context.beginPath();
      context.moveTo(x + normalizedRadius, y);
      context.lineTo(x + width - normalizedRadius, y);
      context.quadraticCurveTo(x + width, y, x + width, y + normalizedRadius);
      context.lineTo(x + width, y + height - normalizedRadius);
      context.quadraticCurveTo(x + width, y + height, x + width - normalizedRadius, y + height);
      context.lineTo(x + normalizedRadius, y + height);
      context.quadraticCurveTo(x, y + height, x, y + height - normalizedRadius);
      context.lineTo(x, y + normalizedRadius);
      context.quadraticCurveTo(x, y, x + normalizedRadius, y);
      context.closePath();
    };

    const fillRoundedRect = (x, y, width, height, radius, fillStyle, strokeStyle = null) => {
      drawRoundedRect(x, y, width, height, radius);
      context.fillStyle = fillStyle;
      context.fill();
      if (strokeStyle) {
        context.strokeStyle = strokeStyle;
        context.stroke();
      }
    };

    const drawWrappedLines = (lines, x, y, lineHeight) => {
      lines.forEach((line, index) => {
        context.fillText(line, x, y + index * lineHeight);
      });
      return y + lines.length * lineHeight;
    };

    const drawSummaryPill = (x, y, label, value, level = null) => {
      const pillText = `${label}: ${value}`;
      context.font = '700 18px Inter, Arial, sans-serif';
      const pillWidth = Math.ceil(context.measureText(pillText).width) + (level ? 58 : 34);
      fillRoundedRect(x, y, pillWidth, 38, 19, palette.panelSoft, palette.grid);

      if (level) {
        context.fillStyle = palette[level];
        context.beginPath();
        context.arc(x + 22, y + 19, 7, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = palette.text;
        context.fillText(pillText, x + 40, y + 25);
      } else {
        context.fillStyle = palette.text;
        context.fillText(pillText, x + 17, y + 25);
      }

      return x + pillWidth + 12;
    };

    context.fillStyle = palette.background;
    context.fillRect(0, 0, canvasWidth, canvasHeight);

    context.fillStyle = palette.text;
    context.font = '700 44px Inter, Arial, sans-serif';
    context.fillText('Risk Matrix', margin, 78);

    let summaryX = margin;
    const summaryY = 112;
    summaryX = drawSummaryPill(summaryX, summaryY, 'Total risks', sortedRisks.length);
    summaryX = drawSummaryPill(summaryX, summaryY, 'Low', riskCountByLevel.low, 'low');
    summaryX = drawSummaryPill(summaryX, summaryY, 'Medium', riskCountByLevel.medium, 'medium');
    drawSummaryPill(summaryX, summaryY, 'High', riskCountByLevel.high, 'high');

    context.font = '700 22px Inter, Arial, sans-serif';
    context.fillStyle = palette.muted;
    context.fillText('Impact', margin - 4, topY + headerHeight + cellHeight * 2 + 38);

    context.save();
    context.translate(matrixGridX + (PROBABILITY_LEVELS.length * cellWidth) / 2 - 66, topY + matrixHeight + 52);
    context.fillStyle = palette.muted;
    context.fillText('Probability', 0, 0);
    context.restore();

    PROBABILITY_LEVELS.forEach((probability, columnIndex) => {
      const x = matrixGridX + columnIndex * cellWidth;
      context.fillStyle = palette.panel;
      context.fillRect(x, topY, cellWidth, headerHeight);
      context.strokeStyle = palette.grid;
      context.strokeRect(x, topY, cellWidth, headerHeight);
      context.fillStyle = palette.text;
      context.font = '700 24px Inter, Arial, sans-serif';
      context.textAlign = 'center';
      context.fillText(`P ${probability}`, x + cellWidth / 2, topY + 40);
      context.textAlign = 'left';
    });

    IMPACT_LEVELS.forEach((impact, rowIndex) => {
      const y = topY + headerHeight + rowIndex * cellHeight;
      context.fillStyle = palette.panel;
      context.fillRect(matrixGridX - labelWidth, y, labelWidth, cellHeight);
      context.strokeStyle = palette.grid;
      context.strokeRect(matrixGridX - labelWidth, y, labelWidth, cellHeight);
      context.fillStyle = palette.text;
      context.font = '700 24px Inter, Arial, sans-serif';
      context.textAlign = 'center';
      context.fillText(`I ${impact}`, matrixGridX - labelWidth / 2, y + cellHeight / 2 + 8);
      context.textAlign = 'left';

      PROBABILITY_LEVELS.forEach((probability, columnIndex) => {
        const x = matrixGridX + columnIndex * cellWidth;
        const score = probability * impact;
        const level = getRiskLevel(score);
        const cellRisks = getRisksForCell(probability, impact);

        context.globalAlpha = 0.22;
        context.fillStyle = palette[level];
        context.fillRect(x, y, cellWidth, cellHeight);
        context.globalAlpha = 1;
        context.strokeStyle = palette.grid;
        context.strokeRect(x, y, cellWidth, cellHeight);

        context.fillStyle = palette.text;
        context.font = '700 17px Inter, Arial, sans-serif';
        context.fillText(`Score ${score}`, x + 12, y + 25);

        const maxCards = Math.min(cellRisks.length, 3);
        for (let index = 0; index < maxCards; index += 1) {
          const risk = cellRisks[index];
          const cardY = y + 40 + index * 28;
          const reference = riskReferences.get(risk);
          context.fillStyle = palette.card;
          context.strokeStyle = palette.cardBorder;
          context.fillRect(x + 10, cardY, cellWidth - 20, 24);
          context.strokeRect(x + 10, cardY, cellWidth - 20, 24);
          context.fillStyle = palette[level];
          context.font = '800 12px Inter, Arial, sans-serif';
          context.fillText(reference, x + 18, cardY + 16);
          context.fillStyle = palette.text;
          context.font = '600 12px Inter, Arial, sans-serif';
          const [line] = wrapText(context, getSafeText(risk.description, 'Untitled risk'), cellWidth - 76);
          context.fillText(line || 'Untitled risk', x + 50, cardY + 16);
        }

        if (cellRisks.length > maxCards) {
          context.fillStyle = palette.muted;
          context.font = '600 13px Inter, Arial, sans-serif';
          context.fillText(`+${cellRisks.length - maxCards} more`, x + 14, y + cellHeight - 14);
        }
      });
    });

    context.fillStyle = palette.text;
    context.font = '700 26px Inter, Arial, sans-serif';
    context.fillText('Risk details', detailsX, topY + 26);
    context.fillStyle = palette.muted;
    context.font = '500 15px Inter, Arial, sans-serif';
    context.fillText('Full description, probability, impact, CIA pillar and mitigation measure.', detailsX, topY + 50);

    let detailY = topY + 72;
    detailRows.forEach(({ risk, reference, descriptionLines, mitigationLines, metaLines, height }) => {
      const score = getScore(risk);
      const level = getRiskLevel(score);
      fillRoundedRect(detailsX, detailY, detailsWidth, height, 18, palette.card, palette.cardBorder);

      fillRoundedRect(detailsX + 18, detailY + 17, 56, 26, 13, palette[level]);
      context.fillStyle = '#ffffff';
      context.font = '800 15px Inter, Arial, sans-serif';
      context.fillText(reference, detailsX + 34, detailY + 35);

      context.fillStyle = palette.text;
      context.font = '700 16px Inter, Arial, sans-serif';
      context.fillText(`Score ${score}`, detailsX + 90, detailY + 35);

      context.fillStyle = palette.text;
      context.font = '600 15px Inter, Arial, sans-serif';
      let textY = detailY + 66;
      textY = drawWrappedLines(descriptionLines, detailsX + 18, textY, detailLineHeight);

      context.fillStyle = palette.faint;
      context.font = '600 15px Inter, Arial, sans-serif';
      textY += 12;
      textY = drawWrappedLines(metaLines, detailsX + 18, textY, detailLineHeight);

      context.fillStyle = palette.muted;
      context.font = '700 14px Inter, Arial, sans-serif';
      textY += 17;
      context.fillText('Mesure:', detailsX + 18, textY);

      context.fillStyle = palette.faint;
      context.font = '400 14px Inter, Arial, sans-serif';
      drawWrappedLines(mitigationLines, detailsX + 18, textY + 22, mitigationLineHeight);

      detailY += height + 14;
    });

    const link = document.createElement('a');
    link.download = `risk-matrix-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

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

      <div className="risk-summary" aria-label="Risk distribution by level">
        <span><strong>{sortedRisks.length}</strong> total risks</span>
        <span className="summary-low"><strong>{riskCountByLevel.low}</strong> low</span>
        <span className="summary-medium"><strong>{riskCountByLevel.medium}</strong> medium</span>
        <span className="summary-high"><strong>{riskCountByLevel.high}</strong> high</span>
      </div>

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
                {PROBABILITY_LEVELS.map((probability) => {
                  const score = probability * impact;
                  const cellRisks = getRisksForCell(probability, impact);

                  return (
                    <td key={`${impact}-${probability}`} className={getCellClass(probability, impact)}>
                      <div className="cell-score">{score}</div>
                      <div className="cell-risks">
                        {cellRisks.length === 0 ? (
                          <span className="cell-empty">-</span>
                        ) : (
                          cellRisks.map((risk) => (
                            <article key={risk.id} className="matrix-risk-chip">
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
                                onClick={() => handleDelete(risk.id)}
                                aria-label={`Delete risk: ${risk.description}`}
                                title="Delete risk"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <path d="M3 6h18" />
                                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                </svg>
                              </button>
                            </article>
                          ))
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
