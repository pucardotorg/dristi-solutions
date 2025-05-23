package org.pucar.dristi.validators;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.CaseRepository;
import org.pucar.dristi.service.IndividualService;
import org.pucar.dristi.util.AdvocateUtil;
import org.pucar.dristi.util.FileStoreUtil;
import org.pucar.dristi.util.LockUtil;
import org.pucar.dristi.util.MdmsUtil;
import org.pucar.dristi.web.models.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.util.ObjectUtils;

import java.util.*;

import static org.pucar.dristi.config.ServiceConstants.*;


@Component
@Slf4j
public class CaseRegistrationValidator {

    private IndividualService individualService;

    private CaseRepository repository;


    private MdmsUtil mdmsUtil;

    private FileStoreUtil fileStoreUtil;

    private AdvocateUtil advocateUtil;

    private Configuration config;

    private ObjectMapper objectMapper;

    private final LockUtil lockUtil;

    @Autowired
    public CaseRegistrationValidator(IndividualService indService, CaseRepository caseRepo,
                                     MdmsUtil mdmsUtil, FileStoreUtil fileStoreUtil, AdvocateUtil advocateUtil,
                                     Configuration config, LockUtil lockUtil, ObjectMapper objectMapper) {
        this.individualService = indService;
        this.repository = caseRepo;
        this.mdmsUtil = mdmsUtil;
        this.fileStoreUtil = fileStoreUtil;
        this.advocateUtil = advocateUtil;
        this.config = config;
        this.lockUtil = lockUtil;
        this.objectMapper = objectMapper;
    }

    /*
     * To do validation-> 1. Validate MDMS data 2. Fetch court department info from
     * HRMS 3. Validate artifact Ids
     */

    public void validateCaseRegistration(CaseRequest caseRequest) throws CustomException {
        CourtCase courtCase = caseRequest.getCases();

        if (ObjectUtils.isEmpty(courtCase.getCaseCategory()))
            throw new CustomException(VALIDATION_ERR, "caseCategory is mandatory for creating case");
        if (ObjectUtils.isEmpty(courtCase.getStatutesAndSections()))
            throw new CustomException(VALIDATION_ERR, "statute and sections is mandatory for creating case");
        if (!(SAVE_DRAFT_CASE_WORKFLOW_ACTION.equalsIgnoreCase(courtCase.getWorkflow().getAction())
                || DELETE_DRAFT_WORKFLOW_ACTION.equalsIgnoreCase(courtCase.getWorkflow().getAction())) && ObjectUtils.isEmpty(courtCase.getLitigants())) {
            throw new CustomException(VALIDATION_ERR, "litigants is mandatory for creating case");
        }
        if (ObjectUtils.isEmpty(caseRequest.getRequestInfo().getUserInfo())) {
            throw new CustomException(VALIDATION_ERR, "user info is mandatory for creating case");
        }
    }

    public boolean validateUpdateRequest(CaseRequest caseRequest, List<CourtCase> existingCourtCaseList) {
        if (existingCourtCaseList.isEmpty()) {
            return false;
        }
        validateCaseRegistration(caseRequest);
        checkForLock(caseRequest);
        CourtCase courtCase = caseRequest.getCases();
        RequestInfo requestInfo = caseRequest.getRequestInfo();

        if (!(SUBMIT_CASE_WORKFLOW_ACTION.equalsIgnoreCase(courtCase.getWorkflow().getAction())
                || SAVE_DRAFT_CASE_WORKFLOW_ACTION.equalsIgnoreCase(courtCase.getWorkflow().getAction()) || SUBMIT_CASE_ADVOCATE_WORKFLOW_ACTION.equalsIgnoreCase(courtCase.getWorkflow().getAction())
                || DELETE_DRAFT_WORKFLOW_ACTION.equalsIgnoreCase(courtCase.getWorkflow().getAction()) || E_SIGN_PARTY_IN_PERSON.equalsIgnoreCase(courtCase.getWorkflow().getAction())
                || UPLOAD.equalsIgnoreCase(courtCase.getWorkflow().getAction()) || E_SIGN.equalsIgnoreCase(courtCase.getWorkflow().getAction()) || EDIT_CASE.equalsIgnoreCase(courtCase.getWorkflow().getAction()) || E_SIGN_COMPLETE.equalsIgnoreCase(courtCase.getWorkflow().getAction())) && ObjectUtils.isEmpty(courtCase.getFilingDate())) {
            throw new CustomException(VALIDATION_ERR, "filingDate is mandatory for updating case");
        }
        //For not allowing certain fields to update
        setUnEditableOnUpdate(existingCourtCaseList.get(0), caseRequest);

        validateMDMSData(requestInfo, courtCase);
        validateDocuments(courtCase);
        validateRepresentative(requestInfo, courtCase);
        validateLinkedCase(courtCase, existingCourtCaseList);

        return true;
    }

