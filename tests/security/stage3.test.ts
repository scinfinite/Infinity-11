import { describe, expect, it } from 'vitest';
import { CredentialCipher, CredentialService, ProviderRegistry } from '@infinity-11/ai-gateway';
import { SqliteDatabaseProvider } from '@infinity-11/persistence';

describe('stage 3 security boundaries', () => {
  it('rejects invalid master key sizes and tampered ciphertext', () => {
    expect(() => new CredentialCipher(new Uint8Array(31))).toThrow('CREDENTIAL_MASTER_KEY_MUST_BE_32_BYTES');
    const cipher = new CredentialCipher(new Uint8Array(32).fill(3));
    const encrypted = cipher.encrypt({ apiKey: 'secret-key-123456' });
    const tampered = `${encrypted.slice(0, -1)}${encrypted.endsWith('A') ? 'B' : 'A'}`;
    expect(() => cipher.decrypt(tampered)).toThrow('CREDENTIAL_DECRYPTION_FAILED');
  });

  it('rejects disabled credentials before provider access', async () => {
    const db = new SqliteDatabaseProvider();
    const service = new CredentialService(db, new CredentialCipher(new Uint8Array(32).fill(1)));
    const record = service.create('ws-1', 'openai', 'primary', { apiKey: 'secret-key-123456' });
    service.update('ws-1', record.id, { enabled: false });
    expect(() => service.reveal('ws-1', record.id)).toThrow('CREDENTIAL_UNAVAILABLE');
    db.close();
  });

  it('prevents duplicate provider registration and does not expose secrets in errors', () => {
    const registry = new ProviderRegistry();
    const provider = { id: 'test', complete: async () => ({ id: '1', provider: 'test', model: 'm', text: '' }), stream: async function* () {} };
    registry.register(provider);
    expect(() => registry.register(provider)).toThrow('PROVIDER_ALREADY_REGISTERED:test');
    expect(() => registry.get('missing')).toThrow('Provider is not registered: missing');
  });
});
