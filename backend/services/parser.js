const fs = require('fs');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');

async function parsePDF(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdf(dataBuffer);
  return data.text;
}

async function parseDOCX(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
}

module.exports = { parsePDF, parseDOCX };