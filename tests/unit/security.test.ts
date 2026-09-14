import { describe, expect, it } from 'vitest';
import { denyByDefault } from '../../packages/security/src/index.js';

describe('security policy', () => {
  it('denies privileged capabilities by default', () => {
    expect(denyByDefault.decide({ capability: 'shell.execute', reason: 'test' })).toBe('DENY');
  });
});
