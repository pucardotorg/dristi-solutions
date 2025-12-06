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

        List<String> accusedUUIDs = getLitigantUUIDS(courtCase, ACCUSED_PARTY_TYPE);
        List<String> accusedAdvocateUUIDs = getAdvocateUUIDS(courtCase, accusedUUIDs);
        List<String> accusedPoaUUIDs = getPOAUUIDs(courtCase, ACCUSED_PARTY_TYPE);

        List<String> complainantUUIDs = getLitigantUUIDS(courtCase, COMPLAINANT_PARTY_TYPE);
        List<String> complainantAdvocateUUIDs = getAdvocateUUIDS(courtCase, complainantUUIDs);
        List<String> complainantPoaUUIDs = getPOAUUIDs(courtCase, COMPLAINANT_PARTY_TYPE);


        switch (digitalizedDocument.getType()){
            case EXAMINATION_OF_ACCUSED -> {
                enrichAssignedRolesForExamination(digitalizedDocument);
                enrichAssignedToForExamination(digitalizedDocument, accusedUUIDs, accusedAdvocateUUIDs, accusedPoaUUIDs);
            }
            case PLEA -> {
                enrichAssignedRolesForPlea(digitalizedDocument);
                enrichAssignedToForPlea(digitalizedDocument, accusedUUIDs, accusedAdvocateUUIDs, accusedPoaUUIDs);
            }
            case MEDIATION -> {
                enrichAssignedRolesForMediation(digitalizedDocument);
                enrichAssignedToForMediation(digitalizedDocument, accusedUUIDs, accusedAdvocateUUIDs, accusedPoaUUIDs, complainantUUIDs, complainantAdvocateUUIDs, complainantPoaUUIDs);
            }
        }

    }

    public void enrichAssignedRolesForExamination(DigitalizedDocument digitalizedDocument){
        List<String> assignedRoles = new ArrayList<>(Arrays.asList(EXAMINATION_CREATOR, EXAMINATION_VIEWER));
        String status = digitalizedDocument.getStatus();
        log.info("Enriching assigned roles for examination document for status {}", status);
        switch (status) {
            case DRAFT_IN_PROGRESS -> {} // required roles are already present
            case PENDING_E_SIGN -> assignedRoles.add(EXAMINATION_SIGNER);
            case PENDING_REVIEW -> assignedRoles.add(EXAMINATION_APPROVER);
            default -> {}
        }
        digitalizedDocument.setAssignedRoles(assignedRoles);
    }

    public void enrichAssignedToForExamination(DigitalizedDocument digitalizedDocument, List<String> accusedUUIDs, List<String> accusedAdvocateUUIDs, List<String> accusedPoaUUIDs){
        List<String> assignedTo = new ArrayList<>();
        String status = digitalizedDocument.getStatus();
        log.info("Enriching assigned to for examination document for status {}", status);
        switch (status){
            case DRAFT_IN_PROGRESS -> {} // citizens do not have access in this stage
            case PENDING_E_SIGN, PENDING_REVIEW -> {
                assignedTo.addAll(accusedUUIDs);
                assignedTo.addAll(accusedAdvocateUUIDs);
                assignedTo.addAll(accusedPoaUUIDs);
            }
            default -> {}
        }
        digitalizedDocument.setAssignedTo(assignedTo);
    }

    public void enrichAssignedRolesForPlea(DigitalizedDocument digitalizedDocument){
        List<String> assignedRoles = new ArrayList<>(Arrays.asList(PLEA_CREATOR, PLEA_VIEWER));
        String status = digitalizedDocument.getStatus();
        log.info("Enriching assigned roles for plea document for status {}", status);
        switch (status) {
            case DRAFT_IN_PROGRESS -> {} // required roles are already present
            case PENDING_E_SIGN -> assignedRoles.add(PLEA_SIGNER);
            case PENDING_REVIEW -> assignedRoles.add(PLEA_APPROVER);
            default -> {}
        }
        digitalizedDocument.setAssignedRoles(assignedRoles);
    }

    public void enrichAssignedToForPlea(DigitalizedDocument digitalizedDocument, List<String> accusedUUIDs, List<String> accusedAdvocateUUIDs, List<String> accusedPoaUUIDs){
        List<String> assignedTo = new ArrayList<>();
        String status = digitalizedDocument.getStatus();
        log.info("Enriching assigned to for plea document for status {}", status);
        switch (status){
            case DRAFT_IN_PROGRESS -> {} // citizens do not have access in this stage
            case PENDING_E_SIGN, PENDING_REVIEW -> {
                assignedTo.addAll(accusedUUIDs);
                assignedTo.addAll(accusedAdvocateUUIDs);
                assignedTo.addAll(accusedPoaUUIDs);
            }
            default -> {}
        }
        digitalizedDocument.setAssignedTo(assignedTo);
    }

    public void enrichAssignedRolesForMediation(DigitalizedDocument digitalizedDocument){
        List<String> assignedRoles = new ArrayList<>(Arrays.asList(MEDIATION_CREATOR, MEDIATION_VIEWER));
        String status = digitalizedDocument.getStatus();
        log.info("Enriching assigned roles for mediation document for status {}", status);
        switch (status) {
            case DRAFT_IN_PROGRESS, PENDING_UPLOAD -> {} // required roles are already present
            case PENDING_E_SIGN -> assignedRoles.add(MEDIATION_SIGNER);
            case PENDING_REVIEW -> assignedRoles.add(MEDIATION_APPROVER);
            default -> {}
        }
        digitalizedDocument.setAssignedRoles(assignedRoles);
    }

    public void enrichAssignedToForMediation(DigitalizedDocument digitalizedDocument, List<String> accusedUUIDs, List<String> accusedAdvocateUUIDs, List<String> accusedPoaUUIDs, List<String> complainantUUIDs, List<String> complainantAdvocateUUIDs, List<String> complainantPoaUUIDs){
        String status = digitalizedDocument.getStatus();
        log.info("Enriching assigned to for mediation document for status {}", status);
        List<String> assignedTo = new ArrayList<>();
        switch (status){
            case DRAFT_IN_PROGRESS, PENDING_UPLOAD -> {} // citizens do not have access in this stage
            case PENDING_E_SIGN, PENDING_REVIEW -> {
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

    private List<String> getLitigantUUIDS(CourtCase courtCase, String partyType){
        List<Party> litigants = courtCase.getLitigants();
        List<String> litigantUUIDs = new ArrayList<>();
        if(litigants == null) return Collections.emptyList();
        for(Party litigant: litigants) {
            if(litigant.getPartyType().contains(partyType)){
                Object additionalDetails = litigant.getAdditionalDetails();
                JsonNode additionalDetailsNode = objectMapper.convertValue(additionalDetails, JsonNode.class);
                String uuid = additionalDetailsNode.get("uuid").toString();
                litigantUUIDs.add(uuid);
            }
        }

        return litigantUUIDs;
    }

    private List<String> getAdvocateUUIDS(CourtCase courtCase, List<String> litigantUUIDs){
        List<String> advocateUUIDs = new ArrayList<>();
        List<AdvocateMapping> representatives = courtCase.getRepresentatives();
        if(representatives == null) return Collections.emptyList();
        for(AdvocateMapping advocateMapping: representatives) {
            List<Party> representingList = advocateMapping.getRepresenting();
            for(Party representing: representingList) {
                Object additionalDetails = representing.getAdditionalDetails();
                JsonNode additionalDetailsNode = objectMapper.convertValue(additionalDetails, JsonNode.class);
                String uuid = additionalDetailsNode.get("uuid").toString();
                if(litigantUUIDs.contains(uuid)) {
                    advocateUUIDs.add(uuid);
                }
            }
        }
        return advocateUUIDs;
    }

    private List<String> getPOAUUIDs(CourtCase courtCase, String partyType){
        List<String> accusedIndividualIDs = getLitigantIndividualIDs(courtCase, partyType);
        List<String> poaUUIDs = new ArrayList<>();
        List<POAHolder> poaHolders = courtCase.getPoaHolders();

        if(poaHolders == null) return Collections.emptyList();

        for(POAHolder poaHolder: poaHolders) {
            Object additionalDetails = poaHolder.getAdditionalDetails();
            JsonNode additionalDetailsNode = objectMapper.convertValue(additionalDetails, JsonNode.class);
            String uuid = additionalDetailsNode.get("uuid").toString();
            for(PoaParty litigant: poaHolder.getRepresentingLitigants()){
                if(accusedIndividualIDs.contains(litigant.getIndividualId())){
                    poaUUIDs.add(uuid);
                }
            }
        }
        return poaUUIDs;


    }

    private List<String> getLitigantIndividualIDs(CourtCase courtCase, String partyType){
        List<Party> litigants = courtCase.getLitigants();
        List<String> accusedIndividualIDs = new ArrayList<>();
        for(Party litigant: litigants) {
            if(litigant.getPartyType().contains(partyType)){
                String individualID = litigant.getIndividualId();
                accusedIndividualIDs.add(individualID);
            }
        }
        return accusedIndividualIDs;

    }
}
