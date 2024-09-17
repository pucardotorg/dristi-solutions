package drishti.payment.calculator.service.summons;

import drishti.payment.calculator.repository.PostalHubRepository;
import drishti.payment.calculator.service.SummonPayment;
import drishti.payment.calculator.util.SummonUtil;
import drishti.payment.calculator.web.models.*;
import drishti.payment.calculator.web.models.enums.Classification;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class EPostSummonFeeService implements SummonPayment {

    private final SummonUtil summonUtil;
    private final PostalHubRepository repository;

    @Autowired
    public EPostSummonFeeService(SummonUtil summonUtil, PostalHubRepository repository) {
        this.summonUtil = summonUtil;
        this.repository = repository;
    }

    @Override
    public Calculation calculatePayment(RequestInfo requestInfo, SummonCalculationCriteria criteria) {


        EPostConfigParams ePostConfigParams = summonUtil.getIPostFeesDefaultData(requestInfo, criteria.getTenantId());

        HubSearchCriteria searchCriteria = HubSearchCriteria.builder().pincode(Collections.singletonList(criteria.getReceiverPincode())).build();
        List<PostalHub> postalHub = repository.getPostalHub(searchCriteria);
        if (postalHub.isEmpty()) {
            throw new CustomException("POSTAL_HUB_NOT_FOUND", "Pincode not found for speed post fee calculation");
        }

        Classification classification = postalHub.get(0).getClassification();
        Double iPostFeeWithoutGST = calculateTotalEPostFee(2, classification, ePostConfigParams);

        Double courtFees = summonUtil.calculateCourtFees(ePostConfigParams);
        Double envelopeFee = ePostConfigParams.getEnvelopeChargeIncludingGst();
        Double gstPercentage = ePostConfigParams.getGstPercentage();
        Double gstFee = iPostFeeWithoutGST * gstPercentage;

        List<BreakDown> breakDowns= getFeeBreakdown(courtFees,gstFee,iPostFeeWithoutGST + envelopeFee);

        double totalAmount = iPostFeeWithoutGST + (gstPercentage * iPostFeeWithoutGST) + courtFees + envelopeFee;

        return Calculation.builder()
                .applicationId(criteria.getSummonId())
                .totalAmount(Math.round(totalAmount * 100.0) / 100.0)
                .tenantId(criteria.getTenantId())
                .breakDown(breakDowns)
                .build();
    }



    // Method to calculate I-Post fee without GST
    private Double calculateTotalEPostFee(Integer numberOfPages, Classification classification, EPostConfigParams configParams) {

        Double weightPerPage = configParams.getPageWeight();
        Double printingFeePerPage = configParams.getPrintingFeePerPage();
        Double businessFee = configParams.getBusinessFee();

        SpeedPost speedPost = configParams.getSpeedPost();
        // Total Weight in grams
        Double totalWeight = numberOfPages * weightPerPage;
        // Total Printing Fee
        Double totalPrintingFee = numberOfPages * printingFeePerPage;
        // Speed Post Fee
        Double speedPostFee = getSpeedPostFee(totalWeight, classification, speedPost);
        // Total Fee before GST
        return totalWeight + totalPrintingFee + speedPostFee + businessFee;
    }


    // Method to get speed post fee
    public Double getSpeedPostFee(Double weight, Double distance, SpeedPost speedPost) {
        WeightRange weightRange = getWeightRange(weight, speedPost.getWeightRanges());

        assert weightRange != null;
        Range distanceRange = calculateDistanceRange(distance, weightRange);

        assert distanceRange != null;
        return distanceRange.getFee();
    }

    public Double getSpeedPostFee(Double weight, Classification classification, SpeedPost speedPost) {
        WeightRange weightRange = getWeightRange(weight, speedPost.getWeightRanges());

        assert weightRange != null;
        Range distanceRange = calculateDistanceRange(classification, weightRange);

        assert distanceRange != null;
        return distanceRange.getFee();
    }

    // Method to calculate weight range based on weight
    private WeightRange getWeightRange(Double weight, List<WeightRange> weightRanges) {
        for (WeightRange range : weightRanges) {
            int lowerBound = range.getMinWeight();
            int upperBound = range.getMaxWeight();
            if (weight >= lowerBound && weight <= upperBound) {
                return range;
            }
        }
        return null; // Invalid weight range
    }

    // Method to calculate distance range based on distance
    private Range calculateDistanceRange(Double distance, WeightRange weightRange) {
        Map<String, Range> distanceMap = weightRange.getDistanceRanges();
        for (Range range : distanceMap.values()) {
            Double lowerBound = range.getMin();
            Double upperBound = range.getMax();

            if (distance >= lowerBound && distance <= upperBound) {
                return range;
            }
        }

        return null; // Invalid distance range
    }

    private Range calculateDistanceRange(Classification classification, WeightRange weightRange) {
        Map<String, Range> distanceMap = weightRange.getDistanceRanges();
        for (Range range : distanceMap.values()) {
            if (classification.equals(Classification.fromValue(range.getClassificationCode()))) {
                return range;
            }
        }

        return null; // Invalid distance range
    }


    public List<BreakDown> getFeeBreakdown(double courtFee, double gst, double postFee) {
        List<BreakDown> feeBreakdowns = new ArrayList<>();

        feeBreakdowns.add(new BreakDown("COURT_FEES", courtFee, new HashMap<>()));
        feeBreakdowns.add(new BreakDown("GST", gst, new HashMap<>()));
        feeBreakdowns.add(new BreakDown("E_POST", postFee, new HashMap<>()));

        return feeBreakdowns;
    }



}
