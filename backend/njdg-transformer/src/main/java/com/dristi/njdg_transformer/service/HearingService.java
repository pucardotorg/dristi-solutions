package com.dristi.njdg_transformer.service;

import com.dristi.njdg_transformer.config.TransformerProperties;
import com.dristi.njdg_transformer.model.NJDGTransformRecord;
import com.dristi.njdg_transformer.model.hearing.Hearing;
import com.dristi.njdg_transformer.model.hearing.HearingCriteria;
import com.dristi.njdg_transformer.model.hearing.HearingSearchRequest;
import com.dristi.njdg_transformer.model.order.Order;
import com.dristi.njdg_transformer.model.order.OrderCriteria;
import com.dristi.njdg_transformer.model.order.OrderListResponse;
import com.dristi.njdg_transformer.model.order.OrderSearchRequest;
import com.dristi.njdg_transformer.repository.CaseRepository;
import com.dristi.njdg_transformer.utils.HearingUtil;
import com.dristi.njdg_transformer.utils.HrmsUtil;
import com.dristi.njdg_transformer.utils.MdmsUtil;
import com.dristi.njdg_transformer.utils.OrderUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static com.dristi.njdg_transformer.config.ServiceConstants.*;

@Service
@Slf4j
public class HearingService {

    @Autowired
    private final CaseRepository njdgTransformRepository;

    private final HrmsUtil hrmsUtil;

    private final MdmsUtil mdmsUtil;

    private final TransformerProperties properties;

    private final HearingUtil hearingUtil;

    private final OrderUtil orderUtil;

    public HearingService(CaseRepository njdgTransformRepository, HrmsUtil hrmsUtil, MdmsUtil mdmsUtil, TransformerProperties properties, HearingUtil hearingUtil, OrderUtil orderUtil) {
        this.njdgTransformRepository = njdgTransformRepository;
        this.hrmsUtil = hrmsUtil;
        this.mdmsUtil = mdmsUtil;
        this.properties = properties;
        this.hearingUtil = hearingUtil;
        this.orderUtil = orderUtil;
    }

    public void updateDataForHearing(Hearing hearing, RequestInfo requestInfo) {
        try {
            // Find the corresponding NJDGTransformRecord using CNR number
            if (hearing.getCnrNumbers() == null || hearing.getCnrNumbers().isEmpty()) {
                log.warn("CNR number is missing in hearing: {}", hearing.getId());
                return;
            }

            // Use the first CNR number from the list
            String cnrNumber = hearing.getCnrNumbers().get(0);
            if (cnrNumber == null || cnrNumber.trim().isEmpty()) {
                log.warn("First CNR number is empty in hearing: {}", hearing.getId());
                return;
            }
            HearingSearchRequest request = HearingSearchRequest.builder()
                    .criteria(HearingCriteria.builder().filingNumber(hearing.getFilingNumber().get(0)).build())
                    .requestInfo(requestInfo)
                    .build();
            // Find record by CNR number
            NJDGTransformRecord record = njdgTransformRepository.findByCino(cnrNumber);
            if (record == null) {
                log.warn("No NJDGTransformRecord found for CNR number: {}", cnrNumber);
                return;
            }

            // Clear existing hearing history or initialize if null
            if (record.getHistoryOfCaseHearing() == null) {
                record.setHistoryOfCaseHearing(new ArrayList<>());
            } else {
                record.getHistoryOfCaseHearing().clear();
            }

            // Get all hearings for the case
            List<Hearing> hearings = hearingUtil.fetchHearingDetails(request);


            // Process each hearing and add to history
            int serialNo = 1;
            for (Hearing hearingItem : hearings) {
                ObjectNode hearingDetails = new ObjectMapper().createObjectNode();
                
                // Set hearing date
                String hearingDate = formatDate(hearingItem.getStartTime());
                hearingDetails.put("hearing_date", hearingDate);
                
                // Set other hearing details
                hearingDetails.put("purpose_of_listing", getPurposeOfListing(requestInfo, hearingItem));
                hearingDetails.put("desg_name", properties.getJudgeDesignation());
                hearingDetails.put("judge_code", properties.getJudgeCode());

                // Fetch order using hearing number to get next hearing date
                if (hearingItem.getHearingId() != null && !hearingItem.getHearingId().isEmpty()) {
                    try {
                        // Create search request for orders with this hearing number
                        OrderSearchRequest orderSearchRequest = OrderSearchRequest.builder()
                                .requestInfo(requestInfo)
                                .criteria(OrderCriteria.builder()
                                        .hearingNumber(hearingItem.getHearingId())
                                        .build())
                                .build();
                        
                        // Fetch orders for this hearing
                        OrderListResponse orderResponse = orderUtil.getOrders(orderSearchRequest);

                        // If we found orders, and they have next hearing date, set it
                        if (orderResponse != null && orderResponse.getList() != null && !orderResponse.getList().isEmpty()) {
                            for (Order order : orderResponse.getList()) {
                                if (order.getNextHearingDate() != null) {
                                    String nextDate = formatDate(order.getNextHearingDate());
                                    hearingDetails.put("next_date", nextDate);
                                    break;
                                }
                            }
                        }
                    } catch (Exception e) {
                        log.error("Error fetching next hearing date for hearing {}: {}", 
                                hearingItem.getHearingId(), e.getMessage());
                    }
                }

                // Add to history
                record.getHistoryOfCaseHearing().add(hearingDetails);
                serialNo++;
            }
            
            // Save the updated record
            njdgTransformRepository.updateData(record);

            log.info("Successfully updated hearing history for case reference number: {}", hearing.getCaseReferenceNumber());

        } catch (Exception e) {
            log.error("Error updating hearing data for hearing: " + hearing.getId(), e);
            throw new RuntimeException("Failed to update hearing data", e);
        }
    }

    private String getPurposeOfListing(RequestInfo requestInfo, Hearing hearing) {
        Map<String, Map<String, JSONArray>> hearingPurposes = mdmsUtil.fetchMdmsData(requestInfo, hearing.getTenantId(), NJDG_MODULE, List.of(PURPOSE_MASTER));
        JSONArray purposeOfListing = hearingPurposes.get(NJDG_MODULE).get(PURPOSE_MASTER);
        String hearingType = hearing.getHearingType();

        // Find the first purpose where name matches the hearing type
        for (Object purposeObj : purposeOfListing) {
            if (purposeObj instanceof Map) {
                Map<String, String> purpose = (Map<String, String>) purposeObj;
                if (hearingType.equalsIgnoreCase(purpose.get("purposeName"))) {
                    return purpose.get("purposeCode"); // Return the code if name matches
                }
            }
        }

        log.warn("No matching purpose found for hearing type: {}", hearingType);
        return "";
    }

    /**
     * Formats a timestamp to dd/MM/yyyy string
     */
    private String formatDate(Long timestamp) {
        if (timestamp == null) {
            return null;
        }
        return Instant.ofEpochMilli(timestamp)
                .atZone(ZoneId.systemDefault())
                .toLocalDate()
                .format(DATE_FORMATTER);
    }
}
