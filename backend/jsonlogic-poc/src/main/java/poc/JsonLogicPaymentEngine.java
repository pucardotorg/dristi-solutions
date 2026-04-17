package poc;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.jamsesso.jsonlogic.JsonLogic;
import io.github.jamsesso.jsonlogic.JsonLogicException;

import java.util.*;

/**
 * Proof-of-concept: JsonLogic-driven payment calculation engine.
 *
 * This class demonstrates how every calculation pattern currently hardcoded in
 * CaseFeeCalculationService can be expressed as a JsonLogic rule stored in MDMS,
 * enabling zero-deployment changes to:
 *   - Fee amounts
 *   - Fee head labels
 *   - Fee head active/inactive toggles
 *   - Calculation logic (conditions, formulas, loops)
 *   - Range-based lookups
 *
 * The JsonLogic engine evaluates rules at RUNTIME against a data context,
 * so changing the rule in MDMS = changing the calculation without code deployment.
 */
public class JsonLogicPaymentEngine {

    private final JsonLogic jsonLogic;
    private final ObjectMapper objectMapper;

    public JsonLogicPaymentEngine() {
        this.jsonLogic = new JsonLogic();
        this.objectMapper = new ObjectMapper();

        // Register custom operations for payment-specific needs
        registerCustomOperations();
    }

    /**
     * Register custom JsonLogic operations that extend the standard spec.
     * These handle payment-specific patterns like Math.ceil and range lookups.
     */
    private void registerCustomOperations() {
        // ceil — rounds up to nearest integer (Math.ceil)
        jsonLogic.addOperation("ceil", args -> {
            if (args == null) return 0.0;
            double value = toDouble(args);
            return Math.ceil(value);
        });

        // range_lookup — looks up a value in a range table
        // args: [rangeTable, lookupValue]
        // rangeTable is an array of {min, max, fee}
        jsonLogic.addOperation("range_lookup", args -> {
            if (!(args instanceof Object[]) || ((Object[]) args).length < 2) return 0.0;
            Object[] arr = (Object[]) args;
            Object rangesObj = arr[0];
            if (rangesObj == null || !(rangesObj instanceof List)) return 0.0;
            List<?> ranges = (List<?>) rangesObj;
            double lookupValue = toDouble(arr[1]);
            
            for (Object range : ranges) {
                if (!(range instanceof Map)) continue;
                @SuppressWarnings("unchecked")
                Map<String, Object> r = (Map<String, Object>) range;
                double min = toDouble(r.get("min"));
                double max = toDouble(r.get("max"));
                double fee = toDouble(r.get("fee"));
                if (lookupValue >= min && lookupValue <= max) {
                    return fee;
                }
            }
            return 0.0;
        });
    }

    /**
     * Evaluate a JsonLogic rule against a data context.
     * This is the core method — called for each payment head.
     */
    public double evaluate(String rule, Map<String, Object> data) throws JsonLogicException {
        Object result = jsonLogic.apply(rule, data);
        return toDouble(result);
    }

    /**
     * Evaluate a complete payment using the head configuration from MDMS.
     * Each head has: code, label, active, sortOrder, rule (JsonLogic expression)
     *
     * @param headConfigs List of payment head configurations from MDMS
     * @param data        The data context (params, litigants, flags, etc.)
     * @return List of computed breakdowns
     */
    public List<Map<String, Object>> calculatePayment(
            List<Map<String, Object>> headConfigs, 
            Map<String, Object> data) throws JsonLogicException {

        List<Map<String, Object>> breakdowns = new ArrayList<>();

        for (Map<String, Object> head : headConfigs) {
            // Skip inactive heads
            Boolean active = (Boolean) head.getOrDefault("active", true);
            if (!active) continue;

            // Get the JsonLogic rule (stored as a JSON string or object)
            Object ruleObj = head.get("rule");
            String ruleStr;
            if (ruleObj instanceof String) {
                ruleStr = (String) ruleObj;
            } else {
                try {
                    ruleStr = objectMapper.writeValueAsString(ruleObj);
                } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
                    throw new RuntimeException("Failed to serialize JsonLogic rule", e);
                }
            }

            // Evaluate the rule
            double amount = evaluate(ruleStr, data);
            amount = Math.ceil(amount);

            // Only add positive amounts (same as addBreakdownIfPositive)
            if (amount > 0) {
                Map<String, Object> breakdown = new LinkedHashMap<>();
                breakdown.put("type", head.get("label"));
                breakdown.put("code", head.get("code"));
                breakdown.put("amount", amount);
                breakdowns.add(breakdown);
            }
        }

        return breakdowns;
    }

    // ================================================================
    // Helper for numeric conversion (JsonLogic returns various types)
    // ================================================================
    private static double toDouble(Object value) {
        if (value == null) return 0.0;
        if (value instanceof Number) return ((Number) value).doubleValue();
        if (value instanceof String) return Double.parseDouble((String) value);
        if (value instanceof Object[] && ((Object[]) value).length > 0) return toDouble(((Object[]) value)[0]);
        return 0.0;
    }
}
