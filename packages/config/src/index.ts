import type { CorrelationContext } from '@infinity-11/types';

export interface AppConfig {
  environment: 'development' | 'test' | 'production';
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  publicOrigin: string;
  correlation: CorrelationContext;
}

const required = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required configuration: ${name}`);
  return value;
};

export const loadConfig = (): AppConfig => ({
  environment: (process.env.NODE_ENV ?? 'development') as AppConfig['environment'],
  logLevel: (process.env.LOG_LEVEL ?? 'info') as AppConfig['logLevel'],
  publicOrigin: required('INFINITY_PUBLIC_ORIGIN'),
  correlation: { correlationId: crypto.randomUUID() },
});
