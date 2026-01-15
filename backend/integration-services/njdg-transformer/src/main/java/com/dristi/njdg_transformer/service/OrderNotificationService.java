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
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
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

    /**
     * Process orders by fetching all hearings for the case using filing number.
     * Implements comprehensive logic for hearing date, purpose of listing, next date, next purpose, and business.
     * @param order The order to process
     * @param requestInfo Request info for API calls
     */
    public void processOrdersWithHearings(Order order, RequestInfo requestInfo) {
        log.info("Processing order with hearings | orderNumber: {} | filingNumber: {}", 
                order.getOrderNumber(), order.getFilingNumber());

        // Fetch all hearings for the case using filing number
        List<Hearing> allHearings = fetchAllHearingsForCase(order, requestInfo);
        log.debug("Fetched {} hearings for filing number: {}", allHearings.size(), order.getFilingNumber());

        String cino = order.getCnrNumber();
        LocalDate searchDate = formatDate(order.getCreatedDate());
        List<JudgeDetails> judgeDetailsList = caseRepository.getJudge(searchDate);
        JudgeDetails judgeDetails = judgeDetailsList.isEmpty() ? null : judgeDetailsList.get(0);
        DesignationMaster designationMaster = caseRepository.getDesignationMaster(JUDGE_DESIGNATION);

        // Hearing date: set as order created date
        LocalDate hearingDate = formatDate(order.getCreatedDate());

        // Purpose of listing: determined by hearing number and order category
        String purposeOfListing = determinePurposeOfListing(order, allHearings);

        // Next date and next purpose: from scheduled hearing after order created date
        Hearing scheduledHearing = findScheduledHearingAfterDate(allHearings, order.getCreatedDate());
        LocalDate nextDate = scheduledHearing != null ? formatDate(scheduledHearing.getStartTime()) : null;
        String nextPurpose = scheduledHearing != null ? 
                getPurposeOfListingValue(scheduledHearing) : "0";

        // Business: hearing summary if not null, otherwise itemText via compileItemText
        String business = determineBusiness(order, allHearings);

        HearingDetails hearingDetails = HearingDetails.builder()
                .cino(cino)
                .hearingDate(hearingDate)
                .purposeOfListing(purposeOfListing)
                .business(business)
                .nextDate(nextDate)
                .nextPurpose(nextPurpose)
                .desgCode(designationMaster.getDesgCode().toString())
                .desgName(designationMaster.getDesgName())
                .judgeCode(judgeDetails != null ? judgeDetails.getJudgeCode().toString() : "")
                .joCode(judgeDetails != null ? judgeDetails.getJocode() : "")
                .courtNo(judgeDetails != null ? judgeDetails.getCourtNo() : 0)
                .hearingId(order.getHearingNumber())
                .orderId(order.getOrderNumber())
                .build();

        producer.push("save-hearing-details", hearingDetails);
        log.info("Saved hearing details for order | orderNumber: {} | cino: {}", order.getOrderNumber(), cino);

        // Update existing hearing details in DB where next date is null
        updateExistingHearingsNextDate(order.getCnrNumber(), scheduledHearing);
    }

    /**
     * Fetch all hearings for the case using filing number.
     */
    private List<Hearing> fetchAllHearingsForCase(Order order, RequestInfo requestInfo) {
        HearingSearchRequest searchRequest = HearingSearchRequest.builder()
                .criteria(HearingCriteria.builder()
                        .tenantId(order.getTenantId())
                        .filingNumber(order.getFilingNumber())
                        .build())
                .requestInfo(requestInfo)
                .build();

        List<Hearing> hearings = hearingUtil.fetchHearingDetails(searchRequest);
        return hearings != null ? hearings : List.of();
    }

    /**
     * Determine purpose of listing based on order hearing number and category.
     * - If order.hearingNumber not null: find that hearing and use its hearing type
     * - If order.hearingNumber is null and order category is INTERMEDIATE: use order type
     * - If order.hearingNumber is null and order category is COMPOSITE: use last completed hearing's hearing type
     */
    private String determinePurposeOfListing(Order order, List<Hearing> allHearings) {
        if (order.getHearingNumber() != null) {
            // Find the hearing matching order's hearing number
            Optional<Hearing> matchingHearing = allHearings.stream()
                    .filter(h -> order.getHearingNumber().equals(h.getHearingId()))
                    .findFirst();
            
            if (matchingHearing.isPresent()) {
                log.debug("Found matching hearing for hearingNumber: {} | hearingType: {}", 
                        order.getHearingNumber(), matchingHearing.get().getHearingType());
                return getPurposeOfListingValue(matchingHearing.get());
            }
            log.warn("No matching hearing found for hearingNumber: {}", order.getHearingNumber());
        }

        // Hearing number is null - check order category
        if (INTERMEDIATE.equalsIgnoreCase(order.getOrderCategory())) {
            // Use order type for intermediate orders
            log.debug("Using order type for INTERMEDIATE order | orderType: {}", order.getOrderType());
            return getPurposeOfListingValue(Hearing.builder().hearingType(order.getOrderType()).build());
        } else if (COMPOSITE.equalsIgnoreCase(order.getOrderCategory())) {
            // Find last completed hearing by startTime
            Hearing lastCompletedHearing = findLastCompletedHearing(allHearings);
            if (lastCompletedHearing != null) {
                log.debug("Using last completed hearing type for COMPOSITE order | hearingType: {}", 
                        lastCompletedHearing.getHearingType());
                return getPurposeOfListingValue(lastCompletedHearing);
            }
            log.warn("No completed hearing found for COMPOSITE order: {}", order.getOrderNumber());
        }

        return "0";
    }

    /**
     * Find the last completed hearing from the list based on startTime.
     */
    private Hearing findLastCompletedHearing(List<Hearing> hearings) {
        return hearings.stream()
                .filter(h -> COMPLETED.equalsIgnoreCase(h.getStatus()))
                .filter(h -> h.getStartTime() != null)
                .max(Comparator.comparing(Hearing::getStartTime))
                .orElse(null);
    }

    /**
     * Find scheduled hearing with startTime after the given date.
     */
    private Hearing findScheduledHearingAfterDate(List<Hearing> hearings, Long orderCreatedDate) {
        if (orderCreatedDate == null) {
            return null;
        }
        return hearings.stream()
                .filter(h -> SCHEDULED.equalsIgnoreCase(h.getStatus()))
                .filter(h -> h.getStartTime() != null && h.getStartTime() > orderCreatedDate)
                .min(Comparator.comparing(Hearing::getStartTime))
                .orElse(null);
    }

    /**
     * Determine business field value.
     * If hearing summary is not null, use it. Otherwise, use itemText via compileItemText.
     */
    private String determineBusiness(Order order, List<Hearing> allHearings) {
        // Check if order has hearing number and that hearing has a summary
        if (order.getHearingNumber() != null) {
            Optional<Hearing> matchingHearing = allHearings.stream()
                    .filter(h -> order.getHearingNumber().equals(h.getHearingId()))
                    .findFirst();
            
            if (matchingHearing.isPresent() && matchingHearing.get().getHearingSummary() != null) {
                return matchingHearing.get().getHearingSummary();
            }
        }
        // Fallback to compileItemText with order's itemText
        return compileItemText(order.getItemText());
    }

    /**
     * Compile item text by cleaning HTML and removing duplicates.
     */
    private String compileItemText(String html) {
        return compileOrderText(html);
    }

    /**
     * Update existing hearing details in DB where next date is null.
     * Set next date from scheduled hearing's startTime if found.
     */
    private void updateExistingHearingsNextDate(String cino, Hearing scheduledHearing) {
        if (scheduledHearing == null) {
            log.debug("No scheduled hearing found, skipping next date update for cino: {}", cino);
            return;
        }

        LocalDate scheduledNextDate = formatDate(scheduledHearing.getStartTime());
        String scheduledNextPurpose = getPurposeOfListingValue(scheduledHearing);

        List<HearingDetails> hearingDetailsList = hearingRepository.getHearingDetailsByCino(cino);
        for (HearingDetails hearingDetails : hearingDetailsList) {
            if (hearingDetails.getNextDate() == null) {
                hearingDetails.setNextDate(scheduledNextDate);
                hearingDetails.setNextPurpose(scheduledNextPurpose != null ? scheduledNextPurpose : "0");
                producer.push("update-hearing-details", hearingDetails);
                log.debug("Updated hearing details with next date | cino: {} | srNo: {} | nextDate: {}", 
                        cino, hearingDetails.getSrNo(), scheduledNextDate);
            }
        }
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
