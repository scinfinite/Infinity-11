import { describe, expect, it, vi } from 'vitest';
import {
  AIGateway,
  CredentialCipher,
  CredentialService,
  InMemoryUsageSink,
  OpenAIAdapter,
  ProviderRegistry,
} from '@infinity-11/ai-gateway';
import { SqliteDatabaseProvider } from '@infinity-11/persistence';

const makeStream = (chunks: string[]): ReadableStream<Uint8Array> => {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
};

describe('stage 3 streaming', () => {
  it('normalizes OpenAI SSE chunks and records final usage', async () => {
    const db = new SqliteDatabaseProvider();
    const credentials = new CredentialService(db, new CredentialCipher(new Uint8Array(32).fill(9)));
    const record = credentials.create('ws-1', 'openai', 'stream', { apiKey: 'x'.repeat(32) });
    const registry = new ProviderRegistry();
    registry.register(new OpenAIAdapter('https://example.test/openai'));
    const sink = new InMemoryUsageSink();
    const gateway = new AIGateway(registry, credentials, sink);
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            makeStream([
              'data: {"id":"stream-1","model":"test-model","choices":[{"delta":{"content":"hel"},"finish_reason":null}]}\n\n',
              'data: {"id":"stream-1","model":"test-model","choices":[{"delta":{"content":"lo"},"finish_reason":"stop"}],"usage":{"prompt_tokens":2,"completion_tokens":2,"total_tokens":4}}\n\n',
              'data: [DONE]\n\n',
            ]),
          ),
      ),
    );
    const chunks = [];
    for await (const chunk of gateway.stream(
      {
        workspaceId: 'ws-1',
        credentialId: record.id,
        model: 'test-model',
        messages: [{ role: 'user', content: 'hi' }],
      },
      { correlationId: 'corr-stream', workspaceId: 'ws-1' },
    ))
      chunks.push(chunk);
    expect(chunks.map((chunk) => chunk.delta).join('')).toBe('hello');
    expect(chunks.at(-1)?.done).toBe(true);
    expect(sink.events[0]?.payload.usage.totalTokens).toBe(4);
    vi.unstubAllGlobals();
    db.close();
  });
});
