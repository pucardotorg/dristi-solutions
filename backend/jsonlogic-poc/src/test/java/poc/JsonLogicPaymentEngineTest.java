package poc;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests that validate every calculation pattern from CaseFeeCalculationService
 * can be expressed and correctly evaluated via JsonLogic rules.
 *
 * Each test mirrors a specific hardcoded pattern from the production code
 * and proves it can be replaced by a JsonLogic rule stored in MDMS.
 */
class JsonLogicPaymentEngineTest {

    private JsonLogicPaymentEngine engine;
    private ObjectMapper mapper;

    @BeforeEach
    void setUp() throws Exception {
        mapper = new ObjectMapper();
        
        // Read operations mapping from json
        String opsJson = DemoRunner.getOperationsJson();
        Map<String, String> opsConfig = mapper.readValue(opsJson, new com.fasterxml.jackson.core.type.TypeReference<Map<String, String>>() {});
        
        engine = new JsonLogicPaymentEngine(opsConfig);
    }

    // ================================================================
    // PATTERN 1: Flat fee with condition (courtFee when hasAdvocate)
    // Currently at CaseFeeCalculationService.java L67:
    //   Double calculatedCourtFee = hasAdvocate ? courtFee : 0.0;
    // ================================================================
    @Test
    @DisplayName("Pattern 1: Conditional flat fee — Court Fee with hasAdvocate")
    void testConditionalFlatFee_courtFee() throws Exception {
        String rule = """
            {"if": [{"var": "hasAdvocate"}, {"var": "params.courtFee"}, 0]}
            """;

        // With advocate
        Map<String, Object> data = buildBaseData(true, false, 0);
        assertEquals(100.0, engine.evaluate(rule, data));

        // Without advocate
        data.put("hasAdvocate", false);
        assertEquals(0.0, engine.evaluate(rule, data));
    }

    // ================================================================
    // PATTERN 2: Flat fee with different condition (delayCondonationFee)
    // Currently at CaseFeeCalculationService.java L55:
    //   Double delayFee = criteria.getIsDelayCondonation() ? delayCondonationFee : 0.0;
    // ================================================================
    @Test
    @DisplayName("Pattern 2: Conditional flat fee — Delay Condonation")
    void testConditionalFlatFee_delayCond() throws Exception {
        String rule = """
            {"if": [{"var": "isDelayCondonation"}, {"var": "params.delayCondonationFee"}, 0]}
            """;

        Map<String, Object> data = buildBaseData(true, true, 0);
        assertEquals(500.0, engine.evaluate(rule, data));

        data.put("isDelayCondonation", false);
        assertEquals(0.0, engine.evaluate(rule, data));
    }

    // ================================================================
    // PATTERN 3: Range lookup (complaint fee by checkAmount)
    // Currently at CaseFeeCalculationService.java L122-134:
    //   for (Range range : rangeMap.values()) { ... }
    // ================================================================
    @Test
    @DisplayName("Pattern 3: Range lookup — Complaint Fee using custom range_lookup")
    void testRangeLookup_complaintFee() throws Exception {
        // Using custom range_lookup operation
        String rule = """
            {"range_lookup": [{"var": "complaintFeeRanges"}, {"var": "checkAmount"}]}
            """;

        List<Map<String, Object>> ranges = List.of(
            Map.of("min", 0, "max", 10000, "fee", 200),
            Map.of("min", 10001, "max", 50000, "fee", 500),
            Map.of("min", 50001, "max", 100000, "fee", 750)
        );

        // Low range
        Map<String, Object> data = new HashMap<>();
        data.put("complaintFeeRanges", ranges);
        data.put("checkAmount", 5000);
        assertEquals(200.0, engine.evaluate(rule, data));

        // Mid range
        data.put("checkAmount", 25000);
        assertEquals(500.0, engine.evaluate(rule, data));

        // High range
        data.put("checkAmount", 75000);
        assertEquals(750.0, engine.evaluate(rule, data));

        // Out of range
        data.put("checkAmount", 150000);
        assertEquals(0.0, engine.evaluate(rule, data));
    }

