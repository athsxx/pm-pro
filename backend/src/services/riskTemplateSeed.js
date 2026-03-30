const path = require('path');
const Excel = require('exceljs');
const { getDb } = require('../db/database');
const { uuidv4 } = require('../db/helpers');

/** Sheet “Risk Assesment”: data from row 8; row 6–7 are merged headers. */
const SHEET_NAME = 'Risk Assesment';
const DATA_START_ROW = 8;
/** Excel columns A–P → srNo … remarks (matches FM 71211 / Haynes layout). */

function cellText(cell) {
  const v = cell.value;
  if (v == null || v === '') return '';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'string') return v;
  if (typeof v === 'object' && v.text != null) return String(v.text);
  if (typeof v === 'object' && v.result != null) return String(v.result);
  if (typeof v === 'object' && Array.isArray(v.richText)) {
    return v.richText.map((r) => r.text || '').join('');
  }
  return String(v);
}

/**
 * Inserts Haynes-style risk rows from bundled xlsx into ProjectRisks.
 * @param {string} projectId
 */
async function seedProjectRisksFromTemplate(projectId) {
  const templatePath =
    process.env.RISK_TEMPLATE_PATH ||
    path.join(__dirname, '../../templates/risk-assessment-haynes.xlsx');

  const wb = new Excel.Workbook();
  await wb.xlsx.readFile(templatePath);
  const ws = wb.getWorksheet(SHEET_NAME);
  if (!ws) {
    throw new Error(`Worksheet "${SHEET_NAME}" not found in risk template`);
  }

  const db = getDb();
  const insert = db.prepare(`
    INSERT INTO ProjectRisks (
      id, projectId, srNo, process, typeOfRisk, riskIdentified,
      likelihood1, consequence1, rpn1, controlsMitigation, responsible, timeFrame,
      implementationStatus, likelihood2, consequence2, rpn2, acceptable, remarks,
      createdAt, updatedAt
    ) VALUES (
      @id, @projectId, @srNo, @process, @typeOfRisk, @riskIdentified,
      @likelihood1, @consequence1, @rpn1, @controlsMitigation, @responsible, @timeFrame,
      @implementationStatus, @likelihood2, @consequence2, @rpn2, @acceptable, @remarks,
      @createdAt, @updatedAt
    )
  `);

  const now = new Date().toISOString();
  const rows = [];

  for (let r = DATA_START_ROW; r <= 500; r++) {
    const row = ws.getRow(r);
    const srNo = cellText(row.getCell(1)).trim();
    const process = cellText(row.getCell(2)).trim();
    if (!srNo && !process) break;

    rows.push({
      id: uuidv4(),
      projectId,
      srNo: srNo || null,
      process: process || null,
      typeOfRisk: cellText(row.getCell(3)).trim() || null,
      riskIdentified: cellText(row.getCell(4)).trim() || null,
      likelihood1: cellText(row.getCell(5)).trim() || null,
      consequence1: cellText(row.getCell(6)).trim() || null,
      rpn1: cellText(row.getCell(7)).trim() || null,
      controlsMitigation: cellText(row.getCell(8)).trim() || null,
      responsible: cellText(row.getCell(9)).trim() || null,
      timeFrame: cellText(row.getCell(10)).trim() || null,
      implementationStatus: cellText(row.getCell(11)).trim() || null,
      likelihood2: cellText(row.getCell(12)).trim() || null,
      consequence2: cellText(row.getCell(13)).trim() || null,
      rpn2: cellText(row.getCell(14)).trim() || null,
      acceptable: cellText(row.getCell(15)).trim() || null,
      remarks: cellText(row.getCell(16)).trim() || null,
      createdAt: now,
      updatedAt: now
    });
  }

  const tx = db.transaction(() => {
    for (const rec of rows) insert.run(rec);
  });
  tx();
}

module.exports = { seedProjectRisksFromTemplate, SHEET_NAME };
