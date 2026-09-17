package org.pucar.dristi.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;
import java.util.concurrent.RejectedExecutionException;
import java.util.concurrent.ThreadPoolExecutor;

@Slf4j
@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean(name = "hearingAsyncExecutor")
    public Executor hearingAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(5);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("hearing-async-");
        executor.setRejectedExecutionHandler((r, pool) -> {
            log.error("Hearing async task rejected: pool={}, queueSize={}, task={}",
                    pool.getPoolSize(), pool.getQueue().size(), r);
            throw new RejectedExecutionException("Hearing async executor saturated; task rejected: " + r);
        });
        executor.initialize();
        return executor;
    }
}
