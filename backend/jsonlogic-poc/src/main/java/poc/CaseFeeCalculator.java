package poc;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.jamsesso.jsonlogic.JsonLogicException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Orchestrator that receives raw input (Case object and Configs), integrates with
 * the JsonLogicPaymentEngine, and returns properly formatted results.
 * Single Responsibility Principle (SRP): Coordinates data and engine execution.
 */
public class CaseFeeCalculator {

    private final JsonLogicPaymentEngine engine;
    private final ObjectMapper objectMapper;
    private List<Map<String, Object>> headConfigs;

    /**
     * Create a calculator with MDMS payment config and head configurations.
     *
     * @param headConfigJson JSON string of payment head configurations with JsonLogic rules
     */
    public CaseFeeCalculator(String headConfigJson) throws JsonProcessingException {
        this.engine = new JsonLogicPaymentEngine();
        this.objectMapper = new ObjectMapper();
        this.headConfigs = objectMapper.readValue(headConfigJson, new TypeReference<>() {});
    }

    /**
     * Create a calculator with pre-parsed head configs.
     *
     * @param headConfigs List of parsed rule configurations
     */
    public CaseFeeCalculator(List<Map<String, Object>> headConfigs) {
        this.engine = new JsonLogicPaymentEngine();
        this.objectMapper = new ObjectMapper();
        this.headConfigs = headConfigs;
    }

    /**
     * Calculate fees using the raw case object map and MDMS params.
     *
     * @param caseMap   The full case object Map
     * @param mdmsParams Flat fee params and ranges from MDMS
     * @return structured CaseFeeResult
     */
    public CaseFeeResult calculate(Map<String, Object> caseMap, Map<String, Object> mdmsParams) throws JsonLogicException {
        // Prepare context
        Map<String, Object> dataContext = new LinkedHashMap<>(caseMap);
        dataContext.put("params", mdmsParams);

        // Evaluate
        List<Map<String, Object>> breakdowns = engine.calculatePayment(headConfigs, dataContext);

        // Build result
        return buildResult(caseMap, breakdowns);
    }

    /**
     * Calculate fees and return the result as a structured JSON string.
     */
    public String calculateAsJson(Map<String, Object> caseMap, Map<String, Object> mdmsParams) throws Exception {
        CaseFeeResult result = calculate(caseMap, mdmsParams);
        return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(result);
    }

    private CaseFeeResult buildResult(Map<String, Object> caseMap, List<Map<String, Object>> breakdowns) {
        CaseFeeResult result = new CaseFeeResult();

        if (caseMap != null) {
            result.caseId = (String) caseMap.get("id");
            result.filingNumber = (String) caseMap.get("filingNumber");
            result.caseTitle = (String) caseMap.getOrDefault("caseTitle", "");
        }

        result.breakdowns = new ArrayList<>();
        double total = 0;

        for (Map<String, Object> bd : breakdowns) {
            CaseFeeResult.FeeBreakdown feeBreakdown = new CaseFeeResult.FeeBreakdown();
            feeBreakdown.type = (String) bd.get("type");
            feeBreakdown.code = (String) bd.get("code");
            feeBreakdown.amount = ((Number) bd.get("amount")).doubleValue();
            result.breakdowns.add(feeBreakdown);
            total += feeBreakdown.amount;
        }

        result.feeAmount = total;
        return result;
    }

    // ================================================================
    // Result Model
    // ================================================================

    /**
     * The computation result — contains total amount and fee breakdowns.
     */
    public static class CaseFeeResult {
        public String caseId;
        public String filingNumber;
        public String caseTitle;
        public double feeAmount;
        public List<FeeBreakdown> breakdowns;

        public static class FeeBreakdown {
            public String type; 
            public String code;  
            public double amount;

            @Override
            public String toString() {
                return String.format("  %-40s [%-30s] = ₹%.2f", type, code, amount);
            }
        }

        @Override
        public String toString() {
            StringBuilder sb = new StringBuilder();
            sb.append("============================================\n");
            sb.append("CASE FEE CALCULATION RESULT\n");
            sb.append("============================================\n");
            if (caseId != null) sb.append("Case ID       : ").append(caseId).append("\n");
            if (filingNumber != null) sb.append("Filing Number : ").append(filingNumber).append("\n");
            if (caseTitle != null && !caseTitle.isEmpty()) sb.append("Case Title    : ").append(caseTitle).append("\n");
            sb.append("--------------------------------------------\n");
            sb.append("FEE BREAKDOWN:\n");
            for (FeeBreakdown bd : breakdowns) {
                sb.append(bd).append("\n");
            }
            sb.append("--------------------------------------------\n");
            sb.append(String.format("TOTAL         : ₹%.2f\n", feeAmount));
            sb.append("============================================\n");
            return sb.toString();
        }
    }
}
