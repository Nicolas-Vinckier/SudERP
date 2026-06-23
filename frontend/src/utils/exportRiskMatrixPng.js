import {
  getRiskLevel,
  getRisksForCell,
  getSafeText,
  getScore,
  IMPACT_LEVELS,
  PROBABILITY_LEVELS,
  RISK_LEVELS
} from './riskMatrix';

const EXPORT_PALETTES = {
  dark: {
    background: '#0f172a',
    panel: '#182236',
    panelSoft: 'rgba(24, 34, 54, 0.78)',
    grid: 'rgba(255, 255, 255, 0.18)',
    text: '#f8fafc',
    muted: '#cbd5e1',
    faint: 'rgba(203, 213, 225, 0.74)',
    [RISK_LEVELS.LOW]: '#10b981',
    [RISK_LEVELS.MEDIUM]: '#f59e0b',
    [RISK_LEVELS.HIGH]: '#ef4444',
    card: 'rgba(15, 23, 42, 0.86)',
    cardBorder: 'rgba(255, 255, 255, 0.24)',
    chipText: '#ffffff'
  },
  light: {
    background: '#f8fafc',
    panel: '#e2e8f0',
    panelSoft: 'rgba(255, 255, 255, 0.9)',
    grid: 'rgba(15, 23, 42, 0.16)',
    text: '#0f172a',
    muted: '#475569',
    faint: 'rgba(71, 85, 105, 0.86)',
    [RISK_LEVELS.LOW]: '#059669',
    [RISK_LEVELS.MEDIUM]: '#d97706',
    [RISK_LEVELS.HIGH]: '#dc2626',
    card: '#ffffff',
    cardBorder: 'rgba(15, 23, 42, 0.16)',
    chipText: '#ffffff'
  }
};

const LAYOUT = {
  margin: 64,
  topY: 184,
  labelWidth: 76,
  headerHeight: 64,
  cellWidth: 184,
  cellHeight: 128,
  detailsGap: 56,
  detailsWidth: 760,
  detailLineHeight: 19,
  mitigationLineHeight: 18
};

const FONT_FAMILY = 'Inter, Arial, sans-serif';

const makeFont = (weight, size) => `${weight} ${size}px ${FONT_FAMILY}`;

const getRiskReference = (index) => `R${index + 1}`;

const getActiveExportPalette = () => {
  const theme = document.documentElement.dataset.theme;
  return EXPORT_PALETTES[theme] || EXPORT_PALETTES.dark;
};

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

const createMeasurementContext = () => {
  const measurementCanvas = document.createElement('canvas');
  return measurementCanvas.getContext('2d');
};

const buildDetailRows = (context, risks, detailsInnerWidth) => (
  risks.map((risk, index) => {
    context.font = makeFont(400, 15);
    const descriptionLines = wrapText(
      context,
      getSafeText(risk.description, 'Untitled risk'),
      detailsInnerWidth
    );

    context.font = makeFont(400, 14);
    const mitigationLines = wrapText(
      context,
      getSafeText(risk.mitigation, 'No mitigation measure provided'),
      detailsInnerWidth
    );

    context.font = makeFont(600, 15);
    const metaLines = wrapText(
      context,
      `Proba: ${risk.probability} | Impact: ${risk.impact} | CIA: ${getSafeText(risk.cia_pillar)}`,
      detailsInnerWidth - 92
    );

    return {
      risk,
      reference: getRiskReference(index),
      descriptionLines,
      mitigationLines,
      metaLines,
      height: 34
        + descriptionLines.length * LAYOUT.detailLineHeight
        + 12
        + metaLines.length * LAYOUT.detailLineHeight
        + 26
        + mitigationLines.length * LAYOUT.mitigationLineHeight
        + 22
    };
  })
);

