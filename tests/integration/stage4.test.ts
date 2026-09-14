import { describe, expect, it, vi } from 'vitest';
import type { AIGateway, AIRequest } from '@infinity-11/ai-gateway';
import {
  HealthTracker,
  InMemoryRouteDecisionSink,
  InMemoryUsageAttributionSink,
  ModelRegistry,
  Router,
  RoutedAIGateway,
  type CredentialRouteState,
  type ModelMetadata,
} from '@infinity-11/ai-gateway/routing';

const model = (overrides: Partial<ModelMetadata> = {}): ModelMetadata => ({
  id: 'model-a',
  provider: 'provider-a',
  capabilities: new Set(['text', 'streaming']),
  contextWindow: 32_000,
  maxOutputTokens: 4_000,
  pricing: { inputPerMillion: 1, outputPerMillion: 2, currency: 'USD' },
  expectedLatencyMs: 500,
  reliability: 0.99,
  provenance: {
    source: 'test-fixture',
    observedAt: '2026-09-14T00:00:00.000Z',
    confidence: 'high',
  },
  enabled: true,
  ...overrides,
});

const credential = (overrides: Partial<CredentialRouteState> = {}): CredentialRouteState => ({
  credentialId: 'credential-a',
  provider: 'provider-a',
  enabled: true,
  ...overrides,
});

describe('stage 4 model routing', () => {
  it('filters capabilities and disabled models', () => {
    const registry = new ModelRegistry();
    registry.register(model());
    registry.register(model({ id: 'vision-only', capabilities: new Set(['vision']) }));
    registry.register(model({ id: 'disabled', enabled: false }));
    const router = new Router(registry);

    const decision = router.decide('req-1', [credential()], {
      requiredCapabilities: new Set(['text']),
    });

    expect(decision.selected.model.id).toBe('model-a');
    expect(decision.rejected.map((item) => item.reason)).toEqual(
      expect.arrayContaining(['CAPABILITY_MISMATCH', 'MODEL_DISABLED']),
    );
  });

  it('rejects exhausted quota without inventing a replacement quota', () => {
    const registry = new ModelRegistry();
    registry.register(model());
    const router = new Router(registry);

    expect(() =>
      router.decide('req-quota', [credential({ quota: { remainingFraction: 0 } })], {}),
    ).toThrow('NO_ELIGIBLE_ROUTE');
  });

  it('is deterministic for identical registry, credentials, and policy inputs', () => {
    const registry = new ModelRegistry();
    registry.register(model());
    registry.register(
      model({
        id: 'model-b',
        provider: 'provider-b',
      }),
    );
    const router = new Router(registry);
    const candidates = [
      credential(),
      credential({ credentialId: 'credential-b', provider: 'provider-b' }),
    ];
    const policy = { preferredProviders: ['provider-b'] };
    const timestamp = new Date('2026-09-14T00:00:00.000Z');
    const first = router.decide('req', candidates, policy, timestamp);
    const second = router.decide('req', candidates, policy, timestamp);

    expect(second.selected).toEqual(first.selected);
    expect(second.fallbackChain).toEqual(first.fallbackChain);
  });

  it('opens a provider circuit after repeated failures and recovers after cooldown', () => {
    const health = new HealthTracker(2, 1_000);
    health.recordFailure('provider-a', 1_000);
    expect(health.isAvailable('provider-a', 1_000)).toBe(true);
    health.recordFailure('provider-a', 1_001);
    expect(health.isAvailable('provider-a', 1_500)).toBe(false);
    expect(health.isAvailable('provider-a', 2_001)).toBe(true);
  });

  it('keeps fallback attempts bounded and attributes usage cost', async () => {
    const registry = new ModelRegistry();
    registry.register(model({ provider: 'provider-a' }));
    registry.register(model({ id: 'model-b', provider: 'provider-b' }));
    const router = new Router(registry);
    const decisionSink = new InMemoryRouteDecisionSink();
    const usageSink = new InMemoryUsageAttributionSink();
    const complete = vi
      .fn()
      .mockRejectedValueOnce({ retryable: true, message: 'temporary' })
      .mockResolvedValueOnce({
        id: 'response-1',
        provider: 'provider-b',
        model: 'model-b',
        text: 'ok',
        usage: { inputTokens: 1_000, outputTokens: 500, totalTokens: 1_500 },
      });
    const gateway = { complete } as unknown as AIGateway;
    const routed = new RoutedAIGateway(gateway, router, decisionSink, usageSink);

    const result = await routed.complete(
      {
        workspaceId: 'workspace',
        messages: [{ role: 'user', content: 'hello' }],
      } as Omit<AIRequest, 'credentialId' | 'model'>,
      [credential(), credential({ credentialId: 'credential-b', provider: 'provider-b' })],
      { maxAttempts: 2 },
      'request-1',
      { requestId: 'request-1', workspaceId: 'workspace' },
    );

    expect(result.response.text).toBe('ok');
    expect(result.attempts).toHaveLength(2);
    expect(complete).toHaveBeenCalledTimes(2);
    expect(decisionSink.decisions).toHaveLength(1);
    expect(usageSink.attributions[0]).toMatchObject({
      provider: 'provider-b',
      credentialId: 'credential-b',
      estimatedCost: 0.002,
      currency: 'USD',
    });
  });

  it('does not fall back on non-retryable provider failures', async () => {
    const registry = new ModelRegistry();
    registry.register(model());
    registry.register(model({ id: 'model-b', provider: 'provider-b' }));
    const router = new Router(registry);
    const complete = vi.fn().mockRejectedValue({
      retryable: false,
      message: 'bad request',
    });
    const routed = new RoutedAIGateway({ complete } as unknown as AIGateway, router);

    await expect(
      routed.complete(
        {
          workspaceId: 'workspace',
          messages: [{ role: 'user', content: 'hello' }],
        } as Omit<AIRequest, 'credentialId' | 'model'>,
        [credential(), credential({ credentialId: 'credential-b', provider: 'provider-b' })],
        { maxAttempts: 2 },
        'request-2',
        { requestId: 'request-2', workspaceId: 'workspace' },
      ),
    ).rejects.toMatchObject({ retryable: false });
    expect(complete).toHaveBeenCalledTimes(1);
  });
});
