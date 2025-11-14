package com.dristi.njdg_transformer.service;

import com.dristi.njdg_transformer.config.TransformerProperties;
import com.dristi.njdg_transformer.model.HearingDetails;
import com.dristi.njdg_transformer.model.JudgeDetails;
import com.dristi.njdg_transformer.model.DesignationMaster;
import com.dristi.njdg_transformer.model.hearing.Hearing;
import com.dristi.njdg_transformer.producer.Producer;
import com.dristi.njdg_transformer.repository.CaseRepository;
import com.dristi.njdg_transformer.repository.HearingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.List;

import static com.dristi.njdg_transformer.config.ServiceConstants.JUDGE_DESIGNATION;

@Service
@Slf4j
@RequiredArgsConstructor
public class HearingService {

    private final HearingRepository hearingRepository;
    private final TransformerProperties properties;
    private final Producer producer;
    private final CaseRepository caseRepository;

    public HearingDetails processAndUpdateHearings(Hearing hearing) {
        String cino = hearing.getCnrNumbers().get(0);
        List<HearingDetails> hearingDetails = hearingRepository.getHearingDetailsByCino(cino);

        // ✅ Check if this hearing already exists
        boolean alreadyExists = hearingDetails.stream()
                .anyMatch(h -> h.getHearingId() != null && h.getHearingId().equals(hearing.getHearingId()));

        if (alreadyExists) {
            log.info("Hearing with ID {} already exists for CINO {}. Skipping insert.", hearing.getHearingId(), cino);
           HearingDetails existingHearings = hearingDetails.stream()
                    .filter(h -> h.getHearingId() != null && h.getHearingId().equals(hearing.getHearingId()))
                    .findFirst()
                    .orElse(null);
           if(existingHearings != null) {
               existingHearings.setBusiness(hearing.getHearingSummary());
               producer.push("save-hearing-details", existingHearings);
               return existingHearings;
           }
        }

        // Determine the next max values for id and sr_no
        int nextId = hearingDetails.stream()
                .mapToInt(HearingDetails::getId)
                .max()
                .orElse(0) + 1;

        int nextSrNo = hearingDetails.stream()
                .mapToInt(HearingDetails::getSrNo)
                .max()
                .orElse(0) + 1;

        JudgeDetails judgeDetails = caseRepository.getJudge(hearing.getPresidedBy().getJudgeID().get(0));
        DesignationMaster designationMaster = caseRepository.getDesignationMaster(JUDGE_DESIGNATION);

        // Create new hearing detail
        HearingDetails newHearingDetail = HearingDetails.builder()
                .cino(cino)
                .srNo(nextSrNo)
                .desgName(designationMaster.getDesgName())
                .hearingDate(formatDate(hearing.getStartTime()))
                .nextDate(null) // will be updated for previous hearing
                .purposeOfListing(String.valueOf(hearingRepository.getHearingPurposeCode(hearing)))
                .judgeCode(judgeDetails != null ? judgeDetails.getJudgeCode().toString() : "")
                .joCode(judgeDetails != null ? judgeDetails.getJocode() : "")
                .desgCode(designationMaster.getDesgCode().toString())
                .hearingId(hearing.getHearingId())
                .business(hearing.getHearingSummary())
                .courtNo(properties.getCourtNumber())
                .build();

        // Update previous hearing's nextDate
        hearingDetails.stream()
                .max(Comparator.comparing(HearingDetails::getHearingDate)) // get the latest hearing before this one
                .ifPresent(prevHearing -> {
                    prevHearing.setNextDate(formatDate(hearing.getStartTime())); // set nextDate as new hearing date
                    producer.push("save-hearing-details", prevHearing); // push updated previous hearing
                    log.info("Updated previous hearing with ID {} for CINO {} with nextDate {}",
                            prevHearing.getHearingId(), cino, prevHearing.getNextDate());
                });

        // Push new hearing
        producer.push("save-hearing-details", newHearingDetail);
        log.info("Added new hearing detail with hearingId {} for CINO {}", hearing.getHearingId(), cino);
        return newHearingDetail;
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
