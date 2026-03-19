/**
 * OCR proxy API route for GrünBilanz.
 * Forwards uploaded documents to the Tesseract OCR microservice
 * and returns extracted German text for pre-filling input forms.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const tesseractUrl = process.env.TESSERACT_URL ?? 'http://localhost:3001';

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'Keine Datei hochgeladen' }, { status: 400 });
    }

    // Forward the file to the tesseract service
    const upstream = new FormData();
    upstream.append('file', file);

    const response = await fetch(`${tesseractUrl}/ocr`, {
      method: 'POST',
      body: upstream,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'OCR-Fehler' }));
      return NextResponse.json(error, { status: response.status });
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (err) {
    console.error('OCR-Proxy-Fehler:', err);
    return NextResponse.json({ error: 'OCR-Service nicht erreichbar' }, { status: 503 });
  }
}
