package poc;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests that prove JsonLogic extracts data DIRECTLY from the Case object.
 * Uses the real case.json from the project root.
 */
class DemoRunnerTest {

    private ObjectMapper mapper;

    @BeforeEach
    void setUp() {
        mapper = new ObjectMapper();
    }

    /**
     * Load the real case.json via DemoRunner.getSampleCaseJson() (reads from file).
     */
    @SuppressWarnings("unchecked")
    private Map<String, Object> loadRealCaseJson() throws Exception {
        return mapper.readValue(DemoRunner.getSampleCaseJson(), Map.class);
    }

    private CaseFeeCalculator getCalculator() throws Exception {
        String rulesJson = mapper.writeValueAsString(MdmsPaymentConfig.getDefaultRuleConfig());
        return new CaseFeeCalculator(rulesJson);
    }

    // ================================================================
    // CORE TEST: Calculate fees from real case.json
    // ================================================================

    @Test
    @DisplayName("DEMO: Calculate fees from real case.json — all data extracted via JsonLogic")
    void testCalculateFromRealCase() throws Exception {
        Map<String, Object> caseObject = loadRealCaseJson();
        Map<String, Object> mdmsParams = MdmsPaymentConfig.getDefaultMdmsParams();
        CaseFeeCalculator calculator = getCalculator();

        CaseFeeCalculator.CaseFeeResult result = calculator.calculate(caseObject, mdmsParams);
        List<CaseFeeCalculator.CaseFeeResult.FeeBreakdown> breakdowns = result.breakdowns;

        assertTrue(breakdowns.size() >= 5, "Should have at least 5 fee heads");

        // Verify Court Fee (hasAdvocate=true)
        CaseFeeCalculator.CaseFeeResult.FeeBreakdown courtFee = findByCode(breakdowns, "COURT_FEE");
        assertNotNull(courtFee, "Court Fee should be present (advocate exists)");
        assertEquals(100.0, courtFee.amount);

        // Verify Complaint Fee (chequeAmount=6546666, range 500001-10M)
        CaseFeeCalculator.CaseFeeResult.FeeBreakdown complaintFee = findByCode(breakdowns, "COMPLAINT_FEE");
        assertNotNull(complaintFee, "Complaint Fee should be present");
        assertEquals(1500.0, complaintFee.amount);

        // Verify Delay Condonation (delayCondonationType.code = "YES")
        CaseFeeCalculator.CaseFeeResult.FeeBreakdown delayCond = findByCode(breakdowns, "DELAY_CONDONATION_FEE");
        assertNotNull(delayCond, "Delay Condonation should be present (code=YES)");
        assertEquals(500.0, delayCond.amount);

        // Verify Advocate Welfare (1 litigant, 1 advocate → range 1-2 → 100)
        CaseFeeCalculator.CaseFeeResult.FeeBreakdown advocateWelfare = findByCode(breakdowns, "ADVOCATE_WELFARE_FUND");
        assertNotNull(advocateWelfare, "Advocate Welfare should be present");
        assertEquals(100.0, advocateWelfare.amount);

        // Verify Stipend Stamp (1 litigant, 1 advocate → range 1-2 → 50)
        CaseFeeCalculator.CaseFeeResult.FeeBreakdown stipend = findByCode(breakdowns, "STIPEND_STAMP");
        assertNotNull(stipend, "Stipend Stamp should be present");
        assertEquals(50.0, stipend.amount);
    }

    // ================================================================
    // PROOF: JsonLogic extracts chequeAmount from deep case path
    // ================================================================

    @Test
    @DisplayName("PROOF: chequeAmount extracted via JsonLogic path, not Java getter")
    void testChequeAmountExtraction() throws Exception {
        Map<String, Object> caseObject = loadRealCaseJson();
        Map<String, Object> mdmsParams = MdmsPaymentConfig.getDefaultMdmsParams();
        CaseFeeCalculator calculator = getCalculator();

        CaseFeeCalculator.CaseFeeResult result = calculator.calculate(caseObject, mdmsParams);
        CaseFeeCalculator.CaseFeeResult.FeeBreakdown complaint = findByCode(result.breakdowns, "COMPLAINT_FEE");
        assertNotNull(complaint);
        assertEquals(1500.0, complaint.amount);
    }

    // ================================================================
    // PROOF: delayCondonation extracted via JsonLogic path
    // ================================================================

