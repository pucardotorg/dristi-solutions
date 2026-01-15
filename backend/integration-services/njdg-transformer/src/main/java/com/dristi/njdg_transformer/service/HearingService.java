package com.dristi.njdg_transformer.service;

import com.dristi.njdg_transformer.config.TransformerProperties;
import com.dristi.njdg_transformer.model.HearingDetails;
import com.dristi.njdg_transformer.model.JudgeDetails;
import com.dristi.njdg_transformer.model.DesignationMaster;
import com.dristi.njdg_transformer.model.hearing.Hearing;
import com.dristi.njdg_transformer.model.hearing.HearingCriteria;
import com.dristi.njdg_transformer.model.hearing.HearingSearchRequest;
import com.dristi.njdg_transformer.model.order.Order;
import com.dristi.njdg_transformer.model.order.OrderCriteria;
import com.dristi.njdg_transformer.model.order.OrderListResponse;
import com.dristi.njdg_transformer.model.order.OrderSearchRequest;
import com.dristi.njdg_transformer.producer.Producer;
import com.dristi.njdg_transformer.repository.CaseRepository;
import com.dristi.njdg_transformer.repository.HearingRepository;
import com.dristi.njdg_transformer.utils.HearingUtil;
import com.dristi.njdg_transformer.utils.OrderUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