    // ================================================================
    // PATTERN 3b: Range lookup using pure JsonLogic (no custom ops)
    // This proves it can be done even without custom operations
    // ================================================================
    @Test
    @DisplayName("Pattern 3b: Range lookup — Pure JsonLogic if-chain (no custom ops)")
    void testRangeLookup_pureJsonLogic() throws Exception {
        String rule = """
            {"if": [
              {"and": [{">=": [{"var": "checkAmount"}, 0]}, {"<=": [{"var": "checkAmount"}, 10000]}]},
              200,
              {"and": [{">=": [{"var": "checkAmount"}, 10001]}, {"<=": [{"var": "checkAmount"}, 50000]}]},
              500,
              {"and": [{">=": [{"var": "checkAmount"}, 50001]}, {"<=": [{"var": "checkAmount"}, 100000]}]},
              750,
              0
            ]}
            """;

        Map<String, Object> data = Map.of("checkAmount", 25000);
        assertEquals(500.0, engine.evaluate(rule, data));

        data = Map.of("checkAmount", 5000);
        assertEquals(200.0, engine.evaluate(rule, data));
    }

    // ================================================================
    // PATTERN 4: Per-litigant iteration with range lookup (advocate fee)
    // Currently at CaseFeeCalculationService.java L71-77:
    //   for (entry : litigantAdvocateMap.entrySet()) {
    //       advocateFee += getAdvocateFee(noOfAdvocateFees, entry.getValue().size());
    //   }
    // This is the MOST COMPLEX pattern — it combines iteration + range lookup
    // ================================================================
    @Test
    @DisplayName("Pattern 4: Per-litigant reduce with range lookup — Advocate Fee")
    void testPerLitigantReduce_advocateFee() throws Exception {
        // Using reduce to iterate over litigants, and if-chain for range lookup
        String rule = """
            {"reduce": [
              {"var": "litigants"},
              {"+": [
                {"var": "accumulator"},
                {"if": [
                  {"and": [{">=": [{"var": "current.advocateCount"}, 1]}, {"<=": [{"var": "current.advocateCount"}, 2]}]},
                  100,
                  {"and": [{">=": [{"var": "current.advocateCount"}, 3]}, {"<=": [{"var": "current.advocateCount"}, 5]}]},
                  200,
                  {">=": [{"var": "current.advocateCount"}, 6]},
                  300,
                  0
                ]}
              ]},
              0
            ]}
            """;

        Map<String, Object> data = new HashMap<>();
        data.put("litigants", List.of(
            Map.of("advocateCount", 2),  // range 1-2 → 100
            Map.of("advocateCount", 4),  // range 3-5 → 200
            Map.of("advocateCount", 1)   // range 1-2 → 100
        ));

        // Sum: 100 + 200 + 100 = 400
        assertEquals(400.0, engine.evaluate(rule, data));
    }

    // ================================================================
    // PATTERN 4b: Same per-litigant reduce, using custom range_lookup
    // This is cleaner and more maintainable when ranges change
    // ================================================================
    @Test
    @DisplayName("Pattern 4b: Per-litigant reduce with inline if-chain range lookup")
    void testPerLitigantReduce_withInlineRangeLookup() throws Exception {
        // Inside reduce, the context becomes {current, accumulator}, so top-level
        // vars like advocateFeeRanges are not accessible.
        // Solution: Use inline if-chain for range lookup within reduce.
        // The range boundaries and fees come from MDMS — they are baked INTO the rule JSON.
        // When ranges change, the MDMS rule itself is updated (still zero deployment).
        String rule = """
            {"reduce": [
              {"var": "litigants"},
              {"+": [
                {"var": "accumulator"},
                {"if": [
                  {"and": [{">=": [{"var": "current.advocateCount"}, 1]}, {"<=": [{"var": "current.advocateCount"}, 2]}]},
                  100,
                  {"and": [{">=": [{"var": "current.advocateCount"}, 3]}, {"<=": [{"var": "current.advocateCount"}, 5]}]},
                  200,
                  {">=": [{"var": "current.advocateCount"}, 6]},
                  300,
                  0
                ]}
              ]},
              0
            ]}
            """;

        Map<String, Object> data = new HashMap<>();
        data.put("litigants", List.of(
            Map.of("advocateCount", 2),
            Map.of("advocateCount", 4),
            Map.of("advocateCount", 1)
        ));

        assertEquals(400.0, engine.evaluate(rule, data));
    }

    // ================================================================
    // PATTERN 5: EPost formula (arithmetic computation)
    // Currently at EPostFeeService.java L52-57:
    //   postFee = speedPostUtil.calculateEPostFee(pages, classification, params)
    //   gstFee = postFee * gstPercentage
    //   courtFees = courtFee + applicationFee + envelopeCharge
    // ================================================================
    @Test
    @DisplayName("Pattern 5: Arithmetic formula — EPost fee calculation")
    void testArithmeticFormula_epostFee() throws Exception {
        // postFee = (pages * pageWeight * ratePerGram) + (pages * printingFee) + businessFee
        String postFeeRule = """
            {"+": [
              {"*": [{"var": "pages"}, {"var": "speedPost.pageWeight"}, {"var": "speedPost.ratePerGram"}]},
              {"*": [{"var": "pages"}, {"var": "speedPost.printingFeePerPage"}]},
              {"var": "speedPost.businessFee"}
            ]}
            """;

        Map<String, Object> data = new HashMap<>();
        data.put("pages", 4);
        data.put("speedPost", Map.of(
            "pageWeight", 5.0,
            "ratePerGram", 0.5,
            "printingFeePerPage", 2.0,
            "businessFee", 10.0
        ));

        // (4*5*0.5) + (4*2) + 10 = 10 + 8 + 10 = 28.0
        assertEquals(28.0, engine.evaluate(postFeeRule, data));
    }

