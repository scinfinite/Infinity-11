import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import type { CorrelationContext, DomainEvent } from '@infinity-11/types';
import type { CredentialRecord, DatabaseProvider } from '@infinity-11/persistence';

export type AIContentPart = { type: 'text'; text: string } | { type: 'image_url'; url: string };
export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | AIContentPart[];
}
export interface AIRequest {
  workspaceId: string;
  credentialId: string;
  model: string;
  messages: AIMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}
export interface AIUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}
export interface AIResponse {
  id: string;
  provider: string;
  model: string;
  text: string;
  usage?: AIUsage;
  finishReason?: string;
}
export interface AIStreamChunk {
  id: string;
  provider: string;
  model: string;
  delta: string;
  done: boolean;
  usage?: AIUsage;
}
export interface ProviderCredential {
  apiKey: string;
  [key: string]: string;
}
export interface AIProviderAdapter {
  readonly id: string;
  complete(request: AIRequest, credential: ProviderCredential): Promise<AIResponse>;
  stream(request: AIRequest, credential: ProviderCredential): AsyncIterable<AIStreamChunk>;
}
export interface UsageEventPayload {
  requestId: string;
  provider: string;
  credentialId: string;
  model: string;
  usage: AIUsage;
}
export interface UsageSink {
  publish(event: DomainEvent<string, UsageEventPayload>): Promise<void> | void;
}

export class AIProviderError extends Error {
  constructor(
    public readonly code:
      | 'AUTHENTICATION_FAILED'
      | 'RATE_LIMITED'
      | 'INVALID_REQUEST'
      | 'MODEL_NOT_FOUND'
      | 'PROVIDER_UNAVAILABLE'
      | 'PROVIDER_ERROR'
      | 'STREAM_ERROR',
    public readonly retryable: boolean,
    public readonly provider: string,
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'AIProviderError';
  }
}

const assertSafeModel = (model: string): void => {
  if (!/^[A-Za-z0-9._:-]{1,160}$/.test(model))
    throw new AIProviderError('INVALID_REQUEST', false, 'gateway', 'Invalid model identifier');
};
const parseError = (provider: string, status: number, body: string): AIProviderError => {
  if (status === 401 || status === 403)
    return new AIProviderError(
      'AUTHENTICATION_FAILED',
      false,
      provider,
      'Provider authentication failed',
      status,
    );
  if (status === 404)
    return new AIProviderError(
      'MODEL_NOT_FOUND',
      false,
      provider,
      'Provider model was not found',
      status,
    );
  if (status === 408 || status === 429)
    return new AIProviderError(
      'RATE_LIMITED',
      true,
      provider,
      'Provider rate limit or timeout',
      status,
    );
  if (status >= 500)
    return new AIProviderError(
      'PROVIDER_UNAVAILABLE',
      true,
      provider,
      'Provider is temporarily unavailable',
      status,
    );
  return new AIProviderError(
    'PROVIDER_ERROR',
    false,
    provider,
    body.slice(0, 500) || 'Provider request failed',
    status,
  );
};
const readBody = async (response: Response): Promise<string> => response.text();
const headers = (apiKey: string, extra: Record<string, string> = {}): Record<string, string> => ({
  'content-type': 'application/json',
  authorization: `Bearer ${apiKey}`,
  ...extra,
});
const contentToOpenAI = (content: string | AIContentPart[]) =>
  typeof content === 'string'
    ? content
    : content.map((part) =>
        part.type === 'text'
          ? { type: 'text', text: part.text }
          : { type: 'image_url', image_url: { url: part.url } },
      );
const contentToAnthropic = (content: string | AIContentPart[]) =>
  typeof content === 'string'
    ? content
    : content.map((part) =>
        part.type === 'text'
          ? { type: 'text', text: part.text }
          : part.url.startsWith('data:')
            ? (() => {
                const match = /^data:([^;]+);base64,(.+)$/.exec(part.url);
                if (!match)
                  throw new AIProviderError(
                    'INVALID_REQUEST',
                    false,
                    'anthropic',
                    'Invalid image data URL',
                  );
                return {
                  type: 'image',
                  source: { type: 'base64', media_type: match[1], data: match[2] },
                };
              })()
            : { type: 'image', source: { type: 'url', url: part.url } },
      );

