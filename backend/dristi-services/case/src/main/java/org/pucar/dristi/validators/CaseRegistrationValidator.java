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
import org.pucar.dristi.util.AdvocateOfficeUtil;
import org.pucar.dristi.util.AdvocateUtil;
import org.pucar.dristi.util.FileStoreUtil;
import org.pucar.dristi.util.LockUtil;
import org.pucar.dristi.util.MdmsUtil;
import org.pucar.dristi.web.models.*;
import org.pucar.dristi.web.models.v2.Emails;
import org.pucar.dristi.web.models.v2.PartyType;
import org.pucar.dristi.web.models.v2.PhoneNumbers;
import org.pucar.dristi.web.models.v2.WitnessDetails;
import org.pucar.dristi.web.models.v2.WitnessDetailsRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.util.ObjectUtils;

import java.util.*;
import java.util.stream.Collectors;

import static org.pucar.dristi.config.ServiceConstants.*;

/**
 * @author Sathvik
 */
@Component
@Slf4j
public class CaseRegistrationValidator {

    private IndividualService individualService;

    private CaseRepository repository;

    private MdmsUtil mdmsUtil;

    private FileStoreUtil fileStoreUtil;

    private AdvocateUtil advocateUtil;

    private AdvocateOfficeUtil advocateOfficeUtil;

    private Configuration config;

    private ObjectMapper objectMapper;

    private final LockUtil lockUtil;

