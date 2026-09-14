import { describe, expect, it } from 'vitest';
import { redactSecrets } from '../../packages/observability/src/index.js';

describe('observability secret boundary', () => {
  it('redacts secret-like keys recursively', () => {
    expect(redactSecrets({ token: 'secret', nested: { apiKey: 'hidden', value: 'ok' } })).toEqual({
      token: '[REDACTED]',
      nested: { apiKey: '[REDACTED]', value: 'ok' },
    });
  });
});
