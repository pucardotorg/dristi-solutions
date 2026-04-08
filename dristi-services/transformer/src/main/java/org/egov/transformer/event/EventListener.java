package org.egov.transformer.event;

public interface EventListener<T,U> {
    void process(T event,U requestInfo);
}