    private void checkForLock(CaseRequest caseRequest) {
        String uniqueId = caseRequest.getCases().getId().toString();
        String tenantId = caseRequest.getCases().getTenantId();

        // check the lock for case if there is lock then throw an exception
        boolean isLocked;
        try {
            isLocked = lockUtil.isLockPresent(caseRequest.getRequestInfo(), uniqueId, tenantId);
        } catch (JsonProcessingException e) {
            throw new CustomException("JSON_PROCESSING_EXCEPTION", "Exception Occurred while processing json");
        }
        if (isLocked) {
            throw new CustomException("CASE_LOCKED_EXCEPTION", "Case is locked please try after sometime");
        }

    }

    private void validateMDMSData(RequestInfo requestInfo, CourtCase courtCase) {
        Map<String, Map<String, JSONArray>> mdmsData = mdmsUtil.fetchMdmsData(requestInfo, courtCase.getTenantId(),
                config.getCaseModule(), createMasterDetails());

        if (mdmsData.get(config.getCaseModule()) == null)
            throw new CustomException(MDMS_DATA_NOT_FOUND, "MDMS data does not exist");
        if (!courtCase.getLitigants().isEmpty()) {
            courtCase.getLitigants().forEach(litigant -> {
                if (litigant.getIndividualId() != null) {
                    if (!individualService.searchIndividual(requestInfo, litigant.getIndividualId()))
                        throw new CustomException(INDIVIDUAL_NOT_FOUND, INVALID_COMPLAINANT_DETAILS);
                } else
                    throw new CustomException(INDIVIDUAL_NOT_FOUND, INVALID_COMPLAINANT_DETAILS);
            });
        }
    }

    private void validateDocuments(CourtCase courtCase) {
        if (courtCase.getDocuments() != null && !courtCase.getDocuments().isEmpty()) {
            courtCase.getDocuments().forEach(document -> {
                if (document.getFileStore() != null) {
                    if (!fileStoreUtil.doesFileExist(courtCase.getTenantId(), document.getFileStore()))
                        throw new CustomException(INVALID_FILESTORE_ID, INVALID_DOCUMENT_DETAILS);
                } else
                    throw new CustomException(INVALID_FILESTORE_ID, INVALID_DOCUMENT_DETAILS);
            });
        }
    }

    private void validateRepresentative(RequestInfo requestInfo, CourtCase courtCase) {
        if (courtCase.getRepresentatives() != null && !courtCase.getRepresentatives().isEmpty()) {
            courtCase.getRepresentatives().forEach(rep -> {
                if (rep.getAdvocateId() != null) {
                    if (!advocateUtil.doesAdvocateExist(requestInfo, rep.getAdvocateId()))
                        throw new CustomException(INVALID_ADVOCATE_ID, INVALID_ADVOCATE_DETAILS);
                } else
                    throw new CustomException(INVALID_ADVOCATE_ID, INVALID_ADVOCATE_DETAILS);
            });
        }
    }

    private void validateLinkedCase(CourtCase courtCase, List<CourtCase> existingApplications) {
        if (courtCase.getLinkedCases() != null && !courtCase.getLinkedCases().isEmpty()) {
            boolean isValidLinkedCase = courtCase.getLinkedCases().stream().allMatch(linkedCase -> existingApplications
                    .stream()
                    .anyMatch(existingCase -> existingCase.getLinkedCases().stream()
                            .anyMatch(existingLinkedCase -> (linkedCase.getId() != null
                                    && linkedCase.getId().equals(existingLinkedCase.getId()))
                                    || (linkedCase.getIsActive() != null
                                    && linkedCase.getIsActive().equals(existingLinkedCase.getIsActive()))
                                    || (linkedCase.getCaseNumber() != null
                                    && linkedCase.getCaseNumber().equals(existingLinkedCase.getCaseNumber()))
                                    || (linkedCase.getReferenceUri() != null && linkedCase.getReferenceUri()
                                    .equals(existingLinkedCase.getReferenceUri())))));
            if (!isValidLinkedCase)
                throw new CustomException(INVALID_LINKEDCASE_ID, "Invalid linked case details");
        }
    }

