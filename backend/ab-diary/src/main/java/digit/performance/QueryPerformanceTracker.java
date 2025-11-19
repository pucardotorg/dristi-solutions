package digit.performance;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.concurrent.TimeUnit;

public class QueryPerformanceTracker {

    private final MeterRegistry meterRegistry;
    private static final Logger performanceLogger = LoggerFactory.getLogger("performance");

    public QueryPerformanceTracker(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }

    public void record(String dataSource, String name, long durationMs) {

        // Metrics
        Timer.builder("query.duration")
                .tag("source", dataSource)
                .tag("method", name)
                .register(meterRegistry)
                .record(durationMs, TimeUnit.MILLISECONDS);

        // Logging slow calls
        /*if (durationMs > 1000) {
            performanceLogger.warn("Slow query in {}: {} = {} ms", dataSource, name, durationMs);
        }*/
        performanceLogger.warn("Slow query in {}: {} = {} ms", dataSource, name, durationMs);
    }
}
