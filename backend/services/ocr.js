const { createWorker } = require('tesseract.js');

async function ocrImage(filePath) {
  const worker = await createWorker('eng');
  const { data: { text } } = await worker.recognize(filePath);
  await worker.terminate();
  return text;
}

module.exports = { ocrImage };
