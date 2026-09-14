import type { CorrelationContext } from '@infinity-11/types';

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
  correlation: CorrelationContext;
  metadata?: Record<string, unknown>;
}

const SECRET_KEY = /(api[_-]?key|authorization|cookie|password|secret|token)/i;

export const redactSecrets = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(redactSecrets);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, SECRET_KEY.test(key) ? '[REDACTED]' : redactSecrets(item)]),
  );
};

export const createLogEntry = (
  level: LogEntry['level'],
  message: string,
  correlation: CorrelationContext,
  metadata?: Record<string, unknown>,
): LogEntry => ({
  level,
  message,
  timestamp: new Date().toISOString(),
  correlation,
  ...(metadata ? { metadata: redactSecrets(metadata) as Record<string, unknown> } : {}),
});
