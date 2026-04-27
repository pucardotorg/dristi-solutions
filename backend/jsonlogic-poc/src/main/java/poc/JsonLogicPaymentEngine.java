package poc;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.jamsesso.jsonlogic.JsonLogic;
import io.github.jamsesso.jsonlogic.JsonLogicException;

import java.util.*;

/**
 * JsonLogic-driven payment calculation engine.
 *
 * <p>This class evaluates payment calculation rules expressed as JsonLogic
 * against a data context, enabling zero-deployment changes to fee amounts,
 * head labels, toggle flags, and calculation logic via MDMS.
 *
 * <h3>Supported Calculation Patterns</h3>
 * <ul>
 *   <li>Conditional flat fee — {@code if + var}</li>
 *   <li>Range-based lookup — {@code range_lookup} custom op</li>
 *   <li>Per-litigant iteration — {@code reduce + range_lookup}</li>
 *   <li>Arithmetic formula — {@code +, *, var}</li>
 *   <li>Percentage calculation — {@code *, var}</li>
 *   <li>Unconditional flat fee — {@code var}</li>
 * </ul>
 *
 * <h3>Custom Operations</h3>
 * <ul>
 *   <li>{@code ceil} — rounds up to nearest integer (Math.ceil)</li>
 *   <li>{@code range_lookup} — looks up a value in a range table [{min, max, fee}]</li>
 *   <li>{@code round} — rounds to the nearest integer (Math.round)</li>
 *   <li>{@code floor} — rounds down to nearest integer (Math.floor)</li>
 * </ul>
 *
 * <h3>Known Limitations of JsonLogic</h3>
 * <ol>
 *   <li><b>reduce scope isolation:</b> Inside a {@code reduce} callback, only
 *       {@code current} and {@code accumulator} are accessible via {@code var}.
 * Evaluates payment rules using JsonLogic.
 * Single Responsibility Principle (SRP): Responsible ONLY for applying given rules
 * against a data context using the configured JsonLogic engine.
 */
public class JsonLogicPaymentEngine {

    private final JsonLogic jsonLogic;
    private final ObjectMapper objectMapper;

    public JsonLogicPaymentEngine(Map<String, String> customOperations) {
        this.jsonLogic = new JsonLogic();
        this.objectMapper = new ObjectMapper();
        
        // Register custom operations separated into another class (SRP)
        CustomJsonLogicOperations.register(jsonLogic, customOperations);
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
     * @param headConfigs List of payment head configurations from MDMS / Config
     * @param dataContext The data context (passed directly as the Case format)
     * @return List of computed breakdowns
     */
    public List<Map<String, Object>> calculatePayment(
            List<Map<String, Object>> headConfigs, 
            Map<String, Object> dataContext) throws JsonLogicException {

        List<Map<String, Object>> breakdowns = new ArrayList<>();

        for (Map<String, Object> head : headConfigs) {
            if (!Boolean.TRUE.equals(head.getOrDefault("active", true))) continue;

            Object ruleObj = head.get("rule");
            String ruleStr;
            try {
                ruleStr = objectMapper.writeValueAsString(ruleObj);
            } catch (Exception e) {
                throw new RuntimeException("Failed to serialize JsonLogic rule", e);
            }

            Object result = jsonLogic.apply(ruleStr, dataContext);
            double amount = Math.ceil(toDouble(result));

            if (amount > 0) {
                Map<String, Object> breakdown = new LinkedHashMap<>();
                breakdown.put("type", head.get("label"));
                breakdown.put("code", head.get("code"));
                breakdown.put("amount", amount);
                if (head.containsKey("extractionPath")) {
                    breakdown.put("extractionPath", head.get("extractionPath"));
                }
                breakdowns.add(breakdown);
            }
        }

        return breakdowns;
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
