import { describe, expect, it, vi } from 'vitest';
import { SqliteDatabaseProvider } from '@infinity-11/persistence';
import { AIGateway, AnthropicAdapter, CredentialCipher, CredentialService, InMemoryUsageSink, OpenAIAdapter, ProviderRegistry } from '@infinity-11/ai-gateway';

const key = new Uint8Array(32).fill(7);
const credential = { apiKey: 'x'.repeat(32) };
const request = { workspaceId: 'ws-1', credentialId: 'cred-1', model: 'test-model', messages: [{ role: 'user' as const, content: 'hello' }] };

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

describe('stage 3 AI gateway', () => {
  it('encrypts credentials and never exposes ciphertext through list', () => {
    const db = new SqliteDatabaseProvider();
    const service = new CredentialService(db, new CredentialCipher(key));
    const record = service.create('ws-1', 'openai', 'primary', credential);
    expect(record.ciphertext).not.toContain(credential.apiKey);
    expect(service.list('ws-1')).toEqual([{ id: record.id, workspaceId: 'ws-1', provider: 'openai', label: 'primary', enabled: true, createdAt: record.createdAt, updatedAt: record.updatedAt }]);
    expect(service.reveal('ws-1', record.id)).toEqual(credential);
    db.close();
  });

  it('isolates credential reads by workspace', () => {
    const db = new SqliteDatabaseProvider();
    const service = new CredentialService(db, new CredentialCipher(key));
    const record = service.create('ws-1', 'openai', 'primary', credential);
    expect(service.get('ws-2', record.id)).toBeUndefined();
    expect(() => service.reveal('ws-2', record.id)).toThrow('CREDENTIAL_UNAVAILABLE');
    db.close();
  });

  it('normalizes OpenAI responses and records usage without storing secrets', async () => {
    const db = new SqliteDatabaseProvider();
    const service = new CredentialService(db, new CredentialCipher(key));
    const record = service.create('ws-1', 'openai', 'primary', credential);
    const registry = new ProviderRegistry();
    registry.register(new OpenAIAdapter('https://example.test/openai'));
    const sink = new InMemoryUsageSink();
    const gateway = new AIGateway(registry, service, sink);
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(init?.body)).toContain('"model":"test-model"');
      expect(String(init?.body)).not.toContain(credential.apiKey);
      return jsonResponse({ id: 'resp-1', model: 'test-model', choices: [{ message: { content: 'world' }, finish_reason: 'stop' }], usage: { prompt_tokens: 3, completion_tokens: 2, total_tokens: 5 } });
    });
    vi.stubGlobal('fetch', fetchMock);
    const response = await gateway.complete({ ...request, credentialId: record.id }, { correlationId: 'corr-1', workspaceId: 'ws-1' });
    expect(response.text).toBe('world');
    expect(response.usage?.totalTokens).toBe(5);
    expect(sink.events[0]?.type).toBe('ai.usage.recorded');
    expect(JSON.stringify(sink.events[0])).not.toContain(credential.apiKey);
    vi.unstubAllGlobals();
    db.close();
  });

  it('maps Anthropic system messages separately and normalizes output', async () => {
    const db = new SqliteDatabaseProvider();
    const service = new CredentialService(db, new CredentialCipher(key));
    const record = service.create('ws-1', 'anthropic', 'primary', credential);
    const adapter = new AnthropicAdapter('https://example.test/anthropic');
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as { system: string; messages: Array<{ role: string }> };
      expect(body.system).toBe('system prompt');
      expect(body.messages[0]?.role).toBe('user');
      return jsonResponse({ id: 'msg-1', model: 'test-model', content: [{ type: 'text', text: 'answer' }], stop_reason: 'end_turn', usage: { input_tokens: 4, output_tokens: 6 } });
    });
    vi.stubGlobal('fetch', fetchMock);
    const response = await adapter.complete({ ...request, credentialId: record.id, messages: [{ role: 'system', content: 'system prompt' }, { role: 'user', content: 'question' }] }, credential);
    expect(response.text).toBe('answer');
    expect(response.usage?.totalTokens).toBe(10);
    vi.unstubAllGlobals();
    db.close();
  });

  it('normalizes provider authentication errors into a stable taxonomy', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ error: 'nope' }, 401));
    vi.stubGlobal('fetch', fetchMock);
    await expect(new OpenAIAdapter('https://example.test/openai').complete(request, credential)).rejects.toMatchObject({ code: 'AUTHENTICATION_FAILED', retryable: false, provider: 'openai', status: 401 });
    vi.unstubAllGlobals();
  });
});