const getExportDimensions = (detailRows) => {
  const matrixWidth = LAYOUT.labelWidth + PROBABILITY_LEVELS.length * LAYOUT.cellWidth;
  const matrixHeight = LAYOUT.headerHeight + IMPACT_LEVELS.length * LAYOUT.cellHeight;
  const detailsX = LAYOUT.margin + matrixWidth + LAYOUT.detailsGap;
  const detailsHeaderHeight = 42;
  const detailsCardsHeight = detailRows.reduce((total, row) => total + row.height + 14, 0);

  return {
    matrixWidth,
    matrixHeight,
    matrixGridX: LAYOUT.margin + LAYOUT.labelWidth,
    detailsX,
    canvasWidth: detailsX + LAYOUT.detailsWidth + LAYOUT.margin,
    canvasHeight: Math.max(
      LAYOUT.topY + matrixHeight + 112,
      LAYOUT.topY + detailsHeaderHeight + detailsCardsHeight + 64
    )
  };
};

const createCanvas = (width, height) => {
  const scale = window.devicePixelRatio || 1;
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const context = canvas.getContext('2d');
  context.scale(scale, scale);

  return { canvas, context };
};

const drawRoundedRect = (context, x, y, width, height, radius) => {
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

const fillRoundedRect = (context, x, y, width, height, radius, fillStyle, strokeStyle = null) => {
  drawRoundedRect(context, x, y, width, height, radius);
  context.fillStyle = fillStyle;
  context.fill();
  if (strokeStyle) {
    context.strokeStyle = strokeStyle;
    context.stroke();
  }
};

const drawWrappedLines = (context, lines, x, y, lineHeight) => {
  lines.forEach((line, index) => {
    context.fillText(line, x, y + index * lineHeight);
  });
  return y + lines.length * lineHeight;
};

const drawSummaryPill = (context, palette, x, y, label, value, level = null) => {
  const pillText = `${label}: ${value}`;
  context.font = makeFont(700, 18);
  const pillWidth = Math.ceil(context.measureText(pillText).width) + (level ? 58 : 34);
  fillRoundedRect(context, x, y, pillWidth, 38, 19, palette.panelSoft, palette.grid);

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

const drawTitleAndSummary = (context, palette, risks, riskCountByLevel) => {
  context.fillStyle = palette.text;
  context.font = makeFont(700, 44);
  context.fillText('Risk Matrix', LAYOUT.margin, 78);

  let summaryX = LAYOUT.margin;
  const summaryY = 112;
  summaryX = drawSummaryPill(context, palette, summaryX, summaryY, 'Total risks', risks.length);
  summaryX = drawSummaryPill(
    context,
    palette,
    summaryX,
    summaryY,
    'Low',
    riskCountByLevel.low,
    RISK_LEVELS.LOW
  );
  summaryX = drawSummaryPill(
    context,
    palette,
    summaryX,
    summaryY,
    'Medium',
    riskCountByLevel.medium,
    RISK_LEVELS.MEDIUM
  );
  drawSummaryPill(
    context,
    palette,
    summaryX,
    summaryY,
    'High',
    riskCountByLevel.high,
    RISK_LEVELS.HIGH
  );
};

const drawAxisLabels = (context, palette, dimensions) => {
  context.font = makeFont(700, 22);
  context.fillStyle = palette.muted;
  context.fillText(
    'Impact',
    LAYOUT.margin - 4,
    LAYOUT.topY + LAYOUT.headerHeight + LAYOUT.cellHeight * 2 + 38
  );

  context.save();
  context.translate(
    dimensions.matrixGridX + (PROBABILITY_LEVELS.length * LAYOUT.cellWidth) / 2 - 66,
    LAYOUT.topY + dimensions.matrixHeight + 52
  );
  context.fillStyle = palette.muted;
  context.fillText('Probability', 0, 0);
  context.restore();
};

const drawProbabilityHeaders = (context, palette, matrixGridX) => {
  PROBABILITY_LEVELS.forEach((probability, columnIndex) => {
    const x = matrixGridX + columnIndex * LAYOUT.cellWidth;
    context.fillStyle = palette.panel;
    context.fillRect(x, LAYOUT.topY, LAYOUT.cellWidth, LAYOUT.headerHeight);
    context.strokeStyle = palette.grid;
    context.strokeRect(x, LAYOUT.topY, LAYOUT.cellWidth, LAYOUT.headerHeight);
    context.fillStyle = palette.text;
    context.font = makeFont(700, 24);
    context.textAlign = 'center';
    context.fillText(`P ${probability}`, x + LAYOUT.cellWidth / 2, LAYOUT.topY + 40);
    context.textAlign = 'left';
  });
};

const drawImpactHeader = (context, palette, matrixGridX, y, impact) => {
  context.fillStyle = palette.panel;
  context.fillRect(matrixGridX - LAYOUT.labelWidth, y, LAYOUT.labelWidth, LAYOUT.cellHeight);
  context.strokeStyle = palette.grid;
  context.strokeRect(matrixGridX - LAYOUT.labelWidth, y, LAYOUT.labelWidth, LAYOUT.cellHeight);
  context.fillStyle = palette.text;
  context.font = makeFont(700, 24);
  context.textAlign = 'center';
  context.fillText(`I ${impact}`, matrixGridX - LAYOUT.labelWidth / 2, y + LAYOUT.cellHeight / 2 + 8);
  context.textAlign = 'left';
};

const drawRiskCardInCell = (context, palette, risk, reference, level, x, y) => {
  context.fillStyle = palette.card;
  context.strokeStyle = palette.cardBorder;
  context.fillRect(x + 10, y, LAYOUT.cellWidth - 20, 24);
  context.strokeRect(x + 10, y, LAYOUT.cellWidth - 20, 24);

  context.fillStyle = palette[level];
  context.font = makeFont(800, 12);
  context.fillText(reference, x + 18, y + 16);

  context.fillStyle = palette.text;
  context.font = makeFont(600, 12);
  const [line] = wrapText(context, getSafeText(risk.description, 'Untitled risk'), LAYOUT.cellWidth - 76);
  context.fillText(line || 'Untitled risk', x + 50, y + 16);
};

const drawMatrixCell = (context, palette, probability, impact, x, y, risksByCell, riskReferences) => {
  const score = probability * impact;
  const level = getRiskLevel(score);
  const cellRisks = getRisksForCell(risksByCell, probability, impact);

  context.globalAlpha = 0.22;
  context.fillStyle = palette[level];
  context.fillRect(x, y, LAYOUT.cellWidth, LAYOUT.cellHeight);
  context.globalAlpha = 1;
  context.strokeStyle = palette.grid;
  context.strokeRect(x, y, LAYOUT.cellWidth, LAYOUT.cellHeight);

  context.fillStyle = palette.text;
  context.font = makeFont(700, 17);
  context.fillText(`Score ${score}`, x + 12, y + 25);

  const maxCards = Math.min(cellRisks.length, 3);
  for (let index = 0; index < maxCards; index += 1) {
    const risk = cellRisks[index];
    const cardY = y + 40 + index * 28;
    drawRiskCardInCell(context, palette, risk, riskReferences.get(risk.id), level, x, cardY);
  }

  if (cellRisks.length > maxCards) {
    context.fillStyle = palette.muted;
    context.font = makeFont(600, 13);
    context.fillText(`+${cellRisks.length - maxCards} more`, x + 14, y + LAYOUT.cellHeight - 14);
  }
};

const drawMatrix = (context, palette, dimensions, risksByCell, riskReferences) => {
  drawAxisLabels(context, palette, dimensions);
  drawProbabilityHeaders(context, palette, dimensions.matrixGridX);

  IMPACT_LEVELS.forEach((impact, rowIndex) => {
    const y = LAYOUT.topY + LAYOUT.headerHeight + rowIndex * LAYOUT.cellHeight;
    drawImpactHeader(context, palette, dimensions.matrixGridX, y, impact);

    PROBABILITY_LEVELS.forEach((probability, columnIndex) => {
      const x = dimensions.matrixGridX + columnIndex * LAYOUT.cellWidth;
      drawMatrixCell(context, palette, probability, impact, x, y, risksByCell, riskReferences);
    });
  });
};

const drawRiskDetailsHeader = (context, palette, detailsX) => {
  context.fillStyle = palette.text;
  context.font = makeFont(700, 26);
  context.fillText('Risk details', detailsX, LAYOUT.topY + 26);
  context.fillStyle = palette.muted;
  context.font = makeFont(500, 15);
  context.fillText(
    'Full description, probability, impact, CIA pillar and mitigation measure.',
    detailsX,
    LAYOUT.topY + 50
  );
};

const drawRiskDetailCard = (context, palette, row, detailsX, detailY) => {
  const { risk, reference, descriptionLines, mitigationLines, metaLines, height } = row;
  const score = getScore(risk);
  const level = getRiskLevel(score);

  fillRoundedRect(context, detailsX, detailY, LAYOUT.detailsWidth, height, 18, palette.card, palette.cardBorder);
  fillRoundedRect(context, detailsX + 18, detailY + 17, 56, 26, 13, palette[level]);

  context.fillStyle = palette.chipText;
  context.font = makeFont(800, 15);
  context.fillText(reference, detailsX + 34, detailY + 35);

  context.fillStyle = palette.text;
  context.font = makeFont(700, 16);
  context.fillText(`Score ${score}`, detailsX + 90, detailY + 35);

  context.fillStyle = palette.text;
  context.font = makeFont(600, 15);
  let textY = detailY + 66;
  textY = drawWrappedLines(context, descriptionLines, detailsX + 18, textY, LAYOUT.detailLineHeight);

  context.fillStyle = palette.faint;
  context.font = makeFont(600, 15);
  textY += 12;
  textY = drawWrappedLines(context, metaLines, detailsX + 18, textY, LAYOUT.detailLineHeight);

  context.fillStyle = palette.muted;
  context.font = makeFont(700, 14);
  textY += 17;
  context.fillText('Mesure:', detailsX + 18, textY);

  context.fillStyle = palette.faint;
  context.font = makeFont(400, 14);
  drawWrappedLines(context, mitigationLines, detailsX + 18, textY + 22, LAYOUT.mitigationLineHeight);
};

const drawRiskDetails = (context, palette, detailRows, detailsX) => {
  drawRiskDetailsHeader(context, palette, detailsX);

  let detailY = LAYOUT.topY + 72;
  detailRows.forEach((row) => {
    drawRiskDetailCard(context, palette, row, detailsX, detailY);
    detailY += row.height + 14;
  });
};

const downloadCanvasAsPng = (canvas) => {
  const link = document.createElement('a');
  link.download = `risk-matrix-${new Date().toISOString().slice(0, 10)}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
};

export const exportRiskMatrixPng = ({ risks, riskCountByLevel, risksByCell }) => {
  const detailsInnerWidth = LAYOUT.detailsWidth - 36;
  const palette = getActiveExportPalette();
  const measurementContext = createMeasurementContext();
  const detailRows = buildDetailRows(measurementContext, risks, detailsInnerWidth);
  const dimensions = getExportDimensions(detailRows);
  const riskReferences = new Map(risks.map((risk, index) => [risk.id, getRiskReference(index)]));
  const { canvas, context } = createCanvas(dimensions.canvasWidth, dimensions.canvasHeight);

  context.fillStyle = palette.background;
  context.fillRect(0, 0, dimensions.canvasWidth, dimensions.canvasHeight);

  drawTitleAndSummary(context, palette, risks, riskCountByLevel);
  drawMatrix(context, palette, dimensions, risksByCell, riskReferences);
  drawRiskDetails(context, palette, detailRows, dimensions.detailsX);
  downloadCanvasAsPng(canvas);
};