export class OpenAIAdapter implements AIProviderAdapter {
  readonly id = 'openai';
  constructor(private readonly endpoint = 'https://api.openai.com/v1/chat/completions') {}
  async complete(request: AIRequest, credential: ProviderCredential): Promise<AIResponse> {
    const body = {
      model: request.model,
      messages: request.messages.map((message) => ({
        role: message.role,
        content: contentToOpenAI(message.content),
      })),
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      stream: false,
    };
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: headers(credential.apiKey),
      body: JSON.stringify(body),
    });
    if (!response.ok) throw parseError(this.id, response.status, await readBody(response));
    const data = (await response.json()) as {
      id: string;
      model: string;
      choices?: Array<{ message?: { content?: string }; finish_reason?: string }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
    };
    return {
      id: data.id,
      provider: this.id,
      model: data.model ?? request.model,
      text: data.choices?.[0]?.message?.content ?? '',
      finishReason: data.choices?.[0]?.finish_reason,
      usage: data.usage
        ? {
            inputTokens: data.usage.prompt_tokens,
            outputTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
    };
  }
  async *stream(request: AIRequest, credential: ProviderCredential): AsyncIterable<AIStreamChunk> {
    const body = {
      model: request.model,
      messages: request.messages.map((message) => ({
        role: message.role,
        content: contentToOpenAI(message.content),
      })),
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      stream: true,
    };
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: headers(credential.apiKey),
      body: JSON.stringify(body),
    });
    if (!response.ok) throw parseError(this.id, response.status, await readBody(response));
    if (!response.body)
      throw new AIProviderError('STREAM_ERROR', true, this.id, 'Provider returned no stream body');
    yield* parseOpenAIStream(response.body, request.model, this.id);
  }
}

async function* parseOpenAIStream(
  body: ReadableStream<Uint8Array>,
  model: string,
  provider: string,
): AsyncIterable<AIStreamChunk> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let id = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (data === '[DONE]') {
          yield { id, provider, model, delta: '', done: true };
          return;
        }
        try {
          const item = JSON.parse(data) as {
            id?: string;
            model?: string;
            choices?: Array<{ delta?: { content?: string }; finish_reason?: string }>;
            usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
          };
          id ||= item.id ?? '';
          const choice = item.choices?.[0];
          yield {
            id,
            provider,
            model: item.model ?? model,
            delta: choice?.delta?.content ?? '',
            done: Boolean(choice?.finish_reason),
            usage: item.usage
              ? {
                  inputTokens: item.usage.prompt_tokens,
                  outputTokens: item.usage.completion_tokens,
                  totalTokens: item.usage.total_tokens,
                }
              : undefined,
          };
        } catch {
          throw new AIProviderError(
            'STREAM_ERROR',
            false,
            provider,
            'Invalid provider stream event',
          );
        }
      }
      if (done) break;
    }
  } finally {
    reader.releaseLock();
  }
  yield { id, provider, model, delta: '', done: true };
}

