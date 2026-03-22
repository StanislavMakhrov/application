/**
 * PDF rendering helper.
 * Wraps @react-pdf/renderer's renderToBuffer for use in API routes.
 *
 * IMPORTANT: Must run on the Node.js runtime (not Edge), because
 * @react-pdf/renderer requires Node.js native modules.
 */

import { renderToBuffer } from '@react-pdf/renderer';
import type { ReactElement } from 'react';

/**
 * Renders a React-PDF document to a Buffer.
 * @param document - A <Document> element from @react-pdf/renderer
 * @returns Buffer containing the generated PDF bytes
 */
export async function renderPdf(document: ReactElement): Promise<Buffer> {
  const buffer = await renderToBuffer(document);
  return Buffer.from(buffer);
}
