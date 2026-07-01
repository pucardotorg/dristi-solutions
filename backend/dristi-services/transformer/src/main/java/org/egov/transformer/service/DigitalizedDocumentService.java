package org.egov.transformer.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.transformer.models.AdvocateMapping;
import org.egov.transformer.models.CourtCase;
import org.egov.transformer.models.POAHolder;
import org.egov.transformer.models.Party;
import org.egov.transformer.models.PoaParty;
import org.egov.transformer.models.digitalized_document.DigitalizedDocument;
import org.egov.transformer.models.digitalized_document.DigitalizedDocumentRequest;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.egov.transformer.config.ServiceConstants.ACCUSED_PARTY_TYPE;
import static org.egov.transformer.config.ServiceConstants.COMPLAINANT_PARTY_TYPE;
import static org.egov.transformer.config.ServiceConstants.COMPLETED;
import static org.egov.transformer.config.ServiceConstants.DELETED_DRAFT;
import static org.egov.transformer.config.ServiceConstants.DRAFT_IN_PROGRESS;
import static org.egov.transformer.config.ServiceConstants.EXAMINATION_APPROVER;
import static org.egov.transformer.config.ServiceConstants.EXAMINATION_CREATOR;
import static org.egov.transformer.config.ServiceConstants.EXAMINATION_SIGNER;
import static org.egov.transformer.config.ServiceConstants.EXAMINATION_VIEWER;
import static org.egov.transformer.config.ServiceConstants.MEDIATION_APPROVER;
import static org.egov.transformer.config.ServiceConstants.MEDIATION_CREATOR;
import static org.egov.transformer.config.ServiceConstants.MEDIATION_SIGNER;
import static org.egov.transformer.config.ServiceConstants.MEDIATION_VIEWER;
import static org.egov.transformer.config.ServiceConstants.PENDING_E_SIGN;
import static org.egov.transformer.config.ServiceConstants.PENDING_REVIEW;
import static org.egov.transformer.config.ServiceConstants.PENDING_UPLOAD;
import static org.egov.transformer.config.ServiceConstants.PLEA_APPROVER;
import static org.egov.transformer.config.ServiceConstants.PLEA_CREATOR;
import static org.egov.transformer.config.ServiceConstants.PLEA_SIGNER;
import static org.egov.transformer.config.ServiceConstants.PLEA_VIEWER;

@Component
@Slf4j
public class DigitalizedDocumentService {

    private final CaseService caseService;
    private final ObjectMapper objectMapper;

    public DigitalizedDocumentService(CaseService caseService, ObjectMapper objectMapper) {
        this.caseService = caseService;
        this.objectMapper = objectMapper;
    }

    public void enrichDigitalizedDocument(DigitalizedDocumentRequest request){
        DigitalizedDocument digitalizedDocument = request.getDigitalizedDocument();
        RequestInfo requestInfo = request.getRequestInfo();
        String filingNumber = digitalizedDocument.getCaseFilingNumber();
        String tenantId = digitalizedDocument.getTenantId();

        CourtCase courtCase = caseService.getCase(filingNumber, tenantId, requestInfo);
        String cmpNumber = courtCase.getCmpNumber();
        String stNumber = courtCase.getCourtCaseNumber();
        // Enriched in document for pdf generation
        String caseNumber = stNumber != null ? stNumber : cmpNumber;
        String caseTitle = courtCase.getCaseTitle();
        digitalizedDocument.setCaseNumber(caseNumber);
        digitalizedDocument.setCaseName(caseTitle);
        digitalizedDocument.setCaseTitle(caseTitle + ", " + caseNumber);

        List<String> searchableFields = new ArrayList<>();
        searchableFields.add(digitalizedDocument.getCaseTitle());
        searchableFields.add(filingNumber);
        if(digitalizedDocument.getDocuments() != null && !digitalizedDocument.getDocuments().isEmpty()) {
            String documentName = digitalizedDocument.getDocuments().get(0).getDocumentName();
            digitalizedDocument.setTitle(documentName);
        }
        digitalizedDocument.setSearchableFields(searchableFields);

        if(DELETED_DRAFT.equalsIgnoreCase(digitalizedDocument.getStatus())){
            // if the document is deleted, no one should be able to access it
            digitalizedDocument.setAssignedRoles(Collections.emptyList());
            digitalizedDocument.setAssignedTo(Collections.emptyList());
            return;
        }

        switch (digitalizedDocument.getType()){
            case EXAMINATION_OF_ACCUSED -> {
                enrichAssignedRolesForExamination(digitalizedDocument);
                enrichAssignedToForExamination(digitalizedDocument, courtCase);
            }
            case PLEA -> {
                enrichAssignedRolesForPlea(digitalizedDocument);
                enrichAssignedToForPlea(digitalizedDocument, courtCase);
            }
            case MEDIATION -> {
                enrichAssignedRolesForMediation(digitalizedDocument);
                enrichAssignedToForMediation(digitalizedDocument, courtCase);
            }
        }

    }