    private void setUnEditableOnUpdate(CourtCase courtCase, CaseRequest caseRequest) {
        caseRequest.getCases().setFilingDate(courtCase.getFilingDate());
        caseRequest.getCases().setCaseNumber(courtCase.getCaseNumber());
        caseRequest.getCases().setCnrNumber(courtCase.getCnrNumber());
        caseRequest.getCases().setRegistrationDate(courtCase.getRegistrationDate());
        caseRequest.getCases().setTenantId(courtCase.getTenantId());

        caseRequest.getCases().setCourtId(courtCase.getCourtId());
        caseRequest.getCases().setCaseType(courtCase.getCaseType());
        caseRequest.getCases().setSubstage(courtCase.getSubstage());
        caseRequest.getCases().setStage(courtCase.getStage());
        caseRequest.getCases().setStatus(courtCase.getStatus());
        caseRequest.getCases().setOutcome(courtCase.getOutcome());
        caseRequest.getCases().setAccessCode(courtCase.getAccessCode());
        caseRequest.getCases().setJudgementDate(courtCase.getJudgementDate());
    }

    public boolean canLitigantJoinCase(JoinCaseRequest joinCaseRequest) {
        RequestInfo requestInfo = joinCaseRequest.getRequestInfo();
        List<Party> litigants = joinCaseRequest.getLitigant();

        for (Party litigant : litigants) {
            if (litigant.getIndividualId() != null) { // validation for IndividualId for litigant
                if (!individualService.searchIndividual(requestInfo, litigant.getIndividualId()))
                    throw new CustomException(INDIVIDUAL_NOT_FOUND, INVALID_COMPLAINANT_DETAILS);
            } else {
                throw new CustomException(INDIVIDUAL_NOT_FOUND, INVALID_COMPLAINANT_DETAILS);
            }

            if (litigant.getDocuments() != null && !litigant.getDocuments().isEmpty()) {// validation for documents for
                // litigant
                litigant.getDocuments().forEach(document -> {
                    if (document.getFileStore() != null) {
                        if (!fileStoreUtil.doesFileExist(litigant.getTenantId(), document.getFileStore()))
                            throw new CustomException(INVALID_FILESTORE_ID, INVALID_DOCUMENT_DETAILS);
                    } else
                        throw new CustomException(INVALID_FILESTORE_ID, INVALID_DOCUMENT_DETAILS);
                });
            }
        }
        return true;

    }

    public boolean validateLitigantJoinCase(JoinCaseV2Request joinCaseRequest) {
        RequestInfo requestInfo = joinCaseRequest.getRequestInfo();
        List<JoinCaseLitigant> litigants = joinCaseRequest.getJoinCaseData().getLitigant();

        for (JoinCaseLitigant litigant : litigants) {
            if (litigant.getIndividualId() != null) {
                // validation for IndividualId for litigant
                if (!individualService.searchIndividual(requestInfo, litigant.getIndividualId()))
                    throw new CustomException(INDIVIDUAL_NOT_FOUND, INVALID_COMPLAINANT_DETAILS);
            } else {
                throw new CustomException(INDIVIDUAL_NOT_FOUND, INVALID_COMPLAINANT_DETAILS);
            }

            if (litigant.getDocuments() != null && !litigant.getDocuments().isEmpty()) {
                // validation for documents for litigant
                litigant.getDocuments().forEach(document -> {
                    if (document.getFileStore() != null) {
                        if (!fileStoreUtil.doesFileExist(joinCaseRequest.getJoinCaseData().getTenantId(), document.getFileStore()))
                            throw new CustomException(INVALID_FILESTORE_ID, INVALID_DOCUMENT_DETAILS);
                    } else
                        throw new CustomException(INVALID_FILESTORE_ID, INVALID_DOCUMENT_DETAILS);
                });
            }
        }
        return true;

    }

    public boolean canRepresentativeJoinCase(JoinCaseRequest joinCaseRequest) {
        RequestInfo requestInfo = joinCaseRequest.getRequestInfo();
        Representative representative = joinCaseRequest.getRepresentative();

        if (representative.getAdvocateId() != null) {
            // validation for advocateId for representative
            if (!advocateUtil.doesAdvocateExist(requestInfo, representative.getAdvocateId()))
                throw new CustomException(INVALID_ADVOCATE_ID, INVALID_ADVOCATE_DETAILS);
        } else {
            throw new CustomException(INVALID_ADVOCATE_ID, INVALID_ADVOCATE_DETAILS);
        }
        if (representative.getDocuments() != null && !representative.getDocuments().isEmpty()) { // validation for
            // documents for representative
            representative.getDocuments().forEach(document -> {
                if (document.getFileStore() != null) {
                    if (!fileStoreUtil.doesFileExist(representative.getTenantId(), document.getFileStore()))
                        throw new CustomException(INVALID_FILESTORE_ID, INVALID_DOCUMENT_DETAILS);
                } else {
                    throw new CustomException(INVALID_FILESTORE_ID, INVALID_DOCUMENT_DETAILS);
                }
            });
        }
        return true;
    }

