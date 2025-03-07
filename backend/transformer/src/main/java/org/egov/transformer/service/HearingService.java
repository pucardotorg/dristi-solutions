package org.egov.transformer.service;

import lombok.extern.slf4j.Slf4j;
import org.egov.transformer.config.TransformerProperties;
import org.egov.transformer.models.CourtCase;
import org.egov.transformer.models.Hearing;
import org.egov.transformer.models.HearingRequest;
import org.egov.transformer.models.OpenHearing;
import org.egov.transformer.producer.TransformerProducer;
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
        enrichOpenHearings(hearing, courtCase);
        producer.push(properties.getSaveHearingTopic(), hearingRequest);
    }

    private void enrichOpenHearings(Hearing hearing, CourtCase courtCase) {
        if(!Objects.equals(hearing.getStatus(), HEARD) &&
                !Objects.equals(hearing.getStatus(), ADJOURNED) &&
                !Objects.equals(hearing.getStatus(), ABATED) &&
                !Objects.equals(hearing.getStatus(), CLOSED)) {
            OpenHearing openHearing = new OpenHearing();
            openHearing.setHearingUuid(hearing.getId().toString());
            openHearing.setHearingNumber(hearing.getHearingId());
            openHearing.setFilingNumber(hearing.getFilingNumber().get(0));
            openHearing.setCaseTitle(courtCase.getCaseTitle());
            openHearing.setCaseNumber(hearing.getCaseReferenceNumber());
            openHearing.setStage(courtCase.getStage());
            openHearing.setCaseUuid(courtCase.getId().toString());
            openHearing.setStatus(hearing.getStatus());
            openHearing.setTenantId(hearing.getTenantId());

            producer.push(properties.getOpenHearingTopic(), openHearing);
        }
    }
}
