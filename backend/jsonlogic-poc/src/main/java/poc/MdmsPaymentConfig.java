package poc;

import java.util.*;

/**
 * Represents the complete MDMS payment configuration.
 * This model encapsulates everything that was previously spread across
 * hardcoded constants, EFilingParam, and inline range maps.
 *
 * <p>In production, this would be fetched from two MDMS masters:
 * <ul>
 *   <li>{@code case/payment-head-config} — head definitions with JsonLogic rules</li>
 *   <li>{@code case/e-filling} — fee amounts and range tables</li>
 * </ul>
 *
 * <p>By combining heads + params + ranges into one config object,
 * the engine needs only a single MDMS fetch to calculate any fee type.
 */
public class MdmsPaymentConfig {

    // ================================================================
    // Payment Head Configurations (from MDMS: case/payment-head-config)
    // Each head defines: code, label, active flag, sort order, rule
    // ================================================================
    private List<Map<String, Object>> headConfigs;

    // ================================================================
    // Fee Parameters (from MDMS: case/e-filling)
    // Flat fee amounts referenced by rules via {var: "params.xxx"}
    // ================================================================
    private Map<String, Object> feeParams;

    // ================================================================
    // Range Tables (from MDMS: case/e-filling or separate master)
    // Each range table is a list of {min, max, fee} objects
    // Referenced by rules via {var: "xxxRanges"}
    // ================================================================
    private Map<String, List<Map<String, Object>>> rangeTables;

    // ================================================================
    // Custom Operations (from MDMS)
    // Map of operation name -> JEXL script
    // ================================================================
    private Map<String, String> customOperations;

    public MdmsPaymentConfig() {
        this.headConfigs = new ArrayList<>();
        this.feeParams = new LinkedHashMap<>();
        this.rangeTables = new LinkedHashMap<>();
        this.customOperations = new LinkedHashMap<>();
    }

    // --- Getters and Setters ---

    public List<Map<String, Object>> getHeadConfigs() {
        return headConfigs;
    }

    public void setHeadConfigs(List<Map<String, Object>> headConfigs) {
        this.headConfigs = headConfigs;
    }

    public Map<String, Object> getFeeParams() {
        return feeParams;
    }

    public void setFeeParams(Map<String, Object> feeParams) {
        this.feeParams = feeParams;
    }

    public Map<String, List<Map<String, Object>>> getRangeTables() {
        return rangeTables;
    }

    public void setRangeTables(Map<String, List<Map<String, Object>>> rangeTables) {
        this.rangeTables = rangeTables;
    }

    public Map<String, String> getCustomOperations() {
        return customOperations;
    }

    public void setCustomOperations(Map<String, String> customOperations) {
        this.customOperations = customOperations;
    }

    // ================================================================
    // Builder for fluent construction
    // ================================================================
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final MdmsPaymentConfig config;

        Builder() {
            this.config = new MdmsPaymentConfig();
        }

        /**
         * Set the payment head configurations (rules from MDMS).
         */
        public Builder headConfigs(List<Map<String, Object>> headConfigs) {
            config.headConfigs = headConfigs;
            return this;
        }

        /**
         * Set a flat fee parameter (e.g., courtFee=100.0).
         */
        public Builder feeParam(String key, Object value) {
            config.feeParams.put(key, value);
            return this;
        }

        /**
         * Set all fee parameters at once.
         */
        public Builder feeParams(Map<String, Object> params) {
            config.feeParams.putAll(params);
            return this;
        }

        /**
         * Add a range table (e.g., complaintFeeRanges).
         * Each entry is a list of {min, max, fee} maps.
         */
        public Builder rangeTable(String name, List<Map<String, Object>> ranges) {
            config.rangeTables.put(name, ranges);
            return this;
        }

        /**
         * Add custom operations.
         */
        public Builder customOperations(Map<String, String> operations) {
            config.customOperations.putAll(operations);
            return this;
        }