    public boolean validateRepresentativeJoinCase(JoinCaseV2Request joinCaseRequest) {
        RequestInfo requestInfo = joinCaseRequest.getRequestInfo();
        JoinCaseRepresentative representative = joinCaseRequest.getJoinCaseData().getRepresentative();

        if (representative.getAdvocateId() != null) {
            // validation for advocateId for representative
            if (!advocateUtil.doesAdvocateExist(requestInfo, representative.getAdvocateId()))
                throw new CustomException(INVALID_ADVOCATE_ID, INVALID_ADVOCATE_DETAILS);
        } else {
            throw new CustomException(INVALID_ADVOCATE_ID, INVALID_ADVOCATE_DETAILS);
        }
        if (representative.getReasonDocument() != null) {
            if (representative.getReasonDocument().getFileStore() != null) {
                if (!fileStoreUtil.doesFileExist(joinCaseRequest.getJoinCaseData().getTenantId(), representative.getReasonDocument().getFileStore()))
                    throw new CustomException(INVALID_FILESTORE_ID, INVALID_DOCUMENT_DETAILS);
            }
        }
        return true;
    }

    public void validateEditCase(CaseRequest caseRequest) throws CustomException {

        if (ObjectUtils.isEmpty(caseRequest.getCases().getId())) {
            throw new CustomException(VALIDATION_ERR, "case Id cannot be empty");
        }

        if (ObjectUtils.isEmpty(caseRequest.getCases().getCaseTitle()) || ObjectUtils.isEmpty(caseRequest.getCases().getAdditionalDetails())
                || caseRequest.getCases().getCaseTitle().trim().isEmpty()) {
            throw new CustomException(VALIDATION_ERR, "caseTitle or additionalDetails cannot be empty");
        }
    }

    public void validateProfileEdit(CreateProfileRequest profileRequest, CourtCase courtCase) throws CustomException {

        if (ObjectUtils.isEmpty(profileRequest.getProfile().getCaseId())) {
            throw new CustomException(VALIDATION_ERR, "case Id cannot be empty");
        }

        if (ObjectUtils.isEmpty(profileRequest.getProfile().getLitigantDetails())) {
            throw new CustomException(VALIDATION_ERR, "litigantDetails cannot be empty");
        }

        Profile profileEdit = profileRequest.getProfile();
        log.info("Processing ProfileEdit :: {}", profileEdit);

        // Set to track unique mappings of (advocate UUID + litigant UniqueId)
        Set<String> uniqueMappings = new HashSet<>();

        // Safely extract litigantDetails and editorDetails
        JsonNode litigantDetails = objectMapper.convertValue(profileEdit.getLitigantDetails(), JsonNode.class);
        JsonNode editorDetails = objectMapper.convertValue(profileEdit.getEditorDetails(), JsonNode.class);

        // Validate litigantDetails
        if (litigantDetails == null || litigantDetails.get("uniqueId") == null) {
            throw new CustomException(VALIDATION_ERR, "Missing litigantDetails or uniqueId in request.");
        }

        // Validate editorDetails
        if (editorDetails == null || editorDetails.get("isAdvocate") == null) {
            throw new CustomException(VALIDATION_ERR, "Missing editorDetails or isAdvocate in request.");
        }

        if (editorDetails.get("uuid") == null) {
            throw new CustomException(VALIDATION_ERR, "Missing UUID for advocate or litigant.");
        }

        String uniqueId = litigantDetails.get("uniqueId").asText();

        String uuid = editorDetails.get("uuid").asText();
        String mappingKey = uuid + "|" + uniqueId;
        uniqueMappings.add(mappingKey);

        // Check if this (UUID + uniqueId) already exists
        JsonNode additionalDetails = objectMapper.convertValue(courtCase.getAdditionalDetails(), JsonNode.class);
        JsonNode profileRequests = additionalDetails.get("profileRequests");
        if (profileRequests != null) {
            for (JsonNode existProfile : profileRequests) {
                String existMappingKey = existProfile.get("editorDetails").get("uuid").asText() +
                        "|" + existProfile.get("litigantDetails").get("uniqueId").asText();
                if (!uniqueMappings.add(existMappingKey)) {
                    throw new CustomException(VALIDATION_ERR, "Duplicate profile edit request found for UUID: " + uuid + " and uniqueId: " + uniqueId);
                }
            }
        }
    }

    private List<String> createMasterDetails() {
        List<String> masterList = new ArrayList<>();
        masterList.add("ComplainantType");
        masterList.add("CaseCategory");
        masterList.add("PaymentMode");
        masterList.add("ResolutionMechanism");

        return masterList;
    }

}