    @Autowired
    public CaseRegistrationValidator(IndividualService indService, CaseRepository caseRepo,
                                     MdmsUtil mdmsUtil, FileStoreUtil fileStoreUtil, AdvocateUtil advocateUtil,
                                     AdvocateOfficeUtil advocateOfficeUtil,
                                     Configuration config, LockUtil lockUtil, ObjectMapper objectMapper) {
        this.individualService = indService;
        this.repository = caseRepo;
        this.mdmsUtil = mdmsUtil;
        this.fileStoreUtil = fileStoreUtil;
        this.advocateUtil = advocateUtil;
        this.advocateOfficeUtil = advocateOfficeUtil;
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

    /**
     * Validates that the user creating the case is authorized to file on behalf of the advocate.
     * The user must be either:
     * 1. The advocate themselves (advocate's individualId matches user's individual)
     * 2. A member of the advocate's office
     */
    public void validateAdvocateAuthorization(RequestInfo requestInfo, CourtCase courtCase) {
        if (courtCase.getRepresentatives() == null || courtCase.getRepresentatives().isEmpty()) {
            return;
        }

        String userUuid = requestInfo.getUserInfo().getUuid();
        String tenantId = courtCase.getTenantId();

        for (AdvocateMapping rep : courtCase.getRepresentatives()) {
            if (rep.getAdvocateId() == null) {
                continue;
            }

            boolean isAuthorized = false;

            // Check 1: Is the user the advocate themselves?
            List<Advocate> advocates = advocateUtil.fetchAdvocatesById(requestInfo, rep.getAdvocateId());
            if (!advocates.isEmpty()) {
                Advocate advocate = advocates.get(0);
                if (advocate.getIndividualId() != null) {
                    List<Individual> individuals = individualService.getIndividualsByIndividualId(requestInfo, advocate.getIndividualId());
                    if (!individuals.isEmpty() && userUuid.equals(individuals.get(0).getUserUuid())) {
                        isAuthorized = true;
                    }
                }
            }

            // Check 2: Is the user a member of the advocate's office?
            if (!isAuthorized) {
                try {
                    isAuthorized = advocateOfficeUtil.isUserMemberOfAdvocateOffice(
                            requestInfo,
                            tenantId,
                            UUID.fromString(rep.getAdvocateId()),
                            UUID.fromString(userUuid)
                    );
                } catch (Exception e) {
                    log.warn("Error checking advocate office membership: {}", e.getMessage());
                }
            }

            if (!isAuthorized) {
                throw new CustomException("UNAUTHORIZED_ADVOCATE_ACCESS",
                        "User is not authorized to file case on behalf of advocate: " + rep.getAdvocateId());
            }
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

    public Individual validatePOAIndividual(JoinCaseV2Request joinCaseRequest) {
        JoinCasePOA joinCasePOA = joinCaseRequest.getJoinCaseData().getPoa();

        if (joinCasePOA.getIndividualId() != null) {
            List<Individual> individual = individualService.getIndividualsByIndividualId(joinCaseRequest.getRequestInfo(), joinCasePOA.getIndividualId());
            if (individual.isEmpty())
                throw new CustomException(INDIVIDUAL_NOT_FOUND, "POA individual not found");

            return individual.get(0);
        } else {
            throw new CustomException(INDIVIDUAL_NOT_FOUND, "POA individual not found");
        }
    }

    public void validatePOAJoinCase(CourtCase courtCase, JoinCaseDataV2 joinCaseData) {
        List<POARepresentingJoinCase> poaRepresenting = joinCaseData.getPoa().getPoaRepresenting();
        Map<String, String> poaHolderRepresentingMap = getPoaHolderRepresentingMap(courtCase);

        String individualIdPOA = joinCaseData.getPoa().getIndividualId();
        for (POARepresentingJoinCase poaRepresentingJoinCase : poaRepresenting) {
            String individualIdRepresenting = poaRepresentingJoinCase.getIndividualId();
            Boolean isRevoking = poaRepresentingJoinCase.getIsRevoking();

            validatePOAJoinCase(isRevoking, poaHolderRepresentingMap, individualIdRepresenting, individualIdPOA);
        }
    }

    public void isStillValidPOAJoinCase(CourtCase courtCase, POAJoinCaseTaskRequest joinCaseTaskRequest) {
        List<POAIndividualDetails> poaRepresenting = joinCaseTaskRequest.getIndividualDetails();
        Map<String, String> poaHolderRepresentingMap = getPoaHolderRepresentingMap(courtCase);

        String individualIdPOA = joinCaseTaskRequest.getPoaDetails().getIndividualId();
        for (POAIndividualDetails poaRepresentingJoinCase : poaRepresenting) {
            String individualIdRepresenting = poaRepresentingJoinCase.getIndividualId();
            Boolean isRevoking = poaRepresentingJoinCase.getIsRevoking();
            validatePOAJoinCase(isRevoking, poaHolderRepresentingMap, individualIdRepresenting, individualIdPOA);
        }
    }

    private Map<String, String> getPoaHolderRepresentingMap(CourtCase courtCase) {
        if(courtCase.getPoaHolders() == null){
            courtCase.setPoaHolders(new ArrayList<>());
        }
        List<POAHolder> poaHolders = courtCase.getPoaHolders();

        Map<String, String> poaHolderRepresentingMap = new HashMap<>();
        for (POAHolder poaHolder : poaHolders) {
            for (PoaParty party : poaHolder.getRepresentingLitigants()) {
                poaHolderRepresentingMap.put(party.getIndividualId(), poaHolder.getIndividualId());
            }
        }
        return poaHolderRepresentingMap;
    }

    private static void validatePOAJoinCase(Boolean isRevoking, Map<String, String> poaHolderRepresentingMap, String individualIdRepresenting, String individualIdPOA) {
        if (isRevoking) {
            if (!poaHolderRepresentingMap.containsKey(individualIdRepresenting))
                throw new CustomException(VALIDATION_ERR, "Litigant with individualId " + individualIdRepresenting + " don't have poa holder");
            else if (poaHolderRepresentingMap.containsKey(individualIdRepresenting) && poaHolderRepresentingMap.get(individualIdRepresenting).equals(individualIdPOA)) {
                throw new CustomException(VALIDATION_ERR, "POA individualId " + individualIdPOA + " already a POA holder for the litigant " + individualIdRepresenting);
            }
        }else {
            if (poaHolderRepresentingMap.containsKey(individualIdRepresenting))
                throw new CustomException(VALIDATION_ERR, "Litigant with individualId " + individualIdRepresenting + " have poa holder");
        }
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

    public void validateWitnessRequest(WitnessDetailsRequest body, CourtCase courtCase) {
        try {
            log.info("operation=validateWitnessRequest, status=IN_PROGRESS, filingNumber: {}", body.getCaseFilingNumber());
            JsonNode additionalDetails = objectMapper.convertValue(courtCase.getAdditionalDetails(), JsonNode.class);
            List<WitnessDetails> existingWitnesses = courtCase.getWitnessDetails();
            validateMobileNumbersInRequest(body.getWitnessDetails());
            for(WitnessDetails witnessDetails : body.getWitnessDetails()) {
                validateMobileNumbers(additionalDetails, witnessDetails, existingWitnesses);
                validateEmail(additionalDetails, witnessDetails, existingWitnesses);
            }
            log.info("operation=validateWitnessRequest, status=SUCCESS, filingNumber: {}", body.getCaseFilingNumber());
        } catch (Exception e) {
            log.error("operation=validateWitnessRequest, status=FAILURE, filingNumber: {}, error: {}", body.getCaseFilingNumber(), e.getMessage());
            throw new CustomException(ERROR_VALIDATING_WITNESS, "Error while validating witness request: " + body.getCaseFilingNumber() + ", error: " + e.getMessage());
        }
    }

    private void validateMobileNumbersInRequest(List<WitnessDetails> witnessDetails) {
        if(witnessDetails == null || witnessDetails.isEmpty()) {
            throw new CustomException(ERROR_VALIDATING_WITNESS, "Witness details cannot be empty");
        }
        
        Set<String> mobileNumberSet = new HashSet<>();
        for(WitnessDetails witnessDetail : witnessDetails) {
            List<String> mobileNumbers = extractMobileNumbers(witnessDetail);
            for(String mobileNumber : mobileNumbers) {
                if(!mobileNumberSet.add(mobileNumber)) {
                    throw new CustomException(ERROR_VALIDATING_WITNESS, 
                        "Duplicate mobile number found: " + mobileNumber + ". All witnesses must have different mobile numbers.");
                }
            }
        }
    }
    
    private List<String> extractMobileNumbers(WitnessDetails witnessDetail) {
        if(witnessDetail.getPhoneNumbers() == null || witnessDetail.getPhoneNumbers().getMobileNumber() == null) {
            return Collections.emptyList();
        }
        return witnessDetail.getPhoneNumbers().getMobileNumber().stream()
                .filter(mobile -> mobile != null && !mobile.trim().isEmpty())
                .collect(Collectors.toList());
    }

    private boolean doesWitnessExists(List<WitnessDetails> existingWitnesses, WitnessDetails witnessDetails) {
        if(existingWitnesses == null || existingWitnesses.isEmpty()) {
            return false;
        }
        return existingWitnesses.stream()
                .map(WitnessDetails::getUniqueId)
                .anyMatch(uniqueId -> witnessDetails.getUniqueId().equals(uniqueId));
    }

    private void validateEmail(JsonNode additionalDetails, WitnessDetails witnessDetails, List<WitnessDetails> existingWitnesses) {
        List<String> emailIds = new ArrayList<>();
        emailIds.addAll(extractEmailIdsFromDetails(additionalDetails.get("respondentDetails")));
        emailIds.addAll(extractWitnessEmailIds(existingWitnesses));

        if (witnessDetails.getEmails() == null || witnessDetails.getEmails().getEmailId().isEmpty()) {
            return;
        }
        List<String> witnessEmailIds = witnessDetails.getEmails().getEmailId();
        Set<String> emailIdSet = new HashSet<>(emailIds);
        for(String emailId : witnessEmailIds) {
            boolean witnessExist = doesWitnessExists(existingWitnesses, witnessDetails);
            if(emailIdSet.contains(emailId) && !witnessExist) {
                throw new CustomException(ERROR_VALIDATING_WITNESS,
                        "Witness email id should not be same as existing parties email id");
            }
        }
    }

    public static List<String> extractEmailIdsFromDetails(JsonNode detailsNode) {
        List<String> emailIds = new ArrayList<>();

        if (detailsNode == null || !detailsNode.has("formdata")) {
            return emailIds;
        }

        JsonNode formDataArray = detailsNode.get("formdata");
        if (!formDataArray.isArray() || formDataArray.isEmpty()) {
            return emailIds;
        }

        for (JsonNode formDataItem : formDataArray) {
            JsonNode emailNode = formDataItem.at("/data/emails/emailId");
            if (!emailNode.isMissingNode() && emailNode.isArray()) {
                for (JsonNode node : emailNode) {
                    if (isNonEmptyText(node)) {
                        emailIds.add(node.asText());
                    }
                }
            }
        }

        return emailIds;
    }

    public static List<String> extractWitnessEmailIds(List<WitnessDetails> witnesses) {
        if(witnesses == null || witnesses.isEmpty()) {
            return Collections.emptyList();
        }
        return witnesses.stream()
                .map(WitnessDetails::getEmails)
                .filter(Objects::nonNull)
                .map(Emails::getEmailId)
                .filter(Objects::nonNull)
                .flatMap(List::stream)
                .filter(emailId -> emailId != null && !emailId.trim().isEmpty())
                .toList();
    }

    private void validateMobileNumbers(JsonNode additionalDetails, WitnessDetails witnessDetails, List<WitnessDetails> existingWitnesses) {

        if(witnessDetails.getPhoneNumbers() == null || witnessDetails.getPhoneNumbers().getMobileNumber().isEmpty()) {
            return;
        }
        List<String> mobileNumberList = new ArrayList<>();

        mobileNumberList.addAll(extractMobileNumbersFromDetails(additionalDetails.get("advocateDetails"), PartyType.ADVOCATE));
        mobileNumberList.addAll(extractMobileNumbersFromDetails(additionalDetails.get("complainantDetails"), PartyType.COMPLAINANT));
        mobileNumberList.addAll(extractMobileNumbersFromDetails(additionalDetails.get("respondentDetails"), PartyType.RESPONDENT));
        mobileNumberList.addAll(extractWitnessMobileNumbers(existingWitnesses));

        List<String> witnessMobileNumber = witnessDetails.getPhoneNumbers().getMobileNumber();
        Set<String> mobileNumberSet = new HashSet<>(mobileNumberList);
        for (String witnessNumber : witnessMobileNumber) {
            boolean isWitnessExists = doesWitnessExists(existingWitnesses, witnessDetails);
            if (mobileNumberSet.contains(witnessNumber) && !isWitnessExists) {
                throw new CustomException(ERROR_VALIDATING_WITNESS,
                        "Witness mobile number should not be same as existing parties mobile number");
            }
        }
    }

    public static boolean isNonEmptyText(JsonNode node) {
        return node != null &&
                !node.isMissingNode() &&
                !node.isNull() &&
                node.isTextual() &&
                !node.asText().trim().isEmpty();
    }


    public static List<String> extractMobileNumbersFromDetails(JsonNode detailsNode, PartyType type) {
        List<String> mobileNumbers = new ArrayList<>();
        if (detailsNode == null || !detailsNode.has("formdata")) {
            return mobileNumbers;
        }
        JsonNode formDataArray = detailsNode.get("formdata");
        if (!formDataArray.isArray()) {
            return mobileNumbers;
        }
        for (JsonNode formDataItem : formDataArray) {
            JsonNode dataNode = formDataItem.get("data");

            if (dataNode == null) continue;
            switch (type) {
                case COMPLAINANT:
                    JsonNode complainantMobile = dataNode.at("/complainantVerification/mobileNumber");
                    if (isNonEmptyText(complainantMobile)) {
                        mobileNumbers.add(complainantMobile.asText());
                    }
                    break;

                case RESPONDENT:
                    JsonNode mobileNode = dataNode.at("/phonenumbers/mobileNumber");
                    if (!mobileNode.isMissingNode() && mobileNode.isArray()) {
                        for (JsonNode numberNode : mobileNode) {
                            if (isNonEmptyText(numberNode)) {
                                mobileNumbers.add(numberNode.asText());
                            }
                        }
                    }
                    break;
                case ADVOCATE:
                    JsonNode multipleAdvocates = dataNode.at("/multipleAdvocatesAndPip/multipleAdvocateNameDetails");
                    if (multipleAdvocates.isArray()) {
                        for (JsonNode advocateEntry : multipleAdvocates) {
                            JsonNode advocateNameDetails = advocateEntry.get("advocateNameDetails");
                            if (advocateNameDetails != null) {
                                JsonNode advocateMobile = advocateNameDetails.get("advocateMobileNumber");
                                if (isNonEmptyText(advocateMobile)) {
                                    mobileNumbers.add(advocateMobile.asText());
                                }
                            }
                        }
                    }
                    break;

                default:
                    log.warn("Unsupported party type for mobile number extraction: {}", type);
                    return mobileNumbers;
            }
        }

        return mobileNumbers;
    }

    public static List<String> extractWitnessMobileNumbers(List<WitnessDetails> witnesses){
        if(witnesses == null || witnesses.isEmpty()){
            return Collections.emptyList();
        }

        return witnesses.stream()
                .map(WitnessDetails::getPhoneNumbers)
                .filter(Objects::nonNull)
                .map(PhoneNumbers::getMobileNumber)
                .filter(Objects::nonNull)
                .flatMap(List::stream)
                .filter(number -> number != null && !number.trim().isEmpty())
                .toList();
    }

    public void validateUpdateLPRDetails(CaseRequest caseRequest) {

        CourtCase courtCase = caseRequest.getCases();
        if (courtCase == null || ObjectUtils.isEmpty(courtCase)) {
            throw new CustomException(VALIDATION_ERR, "courtCase cannot be empty");
        }
        if (ObjectUtils.isEmpty(courtCase.getId())) {
            throw new CustomException(VALIDATION_ERR, "case Id cannot be empty");
        }
        if (courtCase.getCourtCaseNumber() == null) {
            throw new CustomException(VALIDATION_ERR, "courtCaseNumber cannot be empty or null");
        }

        if (courtCase.getIsLPRCase() == null || ObjectUtils.isEmpty(courtCase.getIsLPRCase())) {
            throw new CustomException(VALIDATION_ERR, "isLPRCase cannot be empty or null");
        }

        if (courtCase.getIsLPRCase() && (courtCase.getLprNumber() != null || courtCase.getCourtCaseNumberBackup() != null)) {
            // If trying to convert case to Long Pending Registration, it should not have LPR number or backup court case number
            // case can only go to LPR once
            throw new CustomException(VALIDATION_ERR, "To convert to LPR, case cannot have LPR number or backup court case number");
        }

    }
}
