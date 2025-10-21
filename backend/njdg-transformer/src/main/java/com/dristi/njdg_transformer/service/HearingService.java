package com.dristi.njdg_transformer.service;

import com.dristi.njdg_transformer.config.TransformerProperties;
import com.dristi.njdg_transformer.model.HearingDetails;
import com.dristi.njdg_transformer.model.JudgeDetails;
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
import java.util.List;

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

        //Determine the next max values for id
        int maxId = hearingDetails.stream()
                .mapToInt(HearingDetails::getId)
                .max()
                .orElse(0);

        int nextId = maxId + 1;

        //Determine the next max values for sr_no
        int maxSrNo = hearingDetails.stream()
                .mapToInt(HearingDetails::getSrNo)
                .max()
                .orElse(0);

        int nextSrNo = maxSrNo + 1;

        JudgeDetails judgeDetails = caseRepository.getJudge(hearing.getPresidedBy().getJudgeID().get(0));
        HearingDetails newHearingDetail = HearingDetails.builder()
                .id(nextId)
                .cino(cino)
                .srNo(nextSrNo)
                .desgName(properties.getJudgeDesignation())
                .hearingDate(formatDate(hearing.getStartTime()))
                .nextDate(null)//todo: configure from next order
                .purposeOfListing(String.valueOf(hearingRepository.getHearingPurposeCode(hearing)))
                .judgeCode(judgeDetails.getJudgeCode().toString())
                .joCode(judgeDetails.getJocode())
                .desgCode("1")//todo: get it from desg_type table
                .build();

        producer.push("save-hearing-details", newHearingDetail);
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