    // ================================================================
    // PATTERN 6: GST calculation (percentage of another computed value)
    // gstFee = postFee * gstPercentage — 
    // This demonstrates formulas referencing other computed values
    // ================================================================
    @Test
    @DisplayName("Pattern 6: Percentage calculation — GST on post fee")
    void testPercentageCalc_gst() throws Exception {
        String gstRule = """
            {"*": [{"var": "postFee"}, {"var": "gstPercentage"}]}
            """;

        Map<String, Object> data = Map.of("postFee", 100.0, "gstPercentage", 0.18);
        assertEquals(18.0, engine.evaluate(gstRule, data));
    }

    // ================================================================
    // PATTERN 7: Unconditional (always-on) flat fee
    // Some heads are always applied regardless of conditions
    // ================================================================
    @Test
    @DisplayName("Pattern 7: Unconditional flat fee — always applied")
    void testUnconditionalFlatFee() throws Exception {
        String rule = """
            {"var": "params.courtFee"}
            """;

        Map<String, Object> data = buildBaseData(false, false, 0);
        assertEquals(100.0, engine.evaluate(rule, data));
    }

    // ================================================================
    // INTEGRATION TEST: Full end-to-end payment calculation
    // Simulates the complete CaseFeeCalculationService.calculateCaseFees()
    // using MDMS-stored head configs with JsonLogic rules
    // ================================================================
    @Test
    @DisplayName("Integration: Full case filing payment via MDMS head config")
    void testFullCaseFilingPayment() throws Exception {
        // This is what would be stored in MDMS as payment-head-config
        String headConfigJson = """
            [
              {
                "code": "COURT_FEE",
                "label": "Court Fee",
                "active": true,
                "sortOrder": 1,
                "rule": {"if": [{"var": "hasAdvocate"}, {"var": "params.courtFee"}, 0]}
              },
              {
                "code": "LEGAL_BENEFIT_FEE",
                "label": "Legal Benefit Fee",
                "active": true,
                "sortOrder": 2,
                "rule": {"if": [{"var": "hasAdvocate"}, {"var": "params.legalBasicFund"}, 0]}
              },
              {
                "code": "ADVOCATE_CLERK_WELFARE_FUND",
                "label": "Advocate Clerk Welfare Fund",
                "active": true,
                "sortOrder": 3,
                "rule": {"if": [{"var": "hasAdvocate"}, {"var": "params.advocateClerkWelfareFund"}, 0]}
              },
              {
                "code": "COMPLAINT_FEE",
                "label": "Complaint Fee",
                "active": true,
                "sortOrder": 4,
                "rule": {"range_lookup": [{"var": "complaintFeeRanges"}, {"var": "checkAmount"}]}
              },
              {
                "code": "ADVOCATE_WELFARE_FUND",
                "label": "Advocate Welfare Fund",
                "active": true,
                "sortOrder": 5,
                "rule": {"reduce": [{"var": "litigants"}, {"+": [{"var": "accumulator"}, {"if": [{"and": [{">=": [{"var": "current.advocateCount"}, 1]}, {"<=": [{"var": "current.advocateCount"}, 2]}]}, 100, {"and": [{">=": [{"var": "current.advocateCount"}, 3]}, {"<=": [{"var": "current.advocateCount"}, 5]}]}, 200, {">=": [{"var": "current.advocateCount"}, 6]}, 300, 0]}]}, 0]}
              },
              {
                "code": "DELAY_CONDONATION_FEE",
                "label": "Delay Condonation Application Fee",
                "active": true,
                "sortOrder": 6,
                "rule": {"if": [{"var": "isDelayCondonation"}, {"var": "params.delayCondonationFee"}, 0]}
              },
              {
                "code": "STIPEND_STAMP",
                "label": "Stipend Stamp",
                "active": true,
                "sortOrder": 7,
                "rule": {"reduce": [{"var": "litigants"}, {"+": [{"var": "accumulator"}, {"if": [{"and": [{">=": [{"var": "current.advocateCount"}, 1]}, {"<=": [{"var": "current.advocateCount"}, 2]}]}, 50, {"and": [{">=": [{"var": "current.advocateCount"}, 3]}, {"<=": [{"var": "current.advocateCount"}, 5]}]}, 100, 0]}]}, 0]}
              }
            ]
            """;

        List<Map<String, Object>> headConfigs = mapper.readValue(headConfigJson,
            new TypeReference<List<Map<String, Object>>>() {});

        // Build the data context (same as CaseFeeCalculationService builds)
        Map<String, Object> data = new HashMap<>();
        data.put("hasAdvocate", true);
        data.put("isDelayCondonation", true);
        data.put("checkAmount", 25000);
        data.put("params", Map.of(
            "courtFee", 100.0,
            "legalBasicFund", 50.0,
            "advocateClerkWelfareFund", 25.0,
            "delayCondonationFee", 500.0
        ));
        data.put("litigants", List.of(
            Map.of("advocateCount", 2),
            Map.of("advocateCount", 4),
            Map.of("advocateCount", 1)
        ));
        data.put("complaintFeeRanges", List.of(
            Map.of("min", 0, "max", 10000, "fee", 200),
            Map.of("min", 10001, "max", 50000, "fee", 500)
        ));
        data.put("advocateFeeRanges", List.of(
            Map.of("min", 1, "max", 2, "fee", 100),
            Map.of("min", 3, "max", 5, "fee", 200),
            Map.of("min", 6, "max", 99, "fee", 300)
        ));
        data.put("stipendStampRanges", List.of(
            Map.of("min", 1, "max", 2, "fee", 50),
            Map.of("min", 3, "max", 5, "fee", 100)
        ));

        // Execute
        List<Map<String, Object>> breakdowns = engine.calculatePayment(headConfigs, data);

        // Verify
        assertEquals(7, breakdowns.size());

        // Court Fee = 100 (hasAdvocate=true)
        assertEquals("Court Fee", breakdowns.get(0).get("type"));
        assertEquals("COURT_FEE", breakdowns.get(0).get("code"));
        assertEquals(100.0, breakdowns.get(0).get("amount"));

        // Legal Benefit Fee = 50
        assertEquals("Legal Benefit Fee", breakdowns.get(1).get("type"));
        assertEquals(50.0, breakdowns.get(1).get("amount"));

        // Advocate Clerk Welfare = 25
        assertEquals("Advocate Clerk Welfare Fund", breakdowns.get(2).get("type"));
        assertEquals(25.0, breakdowns.get(2).get("amount"));

        // Complaint Fee = 500 (checkAmount=25000 → range 10001-50000)
        assertEquals("Complaint Fee", breakdowns.get(3).get("type"));
        assertEquals(500.0, breakdowns.get(3).get("amount"));

        // Advocate Welfare = 100+200+100 = 400
        assertEquals("Advocate Welfare Fund", breakdowns.get(4).get("type"));
        assertEquals(400.0, breakdowns.get(4).get("amount"));

        // Delay Condonation = 500
        assertEquals("Delay Condonation Application Fee", breakdowns.get(5).get("type"));
        assertEquals(500.0, breakdowns.get(5).get("amount"));

        // Stipend Stamp = 50+100+50 = 200
        assertEquals("Stipend Stamp", breakdowns.get(6).get("type"));
        assertEquals(200.0, breakdowns.get(6).get("amount"));

        // Total
        double total = breakdowns.stream().mapToDouble(b -> (double) b.get("amount")).sum();
        assertEquals(1775.0, total);
    }

