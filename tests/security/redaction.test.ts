import { describe, expect, it } from 'vitest';
import { redactSecrets } from '../../packages/observability/src/index.js';

describe('security regression', () => {
  it('does not preserve authorization material in structured metadata', () => {
    const value = redactSecrets({ authorization: 'Bearer example', safe: 'value' });
    expect(value).toEqual({ authorization: '[REDACTED]', safe: 'value' });
  });
});
