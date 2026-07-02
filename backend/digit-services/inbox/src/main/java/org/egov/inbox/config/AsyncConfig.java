package org.egov.inbox.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

@Configuration
public class AsyncConfig {

    @Value("${inbox.count.executor.core.pool.size:10}")
    private int corePoolSize;

    @Value("${inbox.count.executor.max.pool.size:20}")
    private int maxPoolSize;

    @Value("${inbox.count.executor.queue.capacity:50}")
    private int queueCapacity;

    @Bean("inboxCountExecutor")
    public Executor inboxCountExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(corePoolSize);
        executor.setMaxPoolSize(maxPoolSize);
        executor.setQueueCapacity(queueCapacity);
        executor.setThreadNamePrefix("inbox-count-");
        executor.initialize();
        return executor;
    }
}