    // ================================================================
    // CHANGE SCENARIO TEST: Disable a head via MDMS (zero deployment)
    // ================================================================
    @Test
    @DisplayName("Zero-deploy: Disable Advocate Clerk Welfare by setting active=false")
    void testDisableHead_viaActiveFlag() throws Exception {
        String headConfigJson = """
            [
              {"code": "COURT_FEE", "label": "Court Fee", "active": true, "sortOrder": 1,
               "rule": {"var": "params.courtFee"}},
              {"code": "ADVOCATE_CLERK_WELFARE_FUND", "label": "Advocate Clerk Welfare Fund", 
               "active": false, "sortOrder": 2,
               "rule": {"var": "params.advocateClerkWelfareFund"}}
            ]
            """;

        List<Map<String, Object>> headConfigs = mapper.readValue(headConfigJson,
            new TypeReference<>() {});

        Map<String, Object> data = Map.of("params", Map.of("courtFee", 100.0, "advocateClerkWelfareFund", 25.0));

        List<Map<String, Object>> breakdowns = engine.calculatePayment(headConfigs, data);

        // Only Court Fee should appear, welfare is disabled
        assertEquals(1, breakdowns.size());
        assertEquals("COURT_FEE", breakdowns.get(0).get("code"));
    }

    // ================================================================
    // CHANGE SCENARIO TEST: Rename a head via MDMS (zero deployment)
    // ================================================================
    @Test
    @DisplayName("Zero-deploy: Rename 'Court Fee' to 'Admin Fee' via MDMS label change")
    void testRenameHead_viaLabelChange() throws Exception {
        String headConfigJson = """
            [
              {"code": "COURT_FEE", "label": "Admin Fee", "active": true, "sortOrder": 1,
               "rule": {"var": "params.courtFee"}}
            ]
            """;

        List<Map<String, Object>> headConfigs = mapper.readValue(headConfigJson,
            new TypeReference<>() {});

        Map<String, Object> data = Map.of("params", Map.of("courtFee", 100.0));

        List<Map<String, Object>> breakdowns = engine.calculatePayment(headConfigs, data);

        assertEquals("Admin Fee", breakdowns.get(0).get("type"));
        assertEquals("COURT_FEE", breakdowns.get(0).get("code"));
    }

