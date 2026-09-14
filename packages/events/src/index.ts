import { randomUUID } from 'node:crypto';
import type { CorrelationContext, DomainEvent } from '@infinity-11/types';

export type EventHandler<T = unknown> = (event: DomainEvent<string, T>) => void | Promise<void>;
export interface EventStore {
  append(event: DomainEvent): Promise<void> | void;
}

export class InMemoryEventBus implements EventStore {
  private readonly handlers = new Map<string, Set<EventHandler>>();
  private readonly history: DomainEvent[] = [];
  on<T>(type: string, handler: EventHandler<T>): () => void {
    const set = this.handlers.get(type) ?? new Set<EventHandler>();
    set.add(handler as EventHandler);
    this.handlers.set(type, set);
    return () => set.delete(handler as EventHandler);
  }
  append(event: DomainEvent): void {
    if (event.version !== 1) throw new Error('UNSUPPORTED_EVENT_VERSION');
    this.history.push(structuredClone(event));
  }
  async publish<T>(
    type: string,
    payload: T,
    correlation: CorrelationContext,
  ): Promise<DomainEvent<string, T>> {
    const event: DomainEvent<string, T> = {
      id: randomUUID(),
      type,
      version: 1,
      occurredAt: new Date().toISOString(),
      correlation,
      payload,
    };
    await this.append(event);
    for (const handler of this.handlers.get(type) ?? []) await handler(event);
    return event;
  }
  list(): DomainEvent[] {
    return this.history.map(structuredClone);
  }
}
