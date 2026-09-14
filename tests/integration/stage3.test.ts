import { describe, expect, it, vi } from 'vitest';
import { SqliteDatabaseProvider } from '@infinity-11/persistence';
import {
  AIGateway,
  AnthropicAdapter,
  CredentialCipher,
  CredentialService,
  InMemoryUsageSink,
  OpenAIAdapter,
  ProviderRegistry,
} from '@infinity-11/ai-gateway';

const key = new Uint8Array(32).fill(7);
const credential = { apiKey: 'x'.repeat(32) };

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
function workspace(db: SqliteDatabaseProvider): string {
  const user = db.createUser(`test-${crypto.randomUUID()}@example.invalid`, 'hash');
  return db.createWorkspace('test-workspace', user.id).id;
}

describe('stage 3 AI gateway', () => {
  it('encrypts credentials and never exposes ciphertext through list', () => {
    const db = new SqliteDatabaseProvider();
    const workspaceId = workspace(db);
    const service = new CredentialService(db, new CredentialCipher(key));
    const record = service.create(workspaceId, 'openai', 'primary', credential);
    expect(record.ciphertext).not.toContain(credential.apiKey);
    expect(service.list(workspaceId)).toEqual([
      {
        id: record.id,
        workspaceId,
        provider: 'openai',
        label: 'primary',
        enabled: true,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
    ]);
    expect(service.reveal(workspaceId, record.id)).toEqual(credential);
    db.close();
  });

  it('isolates credential reads by workspace', () => {
    const db = new SqliteDatabaseProvider();
    const workspaceId = workspace(db);
    const service = new CredentialService(db, new CredentialCipher(key));
    const record = service.create(workspaceId, 'openai', 'primary', credential);
    expect(service.get('other-workspace', record.id)).toBeUndefined();
    expect(() => service.reveal('other-workspace', record.id)).toThrow('CREDENTIAL_UNAVAILABLE');
    db.close();
  });

  it('normalizes OpenAI responses and records usage without storing secrets', async () => {
    const db = new SqliteDatabaseProvider();
    const workspaceId = workspace(db);
    const service = new CredentialService(db, new CredentialCipher(key));
    const record = service.create(workspaceId, 'openai', 'primary', credential);
    const registry = new ProviderRegistry();
    registry.register(new OpenAIAdapter('https://example.test/openai'));
    const sink = new InMemoryUsageSink();
    const gateway = new AIGateway(registry, service, sink);
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(init?.body)).toContain('"model":"test-model"');
      expect(String(init?.body)).not.toContain(credential.apiKey);
      return jsonResponse({
        id: 'resp-1',
        model: 'test-model',
        choices: [{ message: { content: 'world' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 3, completion_tokens: 2, total_tokens: 5 },
      });
    });
    vi.stubGlobal('fetch', fetchMock);
    const response = await gateway.complete(
      {
        workspaceId,
        credentialId: record.id,
        model: 'test-model',
        messages: [{ role: 'user', content: 'hello' }],
      },
      { correlationId: 'corr-1', workspaceId },
    );
    expect(response.text).toBe('world');
    expect(response.usage?.totalTokens).toBe(5);
    expect(sink.events[0]?.type).toBe('ai.usage.recorded');
    expect(JSON.stringify(sink.events[0])).not.toContain(credential.apiKey);
    vi.unstubAllGlobals();
    db.close();
  });

  it('maps Anthropic system messages separately and normalizes output', async () => {
    const db = new SqliteDatabaseProvider();
    const workspaceId = workspace(db);
    const service = new CredentialService(db, new CredentialCipher(key));
    const record = service.create(workspaceId, 'anthropic', 'primary', credential);
    const adapter = new AnthropicAdapter('https://example.test/anthropic');
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as {
        system: string;
        messages: Array<{ role: string }>;
      };
      expect(body.system).toBe('system prompt');
      expect(body.messages[0]?.role).toBe('user');
      return jsonResponse({
        id: 'msg-1',
        model: 'test-model',
        content: [{ type: 'text', text: 'answer' }],
        stop_reason: 'end_turn',
        usage: { input_tokens: 4, output_tokens: 6 },
      });
    });
    vi.stubGlobal('fetch', fetchMock);
    const response = await adapter.complete(
      {
        workspaceId,
        credentialId: record.id,
        model: 'test-model',
        messages: [
          { role: 'system', content: 'system prompt' },
          { role: 'user', content: 'question' },
        ],
      },
      credential,
    );
    expect(response.text).toBe('answer');
    expect(response.usage?.totalTokens).toBe(10);
    vi.unstubAllGlobals();
    db.close();
  });

  it('normalizes provider authentication errors into a stable taxonomy', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ error: 'nope' }, 401));
    vi.stubGlobal('fetch', fetchMock);
    await expect(
      new OpenAIAdapter('https://example.test/openai').complete(
        {
          workspaceId: 'ws',
          credentialId: 'cred',
          model: 'test-model',
          messages: [{ role: 'user', content: 'hello' }],
        },
        credential,
      ),
    ).rejects.toMatchObject({
      code: 'AUTHENTICATION_FAILED',
      retryable: false,
      provider: 'openai',
      status: 401,
    });
    vi.unstubAllGlobals();
  });
});
