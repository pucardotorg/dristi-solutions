package org.egov.transformer.service;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.transformer.config.TransformerProperties;
import org.egov.transformer.models.CourtCase;
import org.egov.transformer.models.Hearing;
import org.egov.transformer.models.HearingRequest;
import org.egov.transformer.models.OpenHearing;
import org.egov.transformer.producer.TransformerProducer;
import org.jetbrains.annotations.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.Objects;

import static org.egov.transformer.config.ServiceConstants.*;

@Slf4j
@Service
public class HearingService {

    private final TransformerProducer producer;
    private final CaseService caseService;
    private final TransformerProperties properties;

    @Autowired
    public HearingService(TransformerProducer producer, CaseService caseService, TransformerProperties properties) {
        this.producer = producer;
        this.caseService = caseService;
        this.properties = properties;
    }

    public void addCaseDetailsToHearing(Hearing hearing, String topic) throws IOException {

        CourtCase courtCase = caseService.fetchCase(hearing.getFilingNumber().get(0));

        hearing.setFilingDate(courtCase.getFilingDate());
        hearing.setRegistrationDate(courtCase.getRegistrationDate());
        hearing.setStage(courtCase.getStage());
        hearing.setSubstage(courtCase.getSubstage());

        HearingRequest hearingRequest = new HearingRequest();
        hearingRequest.setHearing(hearing);
        producer.push(properties.getSaveHearingTopic(), hearingRequest);
        producer.push("hearing-legacy-topic", hearingRequest);
    }

    public void enrichOpenHearings(HearingRequest hearingRequest) {
        Hearing hearing = hearingRequest.getHearing();
        RequestInfo requestInfo = hearingRequest.getRequestInfo();
        CourtCase courtCase = caseService.getCase(hearing.getFilingNumber().get(0), hearing.getTenantId(), requestInfo);
        log.info("Enriching Hearing for caseReferenceNumber: {}", hearing.getCaseReferenceNumber());
        OpenHearing openHearing = getOpenHearing(hearing, courtCase);
        producer.push(properties.getOpenHearingTopic(), openHearing);
    }

    @NotNull
    private OpenHearing getOpenHearing(Hearing hearing, CourtCase courtCase) {
        OpenHearing openHearing = new OpenHearing();
        openHearing.setHearingUuid(hearing.getId().toString());
        openHearing.setHearingNumber(hearing.getHearingId());
        openHearing.setFilingNumber(hearing.getFilingNumber().get(0));
        openHearing.setCaseTitle(courtCase.getCaseTitle());
        openHearing.setCaseNumber(enrichCaseNumber(hearing, courtCase));
        openHearing.setStage(courtCase.getStage());
        openHearing.setSubStage(courtCase.getSubstage());
        openHearing.setCaseUuid(courtCase.getId().toString());
        openHearing.setStatus(hearing.getStatus());
        openHearing.setTenantId(hearing.getTenantId());
        openHearing.setFromDate(hearing.getStartTime());
        openHearing.setToDate(hearing.getEndTime());
        openHearing.setCourtId(courtCase.getCourtId());
        return openHearing;
    }

    private String enrichCaseNumber(Hearing hearing, CourtCase courtCase) {
        String caseRefNumber = hearing.getCaseReferenceNumber();

        if (caseRefNumber != null && !caseRefNumber.isEmpty()) {
            return caseRefNumber;
        }

        String courtCaseNumber = courtCase.getCourtCaseNumber();
        return (courtCaseNumber != null && !courtCaseNumber.isEmpty())
                ? courtCaseNumber
                : courtCase.getCmpNumber();
    }
}