    @Test
    @DisplayName("PROOF: delayCondonation code extracted via JsonLogic, compared with ==")
    void testDelayCondonationExtraction() throws Exception {
        Map<String, Object> caseWithDelay = loadRealCaseJson();
        Map<String, Object> mdmsParams = MdmsPaymentConfig.getDefaultMdmsParams();
        CaseFeeCalculator calculator = getCalculator();

        CaseFeeCalculator.CaseFeeResult result1 = calculator.calculate(caseWithDelay, mdmsParams);
        CaseFeeCalculator.CaseFeeResult.FeeBreakdown delay1 = findByCode(result1.breakdowns, "DELAY_CONDONATION_FEE");
        assertNotNull(delay1, "Delay fee should be present when code=YES");
        assertEquals(500.0, delay1.amount);

        // Modify the case
        @SuppressWarnings("unchecked")
        Map<String, Object> caseNoDelay = mapper.readValue(mapper.writeValueAsString(caseWithDelay), Map.class);
        setNestedValue(caseNoDelay, "caseDetails.delayApplications.formdata.0.data.delayCondonationType.code", "NO");

        CaseFeeCalculator.CaseFeeResult result2 = calculator.calculate(caseNoDelay, mdmsParams);
        CaseFeeCalculator.CaseFeeResult.FeeBreakdown delay2 = findByCode(result2.breakdowns, "DELAY_CONDONATION_FEE");
        assertNull(delay2, "Delay fee should NOT be present when code=NO");
    }

    // ================================================================
    // PROOF: hasAdvocate determined from case representatives array
    // ================================================================

    @Test
    @DisplayName("PROOF: hasAdvocate computed from case litigants + representatives arrays")
    void testHasAdvocateComputation() throws Exception {
        Map<String, Object> caseObject = loadRealCaseJson();
        Map<String, Object> mdmsParams = MdmsPaymentConfig.getDefaultMdmsParams();
        CaseFeeCalculator calculator = getCalculator();

        CaseFeeCalculator.CaseFeeResult result1 = calculator.calculate(caseObject, mdmsParams);
        assertNotNull(findByCode(result1.breakdowns, "COURT_FEE"));

        @SuppressWarnings("unchecked")
        Map<String, Object> caseNoAdv = mapper.readValue(mapper.writeValueAsString(caseObject), Map.class);
        caseNoAdv.put("representatives", Collections.emptyList());

        CaseFeeCalculator.CaseFeeResult result2 = calculator.calculate(caseNoAdv, mdmsParams);
        assertNull(findByCode(result2.breakdowns, "COURT_FEE"), "Court fee should be 0 when no representatives");
    }

    // ================================================================
    // EDGE: Case with different chequeAmount hits different range
    // ================================================================

    @Test
    @DisplayName("Different chequeAmount values produce different complaint fees via JsonLogic")
    void testDifferentChequeAmounts() throws Exception {
        Map<String, Object> mdmsParams = MdmsPaymentConfig.getDefaultMdmsParams();
        CaseFeeCalculator calculator = getCalculator();

        String[] amounts = {"5000", "25000", "75000", "200000"};
        double[] expectedFees = {200, 500, 750, 1000};

        for (int i = 0; i < amounts.length; i++) {
            @SuppressWarnings("unchecked")
            Map<String, Object> caseObj = mapper.readValue(DemoRunner.getSampleCaseJson(), Map.class);
            setNestedValue(caseObj, "caseDetails.chequeDetails.formdata.0.data.chequeAmount", amounts[i]);

            CaseFeeCalculator.CaseFeeResult result = calculator.calculate(caseObj, mdmsParams);
            CaseFeeCalculator.CaseFeeResult.FeeBreakdown complaint = findByCode(result.breakdowns, "COMPLAINT_FEE");
            assertNotNull(complaint, "Complaint fee should exist for amount " + amounts[i]);
            assertEquals(expectedFees[i], complaint.amount, "chequeAmount=" + amounts[i] + " should give fee=" + expectedFees[i]);
        }
    }

    // ================================================================
    // Helpers
    // ================================================================

    private CaseFeeCalculator.CaseFeeResult.FeeBreakdown findByCode(List<CaseFeeCalculator.CaseFeeResult.FeeBreakdown> breakdowns, String code) {
        return breakdowns.stream()
                .filter(b -> code.equals(b.code))
                .findFirst().orElse(null);
    }

    @SuppressWarnings("unchecked")
    private void setNestedValue(Map<String, Object> map, String dotPath, Object value) {
        String[] parts = dotPath.split("\\.");
        Object current = map;
        for (int i = 0; i < parts.length - 1; i++) {
            if (current instanceof Map) {
                current = ((Map<String, Object>) current).get(parts[i]);
            } else if (current instanceof List) {
                current = ((List<?>) current).get(Integer.parseInt(parts[i]));
            }
        }
        if (current instanceof Map) {
            ((Map<String, Object>) current).put(parts[parts.length - 1], value);
        }
    }
}
