/**
 * Tesseract OCR REST service for GrünBilanz.
 * Wraps tesseract.js to provide a simple HTTP API for document text extraction.
 * Supports German (deu) language recognition for utility bills and invoices.
 */

const express = require('express');
const multer = require('multer');
const Tesseract = require('tesseract.js');

const app = express();
const PORT = process.env.PORT || 3001;

// Store uploaded files in memory to avoid disk I/O in container
const upload = multer({ storage: multer.memoryStorage() });

/**
 * POST /ocr
 * Accepts a multipart file upload and returns extracted text.
 * Uses German language model for optimal recognition of utility bills.
 */
app.post('/ocr', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Keine Datei hochgeladen' });
  }

  try {
    const { data: { text } } = await Tesseract.recognize(
      req.file.buffer,
      'deu', // German language model
      // Suppress verbose progress logging in production; enable in development for debugging
      { logger: process.env.NODE_ENV === 'development' ? console.log : () => {} }
    );
    res.json({ text });
  } catch (err) {
    console.error('OCR-Fehler:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /health
 * Health check endpoint for Docker healthcheck and load balancer probes.
 */
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'tesseract-ocr' });
});

app.listen(PORT, () => {
  console.log(`Tesseract OCR-Service läuft auf Port ${PORT}`);
});