import static com.dristi.njdg_transformer.config.ServiceConstants.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class HearingService {

    private final HearingRepository hearingRepository;
    private final TransformerProperties properties;
    private final Producer producer;
    private final CaseRepository caseRepository;
    private final HearingUtil hearingUtil;
    private final OrderUtil orderUtil;

    public HearingDetails processAndUpdateHearings(Hearing hearing, RequestInfo requestInfo) {
        String cino = hearing.getCnrNumbers().get(0);
        List<HearingDetails> hearingDetails = hearingRepository.getHearingDetailsByCino(cino);

        for(HearingDetails hearingDetail: hearingDetails) {
            if(hearingDetail.getHearingId().equalsIgnoreCase(hearing.getHearingId())) {
                hearingDetail.setBusiness(hearingDetail.getBusiness() == null ? hearing.getHearingSummary() : hearingDetail.getBusiness());
                producer.push("update-hearing-details", hearingDetail);
                return hearingDetail;
            }
        }

        // Use hearing startTime (createdDate equivalent) for hearing processing
        LocalDate searchDate = formatDate(hearing.getStartTime());
        List<JudgeDetails> judgeDetailsList = caseRepository.getJudge(searchDate);
        JudgeDetails judgeDetails = judgeDetailsList.isEmpty() ? null : judgeDetailsList.get(0);
        DesignationMaster designationMaster = caseRepository.getDesignationMaster(JUDGE_DESIGNATION);

        // Create new hearing detail
        HearingDetails newHearingDetail = HearingDetails.builder()
                .cino(cino)
                .desgName(designationMaster.getDesgName())
                .hearingDate(formatDate(hearing.getStartTime()))
                .nextDate(hearing.getNextHearingDate() != null ? formatDate(hearing.getNextHearingDate()) : getNextDateFromOrder(hearing, requestInfo)) // Set next date from scheduled hearing or null
                .purposeOfListing(getPurposeOfListingValue(hearing))
                .judgeCode(judgeDetails != null ? judgeDetails.getJudgeCode().toString() : "")
                .joCode(judgeDetails != null ? judgeDetails.getJocode() : "")
                .desgCode(designationMaster.getDesgCode().toString())
                .hearingId(hearing.getHearingId())
                .business(hearing.getHearingSummary())
                .courtNo(judgeDetails != null ? judgeDetails.getCourtNo() : 0)
                .nextPurpose(hearing.getNextPurpose() != null ? getPurposeOfListingValue(Hearing.builder().hearingType(hearing.getNextPurpose()).build()) : getNextPurposeFromOrder(hearing, requestInfo))
                .build();

        updatePreviousHearingDetails(newHearingDetail);
        // Push new hearing
        producer.push("save-hearing-details", newHearingDetail);
        log.info("Added new hearing detail with hearingId {} for CINO {}", hearing.getHearingId(), cino);
        return newHearingDetail;
    }

    private LocalDate getNextDateFromOrder(Hearing hearing, RequestInfo requestInfo) {

        if (hearing == null || hearing.getHearingId() == null) {
            return null;
        }
        if (requestInfo == null) {
            return null;
        }

        OrderSearchRequest orderSearchRequest = OrderSearchRequest.builder()
                .criteria(
                        OrderCriteria.builder()
                                .hearingNumber(hearing.getHearingId())
                                .status(PUBLISHED_ORDER)
                                .build()
                )
                .requestInfo(requestInfo)
                .build();

        OrderListResponse orderListResponse = orderUtil.getOrders(orderSearchRequest);
        if (orderListResponse == null || orderListResponse.getList() == null || orderListResponse.getList().isEmpty()) {
            return null;
        }
        Order firstOrder = orderListResponse.getList().get(0);
        if (firstOrder == null || firstOrder.getNextHearingDate() == null) {
            return null;
        }
        try {
            return formatDate(firstOrder.getNextHearingDate());
        } catch (Exception e) {
            return null;
        }
    }

    private String getNextPurposeFromOrder(Hearing hearing, RequestInfo requestInfo) {

        if (hearing == null || hearing.getHearingId() == null) {
            return null;
        }
        if (requestInfo == null) {
            return null;
        }

        OrderSearchRequest orderSearchRequest = OrderSearchRequest.builder()
                .criteria(
                        OrderCriteria.builder()
                                .hearingNumber(hearing.getHearingId())
                                .status(PUBLISHED_ORDER)
                                .build()
                )
                .requestInfo(requestInfo)
                .build();

        OrderListResponse orderListResponse = orderUtil.getOrders(orderSearchRequest);
        if (orderListResponse == null || orderListResponse.getList() == null || orderListResponse.getList().isEmpty()) {
            return null;
        }
        Order firstOrder = orderListResponse.getList().get(0);
        if (firstOrder == null || firstOrder.getPurposeOfNextHearing() == null) {
            return null;
        }
        try {
            return getPurposeOfListingValue(Hearing.builder().hearingType(firstOrder.getPurposeOfNextHearing()).build());
        } catch (Exception e) {
            log.warn("Error getting next purpose from order for hearingId: {} | error: {}", hearing.getHearingId(), e.getMessage());
            return null;
        }
    }


    private void updatePreviousHearingDetails(HearingDetails newHearingDetail) {
        List<HearingDetails> hearingDetails = hearingRepository.getHearingDetailsByCino(newHearingDetail.getCino());
        int size = hearingDetails.size();
        for(int i=0; i<size; i++) {
            HearingDetails temp = hearingDetails.get(i);
            if(i == size-1) {
                temp.setNextDate(newHearingDetail.getHearingDate());
                producer.push("update-hearing-details", temp);
            } else if(i < size-1) {
                temp.setNextDate(hearingDetails.get(i+1).getHearingDate());
                producer.push("update-hearing-details", temp);
            }
        }
    }


    /**
     * Gets the purpose of listing value, handling the case where purpose code is 0 (default value)
     * @param hearing The hearing object
     * @return Purpose of listing as string, or null if purpose code is 0
     */
    private String getPurposeOfListingValue(Hearing hearing) {
        try {
            Integer purposeCode = hearingRepository.getHearingPurposeCode(hearing);
            // Return null if purpose code is 0 (default value) or null
            if (purposeCode == null || purposeCode == 0) {
                log.info("Purpose code is {} for hearing {}, returning null", purposeCode, hearing.getHearingId());
                return null;
            }
            return String.valueOf(purposeCode);
        } catch (Exception e) {
            log.warn("Failed to get hearing purpose code for hearing {}: {}", hearing.getHearingId(), e.getMessage());
            return null;
        }
    }

    private LocalDate formatDate(Long timestamp) {
        if (timestamp == null) {
            return null;
        }
        return Instant.ofEpochMilli(timestamp)
                .atZone(ZoneId.of(properties.getApplicationZoneId()))
                .toLocalDate();
    }

    public void processBusinessOrder(Order order, RequestInfo requestInfo){
        try {
            String hearingId = order.getHearingNumber();
            // Create search criteria for scheduled hearings
            HearingCriteria criteria = HearingCriteria.builder()
                    .tenantId(order.getTenantId())
                    .hearingId(hearingId)
                    .build();

            // Create search request
            HearingSearchRequest searchRequest = HearingSearchRequest.builder()
                    .requestInfo(requestInfo) // Use passed request info
                    .criteria(criteria)
                    .build();

            List<Hearing> hearings = hearingUtil.fetchHearingDetails(searchRequest);
            if (hearings == null || hearings.isEmpty()) {
                log.info("No hearings found for hearingId: {}", hearingId);
                return;
            }
            Hearing hearing = hearings.get(0);
            hearing.setHearingSummary(hearing.getHearingSummary() == null ? compileOrderText(order.getItemText()) : hearing.getHearingSummary());
            hearing.setNextHearingDate(order.getNextHearingDate());
            hearing.setNextPurpose(order.getPurposeOfNextHearing());
            processAndUpdateHearings(hearing, requestInfo);
        } catch (Exception e) {
            log.error("Error processing business order for hearingId: {}", order.getHearingNumber(), e);
        }
    }

    private String compileOrderText(String html) {
        if (html == null) return null;

        // 1) Normalize line breaks
        String text = html
                .replaceAll("(?i)<br\\s*/?>", "\n")
                .replaceAll("(?i)</p>", "\n")
                .replaceAll("(?i)<p[^>]*>", "")
                .replaceAll("(?i)<[^>]+>", "")
                .replace("&nbsp;", " ");

        // 2) Clean and remove duplicates
        return Arrays.stream(text.split("\n"))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .distinct()
                .collect(Collectors.joining("\n"));
    }

}
