import { describe, expect, it } from 'vitest';
import { PERMISSION_DECISIONS, QUALITY_STATES } from '../../packages/types/src/index.js';

describe('integration contract smoke', () => {
  it('keeps governance enums closed and explicit', () => {
    expect(PERMISSION_DECISIONS).toEqual(['ALLOW', 'ASK', 'DENY']);
    expect(QUALITY_STATES).toEqual(['VERIFIED', 'PARTIALLY_VERIFIED', 'UNVERIFIED', 'BLOCKED']);
  });
});
