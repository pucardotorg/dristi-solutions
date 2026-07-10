package org.egov.transformer.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.constraints.NotNull;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import org.egov.common.contract.request.RequestInfo;
import org.egov.transformer.config.TransformerProperties;
import org.egov.transformer.models.*;
import org.egov.transformer.models.inbox.InboxRequest;
import org.egov.transformer.producer.TransformerProducer;
import org.egov.transformer.repository.ServiceRequestRepository;
import org.egov.transformer.util.AdvocateUtil;
import org.egov.transformer.util.InboxUtil;
import org.egov.transformer.util.JsonUtil;
import org.egov.transformer.util.MdmsUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

import static org.egov.transformer.config.ServiceConstants.*;

@Slf4j
@Service
public class HearingService {

    private final TransformerProducer producer;
    private final CaseService caseService;
    private final TransformerProperties properties;
    private final JsonUtil jsonUtil;
    private final MdmsUtil mdmsUtil;
    private final ServiceRequestRepository serviceRequestRepository;
    private final ObjectMapper objectMapper;
    private final AdvocateUtil advocateUtil;
    private final InboxUtil inboxUtil;

    @Autowired
    public HearingService(TransformerProducer producer, CaseService caseService, TransformerProperties properties, JsonUtil jsonUtil, MdmsUtil mdmsUtil, org.egov.transformer.repository.ServiceRequestRepository serviceRequestRepository, ObjectMapper objectMapper, AdvocateUtil advocateUtil, InboxUtil inboxUtil) {
        this.producer = producer;
        this.caseService = caseService;
        this.properties = properties;
        this.jsonUtil = jsonUtil;
        this.mdmsUtil = mdmsUtil;
        this.serviceRequestRepository = serviceRequestRepository;
        this.objectMapper = objectMapper;
        this.advocateUtil = advocateUtil;
        this.inboxUtil = inboxUtil;
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

    public void enrichOpenHearings(HearingRequest hearingRequest,boolean isCreateHearing) {
        Hearing hearing = hearingRequest.getHearing();
        RequestInfo requestInfo = hearingRequest.getRequestInfo();
        CourtCase courtCase = caseService.getCase(hearing.getFilingNumber().get(0), hearing.getTenantId(), requestInfo);
        log.info("Enriching Hearing for caseReferenceNumber: {}", hearing.getCaseReferenceNumber());
        OpenHearing openHearing = getOpenHearing(requestInfo,hearing, courtCase,isCreateHearing);
        producer.push(properties.getOpenHearingTopic(), openHearing);
    }

    @NotNull
    private OpenHearing getOpenHearing(RequestInfo requestInfo, Hearing hearing, CourtCase courtCase,boolean isCreateHearing) {

        List<AdvocateMapping> representatives = courtCase.getRepresentatives();
        List<Party> litigants = courtCase.getLitigants();
        List<POAHolder> poaHolders = courtCase.getPoaHolders();

        Advocate advocate = getAdvocates(representatives, courtCase.getLitigants(), requestInfo);

        OpenHearing openHearing = new OpenHearing();
        openHearing.setHearingUuid(hearing.getId().toString());
        openHearing.setHearingNumber(hearing.getHearingId());
        openHearing.setFilingNumber(hearing.getFilingNumber().get(0));
        openHearing.setCaseTitle(courtCase.getCaseTitle());
        // Resolve the case number from a Redis-first metadata lookup (cache hit avoids the DB
        // case body; miss falls back to dristi_cases) rather than the search-sourced courtCase.
        // Kept non-fatal: a failure here must not drop the rest of the open-hearing enrichment.
        CaseMeta caseMeta = null;
        try {
            caseMeta = caseService.getCaseMeta(hearing.getFilingNumber().get(0), hearing.getTenantId(), requestInfo);
        } catch (Exception ex) {
            log.error("Error fetching case meta for filingNumber: {}, hearingId: {}; will fall back to hearing case reference number",
                    hearing.getFilingNumber().get(0), hearing.getHearingId(), ex);
        }
        openHearing.setCaseNumber(enrichCaseNumber(hearing, caseMeta));
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
        openHearing.setSearchableFields(getSearchableFields(advocate, hearing, litigants, poaHolders, courtCase));
        openHearing.setHearingDurationInMillis(hearing.getHearingDurationInMillis());
        if(isCreateHearing){
            openHearing.setOrderStatus(OrderStatus.NOT_CREATED);
        }

        InboxRequest inboxRequest = inboxUtil.getInboxRequestForOpenHearing(courtCase.getCourtId(), hearing.getId().toString() );
        List<OpenHearing> openHearingList = null;
        try {
            openHearingList = inboxUtil.getInboxEntities(inboxRequest, OPEN_HEARING_INDEX_BUSINESS_OBJECT_KEY, OpenHearing.class);
        } catch (Exception ex) {
            log.error("Error while getting open hearings: {}, for hearingId: {}", ex.getMessage(),openHearing.getHearingUuid(), ex);
        }
        if(openHearingList != null && !openHearingList.isEmpty()) {
            if(openHearingList.get(0).getSerialNumber() > 0) {
                openHearing.setSerialNumber(openHearingList.get(0).getSerialNumber());
            }
            if(openHearingList.get(0).getOrderStatus() !=null && !openHearingList.get(0).getOrderStatus().toString().isEmpty() ) {
                openHearing.setOrderStatus(openHearingList.get(0).getOrderStatus());
            }
        }

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

    private List<String> getSearchableFields(Advocate advocate, Hearing hearing, List<Party> litigants, List<POAHolder> poaHolders, CourtCase courtCase) {

        List<String> searchableFields = new ArrayList<>();
        searchableFields.addAll(advocate.getComplainant());
        searchableFields.addAll(advocate.getAccused());
        searchableFields.addAll(advocate.getIndividualIds());

        List<Party> litigantList = Optional.ofNullable(litigants).orElse(Collections.emptyList());
        for (Party party : litigantList) {
            if (party.getIndividualId() != null && !party.getIndividualId().isEmpty()) {
                searchableFields.add(party.getIndividualId());
            }
        }

        List<POAHolder> poaHolderList = Optional.ofNullable(poaHolders).orElse(Collections.emptyList());
        for (POAHolder poaHolder : poaHolderList) {
            if (poaHolder.getIndividualId() != null && !poaHolder.getIndividualId().isEmpty()) {
                searchableFields.add(poaHolder.getIndividualId());
            }
        }
        searchableFields.add(courtCase.getCaseTitle());
        searchableFields.addAll(hearing.getFilingNumber());
        if (hearing.getCmpNumber() != null) searchableFields.add(hearing.getCmpNumber());
        if (hearing.getCourtCaseNumber() != null) searchableFields.add(hearing.getCourtCaseNumber());
        if (LifecycleStatus.LPR.equals(courtCase.getLifecycleStatus()) && courtCase.getLprNumber() != null) {
            searchableFields.add(courtCase.getLprNumber());
        }
        return searchableFields;

    }


    public Advocate getAdvocates(List<AdvocateMapping> representatives, List<Party> litigants, RequestInfo requestInfo) {

        List<String> complainantNames = new ArrayList<>();
        List<String> accusedNames = new ArrayList<>();
        Set<String> advocateIds = new HashSet<>();
        Set<String> individualIds = new HashSet<>();
        Set<String> advocateIndividualIds = new HashSet<>();

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

            advocateIds =  representatives.stream()
                    .map(AdvocateMapping::getAdvocateId)
                    .collect(Collectors.toSet());

            if (!advocateIds.isEmpty()) {
                advocateIndividualIds = advocateUtil.getAdvocate(requestInfo, advocateIds.stream().toList());
            }

        }

        if (litigants != null) {
            individualIds = litigants.stream()
                    .map(Party::getIndividualId)
                    .collect(Collectors.toSet());
        }

        if (!advocateIndividualIds.isEmpty()) {
            individualIds.addAll(advocateIndividualIds);
        }

        advocate.setIndividualIds(new ArrayList<>(individualIds));

        return advocate;

    }

    private String enrichCaseNumber(Hearing hearing, CaseMeta caseMeta) {

        String filingNumber = hearing.getFilingNumber() != null && !hearing.getFilingNumber().isEmpty()
                ? hearing.getFilingNumber().get(0) : null;

        // caseMeta comes from the Redis-first metadata lookup. If it could not be resolved at all,
        // fall back to the (possibly stale) value carried on the hearing event.
        if (caseMeta == null) {
            log.warn("No case metadata resolved (Redis/DB) for filingNumber: {}; falling back to "
                    + "hearing.caseReferenceNumber: {}, for hearingId: {}",
                    filingNumber, hearing.getCaseReferenceNumber(), hearing.getHearingId());
            return hearing.getCaseReferenceNumber();
        }

        // Log the candidate values up front so that if an open hearing ends up with an unexpected
        // case number, we can tell from the logs which source was available and which branch won.
        log.info("Enriching open-hearing case number for hearingId: {}, filingNumber: {} | lifecycleStatus: {}, "
                        + "lprNumber: {}, courtCaseNumber: {}, cmpNumber: {}, hearing.caseReferenceNumber: {}",
                hearing.getHearingId(),
                filingNumber,
                caseMeta.getLifecycleStatus(),
                caseMeta.getLprNumber(),
                caseMeta.getCourtCaseNumber(),
                caseMeta.getCmpNumber(),
                hearing.getCaseReferenceNumber());

        if (LifecycleStatus.LPR.equals(caseMeta.getLifecycleStatus())) {
            log.info("Resolved case number from lprNumber (LPR lifecycle): {}, for hearingId: {}",
                    caseMeta.getLprNumber(), hearing.getHearingId());
            return caseMeta.getLprNumber();
        }

        // Prefer the live case, as hearing events can arrive stale/out-of-order and clobber
        // a corrected case number in the open-hearing index. Fall back to the (possibly stale)
        // value on the hearing event only when the live case has neither number.
        String courtCaseNumber = caseMeta.getCourtCaseNumber();
        if (courtCaseNumber != null && !courtCaseNumber.isEmpty()) {
            log.info("Resolved case number from courtCaseNumber: {}, for hearingId: {}",
                    courtCaseNumber, hearing.getHearingId());
            return courtCaseNumber;
        }

        String cmpNumber = caseMeta.getCmpNumber();
        if (cmpNumber != null && !cmpNumber.isEmpty()) {
            log.info("Resolved case number from cmpNumber: {}, for hearingId: {}",
                    cmpNumber, hearing.getHearingId());
            return cmpNumber;
        }

        // Live case has neither number; fall back to the (possibly stale) value on the hearing event.
        log.warn("Live court case has no courtCaseNumber/cmpNumber; falling back to hearing.caseReferenceNumber: {}, "
                + "for hearingId: {}", hearing.getCaseReferenceNumber(), hearing.getHearingId());
        return hearing.getCaseReferenceNumber();
    }

    public void pushHearingToLegacy(HearingRequest hearingRequest) {
        HearingResponse hearingResponse = new HearingResponse();
        List<Hearing> hearingList = new ArrayList<>();
        hearingList.add(hearingRequest.getHearing());
        hearingResponse.setHearingList(hearingList);
        producer.push("hearing-legacy-topic", hearingResponse);
    }
}