    // ================================================================
    // CHANGE SCENARIO TEST: Switch calculation logic (zero deployment)
    // Change advocate welfare from per-litigant-advocate to flat per-litigant
    // ================================================================
    @Test
    @DisplayName("Zero-deploy: Change advocate welfare from per-advocate-range to flat per-litigant")
    void testChangeCalcLogic_perLitigantFlat() throws Exception {
        // NEW rule: simply count litigants × flat rate
        String headConfigJson = """
            [
              {"code": "ADVOCATE_WELFARE_FUND", "label": "Advocate Welfare Fund", "active": true, 
               "sortOrder": 1,
               "rule": {"*": [{"reduce": [{"var": "litigants"}, {"+": [{"var": "accumulator"}, 1]}, 0]}, {"var": "params.advocateWelfarePerLitigant"}]}}
            ]
            """;

        List<Map<String, Object>> headConfigs = mapper.readValue(headConfigJson,
            new TypeReference<>() {});

        Map<String, Object> data = new HashMap<>();
        data.put("litigants", List.of(
            Map.of("advocateCount", 2),
            Map.of("advocateCount", 4),
            Map.of("advocateCount", 1)
        ));
        data.put("params", Map.of("advocateWelfarePerLitigant", 150.0));

        List<Map<String, Object>> breakdowns = engine.calculatePayment(headConfigs, data);

        // 3 litigants × 150 = 450
        assertEquals(450.0, breakdowns.get(0).get("amount"));
    }

    // ================================================================
    // CHANGE SCENARIO TEST: Add a brand new fee head (zero deployment)
    // ================================================================
    @Test
    @DisplayName("Zero-deploy: Add new 'Environmental Surcharge' head via MDMS")
    void testAddNewHead_environmentalSurcharge() throws Exception {
        String headConfigJson = """
            [
              {"code": "COURT_FEE", "label": "Court Fee", "active": true, "sortOrder": 1,
               "rule": {"var": "params.courtFee"}},
              {"code": "ENV_SURCHARGE", "label": "Environmental Surcharge", "active": true, 
               "sortOrder": 8,
               "rule": {"var": "params.environmentalSurcharge"}}
            ]
            """;

        List<Map<String, Object>> headConfigs = mapper.readValue(headConfigJson,
            new TypeReference<>() {});

        Map<String, Object> data = Map.of("params", Map.of(
            "courtFee", 100.0,
            "environmentalSurcharge", 50.0
        ));

        List<Map<String, Object>> breakdowns = engine.calculatePayment(headConfigs, data);

        assertEquals(2, breakdowns.size());
        assertEquals("Environmental Surcharge", breakdowns.get(1).get("type"));
        assertEquals("ENV_SURCHARGE", breakdowns.get(1).get("code"));
        assertEquals(50.0, breakdowns.get(1).get("amount"));
    }

    // ================================================================
    // Helper: Build standard data context
    // ================================================================
    private Map<String, Object> buildBaseData(boolean hasAdvocate, boolean isDelay, double checkAmount) {
        Map<String, Object> data = new HashMap<>();
        data.put("hasAdvocate", hasAdvocate);
        data.put("isDelayCondonation", isDelay);
        data.put("checkAmount", checkAmount);
        data.put("params", Map.of(
            "courtFee", 100.0,
            "legalBasicFund", 50.0,
            "advocateClerkWelfareFund", 25.0,
            "delayCondonationFee", 500.0
        ));
        return data;
    }
}
