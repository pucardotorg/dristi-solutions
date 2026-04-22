package poc;

import io.github.jamsesso.jsonlogic.JsonLogic;
import java.util.List;
import java.util.Map;

/**
 * Encapsulates custom operations for JsonLogic.
 * Single Responsibility Principle (SRP): Responsible ONLY for defining and registering
 * case-specific and math-specific JsonLogic functions.
 */
public class CustomJsonLogicOperations {

    public static void register(JsonLogic jsonLogic) {
        // ceil — Math.ceil
        jsonLogic.addOperation("ceil", args -> {
            if (args == null) return 0.0;
            return Math.ceil(toDouble(args));
        });

        // to_number — convert string to number
        jsonLogic.addOperation("to_number", args -> {
            if (args == null) return 0.0;
            if (args instanceof Object[] && ((Object[]) args).length > 0)
                return toDouble(((Object[]) args)[0]);
            return toDouble(args);
        });

        // count_active_reps — counts active representatives for a given litigant
        jsonLogic.addOperation("count_active_reps", args -> {
            if (!(args instanceof Object[]) || ((Object[]) args).length < 2) return 0.0;
            Object[] arr = (Object[]) args;
            return (double) countActiveRepsForLitigant((List<?>) arr[0], String.valueOf(arr[1]));
        });

        // range_lookup — [{min,max,fee}] lookup
        jsonLogic.addOperation("range_lookup", args -> {
            if (!(args instanceof Object[]) || ((Object[]) args).length < 2) return 0.0;
            Object[] arr = (Object[]) args;
            if (!(arr[0] instanceof List)) return 0.0;
            return lookupRange((List<?>) arr[0], toDouble(arr[1]));
        });

        // has_any_advocate — checks if ANY litigant has at least one active representative
        jsonLogic.addOperation("has_any_advocate", args -> {
            if (!(args instanceof Object[]) || ((Object[]) args).length < 2) return false;
            Object[] arr = (Object[]) args;
            if (!(arr[0] instanceof List) || !(arr[1] instanceof List)) return false;
            
            List<?> litigants = (List<?>) arr[0];
            List<?> reps = (List<?>) arr[1];

            for (Object lit : litigants) {
                if (!(lit instanceof Map)) continue;
                String litId = String.valueOf(((Map<?, ?>) lit).get("individualId"));
                if (countActiveRepsForLitigant(reps, litId) > 0) {
                    return true;
                }
            }
            return false;
        });

        // sum_advocate_range_fee — iterates litigants, counts advocates per litigant,
        // looks up fee from range table embedded in args
        jsonLogic.addOperation("sum_advocate_range_fee", args -> {
            if (!(args instanceof Object[]) || ((Object[]) args).length < 3) return 0.0;
            Object[] arr = (Object[]) args;
            if (!(arr[0] instanceof List) || !(arr[1] instanceof List) || !(arr[2] instanceof List))
                return 0.0;
            
            List<?> litigants = (List<?>) arr[0];
            List<?> reps = (List<?>) arr[1];
            List<?> ranges = (List<?>) arr[2];

            double total = 0;
            for (Object lit : litigants) {
                if (!(lit instanceof Map)) continue;
                String litId = String.valueOf(((Map<?, ?>) lit).get("individualId"));
                int advCount = countActiveRepsForLitigant(reps, litId);
                total += lookupRange(ranges, advCount);
            }
            return total;
        });
    }

    private static int countActiveRepsForLitigant(List<?> reps, String litigantId) {
        int count = 0;
        if (reps == null) return 0;
        for (Object rep : reps) {
            if (!(rep instanceof Map)) continue;
            Map<?, ?> repMap = (Map<?, ?>) rep;
            if (!Boolean.TRUE.equals(repMap.get("isActive"))) continue;
            Object representing = repMap.get("representing");
            if (!(representing instanceof List)) continue;
            for (Object r : (List<?>) representing) {
                if (!(r instanceof Map)) continue;
                Map<?, ?> rMap = (Map<?, ?>) r;
                if (litigantId.equals(String.valueOf(rMap.get("individualId")))) {
                    count++;
                    break;
                }
            }
        }
        return count;
    }

    private static double lookupRange(List<?> ranges, double value) {
        if (ranges == null) return 0.0;
        for (Object range : ranges) {
            if (!(range instanceof Map)) continue;
            Map<?, ?> r = (Map<?, ?>) range;
            if (value >= toDouble(r.get("min")) && value <= toDouble(r.get("max")))
                return toDouble(r.get("fee"));
        }
        return 0.0;
    }

    private static double toDouble(Object value) {
        if (value == null) return 0.0;
        if (value instanceof Number) return ((Number) value).doubleValue();
        if (value instanceof String) {
            try { return Double.parseDouble((String) value); }
            catch (NumberFormatException e) { return 0.0; }
        }
        if (value instanceof Object[] && ((Object[]) value).length > 0)
            return toDouble(((Object[]) value)[0]);
        return 0.0;
    }
}