    public void enrichAssignedRolesForExamination(DigitalizedDocument digitalizedDocument){
        List<String> assignedRoles = new ArrayList<>(Arrays.asList(EXAMINATION_CREATOR, EXAMINATION_VIEWER));
        String status = digitalizedDocument.getStatus();
        log.info("Enriching assigned roles for examination document {} for status {}", digitalizedDocument.getDocumentNumber(), status);
        switch (status) {
            case DRAFT_IN_PROGRESS -> {} // required roles are already present
            case PENDING_E_SIGN -> assignedRoles.add(EXAMINATION_SIGNER);
            case PENDING_REVIEW, COMPLETED -> assignedRoles.add(EXAMINATION_APPROVER);
            default -> {}
        }
        digitalizedDocument.setAssignedRoles(assignedRoles);
    }

    public void enrichAssignedToForExamination(DigitalizedDocument digitalizedDocument, CourtCase courtCase){
        List<String> assignedTo = new ArrayList<>();
        String status = digitalizedDocument.getStatus();
        log.info("Enriching assigned to for examination document {} for status {}", digitalizedDocument.getDocumentNumber(), status);

        List<String> accusedUUIDs = new ArrayList<>();
        List<String> accusedAdvocateUUIDs;
        List<String> accusedPoaUUIDs;

        List<String> complainantUUIDs = new ArrayList<>();
        List<String> complainantAdvocateUUIDs = new ArrayList<>();
        List<String> complainantPoaUUIDs = new ArrayList<>();

        if(COMPLETED.equals(digitalizedDocument.getStatus())){
            // all accused parties should have access
            accusedUUIDs = getLitigantUUIDsForParty(courtCase.getLitigants(), ACCUSED_PARTY_TYPE);

            // all complainant parties should have access
            complainantUUIDs = getLitigantUUIDsForParty(courtCase.getLitigants(), COMPLAINANT_PARTY_TYPE);
            complainantAdvocateUUIDs = getAdvocateUUIDSFromLitigantUUIDs(courtCase, complainantUUIDs);
            complainantPoaUUIDs = getPOAUUIDsFromLitigantUUIDs(courtCase, complainantUUIDs);
        }
        else {
            // only the accused party for whom examination document was raised should have access in other stages
            String accusedUniqueId = digitalizedDocument.getExaminationOfAccusedDetails().getAccusedUniqueId();
            String accusedUUID = getAccusedUUIDFromUniqueId(courtCase, accusedUniqueId);
            if(accusedUUID != null){
                accusedUUIDs.add(accusedUUID);
            }

            // no complainant parties should have access in other stages
        }

        accusedAdvocateUUIDs = getAdvocateUUIDSFromLitigantUUIDs(courtCase, accusedUUIDs);
        accusedPoaUUIDs = getPOAUUIDsFromLitigantUUIDs(courtCase, accusedUUIDs);


        switch (status){
            case DRAFT_IN_PROGRESS -> {} // citizens do not have access in this stage
            case PENDING_E_SIGN, PENDING_REVIEW -> {
                assignedTo.addAll(accusedUUIDs);
                assignedTo.addAll(accusedAdvocateUUIDs);
                assignedTo.addAll(accusedPoaUUIDs);
            }
            case COMPLETED -> {
                assignedTo.addAll(accusedUUIDs);
                assignedTo.addAll(accusedAdvocateUUIDs);
                assignedTo.addAll(accusedPoaUUIDs);
                assignedTo.addAll(complainantUUIDs);
                assignedTo.addAll(complainantAdvocateUUIDs);
                assignedTo.addAll(complainantPoaUUIDs);
            }
            default -> {}
        }
        digitalizedDocument.setAssignedTo(assignedTo);
    }

