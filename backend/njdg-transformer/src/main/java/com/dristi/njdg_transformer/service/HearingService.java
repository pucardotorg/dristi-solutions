package com.dristi.njdg_transformer.service;

import com.dristi.njdg_transformer.config.TransformerProperties;
import com.dristi.njdg_transformer.model.HearingDetails;
import com.dristi.njdg_transformer.model.JudgeDetails;
import com.dristi.njdg_transformer.model.DesignationMaster;
import com.dristi.njdg_transformer.model.hearing.Hearing;
import com.dristi.njdg_transformer.model.hearing.HearingCriteria;
import com.dristi.njdg_transformer.model.hearing.HearingSearchRequest;
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
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

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

        JudgeDetails judgeDetails = caseRepository.getJudge(hearing.getPresidedBy().getJudgeID().get(0));
        DesignationMaster designationMaster = caseRepository.getDesignationMaster(JUDGE_DESIGNATION);

        // Find next scheduled hearing for this filing number
        LocalDate nextScheduledDate = findNextScheduledHearing(hearing, requestInfo);

        // Create new hearing detail
        HearingDetails newHearingDetail = HearingDetails.builder()
                .cino(cino)
                .srNo(nextSrNo)
                .desgName(designationMaster.getDesgName())
                .hearingDate(formatDate(hearing.getStartTime()))
                .nextDate(nextScheduledDate) // Set next date from scheduled hearing or null
                .purposeOfListing(getPurposeOfListingValue(hearing))
                .judgeCode(judgeDetails != null ? judgeDetails.getJudgeCode().toString() : "")
                .joCode(judgeDetails != null ? judgeDetails.getJocode() : "")
                .desgCode(designationMaster.getDesgCode().toString())
                .hearingId(hearing.getHearingId())
                .business(hearing.getHearingSummary())
                .courtNo(properties.getCourtNumber())
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
                        log.debug("No next scheduled hearing found, keeping previous hearing's nextDate as null for CINO {}", cino);
                    }
                });

        // Push new hearing
        producer.push("save-hearing-details", newHearingDetail);
        log.info("Added new hearing detail with hearingId {} for CINO {}", hearing.getHearingId(), cino);
        return newHearingDetail;
    }



    /**
     * Finds the next scheduled hearing for the given filing number
     * @param currentHearing The current completed hearing
     * @param requestInfo The request info from consumer
     * @return LocalDate of the next scheduled hearing, or null if none found
     */
    private LocalDate findNextScheduledHearing(Hearing currentHearing, RequestInfo requestInfo) {
        try {
            // Get filing number from current hearing
            if (currentHearing.getFilingNumber() == null || currentHearing.getFilingNumber().isEmpty()) {
                log.warn("No filing number found for hearing {}", currentHearing.getHearingId());
                return null;
            }
            
            String filingNumber = currentHearing.getFilingNumber().get(0);
            log.debug("Searching for scheduled hearings with filing number: {}", filingNumber);
            
            // Create search criteria for scheduled hearings
            HearingCriteria criteria = HearingCriteria.builder()
                    .filingNumber(filingNumber)
                    .tenantId(currentHearing.getTenantId())
                    .fromDate(currentHearing.getStartTime()) // Search from current hearing time onwards
                    .build();
            
            // Create search request
            HearingSearchRequest searchRequest = HearingSearchRequest.builder()
                    .requestInfo(requestInfo) // Use passed request info
                    .criteria(criteria)
                    .build();
            
            // Fetch hearings using HearingUtil
            List<Hearing> scheduledHearings = hearingUtil.fetchHearingDetails(searchRequest);
            
            if (scheduledHearings == null || scheduledHearings.isEmpty()) {
                log.debug("No scheduled hearings found for filing number: {}", filingNumber);
                return null;
            }
            
            // Find the next scheduled hearing (status = SCHEDULED and startTime > current hearing startTime)
            Optional<Hearing> nextScheduledHearing = scheduledHearings.stream()
                    .filter(h -> "SCHEDULED".equalsIgnoreCase(h.getStatus()))
                    .filter(h -> h.getStartTime() != null && h.getStartTime() > currentHearing.getStartTime())
                    .min(Comparator.comparing(Hearing::getStartTime)); // Get the earliest scheduled hearing
            
            if (nextScheduledHearing.isPresent()) {
                LocalDate nextDate = formatDate(nextScheduledHearing.get().getStartTime());
                log.info("Found next scheduled hearing for filing number {} on date: {}", 
                        filingNumber, nextDate);
                return nextDate;
            } else {
                log.debug("No future scheduled hearings found for filing number: {}", filingNumber);
                return null;
            }
            
        } catch (Exception e) {
            log.error("Error finding next scheduled hearing for hearing {}: {}", 
                    currentHearing.getHearingId(), e.getMessage(), e);
            return null;
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
                log.debug("Purpose code is {} for hearing {}, returning null", purposeCode, hearing.getHearingId());
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

}
