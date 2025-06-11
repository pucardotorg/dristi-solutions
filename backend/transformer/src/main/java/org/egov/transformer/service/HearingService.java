package org.egov.transformer.service;

import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import org.egov.common.contract.request.RequestInfo;
import org.egov.transformer.config.TransformerProperties;
import org.egov.transformer.models.*;
import org.egov.transformer.producer.TransformerProducer;
import org.egov.transformer.util.JsonUtil;
import org.egov.transformer.util.MdmsUtil;
import org.jetbrains.annotations.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.*;

import static org.egov.transformer.config.ServiceConstants.*;

@Slf4j
@Service
public class HearingService {

    private final TransformerProducer producer;
    private final CaseService caseService;
    private final TransformerProperties properties;
    private final JsonUtil jsonUtil;
    private final MdmsUtil mdmsUtil;

    @Autowired
    public HearingService(TransformerProducer producer, CaseService caseService, TransformerProperties properties, JsonUtil jsonUtil, MdmsUtil mdmsUtil) {
        this.producer = producer;
        this.caseService = caseService;
        this.properties = properties;
        this.jsonUtil = jsonUtil;
        this.mdmsUtil = mdmsUtil;
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
        pushHearingToLegacy(hearingRequest);
    }

    public void enrichOpenHearings(HearingRequest hearingRequest) {
        Hearing hearing = hearingRequest.getHearing();
        RequestInfo requestInfo = hearingRequest.getRequestInfo();
        CourtCase courtCase = caseService.getCase(hearing.getFilingNumber().get(0), hearing.getTenantId(), requestInfo);
        log.info("Enriching Hearing for caseReferenceNumber: {}", hearing.getCaseReferenceNumber());
        OpenHearing openHearing = getOpenHearing(requestInfo,hearing, courtCase);
        producer.push(properties.getOpenHearingTopic(), openHearing);
    }

    @NotNull
    private OpenHearing getOpenHearing(RequestInfo requestInfo, Hearing hearing, CourtCase courtCase) {

        List<AdvocateMapping> representatives = courtCase.getRepresentatives();

        Advocate advocate = getAdvocates(representatives, hearing);

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
        openHearing.setCaseFilingDate(courtCase.getFilingDate());
        openHearing.setAdvocate(advocate);
        openHearing.setHearingType(hearing.getHearingType());
        openHearing.setSearchableFields(getSearchableFields(advocate, hearing, courtCase));
        openHearing.setHearingDurationInMillis(hearing.getHearingDurationInMillis());

        enrichOrderFields(requestInfo,openHearing);

        return openHearing;
    }

    private void enrichOrderFields(RequestInfo requestInfo, OpenHearing openHearing) {

        // fetch status and its priority from mdms

        Map<String, Map<String, JSONArray>> hearingStatusData =
                mdmsUtil.fetchMdmsData(requestInfo, openHearing.getTenantId(),
                        HEARING_MODULE_NAME,
                        Collections.singletonList(HEARING_STATUS_MASTER_NAME));
        JSONArray hearingStatusJsonArray = hearingStatusData.get(HEARING_MODULE_NAME).get(HEARING_STATUS_MASTER_NAME);

        for (Object hearingStatusObject : hearingStatusJsonArray) {

            String status = jsonUtil.getNestedValue(hearingStatusObject, List.of("status"), String.class);
            if (openHearing.getStatus().equalsIgnoreCase(status)) {
                Integer priority = jsonUtil.getNestedValue(hearingStatusObject, List.of("priority"), Integer.class);
                openHearing.setStatusOrder(priority);
                break;
            }
        }
        // fetch hearing type and its priority from mdms

        Map<String, Map<String, JSONArray>> defaultHearingsData =
                mdmsUtil.fetchMdmsData(requestInfo, openHearing.getTenantId(),
                        DEFAULT_COURT_MODULE_NAME,
                        Collections.singletonList(DEFAULT_HEARING_MASTER_NAME));
        JSONArray hearingTypeJsonArray = defaultHearingsData.get(DEFAULT_COURT_MODULE_NAME).get(DEFAULT_HEARING_MASTER_NAME);


        for (Object hearingTypeObject : hearingTypeJsonArray) {

            String hearingType = jsonUtil.getNestedValue(hearingTypeObject, List.of("hearingType"), String.class);
            if (openHearing.getHearingType().equalsIgnoreCase(hearingType)) {
                Integer priority = jsonUtil.getNestedValue(hearingTypeObject, List.of("priority"), Integer.class);
                openHearing.setHearingTypeOrder(priority);
                break;
            }
        }


    }

    private List<String> getSearchableFields(Advocate advocate, Hearing hearing, CourtCase courtCase) {

        List<String> searchableFields = new ArrayList<>();
        searchableFields.addAll(advocate.getComplainant());
        searchableFields.addAll(advocate.getAccused());
        searchableFields.add(courtCase.getCaseTitle());
        searchableFields.addAll(hearing.getFilingNumber());
        if (hearing.getCmpNumber() != null) searchableFields.add(hearing.getCmpNumber());
        if (hearing.getCourtCaseNumber() != null) searchableFields.add(hearing.getCourtCaseNumber());
        return searchableFields;

    }

    private Advocate getAdvocates(List<AdvocateMapping> representatives, Hearing hearing) {

        List<String> complainantNames = new ArrayList<>();
        List<String> accusedNames = new ArrayList<>();

        Advocate advocate = Advocate.builder().build();
        advocate.setComplainant(complainantNames);
        advocate.setAccused(accusedNames);

        if (representatives != null) {
            for (AdvocateMapping representative : representatives) {
                if (representative != null && representative.getAdditionalDetails() != null) {
                    Object additionalDetails = representative.getAdditionalDetails();
                    String advocateName = jsonUtil.getNestedValue(additionalDetails, List.of("advocateName"), String.class);
                    if (advocateName != null && !advocateName.isEmpty()) {
                        List<Party> representingList = Optional.ofNullable(representative.getRepresenting())
                                .orElse(Collections.emptyList());
                        if (!representingList.isEmpty()) {
                            Party first = representingList.get(0);
                            if (first.getPartyType() != null && first.getPartyType().contains("complainant")) {
                                complainantNames.add(advocateName);
                            } else {
                                accusedNames.add(advocateName);
                            }
                        }
                    }
                }
            }
        }

        return advocate;

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

    public void pushHearingToLegacy(HearingRequest hearingRequest) {
        HearingResponse hearingResponse = new HearingResponse();
        List<Hearing> hearingList = new ArrayList<>();
        hearingList.add(hearingRequest.getHearing());
        hearingResponse.setHearingList(hearingList);
        producer.push("hearing-legacy-topic", hearingResponse);
    }

}