export class AnthropicAdapter implements AIProviderAdapter {
  readonly id = 'anthropic';
  constructor(private readonly endpoint = 'https://api.anthropic.com/v1/messages') {}
  async complete(request: AIRequest, credential: ProviderCredential): Promise<AIResponse> {
    const system = request.messages
      .filter((m) => m.role === 'system')
      .map((m) => contentToAnthropic(m.content))
      .join('\n');
    const messages = request.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role, content: contentToAnthropic(m.content) }));
    const body = {
      model: request.model,
      max_tokens: request.maxTokens ?? 1024,
      temperature: request.temperature,
      system: system || undefined,
      messages,
      stream: false,
    };
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: headers(credential.apiKey, {
        'x-api-key': credential.apiKey,
        'anthropic-version': '2023-06-01',
      }),
      body: JSON.stringify(body),
    });
    if (!response.ok) throw parseError(this.id, response.status, await readBody(response));
    const data = (await response.json()) as {
      id: string;
      model: string;
      content?: Array<{ type: string; text?: string }>;
      stop_reason?: string;
      usage?: { input_tokens?: number; output_tokens?: number };
    };
    return {
      id: data.id,
      provider: this.id,
      model: data.model ?? request.model,
      text:
        data.content
          ?.filter((part) => part.type === 'text')
          .map((part) => part.text ?? '')
          .join('') ?? '',
      finishReason: data.stop_reason,
      usage: data.usage
        ? {
            inputTokens: data.usage.input_tokens,
            outputTokens: data.usage.output_tokens,
            totalTokens: (data.usage.input_tokens ?? 0) + (data.usage.output_tokens ?? 0),
          }
        : undefined,
    };
  }
  async *stream(request: AIRequest, credential: ProviderCredential): AsyncIterable<AIStreamChunk> {
    const system = request.messages
      .filter((m) => m.role === 'system')
      .map((m) => contentToAnthropic(m.content))
      .join('\n');
    const messages = request.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role, content: contentToAnthropic(m.content) }));
    const body = {
      model: request.model,
      max_tokens: request.maxTokens ?? 1024,
      temperature: request.temperature,
      system: system || undefined,
      messages,
      stream: true,
    };
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: headers(credential.apiKey, {
        'x-api-key': credential.apiKey,
        'anthropic-version': '2023-06-01',
      }),
      body: JSON.stringify(body),
    });
    if (!response.ok) throw parseError(this.id, response.status, await readBody(response));
    if (!response.body)
      throw new AIProviderError('STREAM_ERROR', true, this.id, 'Provider returned no stream body');
    yield* parseAnthropicStream(response.body, request.model);
  }
}
async function* parseAnthropicStream(
  body: ReadableStream<Uint8Array>,
  model: string,
): AsyncIterable<AIStreamChunk> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let id = '';
  let inputTokens: number | undefined;
  let outputTokens: number | undefined;
  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        try {
          const item = JSON.parse(data) as {
            type?: string;
            message?: { id?: string; model?: string; usage?: { input_tokens?: number } };
            delta?: { type?: string; text?: string; stop_reason?: string };
            usage?: { output_tokens?: number };
          };
          id ||= item.message?.id ?? '';
          inputTokens = item.message?.usage?.input_tokens ?? inputTokens;
          outputTokens = item.usage?.output_tokens ?? outputTokens;
          const delta = item.delta?.type === 'text_delta' ? (item.delta.text ?? '') : '';
          if (delta || item.type === 'message_start' || item.type === 'message_delta')
            yield {
              id,
              provider: 'anthropic',
              model: item.message?.model ?? model,
              delta,
              done: item.delta?.stop_reason != null,
              usage:
                inputTokens != null || outputTokens != null
                  ? {
                      inputTokens,
                      outputTokens,
                      totalTokens:
                        inputTokens != null && outputTokens != null
                          ? inputTokens + outputTokens
                          : undefined,
                    }
                  : undefined,
            };
        } catch {
          throw new AIProviderError(
            'STREAM_ERROR',
            false,
            'anthropic',
            'Invalid provider stream event',
          );
        }
      }
      if (done) break;
    }
  } finally {
    reader.releaseLock();
  }
  yield {
    id,
    provider: 'anthropic',
    model,
    delta: '',
    done: true,
    usage:
      inputTokens != null || outputTokens != null
        ? {
            inputTokens,
            outputTokens,
            totalTokens:
              inputTokens != null && outputTokens != null ? inputTokens + outputTokens : undefined,
          }
        : undefined,
  };
}

export class ProviderRegistry {
  private readonly providers = new Map<string, AIProviderAdapter>();
  register(provider: AIProviderAdapter): void {
    if (this.providers.has(provider.id))
      throw new Error(`PROVIDER_ALREADY_REGISTERED:${provider.id}`);
    this.providers.set(provider.id, provider);
  }
  get(id: string): AIProviderAdapter {
    const provider = this.providers.get(id);
    if (!provider)
      throw new AIProviderError('PROVIDER_ERROR', false, id, `Provider is not registered: ${id}`);
    return provider;
  }
  list(): string[] {
    return [...this.providers.keys()].sort();
  }
}

