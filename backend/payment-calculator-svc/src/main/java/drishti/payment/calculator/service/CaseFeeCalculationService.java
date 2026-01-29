package drishti.payment.calculator.service;


import com.fasterxml.jackson.databind.JsonNode;
import drishti.payment.calculator.util.CaseUtil;
import drishti.payment.calculator.util.EFillingUtil;
import drishti.payment.calculator.web.models.*;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

import static drishti.payment.calculator.config.ServiceConstants.*;

@Service
@Slf4j
public class CaseFeeCalculationService {

    private final EFillingUtil eFillingUtil;

    private final CaseUtil caseUtil;

    @Autowired
    public CaseFeeCalculationService(EFillingUtil eFillingUtil, CaseUtil caseUtil) {
        this.eFillingUtil = eFillingUtil;
        this.caseUtil = caseUtil;
    }


    public List<Calculation> calculateCaseFees(EFillingCalculationRequest request) {
        log.info("operation=calculateCaseFees, result=IN_PROGRESS");

        RequestInfo requestInfo = request.getRequestInfo();
        List<EFillingCalculationCriteria> calculationCriteria = request.getCalculationCriteria();
        EFilingParam eFillingDefaultData = eFillingUtil.getEFillingDefaultData(requestInfo, calculationCriteria.get(0).getTenantId());

        Double advocateClerkWelfareFund = eFillingDefaultData.getAdvocateClerkWelfareFund();
        Double delayCondonationFee = eFillingDefaultData.getDelayCondonationFee();
        Double courtFee = eFillingDefaultData.getCourtFee();
        Double legalBasicFund = eFillingDefaultData.getLegalBasicFund();

        LinkedHashMap<String, HashMap<String, Integer>> noOfAdvocateFees = eFillingDefaultData.getNoOfAdvocateFees();
        Map<String, Range> complaintFeeRange = eFillingDefaultData.getComplaintFee();


        List<Calculation> result = new ArrayList<>();

        for (EFillingCalculationCriteria criteria : calculationCriteria) {
            log.info("operation=calculateCaseFees, result=CALCULATING_FEE, caseId={}", criteria.getCaseId());
            Double complaintFee = getComplaintFee(criteria.getCheckAmount(), complaintFeeRange);
            Double delayFee = criteria.getIsDelayCondonation() ? delayCondonationFee : 0.0;

            Map<String, List<JsonNode>> litigantAdvocateMap = caseUtil.getAdvocateForLitigant(request.getRequestInfo(), criteria.getFilingNumber(), criteria.getTenantId());
            Double advocateFee = 0.0;

            Double calculatedCourtFee =  courtFee;
            Double calculatedLegalBasicFund = legalBasicFund;
            Double calculatedAdvocateClerkWelfareFund = advocateClerkWelfareFund;

            for (Map.Entry<String, List<JsonNode>> entry : litigantAdvocateMap.entrySet()) {
                int advocateCount = entry.getValue().size();
                advocateFee += getAdvocateFee(noOfAdvocateFees, advocateCount);
            }

            calculatedCourtFee = Math.ceil(calculatedCourtFee);
            calculatedLegalBasicFund = Math.ceil(calculatedLegalBasicFund);
            calculatedAdvocateClerkWelfareFund = Math.ceil(calculatedAdvocateClerkWelfareFund);
            complaintFee = Math.ceil(complaintFee);
            delayFee = Math.ceil(delayFee);
            advocateFee = Math.ceil(advocateFee);

            log.info("complaintFee={}, courtFee={}, legalBasicFund={}, advocateClerkWelfareFund={}, delayFee={}, advocateFee={}", complaintFee, calculatedCourtFee, calculatedLegalBasicFund, calculatedAdvocateClerkWelfareFund, delayFee, advocateFee);

            List<BreakDown> feeBreakdown = getFeeBreakdown(calculatedCourtFee, calculatedLegalBasicFund, calculatedAdvocateClerkWelfareFund, complaintFee, delayFee, advocateFee);
            Double totalCourtFee = calculatedCourtFee + calculatedLegalBasicFund + calculatedAdvocateClerkWelfareFund + complaintFee + delayFee + advocateFee;

            Calculation calculation = Calculation.builder()
                    .applicationId(criteria.getCaseId())
                    .totalAmount(totalCourtFee)
                    .tenantId(criteria.getTenantId())
                    .breakDown(feeBreakdown).build();

            result.add(calculation);
        }
        log.info("operation=calculateCaseFees, result=SUCCESS");

        return result;

    }


    public List<BreakDown> getFeeBreakdown(double courtFee, double legalBasicFund, double advocateClerkWelfareFund, double complaintFee, double condonationFee, double advocateFee) {
        List<BreakDown> feeBreakdowns = new ArrayList<>();

        feeBreakdowns.add(new BreakDown(COURT_FEE, "COURT_FEE", courtFee, new HashMap<>()));
        feeBreakdowns.add(new BreakDown(LEGAL_BENEFIT_FEE, "LEGAL_BENEFIT_FEE", legalBasicFund, new HashMap<>()));
        feeBreakdowns.add(new BreakDown(ADVOCATE_CLERK_WELFARE_FUND, "ADVOCATE_CLERK_WELFARE_FUND", advocateClerkWelfareFund, new HashMap<>()));
        feeBreakdowns.add(new BreakDown(COMPLAINT_FEE, "COMPLAINT_FEE", complaintFee, new HashMap<>()));
        feeBreakdowns.add(new BreakDown(ADVOCATE_FEE, "ADVOCATE_WELFARE_FUND", advocateFee, new HashMap<>()));
        if (condonationFee > 0)
            feeBreakdowns.add(new BreakDown(DELAY_CONDONATION_FEE, "DELAY_CONDONATION_FEE", condonationFee, new HashMap<>()));

        return feeBreakdowns;
    }