    public void enrichAssignedRolesForPlea(DigitalizedDocument digitalizedDocument){
        List<String> assignedRoles = new ArrayList<>(Arrays.asList(PLEA_CREATOR, PLEA_VIEWER));
        String status = digitalizedDocument.getStatus();
        log.info("Enriching assigned roles for plea document {} for status {}", digitalizedDocument.getDocumentNumber(), status);
        switch (status) {
            case DRAFT_IN_PROGRESS -> {} // required roles are already present
            case PENDING_E_SIGN -> assignedRoles.add(PLEA_SIGNER);
            case PENDING_REVIEW, COMPLETED -> assignedRoles.add(PLEA_APPROVER);
            default -> {}
        }
        digitalizedDocument.setAssignedRoles(assignedRoles);
    }

    public void enrichAssignedToForPlea(DigitalizedDocument digitalizedDocument, CourtCase courtCase){
        List<String> assignedTo = new ArrayList<>();
        String status = digitalizedDocument.getStatus();
        log.info("Enriching assigned to for plea document {} for status {}", digitalizedDocument.getDocumentNumber(), status);

        List<String> accusedUUIDs = new ArrayList<>();
        List<String> accusedAdvocateUUIDs;
        List<String> accusedPoaUUIDs;

        List<String> complainantUUIDs = new ArrayList<>();
        List<String> complainantAdvocateUUIDs = new ArrayList<>();
        List<String> complainantPoaUUIDs = new ArrayList<>();

        if(COMPLETED.equals(digitalizedDocument.getStatus())){
            // all accused parties should have access in this stage
            accusedUUIDs = getLitigantUUIDsForParty(courtCase.getLitigants(), ACCUSED_PARTY_TYPE);

            // all complainant parties should have access in this stage
            complainantUUIDs = getLitigantUUIDsForParty(courtCase.getLitigants(), COMPLAINANT_PARTY_TYPE);
            complainantAdvocateUUIDs = getAdvocateUUIDSFromLitigantUUIDs(courtCase, complainantUUIDs);
            complainantPoaUUIDs = getPOAUUIDsFromLitigantUUIDs(courtCase, complainantUUIDs);
        }
        else {
            // only the party for whom examination document was raised should have access in other stages
            String accusedUniqueId = digitalizedDocument.getPleaDetails().getAccusedUniqueId();
            String accusedUUID = getAccusedUUIDFromUniqueId(courtCase, accusedUniqueId);
            if(accusedUUID != null){
                accusedUUIDs.add(accusedUUID);
            }

            // no complainant parties should have access other stages
        }
        accusedAdvocateUUIDs = getAdvocateUUIDSFromLitigantUUIDs(courtCase, accusedUUIDs);
        accusedPoaUUIDs = getPOAUUIDsFromLitigantUUIDs(courtCase, accusedUUIDs);

        switch (status){
            case DRAFT_IN_PROGRESS -> {} // citizens do not have access in this stage
            case PENDING_E_SIGN, PENDING_REVIEW-> {
                assignedTo.addAll(accusedUUIDs);
                assignedTo.addAll(accusedAdvocateUUIDs);
                assignedTo.addAll(accusedPoaUUIDs);
            }
            case COMPLETED -> {
                assignedTo.addAll(accusedUUIDs);
                assignedTo.addAll(accusedAdvocateUUIDs);
                assignedTo.addAll(accusedPoaUUIDs);
                assignedTo.addAll(complainantUUIDs);
                assignedTo.addAll(complainantAdvocateUUIDs);
                assignedTo.addAll(complainantPoaUUIDs);
            }
            default -> {}
        }
        digitalizedDocument.setAssignedTo(assignedTo);
    }

