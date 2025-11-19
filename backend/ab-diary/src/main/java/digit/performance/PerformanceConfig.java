package digit.performance;

import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.EnableAspectJAutoProxy;

@Configuration
@EnableAspectJAutoProxy
public class PerformanceConfig {

    @Bean
    public QueryPerformanceTracker tracker(MeterRegistry registry) {
        return new QueryPerformanceTracker(registry);
    }

    @Bean
    public QueryPerformanceAspect aspect(QueryPerformanceTracker tracker) {
        return new QueryPerformanceAspect(tracker);
    }
}