    private Double getComplaintFee(Double checkAmount, Map<String, Range> rangeMap) {

        for (Range range : rangeMap.values()) {
            Double lowerBound = range.getMin();
            Double upperBound = range.getMax();

            if (checkAmount >= lowerBound && checkAmount <= upperBound) {
                return range.getFee();
            }
        }

        return null; // Invalid check amount
    }

    private Boolean isDelayCondonationFeeApplicable(Long delayDuration, Long stdDuration) {

        return delayDuration > stdDuration;

    }

    private Double getAdvocateFee(LinkedHashMap<String, HashMap<String, Integer>> noOfAdvocateFees, int noOfAdvocates) {
        Double advocateFee = 0.0;
        for (Map.Entry<String, HashMap<String, Integer>> entry : noOfAdvocateFees.entrySet()) {
            HashMap<String, Integer> value = entry.getValue();
            Double lowerBound = Double.valueOf(value.get("min"));
            Double upperBound = Double.valueOf(value.get("max"));

            if (noOfAdvocates >= lowerBound && noOfAdvocates <= upperBound) {
                advocateFee = Double.valueOf(value.get("advocateFee"));
                break;
            }
        }
        return advocateFee;
    }

    public List<Calculation> calculateJoinCaseFees(@Valid JoinCasePaymentRequest request) {

        EFilingParam eFillingDefaultData = eFillingUtil.getEFillingDefaultData(request.getRequestInfo(), request.getJoinCaseCriteria().get(0).getTenantId());

        Double courtFee = eFillingDefaultData.getCourtFee();
        Double legalBasicFund = eFillingDefaultData.getLegalBasicFund();
        Double advocateClerkWelfareFund = eFillingDefaultData.getAdvocateClerkWelfareFund();

        List<Calculation> result = new ArrayList<>();
        for (JoinCaseCriteria joinCaseCriteria : request.getJoinCaseCriteria()) {

            Double calculatedCourtFee = 0.0;
            Double calculatedLegalBasicFund = 0.0;
            Double calculatedAdvocateClerkWelfareFund = 0.0;
            Double calculatedAdvocateFee = 0.0;

            for (LitigantAdvocateMap litigantAdvocateMap : joinCaseCriteria.getLitigantAdvocateMap()) {
                if (litigantAdvocateMap.getAdvocateCount() > 0) {
                    calculatedCourtFee = courtFee;
                    calculatedLegalBasicFund = legalBasicFund;
                    calculatedAdvocateClerkWelfareFund = advocateClerkWelfareFund;
                    Double advocateFee = getAdvocateFee(eFillingDefaultData.getNoOfAdvocateFees(), litigantAdvocateMap.getAdvocateCount());
                    calculatedAdvocateFee += advocateFee;
                }
            }
            calculatedAdvocateFee = Math.ceil(calculatedAdvocateFee);
            calculatedCourtFee = Math.ceil(calculatedCourtFee);
            calculatedLegalBasicFund = Math.ceil(calculatedLegalBasicFund);
            calculatedAdvocateClerkWelfareFund = Math.ceil(calculatedAdvocateClerkWelfareFund);
            List<BreakDown> feeBreakdown = getFeeBreakdownForJoinCase(calculatedCourtFee, calculatedLegalBasicFund, calculatedAdvocateClerkWelfareFund, calculatedAdvocateFee);
            Double totalAmount = calculatedCourtFee + calculatedLegalBasicFund + calculatedAdvocateClerkWelfareFund + calculatedAdvocateFee;
            Calculation calculation = Calculation.builder()
                    .applicationId(joinCaseCriteria.getCaseId())
                    .totalAmount(totalAmount)
                    .tenantId(joinCaseCriteria.getTenantId())
                    .breakDown(feeBreakdown).build();

            result.add(calculation);
        }

        return result;


    }

    private void addBreakdownIfPositive(List<BreakDown> feeBreakdowns, String code, String label, double amount) {
        if (amount > 0) {
            feeBreakdowns.add(new BreakDown(code, label, amount, new HashMap<>()));
        }
    }

    public List<BreakDown> getFeeBreakdownForJoinCase(double courtFee, double legalBasicFund, double advocateClerkWelfareFund, double advocateFee) {

        List<BreakDown> feeBreakdowns = new ArrayList<>();

        addBreakdownIfPositive(feeBreakdowns, COURT_FEE, "COURT_FEE", courtFee);
        addBreakdownIfPositive(feeBreakdowns, LEGAL_BENEFIT_FEE, "LEGAL_BENEFIT_FEE", legalBasicFund);
        addBreakdownIfPositive(feeBreakdowns, ADVOCATE_CLERK_WELFARE_FUND, "ADVOCATE_CLERK_WELFARE_FUND", advocateClerkWelfareFund);
        addBreakdownIfPositive(feeBreakdowns, ADVOCATE_FEE, "ADVOCATE_WELFARE_FUND", advocateFee);

        return feeBreakdowns;
    }
}