        public MdmsPaymentConfig build() {
            return config;
        }
    }

    // ================================================================
    // Factory: Convert existing EFilingParam format to MdmsPaymentConfig
    // This bridges the current MDMS structure to the new config model
    // ================================================================

    /**
     * Converts the existing EFilingParam-style MDMS data into the
     * standardized MdmsPaymentConfig format.
     *
     * <p>This handles the conversion of the legacy range formats:
     * <ul>
     *   <li>{@code complaintFee: Map<String, Range>} → {@code [{min, max, fee}]}</li>
     *   <li>{@code noOfAdvocateFees: LinkedHashMap<String, HashMap<String, Integer>>} → {@code [{min, max, fee}]}</li>
     *   <li>{@code stipendStamp: LinkedHashMap<String, HashMap<String, Integer>>} → {@code [{min, max, fee}]}</li>
     * </ul>
     *
     * @param eFilingData the raw MDMS e-filling data as a map
     * @return standardized config
     */
    public static MdmsPaymentConfig fromEFilingParam(Map<String, Object> eFilingData) {
        Builder builder = builder();

        // Extract flat fee params
        Map<String, Object> params = new LinkedHashMap<>();
        putIfPresent(params, "courtFee", eFilingData.get("courtFee"));
        putIfPresent(params, "legalBasicFund", eFilingData.get("legalBasicFund"));
        putIfPresent(params, "advocateClerkWelfareFund", eFilingData.get("advocateClerkWelfareFund"));
        putIfPresent(params, "delayCondonationFee", eFilingData.get("delayCondonationFee"));
        putIfPresent(params, "applicationFee", eFilingData.get("applicationFee"));
        putIfPresent(params, "vakalathnamaFee", eFilingData.get("vakalathnamaFee"));
        putIfPresent(params, "advocateWelfareFund", eFilingData.get("advocateWelfareFund"));
        builder.feeParams(params);

        // Convert complaintFee ranges: Map<String, {min, max, fee}> → List<{min, max, fee}>
        Object complaintFee = eFilingData.get("complaintFee");
        if (complaintFee instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> complaintMap = (Map<String, Object>) complaintFee;
            List<Map<String, Object>> ranges = new ArrayList<>();
            for (Object rangeObj : complaintMap.values()) {
                if (rangeObj instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> range = (Map<String, Object>) rangeObj;
                    ranges.add(Map.of(
                        "min", toDouble(range.get("min")),
                        "max", toDouble(range.get("max")),
                        "fee", toDouble(range.get("fee"))
                    ));
                }
            }
            builder.rangeTable("complaintFeeRanges", ranges);
        }

        // Convert noOfAdvocateFees: LinkedHashMap<String, {min, max, advocateFee}> → List<{min, max, fee}>
        Object advocateFees = eFilingData.get("noOfAdvocateFees");
        if (advocateFees instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> advocateMap = (Map<String, Object>) advocateFees;
            List<Map<String, Object>> ranges = new ArrayList<>();
            for (Object rangeObj : advocateMap.values()) {
                if (rangeObj instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> range = (Map<String, Object>) rangeObj;
                    // Note: legacy format uses "advocateFee" key, normalize to "fee"
                    Object feeValue = range.containsKey("fee") ? range.get("fee") : range.get("advocateFee");
                    ranges.add(Map.of(
                        "min", toDouble(range.get("min")),
                        "max", toDouble(range.get("max")),
                        "fee", toDouble(feeValue)
                    ));
                }
            }
            builder.rangeTable("advocateFeeRanges", ranges);
        }

        // Convert stipendStamp: LinkedHashMap<String, {min, max, fee}> → List<{min, max, fee}>
        Object stipendStamp = eFilingData.get("stipendStamp");
        if (stipendStamp instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> stipendMap = (Map<String, Object>) stipendStamp;
            List<Map<String, Object>> ranges = new ArrayList<>();
            for (Object rangeObj : stipendMap.values()) {
                if (rangeObj instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> range = (Map<String, Object>) rangeObj;
                    ranges.add(Map.of(
                        "min", toDouble(range.get("min")),
                        "max", toDouble(range.get("max")),
                        "fee", toDouble(range.get("fee"))
                    ));
                }
            }
            builder.rangeTable("stipendStampRanges", ranges);
        }

        return builder.build();
    }

    private static void putIfPresent(Map<String, Object> target, String key, Object value) {
        if (value != null) {
            target.put(key, toDouble(value));
        }
    }

    private static double toDouble(Object value) {
        if (value == null) return 0.0;
        if (value instanceof Number) return ((Number) value).doubleValue();
        if (value instanceof String) return Double.parseDouble((String) value);
        return 0.0;
    }

    // ================================================================
    // Default MDMS Params and Rules (moved from DemoRunner)
    // ================================================================

    public static Map<String, Object> getDefaultMdmsParams() {
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("courtFee", 100.0);
        params.put("legalBasicFund", 50.0);
        params.put("advocateClerkWelfareFund", 25.0);
        params.put("delayCondonationFee", 500.0);
        params.put("applicationFee", 150.0);

        params.put("complaintFeeRanges", List.of(
                Map.of("min", 0.0, "max", 10000.0, "fee", 200.0),
                Map.of("min", 10001.0, "max", 50000.0, "fee", 500.0),
                Map.of("min", 50001.0, "max", 100000.0, "fee", 750.0),
                Map.of("min", 100001.0, "max", 500000.0, "fee", 1000.0),
                Map.of("min", 500001.0, "max", 10000000.0, "fee", 1500.0)
        ));

        params.put("advocateFeeRanges", List.of(
                Map.of("min", 1.0, "max", 2.0, "fee", 100.0),
                Map.of("min", 3.0, "max", 5.0, "fee", 200.0),
                Map.of("min", 6.0, "max", 99.0, "fee", 300.0)
        ));

        params.put("stipendStampRanges", List.of(
                Map.of("min", 1.0, "max", 2.0, "fee", 50.0),
                Map.of("min", 3.0, "max", 5.0, "fee", 100.0),
                Map.of("min", 6.0, "max", 99.0, "fee", 150.0)
        ));

        return params;
    }

    public static List<Map<String, Object>> getDefaultRuleConfig() {
        List<Map<String, Object>> rules = new ArrayList<>();

        rules.add(Map.of(
                "code", "COURT_FEE",
                "label", "Court Fee",
                "active", true,
                "sortOrder", 1,
                "description", "Court fee applied when at least one advocate is present",
                "extractionPath", "has_any_advocate(litigants, representatives)",
                "rule", Map.of("if", List.of(
                        Map.of("has_any_advocate", List.of(Map.of("var", "litigants"), Map.of("var", "representatives"))),
                        Map.of("var", "params.courtFee"),
                        0
                ))
        ));

        rules.add(Map.of(
                "code", "LEGAL_BENEFIT_FEE",
                "label", "Legal Benefit Fee",
                "active", true,
                "sortOrder", 2,
                "description", "Legal benefit fee when advocate is present",
                "extractionPath", "has_any_advocate(litigants, representatives)",
                "rule", Map.of("if", List.of(
                        Map.of("has_any_advocate", List.of(Map.of("var", "litigants"), Map.of("var", "representatives"))),
                        Map.of("var", "params.legalBasicFund"),
                        0
                )) // Fixed map logic scope mismatch
        ));

        rules.add(Map.of(
                "code", "ADVOCATE_CLERK_WELFARE_FUND",
                "label", "Advocate Clerk Welfare Fund",
                "active", true,
                "sortOrder", 3,
                "description", "Advocate clerk welfare fund when advocate present",
                "extractionPath", "has_any_advocate(litigants, representatives)",
                "rule", Map.of("if", List.of(
                        Map.of("has_any_advocate", List.of(Map.of("var", "litigants"), Map.of("var", "representatives"))),
                        Map.of("var", "params.advocateClerkWelfareFund"),
                        0
                ))
        ));

        rules.add(Map.of(
                "code", "COMPLAINT_FEE",
                "label", "Complaint Fee",
                "active", true,
                "sortOrder", 4,
                "description", "Complaint fee based on cheque amount, extracted from case.caseDetails.chequeDetails",
                "extractionPath", "caseDetails.chequeDetails.formdata.0.data.chequeAmount",
                "rule", Map.of("range_lookup", List.of(
                        Map.of("var", "params.complaintFeeRanges"),
                        Map.of("to_number", List.of(Map.of("var", "caseDetails.chequeDetails.formdata.0.data.chequeAmount")))
                ))
        ));

        rules.add(Map.of(
                "code", "ADVOCATE_WELFARE_FUND",
                "label", "Advocate Welfare Fund",
                "active", true,
                "sortOrder", 5,
                "description", "Advocate welfare fee per litigant based on their advocate count",
                "extractionPath", "sum_advocate_range_fee(litigants, representatives, params.advocateFeeRanges)",
                "rule", Map.of("sum_advocate_range_fee", List.of(
                        Map.of("var", "litigants"),
                        Map.of("var", "representatives"),
                        Map.of("var", "params.advocateFeeRanges")
                ))
        ));

        rules.add(Map.of(
                "code", "DELAY_CONDONATION_FEE",
                "label", "Delay Condonation Application Fee",
                "active", true,
                "sortOrder", 6,
                "description", "Delay condonation fee when delayCondonationType.code == 'YES'",
                "extractionPath", "caseDetails.delayApplications.formdata.0.data.delayCondonationType.code",
                "rule", Map.of("if", List.of(
                        Map.of("==", List.of(
                                Map.of("var", "caseDetails.delayApplications.formdata.0.data.delayCondonationType.code"),
                                "YES"
                        )),
                        Map.of("var", "params.delayCondonationFee"),
                        0
                ))
        ));

        rules.add(Map.of(
                "code", "STIPEND_STAMP",
                "label", "Stipend Stamp",
                "active", true,
                "sortOrder", 7,
                "description", "Stipend stamp per litigant based on advocate count",
                "extractionPath", "sum_advocate_range_fee(litigants, representatives, params.stipendStampRanges)",
                "rule", Map.of("sum_advocate_range_fee", List.of(
                        Map.of("var", "litigants"),
                        Map.of("var", "representatives"),
                        Map.of("var", "params.stipendStampRanges")
                ))
        ));

        return rules;
    }

}
