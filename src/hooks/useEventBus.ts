import { useEffect } from 'react';
import { eventBus, EventTopic, EventPayloads } from '@/lib/events/EventBus';

/**
 * Hook to subscribe to event bus topics
 */
export function useEventBus<T extends EventTopic>(
  topic: T,
  handler: (payload: EventPayloads[T]) => void,
  deps: any[] = []
) {
  useEffect(() => {
    const unsubscribe = eventBus.on(topic, handler);
    return unsubscribe;
  }, [topic, ...deps]);
}

/**
 * Hook to emit events from components
 */
export function useEventEmitter() {
  return {
    emit: <T extends EventTopic>(topic: T, payload: EventPayloads[T]) => {
      eventBus.emit(topic, payload);
    },
  };
}
