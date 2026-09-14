import type {
  AIGateway,
  AIProviderError,
  AIRequest,
  AIResponse,
  AIUsage,
} from '@infinity-11/ai-gateway';

export type ModelCapability = 'text' | 'vision' | 'streaming' | 'tool-calling' | 'reasoning';

export interface ModelPricing {
  inputPerMillion: number;
  outputPerMillion: number;
  currency: string;
}

export interface ModelProvenance {
  source: string;
  observedAt: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface ModelMetadata {
  id: string;
  provider: string;
  capabilities: ReadonlySet<ModelCapability>;
  contextWindow: number;
  maxOutputTokens: number;
  pricing?: ModelPricing | undefined;
  expectedLatencyMs?: number | undefined;
  reliability?: number | undefined;
  provenance: ModelProvenance;
  enabled: boolean;
}

export interface CredentialRouteState {
  credentialId: string;
  provider: string;
  enabled: boolean;
  quota?:
    | {
        remainingFraction: number;
        resetAt?: string | undefined;
      }
    | undefined;
}

export interface ProviderHealthState {
  provider: string;
  available: boolean;
  consecutiveFailures: number;
  cooldownUntil?: string | undefined;
}

export interface RoutingWeights {
  cost: number;
  latency: number;
  reliability: number;
  preference: number;
}

export interface RoutingPolicy {
  requiredCapabilities?: ReadonlySet<ModelCapability> | undefined;
  preferredProviders?: readonly string[] | undefined;
  excludedProviders?: readonly string[] | undefined;
  maxEstimatedCost?: number | undefined;
  maxLatencyMs?: number | undefined;
  maxAttempts?: number | undefined;
  weights?: Partial<RoutingWeights> | undefined;
}

export interface RouteCandidate {
  model: ModelMetadata;
  credential: CredentialRouteState;
  score: number;
  factors: {
    cost: number;
    latency: number;
    reliability: number;
    preference: number;
  };
}

export interface RouteDecision {
  requestId: string;
  selected: RouteCandidate;
  fallbackChain: readonly RouteCandidate[];
  rejected: readonly {
    provider: string;
    model: string;
    reason: string;
  }[];
  policySnapshot: RoutingPolicy;
  decidedAt: string;
}

export interface RouteDecisionSink {
  publish(decision: RouteDecision): Promise<void> | void;
}

export interface UsageAttribution {
  requestId: string;
  provider: string;
  credentialId: string;
  model: string;
  usage: AIUsage;
  estimatedCost?: number | undefined;
  currency?: string | undefined;
}

export interface UsageAttributionSink {
  publish(attribution: UsageAttribution): Promise<void> | void;
}

export class ModelRegistry {
  private readonly models = new Map<string, ModelMetadata>();

  register(model: ModelMetadata): void {
    if (!/^[a-z0-9._:-]{1,160}$/.test(model.id)) {
      throw new Error('INVALID_MODEL_ID');
    }
    if (!/^[a-z0-9_-]{1,64}$/.test(model.provider)) {
      throw new Error('INVALID_PROVIDER_ID');
    }
    if (model.contextWindow < 1 || model.maxOutputTokens < 1) {
      throw new Error('INVALID_MODEL_LIMITS');
    }
    if (
      model.pricing &&
      (model.pricing.inputPerMillion < 0 || model.pricing.outputPerMillion < 0)
    ) {
      throw new Error('INVALID_MODEL_PRICING');
    }
    if (this.models.has(model.id)) {
      throw new Error(`MODEL_ALREADY_REGISTERED:${model.id}`);
    }
    this.models.set(model.id, {
      ...model,
      capabilities: new Set(model.capabilities),
    });
  }

  replace(model: ModelMetadata): void {
    if (!this.models.has(model.id)) {
      throw new Error(`MODEL_NOT_FOUND:${model.id}`);
    }
    this.models.set(model.id, {
      ...model,
      capabilities: new Set(model.capabilities),
    });
  }

  get(id: string): ModelMetadata {
    const model = this.models.get(id);
    if (!model) {
      throw new Error(`MODEL_NOT_FOUND:${id}`);
    }
    return { ...model, capabilities: new Set(model.capabilities) };
  }

  list(): ModelMetadata[] {
    return [...this.models.values()]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((model) => ({
        ...model,
        capabilities: new Set(model.capabilities),
      }));
  }
}

export class HealthTracker {
  private readonly states = new Map<string, ProviderHealthState>();

  constructor(
    private readonly failureThreshold = 2,
    private readonly cooldownMs = 30_000,
  ) {
    if (failureThreshold < 1 || cooldownMs < 0) {
      throw new Error('INVALID_HEALTH_POLICY');
    }
  }

  get(provider: string): ProviderHealthState {
    return (
      this.states.get(provider) ?? {
        provider,
        available: true,
        consecutiveFailures: 0,
      }
    );
  }

  recordSuccess(provider: string): void {
    this.states.set(provider, {
      provider,
      available: true,
      consecutiveFailures: 0,
    });
  }

