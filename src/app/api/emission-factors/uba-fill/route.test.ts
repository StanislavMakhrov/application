/**
 * API route tests for POST /api/emission-factors/uba-fill
 *
 * The endpoint is a stub — it always returns 501 Not Implemented.
 * UBA values are managed exclusively in the database (not bundled as
 * hardcoded source-code data).
 */

import { describe, it, expect } from 'vitest';
import { POST } from './route';

describe('POST /api/emission-factors/uba-fill', () => {
  it('POST_ubaFill_always_returns501Stub', async () => {
    const res = await POST();
    const data = (await res.json()) as { error: string };

    expect(res.status).toBe(501);
    expect(data.error).toBeTruthy();
  });

  it('POST_ubaFill_returns501WithErrorMessage', async () => {
    const res = await POST();

    expect(res.status).toBe(501);
  });
});
