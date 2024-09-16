package drishti.payment.calculator.service;

import drishti.payment.calculator.repository.PostalHubRepository;
import drishti.payment.calculator.util.EPostUtil;
import drishti.payment.calculator.web.models.*;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
public class EPostSummonFeesCalculation implements SummonPayment {

    private final EPostUtil ePostUtil;
    private final PostalHubRepository repository;

    @Autowired
    public EPostSummonFeesCalculation(EPostUtil ePostUtil, PostalHubRepository repository) {
        this.ePostUtil = ePostUtil;
        this.repository = repository;
    }

    @Override
    public Calculation calculatePayment(RequestInfo requestInfo, SummonCalculationCriteria criteria) {


        EPostConfigParams ePostConfigParams = ePostUtil.getIPostFeesDefaultData(requestInfo, criteria.getTenantId());

        HubSearchCriteria searchCriteria = HubSearchCriteria.builder().pincode(Collections.singletonList(criteria.getReceiverPincode())).build();
        List<PostalHub> postalHub = repository.getPostalHub(searchCriteria);
        if(postalHub.isEmpty()){
            throw new CustomException("POSTAL_HUB_NOT_FOUND", "Pincode not found for speed post fee calculation");
        }

        Double iPostFeeWithoutGST = calculateTotalEPostFee(2, 50.0, ePostConfigParams);

        Double courtFees = calculateCourtFees(ePostConfigParams);

        Double envelopeFee = ePostConfigParams.getEnvelopeChargeIncludingGst();
        Double gstPercentage = ePostConfigParams.getGstPercentage();

        Double gstFee = iPostFeeWithoutGST * gstPercentage;

        List<BreakDown> breakDowns = new ArrayList<>();

        BreakDown courtFee = BreakDown.builder()
                .type("COURT_FEES")
                .amount(courtFees).build();
        breakDowns.add(courtFee);
        BreakDown gst = BreakDown.builder()
                .type("GST")
                .amount(gstFee).build();
        breakDowns.add(gst);

        BreakDown ipost = BreakDown.builder()
                .type("I_POST")
                .amount(iPostFeeWithoutGST + envelopeFee).build();
        breakDowns.add(ipost);

        double totalAmount = iPostFeeWithoutGST + gstPercentage * iPostFeeWithoutGST + courtFees + envelopeFee;
        return Calculation.builder()
                .applicationId(criteria.getSummonId())
                .totalAmount(Math.round(totalAmount * 100.0) / 100.0)
                .tenantId(criteria.getTenantId())
                .breakDown(breakDowns)
                .build();
    }

    private Double calculateCourtFees(EPostConfigParams iPostFeesDefaultData) {
        return iPostFeesDefaultData.getCourtFee() + iPostFeesDefaultData.getCourtFee();
    }

    // Method to calculate I-Post fee without GST
    private Double calculateTotalEPostFee(Integer numberOfPages, Double distance, EPostConfigParams configParams) {
        Double weightPerPage = configParams.getPageWeight();
        Double printingFeePerPage = configParams.getPrintingFeePerPage();
        Double businessFee = configParams.getBusinessFee();

        SpeedPost speedPost = configParams.getSpeedPost();

        // Total Weight in grams
        Double totalWeight = numberOfPages * weightPerPage;

        // Total Printing Fee
        Double totalPrintingFee = numberOfPages * printingFeePerPage;

        // Speed Post Fee
        Double speedPostFee = getSpeedPostFee(totalWeight, distance, speedPost);

        // Total Fee before GST
        return totalWeight + totalPrintingFee + speedPostFee + businessFee;
    }


    // Method to get speed post fee
    public Double getSpeedPostFee(Double weight, Double distance, SpeedPost speedPost) {
        WeightRange weightRange = getWeightRange(weight, speedPost.getWeightRanges());

        assert weightRange != null;
        DistanceRange distanceRange = calculateDistanceRange(distance, weightRange);

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
    private DistanceRange calculateDistanceRange(Double distance, WeightRange weightRange) {
        Map<String, DistanceRange> distanceMap = weightRange.getDistanceRanges();
        for (DistanceRange range : distanceMap.values()) {
            Double lowerBound = range.getMinDistance();
            Double upperBound = range.getMaxDistance();

            //TODO: use classification to filter, add classification code in mdms
            if (distance >= lowerBound && distance <= upperBound) {
                return range;
            }
        }

        return null; // Invalid distance range
    }


}