export class CredentialCipher {
  constructor(private readonly key: Uint8Array) {
    if (key.byteLength !== 32) throw new Error('CREDENTIAL_MASTER_KEY_MUST_BE_32_BYTES');
  }
  encrypt(value: ProviderCredential): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const ciphertext = Buffer.concat([
      cipher.update(JSON.stringify(value), 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return `v1.${iv.toString('base64url')}.${tag.toString('base64url')}.${ciphertext.toString('base64url')}`;
  }
  decrypt(encoded: string): ProviderCredential {
    const [version, ivText, tagText, dataText] = encoded.split('.');
    if (version !== 'v1' || !ivText || !tagText || !dataText)
      throw new Error('INVALID_CREDENTIAL_CIPHERTEXT');
    try {
      const decipher = createDecipheriv('aes-256-gcm', this.key, Buffer.from(ivText, 'base64url'));
      decipher.setAuthTag(Buffer.from(tagText, 'base64url'));
      const plain = Buffer.concat([
        decipher.update(Buffer.from(dataText, 'base64url')),
        decipher.final(),
      ]).toString('utf8');
      return JSON.parse(plain) as ProviderCredential;
    } catch {
      throw new Error('CREDENTIAL_DECRYPTION_FAILED');
    }
  }
}

export class CredentialService {
  constructor(
    private readonly db: DatabaseProvider,
    private readonly cipher: CredentialCipher,
  ) {}
  create(
    workspaceId: string,
    provider: string,
    label: string,
    credential: ProviderCredential,
  ): CredentialRecord {
    this.validate(provider, label, credential);
    return this.db.createCredential(
      workspaceId,
      provider,
      label.trim(),
      this.cipher.encrypt(credential),
    );
  }
  get(workspaceId: string, id: string): CredentialRecord | undefined {
    return this.db.getCredential(id, workspaceId);
  }
  list(workspaceId: string): Array<Omit<CredentialRecord, 'ciphertext'>> {
    return this.db.listCredentials(workspaceId).map((credential) => {
      const { ciphertext, ...safe } = credential;
      void ciphertext;
      return safe;
    });
  }
  reveal(workspaceId: string, id: string): ProviderCredential {
    const record = this.db.getCredential(id, workspaceId);
    if (!record || !record.enabled) throw new Error('CREDENTIAL_UNAVAILABLE');
    return this.cipher.decrypt(record.ciphertext);
  }
  update(
    workspaceId: string,
    id: string,
    patch: { label?: string; credential?: ProviderCredential; enabled?: boolean },
  ): CredentialRecord {
    const ciphertext = patch.credential ? this.cipher.encrypt(patch.credential) : undefined;
    if (patch.credential) this.validate('', patch.label ?? 'credential', patch.credential);
    return this.db.updateCredential(id, workspaceId, {
      label: patch.label?.trim(),
      ciphertext,
      enabled: patch.enabled,
    });
  }
  delete(workspaceId: string, id: string): void {
    this.db.deleteCredential(id, workspaceId);
  }
  private validate(provider: string, label: string, credential: ProviderCredential): void {
    if (provider && !/^[a-z0-9_-]{1,64}$/.test(provider)) throw new Error('INVALID_PROVIDER_ID');
    if (!label.trim() || label.trim().length > 120) throw new Error('INVALID_CREDENTIAL_LABEL');
    if (!credential.apiKey || credential.apiKey.length < 8 || credential.apiKey.length > 4096)
      throw new Error('INVALID_API_KEY');
  }
}

export class AIGateway {
  constructor(
    private readonly registry: ProviderRegistry,
    private readonly credentials: CredentialService,
    private readonly usageSink?: UsageSink,
  ) {}
  async complete(request: AIRequest, correlation: CorrelationContext): Promise<AIResponse> {
    this.validateRequest(request);
    const record = this.credentials.get(request.workspaceId, request.credentialId);
    if (!record || !record.enabled) throw new Error('CREDENTIAL_UNAVAILABLE');
    const provider = this.registry.get(record.provider);
    const credential = this.credentials.reveal(request.workspaceId, record.id);
    const response = await provider.complete(request, credential);
    await this.recordUsage(request, record, response.usage, response.id, correlation);
    return response;
  }
  stream(request: AIRequest, correlation: CorrelationContext): AsyncIterable<AIStreamChunk> {
    this.validateRequest(request);
    return this.streamWithUsage(request, correlation);
  }
  private async *streamWithUsage(
    request: AIRequest,
    correlation: CorrelationContext,
  ): AsyncIterable<AIStreamChunk> {
    const record = this.credentials.get(request.workspaceId, request.credentialId);
    if (!record || !record.enabled) throw new Error('CREDENTIAL_UNAVAILABLE');
    const provider = this.registry.get(record.provider);
    const credential = this.credentials.reveal(request.workspaceId, record.id);
    let usage: AIUsage | undefined;
    let id = '';
    for await (const chunk of provider.stream(request, credential)) {
      id = chunk.id || id;
      usage = chunk.usage ?? usage;
      yield chunk;
    }
    await this.recordUsage(request, record, usage, id, correlation);
  }
  private validateRequest(request: AIRequest): void {
    if (!request.workspaceId || !request.credentialId || !request.messages.length)
      throw new AIProviderError(
        'INVALID_REQUEST',
        false,
        'gateway',
        'workspace, credential, and messages are required',
      );
    assertSafeModel(request.model);
    if (request.temperature != null && (request.temperature < 0 || request.temperature > 2))
      throw new AIProviderError(
        'INVALID_REQUEST',
        false,
        'gateway',
        'temperature must be between 0 and 2',
      );
  }
  private async recordUsage(
    request: AIRequest,
    credential: CredentialRecord,
    usage: AIUsage | undefined,
    requestId: string,
    correlation: CorrelationContext,
  ): Promise<void> {
    if (!this.usageSink || !usage) return;
    await this.usageSink.publish({
      id: requestId || crypto.randomUUID(),
      type: 'ai.usage.recorded',
      version: 1,
      occurredAt: new Date().toISOString(),
      correlation,
      payload: {
        requestId: requestId || crypto.randomUUID(),
        provider: credential.provider,
        credentialId: credential.id,
        model: request.model,
        usage,
      },
    });
  }
}

export class InMemoryUsageSink implements UsageSink {
  readonly events: DomainEvent<string, UsageEventPayload>[] = [];
  publish(event: DomainEvent<string, UsageEventPayload>): void {
    this.events.push(structuredClone(event));
  }
}
