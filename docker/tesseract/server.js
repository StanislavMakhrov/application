/**
 * GrünBilanz Tesseract OCR Microservice
 *
 * Provides a simple HTTP API for extracting text and numeric values from
 * uploaded utility bill images. Runs on port 3001.
 *
 * POST /extract
 *   Body: multipart/form-data { file, category }
 *   Returns: { value, unit, confidence, rawText }
 *
 * NOTE: This is a stub implementation. The real implementation would use
 * Tesseract.js to extract text and then parse numeric values with regex.
 */

const http = require('http');

const PORT = process.env.PORT || 3001;

// Stub values for development
const STUBS = {
  STROM: { value: 45000, unit: 'kWh' },
  ERDGAS: { value: 8500, unit: 'm³' },
  DIESEL_FUHRPARK: { value: 3200, unit: 'L' },
  HEIZOEL: { value: 2800, unit: 'L' },
  FLUESSIGGAS: { value: 450, unit: 'kg' },
  FERNWAERME: { value: 12000, unit: 'kWh' },
  GESCHAEFTSREISEN_FLUG: { value: 8500, unit: 'km' },
  GESCHAEFTSREISEN_BAHN: { value: 3200, unit: 'km' },
  KUPFER: { value: 480, unit: 'kg' },
};

const server = http.createServer((req, res) => {
  // Health check endpoint
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'tesseract-ocr' }));
    return;
  }

  // OCR extract endpoint (stub)
  if (req.method === 'POST' && req.url === '/extract') {
    // In production: parse multipart body, run Tesseract, extract numbers
    // For now, simulate delay and return stub data
    setTimeout(() => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ value: 1000, unit: 'Einheit', confidence: 0.75, rawText: 'STUB' }));
    }, 1000);
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`GrünBilanz Tesseract OCR service running on port ${PORT}`);
});