  recordFailure(provider: string, now = Date.now()): void {
    const current = this.get(provider);
    const failures = current.consecutiveFailures + 1;
    const unavailable = failures >= this.failureThreshold;
    this.states.set(provider, {
      provider,
      available: !unavailable,
      consecutiveFailures: failures,
      ...(unavailable ? { cooldownUntil: new Date(now + this.cooldownMs).toISOString() } : {}),
    });
  }

  isAvailable(provider: string, now = Date.now()): boolean {
    const current = this.get(provider);
    if (current.available) return true;
    if (!current.cooldownUntil) return false;
    if (new Date(current.cooldownUntil).getTime() > now) return false;
    this.states.set(provider, {
      provider,
      available: true,
      consecutiveFailures: 0,
    });
    return true;
  }
}

export class Router {
  constructor(
    private readonly registry: ModelRegistry,
    private readonly health: HealthTracker = new HealthTracker(),
  ) {}

  decide(
    requestId: string,
    candidates: readonly CredentialRouteState[],
    policy: RoutingPolicy,
    now = new Date(),
  ): RouteDecision {
    const rejected: Array<{
      provider: string;
      model: string;
      reason: string;
    }> = [];
    const eligible: RouteCandidate[] = [];
    const required = policy.requiredCapabilities ?? new Set<ModelCapability>(['text']);
    const excluded = new Set(policy.excludedProviders ?? []);
    const preferred = new Set(policy.preferredProviders ?? []);
    const weights: RoutingWeights = {
      cost: policy.weights?.cost ?? 0.35,
      latency: policy.weights?.latency ?? 0.2,
      reliability: policy.weights?.reliability ?? 0.3,
      preference: policy.weights?.preference ?? 0.15,
    };

    if (
      Object.values(weights).some((value) => value < 0) ||
      Object.values(weights).every((value) => value === 0)
    ) {
      throw new Error('INVALID_ROUTING_WEIGHTS');
    }

    const activeCredentials = candidates.filter((credential) => credential.enabled);
    for (const model of this.registry.list()) {
      if (!model.enabled) {
        rejected.push({
          provider: model.provider,
          model: model.id,
          reason: 'MODEL_DISABLED',
        });
        continue;
      }
      if ([...required].some((capability) => !model.capabilities.has(capability))) {
        rejected.push({
          provider: model.provider,
          model: model.id,
          reason: 'CAPABILITY_MISMATCH',
        });
        continue;
      }
      if (excluded.has(model.provider)) {
        rejected.push({
          provider: model.provider,
          model: model.id,
          reason: 'PROVIDER_EXCLUDED',
        });
        continue;
      }
      if (!this.health.isAvailable(model.provider, now.getTime())) {
        rejected.push({
          provider: model.provider,
          model: model.id,
          reason: 'PROVIDER_UNHEALTHY',
        });
        continue;
      }
      const matchingCredentials = activeCredentials.filter(
        (credential) => credential.provider === model.provider,
      );
      if (!matchingCredentials.length) {
        rejected.push({
          provider: model.provider,
          model: model.id,
          reason: 'NO_ELIGIBLE_CREDENTIAL',
        });
        continue;
      }
      if (
        policy.maxLatencyMs != null &&
        (model.expectedLatencyMs ?? Number.POSITIVE_INFINITY) > policy.maxLatencyMs
      ) {
        rejected.push({
          provider: model.provider,
          model: model.id,
          reason: 'LATENCY_LIMIT',
        });
        continue;
      }
      for (const credential of matchingCredentials) {
        const quota = credential.quota?.remainingFraction ?? 1;
        if (quota <= 0) {
          rejected.push({
            provider: model.provider,
            model: model.id,
            reason: 'QUOTA_EXHAUSTED',
          });
          continue;
        }
        const cost = this.costScore(model);
        if (
          policy.maxEstimatedCost != null &&
          model.pricing &&
          model.pricing.inputPerMillion > policy.maxEstimatedCost
        ) {
          rejected.push({
            provider: model.provider,
            model: model.id,
            reason: 'COST_LIMIT',
          });
          continue;
        }
        const factors = {
          cost,
          latency: this.latencyScore(model),
          reliability: Math.min(1, Math.max(0, model.reliability ?? 0.5)) * quota,
          preference: preferred.has(model.provider) ? 1 : 0,
        };
        const totalWeight =
          weights.cost + weights.latency + weights.reliability + weights.preference;
        const score =
          (factors.cost * weights.cost +
            factors.latency * weights.latency +
            factors.reliability * weights.reliability +
            factors.preference * weights.preference) /
          totalWeight;
        eligible.push({ model, credential, score, factors });
      }
    }

    eligible.sort(
      (a, b) =>
        b.score - a.score ||
        a.model.provider.localeCompare(b.model.provider) ||
        a.model.id.localeCompare(b.model.id) ||
        a.credential.credentialId.localeCompare(b.credential.credentialId),
    );
    if (!eligible.length) throw new Error('NO_ELIGIBLE_ROUTE');
    const maxAttempts = Math.max(1, Math.min(policy.maxAttempts ?? 3, eligible.length));
    return {
      requestId,
      selected: eligible[0]!,
      fallbackChain: eligible.slice(1, maxAttempts),
      rejected,
      policySnapshot: clonePolicy(policy),
      decidedAt: now.toISOString(),
    };
  }

