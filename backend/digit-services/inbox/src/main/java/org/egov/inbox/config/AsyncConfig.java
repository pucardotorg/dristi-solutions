package org.egov.inbox.config;

import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.task.TaskDecorator;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.Map;
import java.util.concurrent.Executor;

@Configuration
public class AsyncConfig {

    @Value("${inbox.count.executor.core.pool.size:10}")
    private int corePoolSize;

    @Value("${inbox.count.executor.max.pool.size:20}")
    private int maxPoolSize;

    @Value("${inbox.count.executor.queue.capacity:0}")
    private int queueCapacity;

    @Bean("inboxCountExecutor")
    public Executor inboxCountExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(corePoolSize);
        executor.setMaxPoolSize(maxPoolSize);
        executor.setQueueCapacity(queueCapacity);
        executor.setThreadNamePrefix("inbox-count-");
        executor.setTaskDecorator(new MdcPropagatingTaskDecorator());
        executor.initialize();
        return executor;
    }

    static class MdcPropagatingTaskDecorator implements TaskDecorator {
        @Override
        public Runnable decorate(Runnable runnable) {
            // capture MDC from the calling (request) thread
            Map<String, String> callerMdc = MDC.getCopyOfContextMap();
            return () -> {
                try {
                    if (callerMdc != null) MDC.setContextMap(callerMdc);
                    runnable.run();
                } finally {
                    MDC.clear();
                }
            };
        }
    }
}