    public void enrichAssignedRolesForMediation(DigitalizedDocument digitalizedDocument){
        List<String> assignedRoles = new ArrayList<>(Arrays.asList(MEDIATION_CREATOR, MEDIATION_VIEWER));
        String status = digitalizedDocument.getStatus();
        log.info("Enriching assigned roles for mediation document {} for status {}", digitalizedDocument.getDocumentNumber(), status);
        switch (status) {
            case DRAFT_IN_PROGRESS, PENDING_UPLOAD -> {} // required roles are already present
            case PENDING_E_SIGN -> assignedRoles.add(MEDIATION_SIGNER);
            case PENDING_REVIEW, COMPLETED -> assignedRoles.add(MEDIATION_APPROVER);
            default -> {}
        }
        digitalizedDocument.setAssignedRoles(assignedRoles);
    }

    public void enrichAssignedToForMediation(DigitalizedDocument digitalizedDocument, CourtCase courtCase){
        String status = digitalizedDocument.getStatus();
        log.info("Enriching assigned to for mediation document {} for status {}", digitalizedDocument.getDocumentNumber(), status);
        List<String> assignedTo = new ArrayList<>();

        List<String> accusedUUIDs = getLitigantUUIDsForParty(courtCase.getLitigants(), ACCUSED_PARTY_TYPE);
        List<String> accusedAdvocateUUIDs = getAdvocateUUIDSFromLitigantUUIDs(courtCase, accusedUUIDs);
        List<String> accusedPoaUUIDs = getPOAUUIDsFromLitigantUUIDs(courtCase, accusedUUIDs);

        List<String> complainantUUIDs = getLitigantUUIDsForParty(courtCase.getLitigants(), COMPLAINANT_PARTY_TYPE);
        List<String> complainantAdvocateUUIDs = getAdvocateUUIDSFromLitigantUUIDs(courtCase, complainantUUIDs);
        List<String> complainantPoaUUIDs = getPOAUUIDsFromLitigantUUIDs(courtCase, complainantUUIDs);

        switch (status){
            case DRAFT_IN_PROGRESS, PENDING_UPLOAD -> {} // citizens do not have access in this stage
            case PENDING_E_SIGN, PENDING_REVIEW, COMPLETED -> {
                assignedTo.addAll(accusedUUIDs);
                assignedTo.addAll(accusedAdvocateUUIDs);
                assignedTo.addAll(accusedPoaUUIDs);
                assignedTo.addAll(complainantUUIDs);
                assignedTo.addAll(complainantAdvocateUUIDs);
                assignedTo.addAll(complainantPoaUUIDs);
            }
            default -> {}
        }

        digitalizedDocument.setAssignedTo(assignedTo);
    }

    private List<String> getLitigantUUIDsForParty(List<Party> litigants, String partyType){
        List<String> litigantUUIDs = new ArrayList<>();
        for(Party litigant: litigants) {
            if(litigant.getPartyType().contains(partyType)){
                Object additionalDetails = litigant.getAdditionalDetails();
                JsonNode additionalDetailsNode = objectMapper.convertValue(additionalDetails, JsonNode.class);
                String uuid = additionalDetailsNode.path("uuid").asText();
                if (uuid.isEmpty()) {
                    log.error("UUID not found for litigant");
                    continue;
                }
                litigantUUIDs.add(uuid);
            }
        }

        return litigantUUIDs;
    }

    private String getAccusedUUIDFromUniqueId(CourtCase courtCase, String uniqueId){

        JsonNode caseAdditionalDetailsNode = objectMapper.convertValue(courtCase.getAdditionalDetails(), JsonNode.class);
        JsonNode respondentDetailsFormDataNode = caseAdditionalDetailsNode
                .path("respondentDetails")
                .path("formdata");

        if(!doesJsonNodeContainElements(respondentDetailsFormDataNode)){
            log.info("No respondents present in the case");
            return null;
        }

        for(JsonNode respondentNode: respondentDetailsFormDataNode){

            String respondentUniqueId = respondentNode.path("uniqueId").asText();

            if(respondentUniqueId.equals(uniqueId)){

                String individualId = respondentNode
                        .path("data")
                        .path("respondentVerification")
                        .path("individualDetails")
                        .path("individualId")
                        .asText();

                if(individualId.isEmpty()){
                    log.info("Accused has not yet joined the case");
                    return null;
                }

                List<String> uuids = courtCase.getLitigants().stream()
                        .filter(litigant -> individualId.equals(litigant.getIndividualId()))
                        .map(Party::getAdditionalDetails)
                        .map(additionalDetails -> objectMapper.convertValue(additionalDetails, JsonNode.class))
                        .map(additionalDetailsNode -> additionalDetailsNode.path("uuid").asText())
                        .toList();

                if(uuids.isEmpty()){
                    log.error("UniqueId {} does not map to any UUID in case {}", uniqueId, courtCase.getFilingNumber());
                    return null;
                }

                return uuids.get(0);
            }
        }

        return null;
    }

