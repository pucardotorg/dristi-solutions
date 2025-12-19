package com.dristi.njdg_transformer.service;

import com.dristi.njdg_transformer.config.TransformerProperties;
import com.dristi.njdg_transformer.model.DesignationMaster;
import com.dristi.njdg_transformer.model.HearingDetails;
import com.dristi.njdg_transformer.model.JudgeDetails;
import com.dristi.njdg_transformer.model.hearing.Hearing;
import com.dristi.njdg_transformer.model.hearing.HearingCriteria;
import com.dristi.njdg_transformer.model.hearing.HearingSearchRequest;
import com.dristi.njdg_transformer.model.order.Notification;
import com.dristi.njdg_transformer.model.order.Order;
import com.dristi.njdg_transformer.producer.Producer;
import com.dristi.njdg_transformer.repository.CaseRepository;
import com.dristi.njdg_transformer.repository.HearingRepository;
import com.dristi.njdg_transformer.utils.HearingUtil;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import static com.dristi.njdg_transformer.config.ServiceConstants.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderNotificationService {

    private final HearingUtil hearingUtil;
    private final CaseRepository caseRepository;
    private final TransformerProperties properties;
    private final HearingRepository hearingRepository;
    private final Producer producer;
    private final ObjectMapper objectMapper;

    public void processBusinessDayOrders(Order order, RequestInfo requestInfo) {

        String hearingId = order.getHearingNumber();

        HearingSearchRequest searchRequest = HearingSearchRequest.builder()
                .criteria(HearingCriteria.builder()
                        .tenantId(order.getTenantId())
                        .hearingId(hearingId)
                        .build())
                .build();

        List<Hearing> hearingList = hearingUtil.fetchHearingDetails(searchRequest);

        if (hearingList == null || hearingList.isEmpty()) {
            log.info("No hearings found for hearingId: {}", hearingId);
            return;
        }

        Hearing hearing = hearingList.get(0);
        hearing.setHearingSummary(hearing.getHearingSummary() == null ? compileOrderText(order.getItemText()) : hearing.getHearingSummary());
        hearing.setNextHearingDate(order.getNextHearingDate());
        hearing.setNextPurpose(order.getPurposeOfNextHearing());

        processHearingDetails(hearing, order);
    }

    private void processHearingDetails(Hearing hearing, Order order) {
        String cino = hearing.getCnrNumbers().get(0);
        LocalDate searchDate = formatDate(hearing.getStartTime());
        List<JudgeDetails> judgeDetailsList = caseRepository.getJudge(searchDate);
        JudgeDetails judgeDetails = judgeDetailsList.isEmpty() ? null : judgeDetailsList.get(0);
        DesignationMaster designationMaster = caseRepository.getDesignationMaster(JUDGE_DESIGNATION);

        HearingDetails hearingDetails = HearingDetails.builder()
                .cino(cino)
                .hearingDate(formatDate(hearing.getStartTime()))
                .purposeOfListing(getPurposeOfListingValue(hearing))
                .business(hearing.getHearingSummary())
                .nextDate(formatDate(hearing.getNextHearingDate()))
                .nextPurpose(getPurposeOfListingValue(Hearing.builder().hearingType(hearing.getNextPurpose()).build()))
                .desgCode(designationMaster.getDesgCode().toString())
                .desgName(designationMaster.getDesgName())
                .judgeCode(judgeDetails != null ? judgeDetails.getJudgeCode().toString() : "")
                .joCode(judgeDetails != null ? judgeDetails.getJocode() : "")
                .courtNo(judgeDetails != null ? judgeDetails.getCourtNo() : 0)
                .hearingId(hearing.getHearingId())
                .orderId(order.getOrderNumber())
                .build();

        producer.push("save-hearing-details", hearingDetails);
    }


    public void processAsyncOrders(Order order, RequestInfo requestInfo) {
        //todo: for composite orders set purpose of listing from last hearing done

        String cino = order.getCnrNumber();
        LocalDate searchDate = formatDate(order.getCreatedDate());
        List<JudgeDetails> judgeDetailsList = caseRepository.getJudge(searchDate);
        JudgeDetails judgeDetails = judgeDetailsList.isEmpty() ? null : judgeDetailsList.get(0);
        DesignationMaster designationMaster = caseRepository.getDesignationMaster(JUDGE_DESIGNATION);


        HearingDetails hearingDetails = HearingDetails.builder()
                .cino(cino)
                .hearingDate(formatDate(order.getCreatedDate()))
                .purposeOfListing(getPurposeOfListingValue(Hearing.builder().hearingType(order.getOrderType()).build()))
                .business(compileOrderText(order.getItemText()))
                .nextDate(processOrdersForNextDate(order)) //todo: if next date is null check if entry already exist with next date in future and set that value here
                .nextPurpose(processOrdersForNextPurpose(order))
                .desgCode(designationMaster.getDesgCode().toString())
                .desgName(designationMaster.getDesgName())
                .judgeCode(judgeDetails != null ? judgeDetails.getJudgeCode().toString() : "")
                .joCode(judgeDetails != null ? judgeDetails.getJocode() : "")
                .courtNo(judgeDetails != null ? judgeDetails.getCourtNo() : 0)
                .hearingId(null)
                .orderId(order.getOrderNumber())
                .build();

        producer.push("save-hearing-details", hearingDetails);

        updateNextDateAndPurpose(order);
    }

    private void updateNextDateAndPurpose(Order order) {
        List<HearingDetails> hearingDetailsList = hearingRepository.getHearingDetailsByCino(order.getCnrNumber());
        for(HearingDetails hearingDetails : hearingDetailsList) {
            if(hearingDetails.getNextDate() == null) {
                hearingDetails.setNextDate(processOrdersForNextDate(order));
                hearingDetails.setNextPurpose(processOrdersForNextPurpose(order));
                producer.push("update-hearing-details", hearingDetails);
            }
        }
    }

    private String processOrdersForNextPurpose(Order order) {
        JsonNode orderDetails = findScheduledHearingOrderDetails(order);
        if (orderDetails != null && orderDetails.has("purposeOfHearing")) {
            return orderDetails.get("purposeOfHearing").asText();
        }
        return null;
    }

    private LocalDate processOrdersForNextDate(Order order) {
        JsonNode orderDetails = findScheduledHearingOrderDetails(order);
        if (orderDetails != null && orderDetails.has("hearingDate")) {
            return formatDate(orderDetails.get("hearingDate").asLong());
        }
        return null;
    }

    /**
     * Finds the orderDetails for SCHEDULE_OF_HEARING_DATE order type.
     * Handles both COMPOSITE and INTERMEDIATE orders.
     * @param order The order to search
     * @return JsonNode containing orderDetails, or null if not found
     */
    private JsonNode findScheduledHearingOrderDetails(Order order) {
        if (COMPOSITE.equalsIgnoreCase(order.getOrderCategory())) {
            JsonNode compositeItems = objectMapper.convertValue(order.getCompositeItems(), JsonNode.class);
            for (JsonNode jsonItem : compositeItems) {
                String orderType = jsonItem.get("orderType").asText();
                if (SCHEDULE_OF_HEARING_DATE.equalsIgnoreCase(orderType)) {
                    return jsonItem.get("orderSchema").get("orderDetails");
                }
            }
        } else if (SCHEDULE_OF_HEARING_DATE.equalsIgnoreCase(order.getOrderType())) {
            return objectMapper.convertValue(order.getOrderDetails(), JsonNode.class);
        }
        return null;
    }

    public void processNotificationOrders(Notification notification, RequestInfo requestInfo) {
        List<String> caseNumbers = notification.getCaseNumber();
        for(String caseNumber : caseNumbers) {
            HearingCriteria hearingCriteria = HearingCriteria.builder()
                    .fromDate(notification.getCreatedDate())
                    .courtId(notification.getCourtId())
                    .build();
            HearingSearchRequest hearingSearchRequest = HearingSearchRequest.builder()
                    .criteria(hearingCriteria)
                    .requestInfo(requestInfo)
                    .build();
            List<Hearing> hearings = hearingUtil.fetchHearingDetails(hearingSearchRequest);
            for(Hearing hearing : hearings) {
                if(caseNumber.equalsIgnoreCase(hearing.getCaseReferenceNumber())
                    && SCHEDULED.equalsIgnoreCase(hearing.getStatus())) {
                    String cino = hearing.getCnrNumbers().get(0);
                    LocalDate hearingDate = formatDate(notification.getCreatedDate());
                    DesignationMaster designationMaster = caseRepository.getDesignationMaster(JUDGE_DESIGNATION);
                    List<JudgeDetails> judgeDetailsList = caseRepository.getJudge(hearingDate);
                    JudgeDetails judgeDetails = judgeDetailsList.isEmpty() ? null : judgeDetailsList.get(0);
                    LocalDate nextDate = formatDate(hearing.getStartTime());
                    HearingDetails hearingDetails = HearingDetails.builder()
                            .cino(cino)
                            .hearingDate(hearingDate)
                            .purposeOfListing(getPurposeOfListingValue(hearing))
                            .nextDate(nextDate)
                            .nextPurpose(getPurposeOfListingValue(hearing))
                            .business(getNotificationOrderBusiness(hearingDate, nextDate))
                            .desgCode(designationMaster.getDesgCode().toString())
                            .desgName(designationMaster.getDesgName())
                            .judgeCode(judgeDetails != null ? judgeDetails.getJudgeCode().toString() : "")
                            .joCode(judgeDetails != null ? judgeDetails.getJocode() : "")
                            .courtNo(judgeDetails != null ? judgeDetails.getCourtNo() : 0)
                            .hearingId(hearing.getHearingId())
                            .orderId(notification.getNotificationNumber())
                            .build();

                    producer.push("save-hearing-details", hearingDetails);
                }
            }
        }
    }

    private String getNotificationOrderBusiness(LocalDate hearingDate, LocalDate nextDate) {
        return properties.getNotificationOrderBusinessTemplate()
                .replace("{hearingDate}", hearingDate.toString())
                .replace("{nextDate}", nextDate.toString());
    }

    /**
     * Gets the purpose of listing value, handling the case where purpose code is 0 (default value)
     * @param hearing The hearing object
     * @return Purpose of listing as string, or null if purpose code is 0
     */
    private String getPurposeOfListingValue(Hearing hearing) {
        try {
            Integer purposeCode = hearingRepository.getHearingPurposeCode(hearing);
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
