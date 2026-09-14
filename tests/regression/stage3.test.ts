import { describe, expect, it } from 'vitest';
import {
  AIGateway,
  CredentialCipher,
  CredentialService,
  OpenAIAdapter,
  ProviderRegistry,
} from '@infinity-11/ai-gateway';
import { SqliteDatabaseProvider } from '@infinity-11/persistence';

describe('stage 3 regression', () => {
  it('rejects invalid gateway input before any provider call', async () => {
    const db = new SqliteDatabaseProvider();
    const service = new CredentialService(db, new CredentialCipher(new Uint8Array(32).fill(4)));
    const registry = new ProviderRegistry();
    const adapter = new OpenAIAdapter('https://example.test');
    registry.register(adapter);
    const gateway = new AIGateway(registry, service);
    await expect(
      gateway.complete(
        { workspaceId: '', credentialId: '', model: 'bad model', messages: [] },
        { correlationId: 'c' },
      ),
    ).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
    db.close();
  });

  it('keeps provider selection outside business request types', () => {
    const registry = new ProviderRegistry();
    registry.register(new OpenAIAdapter('https://example.test'));
    expect(registry.list()).toEqual(['openai']);
  });
});
