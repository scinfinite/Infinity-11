import { describe, expect, it } from 'vitest';
import { denyByDefault } from '../../packages/security/src/index.js';

describe('foundation regression', () => {
  it('keeps the default privileged-action posture deny-by-default', () => {
    for (const capability of ['github.merge', 'deploy.execute', 'database.admin'] as const) {
      expect(denyByDefault.decide({ capability, reason: 'regression' })).toBe('DENY');
    }
  });
});
