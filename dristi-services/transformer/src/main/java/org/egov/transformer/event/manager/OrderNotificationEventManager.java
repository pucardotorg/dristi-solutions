package org.egov.transformer.event.manager;


import lombok.extern.slf4j.Slf4j;
import org.egov.transformer.event.EventListener;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Slf4j
public class OrderNotificationEventManager {

    private final List<EventListener<?, ?>> listeners;

    public OrderNotificationEventManager(List<EventListener<?, ?>> listeners) {
        this.listeners = listeners;
    }

    // Notify listeners that match both object types
    public <T, U> void notifyByObjects(T event, U requestInfo) {
        List<EventListener<T, U>> matchingListeners = listeners.stream()
                .filter(listener -> isListenerForTypes(listener, event, requestInfo))
                .map(listener -> (EventListener<T, U>) listener)
                .toList();

        matchingListeners.parallelStream().forEach(listener -> listener.process(event, requestInfo));
    }

    private boolean isListenerForTypes(EventListener<?, ?> listener, Object event1, Object event2) {
        return listener.getClass().getGenericInterfaces()[0].getTypeName()
                .contains(event1.getClass().getSimpleName()) &&
                listener.getClass().getGenericInterfaces()[0].getTypeName()
                        .contains(event2.getClass().getSimpleName());
    }
}
