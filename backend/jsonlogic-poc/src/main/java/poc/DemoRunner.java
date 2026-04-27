package poc;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.Map;

/**
 * ===================================================================
 * DEMO: Pure JsonLogic Fee Calculation — Data Extracted FROM Case Object
 * ===================================================================
 *
 * This demo proves that JsonLogic can:
 *   1. Accept a RAW Case object as-is (no Java preprocessing)
 *   2. Use JsonLogic DATA EXTRACTION rules to pull fields from deep paths
 *   3. Use JsonLogic CALCULATION rules to compute fees
 *   4. Return the final fee breakdown
 *
 * NO Java getters/setters. NO manual mapping. ALL via JsonLogic paths.
 *
 * Single Responsibility Principle (SRP): Acts ONLY as the orchestrator for the demo
 * execution, wiring up the UI/CLI inputs to the internal calculator components.
 */
public class DemoRunner {

    public static void main(String[] args) throws Exception {
        ObjectMapper mapper = new ObjectMapper();

        // 1. Load case JSON from case.json file
        String caseJsonStr = getSampleCaseJson();

        @SuppressWarnings("unchecked")
        Map<String, Object> caseObject = mapper.readValue(caseJsonStr, Map.class);

        // 2. Load MDMS fee params and default rules
        // In production, these are fetched from MDMS. Here we use defaults.
        Map<String, Object> mdmsParams = MdmsPaymentConfig.getDefaultMdmsParams();
        String headConfigJson = mapper.writeValueAsString(MdmsPaymentConfig.getDefaultRuleConfig());
        Map<String, String> opsConfig = mapper.readValue(getOperationsJson(), new com.fasterxml.jackson.core.type.TypeReference<Map<String, String>>() {});

        // 3. Initialize the Calculator
        CaseFeeCalculator calculator = new CaseFeeCalculator(headConfigJson, opsConfig);

        // 4. Calculate and output as JSON
        String resultJson = calculator.calculateAsJson(caseObject, mdmsParams);

        // 5. Print out the flow
        System.out.println("========== DEMO PARAMETERS & RULES ==========");
        System.out.println("✅ Data Extraction Custom Ops: ceil, to_number, count_active_reps, range_lookup, etc.");
        System.out.println("✅ Input: Case Object (with deep fields like chequeAmount and nested array relations).");
        System.out.println("✅ Rules: Defined dynamically via MDMS rule configuration.");
        System.out.println("=============================================");

        System.out.println();
        System.out.println("========== FEE CALCULATION RESULT (JSON) ==========");
        System.out.println(resultJson);
        System.out.println("===================================================");
        System.out.println();
    }

    /**
     * Loads the case object from the case.json file.
     * Looks in the project root directory (jsonlogic-poc/case.json).
     *
     * @return the case JSON string read from file
     */
    static String getSampleCaseJson() {
        try {
            // Try multiple paths to locate case.json
            Path[] candidates = {
                    Path.of("case.json"),                           // project root (when run from jsonlogic-poc/)
                    Path.of("jsonlogic-poc", "case.json"),          // when run from parent dir
                    Path.of("src", "test", "resources", "case.json") // alternative location
            };

            for (Path p : candidates) {
                if (Files.exists(p)) {
                    return Files.readString(p);
                }
            }

            throw new FileNotFoundException(
                    "case.json not found. Searched: " + Arrays.toString(candidates));
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to read case.json", e);
        }
    }

    /**
     * Loads the operations config from operations.json file.
     */
    public static String getOperationsJson() {
        try {
            Path[] candidates = {
                    Path.of("operations.json"),
                    Path.of("jsonlogic-poc", "operations.json"),
                    Path.of("src", "test", "resources", "operations.json")
            };
            for (Path p : candidates) {
                if (Files.exists(p)) {
                    return Files.readString(p);
                }
            }
            throw new FileNotFoundException("operations.json not found.");
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to read operations.json", e);
        }
    }
}