  recordSuccess(provider: string): void {
    this.health.recordSuccess(provider);
  }

  recordFailure(provider: string, now = Date.now()): void {
    this.health.recordFailure(provider, now);
  }

  private costScore(model: ModelMetadata): number {
    if (!model.pricing) return 0.5;
    const cost = model.pricing.inputPerMillion + model.pricing.outputPerMillion;
    return 1 / (1 + cost);
  }

  private latencyScore(model: ModelMetadata): number {
    const latency = model.expectedLatencyMs ?? 2_000;
    return 1 / (1 + latency / 1_000);
  }
}

export interface RoutedCompletion {
  response: AIResponse;
  decision: RouteDecision;
  attempts: readonly {
    provider: string;
    credentialId: string;
    model: string;
    error?: string;
  }[];
  estimatedCost?: number | undefined;
  currency?: string | undefined;
}

export class RoutedAIGateway {
  constructor(
    private readonly gateway: AIGateway,
    private readonly router: Router,
    private readonly decisionSink?: RouteDecisionSink,
    private readonly usageSink?: UsageAttributionSink,
  ) {}

  async complete(
    request: Omit<AIRequest, 'credentialId' | 'model'>,
    candidates: readonly CredentialRouteState[],
    policy: RoutingPolicy,
    requestId: string,
    correlation: Parameters<AIGateway['complete']>[1],
  ): Promise<RoutedCompletion> {
    const decision = this.router.decide(requestId, candidates, policy);
    await this.decisionSink?.publish(structuredClone(decision));
    const attempts: Array<{
      provider: string;
      credentialId: string;
      model: string;
      error?: string;
    }> = [];
    const chain = [decision.selected, ...decision.fallbackChain];
    for (const candidate of chain) {
      const routedRequest: AIRequest = {
        ...request,
        credentialId: candidate.credential.credentialId,
        model: candidate.model.id,
      };
      try {
        const response = await this.gateway.complete(routedRequest, correlation);
        this.router.recordSuccess(candidate.model.provider);
        attempts.push({
          provider: candidate.model.provider,
          credentialId: candidate.credential.credentialId,
          model: candidate.model.id,
        });
        const estimatedCost = estimateCost(candidate.model, response.usage);
        if (response.usage) {
          await this.usageSink?.publish({
            requestId,
            provider: candidate.model.provider,
            credentialId: candidate.credential.credentialId,
            model: candidate.model.id,
            usage: structuredClone(response.usage),
            ...(estimatedCost == null ? {} : { estimatedCost }),
            ...(candidate.model.pricing ? { currency: candidate.model.pricing.currency } : {}),
          });
        }
        return {
          response,
          decision,
          attempts,
          ...(estimatedCost == null ? {} : { estimatedCost }),
          ...(candidate.model.pricing ? { currency: candidate.model.pricing.currency } : {}),
        };
      } catch (error) {
        attempts.push({
          provider: candidate.model.provider,
          credentialId: candidate.credential.credentialId,
          model: candidate.model.id,
          error: safeError(error),
        });
        if (!isRetryableProviderError(error)) throw error;
        this.router.recordFailure(candidate.model.provider);
      }
    }
    throw new Error('ROUTE_EXHAUSTED');
  }
}

export class InMemoryRouteDecisionSink implements RouteDecisionSink {
  readonly decisions: RouteDecision[] = [];

  publish(decision: RouteDecision): void {
    this.decisions.push(structuredClone(decision));
  }
}

export class InMemoryUsageAttributionSink implements UsageAttributionSink {
  readonly attributions: UsageAttribution[] = [];

  publish(attribution: UsageAttribution): void {
    this.attributions.push(structuredClone(attribution));
  }
}

function clonePolicy(policy: RoutingPolicy): RoutingPolicy {
  return {
    ...policy,
    ...(policy.requiredCapabilities
      ? { requiredCapabilities: new Set(policy.requiredCapabilities) }
      : {}),
    ...(policy.preferredProviders ? { preferredProviders: [...policy.preferredProviders] } : {}),
    ...(policy.excludedProviders ? { excludedProviders: [...policy.excludedProviders] } : {}),
    ...(policy.weights ? { weights: { ...policy.weights } } : {}),
  };
}

function estimateCost(model: ModelMetadata, usage: AIUsage | undefined): number | undefined {
  if (!model.pricing || !usage) return undefined;
  return (
    ((usage.inputTokens ?? 0) * model.pricing.inputPerMillion) / 1_000_000 +
    ((usage.outputTokens ?? 0) * model.pricing.outputPerMillion) / 1_000_000
  );
}

function isRetryableProviderError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'retryable' in error &&
      (error as AIProviderError).retryable,
  );
}

function safeError(error: unknown): string {
  if (error instanceof Error) return error.message.slice(0, 300);
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message.slice(0, 300);
  }
  return 'Unknown provider failure';
}
