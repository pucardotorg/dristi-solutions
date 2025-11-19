package digit.performance;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;

@Aspect
public class QueryPerformanceAspect {

    private final QueryPerformanceTracker tracker;

    public QueryPerformanceAspect(QueryPerformanceTracker tracker) {
        this.tracker = tracker;
    }

    @Around("@annotation(trackQuery)")
    public Object track(ProceedingJoinPoint pjp, TrackQuery trackQuery) throws Throwable {

        long start = System.currentTimeMillis();
        try {
            return pjp.proceed();
        } finally {
            long duration = System.currentTimeMillis() - start;
            tracker.record(trackQuery.dataSource(), pjp.getSignature().getName(), duration);
        }
    }
}
