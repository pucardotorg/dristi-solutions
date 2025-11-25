package com.dristi.njdg_transformer.service;

import com.dristi.njdg_transformer.config.TransformerProperties;
import com.dristi.njdg_transformer.model.HearingDetails;
import com.dristi.njdg_transformer.model.JudgeDetails;
import com.dristi.njdg_transformer.model.DesignationMaster;
import com.dristi.njdg_transformer.model.hearing.Hearing;
import com.dristi.njdg_transformer.model.hearing.HearingCriteria;
import com.dristi.njdg_transformer.model.hearing.HearingSearchRequest;
import com.dristi.njdg_transformer.model.order.Order;
import com.dristi.njdg_transformer.producer.Producer;
import com.dristi.njdg_transformer.repository.CaseRepository;
import com.dristi.njdg_transformer.repository.HearingRepository;
import com.dristi.njdg_transformer.utils.HearingUtil;
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

import static com.dristi.njdg_transformer.config.ServiceConstants.JUDGE_DESIGNATION;

@Service
@Slf4j
@RequiredArgsConstructor
public class HearingService {

    private final HearingRepository hearingRepository;
    private final TransformerProperties properties;
    private final Producer producer;
    private final CaseRepository caseRepository;
    private final HearingUtil hearingUtil;

    public HearingDetails processAndUpdateHearings(Hearing hearing, RequestInfo requestInfo) {
        String cino = hearing.getCnrNumbers().get(0);
        List<HearingDetails> hearingDetails = hearingRepository.getHearingDetailsByCino(cino);

        int nextSrNo = hearingDetails.stream()
                .mapToInt(HearingDetails::getSrNo)
                .max()
                .orElse(0) + 1;

        // Use hearing startTime (createdDate equivalent) for hearing processing
        LocalDate searchDate = formatDate(hearing.getStartTime());
        List<JudgeDetails> judgeDetailsList = caseRepository.getJudge(searchDate);
        JudgeDetails judgeDetails = judgeDetailsList.isEmpty() ? null : judgeDetailsList.get(0);
        DesignationMaster designationMaster = caseRepository.getDesignationMaster(JUDGE_DESIGNATION);

        // Create new hearing detail
        HearingDetails newHearingDetail = HearingDetails.builder()
                .cino(cino)
                .srNo(nextSrNo)
                .desgName(designationMaster.getDesgName())
                .hearingDate(formatDate(hearing.getStartTime()))
                .nextDate(hearing.getNextHearingDate() != null ? formatDate(hearing.getNextHearingDate()) : null) // Set next date from scheduled hearing or null
                .purposeOfListing(getPurposeOfListingValue(hearing))
                .judgeCode(judgeDetails != null ? judgeDetails.getJudgeCode().toString() : "")
                .joCode(judgeDetails != null ? judgeDetails.getJocode() : "")
                .desgCode(designationMaster.getDesgCode().toString())
                .hearingId(hearing.getHearingId())
                .business(hearing.getHearingSummary())
                .courtNo(judgeDetails != null ? judgeDetails.getCourtNo() : 0)
                .build();

        // Update previous hearing's nextDate only if there's a next scheduled hearing
        hearingDetails.stream()
                .max(Comparator.comparing(HearingDetails::getHearingDate)) // get the latest hearing before this one
                .ifPresent(prevHearing -> {
                    // Only update if there's a next scheduled hearing
                    if (prevHearing.getNextDate() == null) {
                        prevHearing.setNextDate(formatDate(hearing.getStartTime())); // set nextDate as current hearing date
                        producer.push("save-hearing-details", prevHearing); // push updated previous hearing
                        log.info("Updated previous hearing with ID {} for CINO {} with nextDate {}",
                                prevHearing.getHearingId(), cino, prevHearing.getNextDate());
                    } else {
                        log.info("No next scheduled hearing found, keeping previous hearing's nextDate as null for CINO {}", cino);
                    }
                });

        // Push new hearing
        producer.push("save-hearing-details", newHearingDetail);
        log.info("Added new hearing detail with hearingId {} for CINO {}", hearing.getHearingId(), cino);
        return newHearingDetail;
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
                .atZone(ZoneId.systemDefault())
                .toLocalDate();
    }

    public void processBusinessOrder(Order order, RequestInfo requestInfo){
        try {
            String hearingId = order.getScheduledHearingNumber();
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
            hearing.setHearingSummary(compileOrderText(order.getItemText()));
            hearing.setNextHearingDate(order.getNextHearingDate());
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