    private boolean doesJsonNodeContainElements(JsonNode node){
        return node!= null && !node.isNull() && node.isArray() && !node.isEmpty();
    }

    private List<String> getAdvocateUUIDSFromLitigantUUIDs(CourtCase courtCase, List<String> litigantUUIDs){
        List<AdvocateMapping> representatives = courtCase.getRepresentatives();
        if(representatives == null) return Collections.emptyList();

        List<String> advocateUUIDs = new ArrayList<>();
        for(AdvocateMapping advocateMapping: representatives) {
            Object advocateAdditionalDetails = advocateMapping.getAdditionalDetails();
            JsonNode advocateAdditionalDetailsNode = objectMapper.convertValue(advocateAdditionalDetails, JsonNode.class);
            String advocateUUID = advocateAdditionalDetailsNode.get("uuid").asText();
            List<Party> representingList = advocateMapping.getRepresenting();
            for(Party representing: representingList) {
                Object litigantAdditionalDetails = representing.getAdditionalDetails();
                JsonNode litigantAdditionalDetailsNode = objectMapper.convertValue(litigantAdditionalDetails, JsonNode.class);
                String litigantUUID = litigantAdditionalDetailsNode.get("uuid").asText();
                if(litigantUUIDs.contains(litigantUUID)) {
                    advocateUUIDs.add(advocateUUID);
                }
            }
        }
        return advocateUUIDs;
    }

    private List<String> getPOAUUIDsFromLitigantUUIDs(CourtCase courtCase, List<String> litigantUUIDs){
        List<POAHolder> poaHolders = courtCase.getPoaHolders();
        if(poaHolders == null) return Collections.emptyList();

        List<String> litigantIndividualIDs = getLitigantIndividualIDsFromUUIDs(courtCase, litigantUUIDs);
        List<String> poaUUIDs = new ArrayList<>();

        for(POAHolder poaHolder: poaHolders) {

            Object poaAdditionalDetails = poaHolder.getAdditionalDetails();
            JsonNode poaAdditionalDetailsNode = objectMapper.convertValue(poaAdditionalDetails, JsonNode.class);
            String poaUUID = poaAdditionalDetailsNode.path("uuid").asText();
            if (poaUUID.isEmpty()) {
                log.error("UUID not found for POA holder");
                continue;
            }

            for(PoaParty litigant: poaHolder.getRepresentingLitigants()){
                if(litigantIndividualIDs.contains(litigant.getIndividualId())){
                    poaUUIDs.add(poaUUID);
                }
            }
        }
        return poaUUIDs;


    }

    private List<String> getLitigantIndividualIDsFromUUIDs(CourtCase courtCase, List<String> litigantUUIDs){

        if(litigantUUIDs.isEmpty()) return Collections.emptyList();

        List<Party> litigants = courtCase.getLitigants();
        if(litigants == null) return Collections.emptyList();

        List<String> litigantIndividualIds = new ArrayList<>();

        for(Party litigant: litigants){

            Object litigantAdditionalDetails = litigant.getAdditionalDetails();
            JsonNode litigantAdditionalDetailsNode = objectMapper.convertValue(litigantAdditionalDetails, JsonNode.class);
            String litigantUUID = litigantAdditionalDetailsNode.path("uuid").asText();

            if(litigantUUIDs.contains(litigantUUID)){
                litigantIndividualIds.add(litigant.getIndividualId());
            }
        }

        return litigantIndividualIds;

    }
}
