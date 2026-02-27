package org.pucar.dristi.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.config.ServiceConstants;
import org.pucar.dristi.repository.CtcApplicationRepository;
import org.pucar.dristi.repository.CtcDocumentRepository;
import org.pucar.dristi.util.IdgenUtil;
import org.pucar.dristi.util.CaseUtil;
import org.pucar.dristi.web.models.*;
import org.pucar.dristi.kafka.Producer;
import org.pucar.dristi.web.models.courtcase.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@Slf4j
public class CtcApplicationService {

    @Autowired
    private CtcApplicationRepository ctcApplicationRepository;

    @Autowired
    private IdgenUtil idgenUtil;

    @Autowired
    private CaseUtil caseUtil;

    @Autowired
    private IndividualService individualService;

    @Autowired
    private WorkflowService workflowService;

    @Autowired
    private Configuration config;

    @Autowired
    private Producer producer;

    @Autowired
    private ObjectMapper objectMapper;

    public CtcApplication createApplication(CtcApplicationRequest request) {
        CtcApplication application = request.getCtcApplication();

        // Generate application number if not provided
        application.setCtcApplicationNumber(generateApplicationNumber(application.getTenantId(), request.getRequestInfo()));

        // Set ID and audit details
        application.setId(UUID.randomUUID().toString());
        long currentTime = System.currentTimeMillis();

        if (application.getAuditDetails() == null) {
            application.setAuditDetails(AuditDetails.builder()
                    .createdBy(request.getRequestInfo().getUserInfo().getUuid())
                    .lastModifiedBy(request.getRequestInfo().getUserInfo().getUuid())
                    .createdTime(currentTime)
                    .lastModifiedTime(currentTime)
                    .build());
        }
        workflowService.updateWorkflowStatus(request.getCtcApplication(), request.getRequestInfo());

        producer.push("save-ctc-application", request);

        return application;
    }

    public CtcApplication updateApplication(CtcApplicationRequest request) {
        CtcApplication application = request.getCtcApplication();

        CtcApplicationSearchRequest ctcApplicationSearchRequest = new CtcApplicationSearchRequest();
        ctcApplicationSearchRequest.setCriteria(CtcApplicationSearchCriteria.builder().ctcApplicationNumber(application.getCtcApplicationNumber()).build());
        ctcApplicationSearchRequest.setPagination(Pagination.builder().limit(1.0).offSet(0.0).build());
        ctcApplicationSearchRequest.setRequestInfo(request.getRequestInfo());

        // Check if application exists
        List<CtcApplication> existingApplication = ctcApplicationRepository.getCtcApplication(ctcApplicationSearchRequest);
        if (existingApplication == null || existingApplication.isEmpty()) {
            throw new CustomException(ServiceConstants.CTC_APPLICATION_UPDATE_EXCEPTION,
                    "CTC application not found with ID: " + application.getId());
        }

        // Update audit details
        application.getAuditDetails().setLastModifiedBy(request.getRequestInfo().getUserInfo().getUuid());
        application.getAuditDetails().setLastModifiedTime(System.currentTimeMillis());

        workflowService.updateWorkflowStatus(request.getCtcApplication(), request.getRequestInfo());

        producer.push("update-ctc-application", request);

        return application;
    }

    public List<CtcApplication> searchApplications(CtcApplicationSearchRequest ctcApplicationSearchRequest) {
        List<CtcApplication> applications = ctcApplicationRepository.getCtcApplication(ctcApplicationSearchRequest);
        if (applications == null) {
            return new ArrayList<>();
        }
        return applications;
    }

    private String generateApplicationNumber(String tenantId, RequestInfo requestInfo) {
        try {
            String idName = config.getCaConfig();
            String idFormat = config.getCaFormat();
            List<String> cmpNumberIdList = idgenUtil.getIdList(requestInfo, tenantId, idName, idFormat, 1, false);

            return cmpNumberIdList.get(0);
        } catch (Exception e) {
            log.error("Error enriching ca number: {}", e.toString());
            throw new CustomException("ENRICHMENT_EXCEPTION", "Error while enriching ca number: " + e.getMessage());
        }
    }

    private void calculateApplicationFee(CtcApplication application) {
        if (application.getSelectedDocuments() == null || application.getSelectedDocuments().isEmpty()) {
            return;
        }

        // Calculate total pages
        int totalPages = application.getSelectedDocuments().stream()
                .mapToInt(doc -> doc.getPages() != null ? doc.getPages() : 0)
                .sum();

        application.setTotalPages(totalPages);

    }

    public ValidateUserInfo validateUserForCTCApplication(ValidateUserRequest request) {
        try {
            // Get CourtCase object for POA holders and advocate offices
            CourtCase courtCase = caseUtil.getCase(request.getFilingNumber());

            if (courtCase == null) {
                throw new CustomException("CASE_NOT_FOUND", "Case not found with filingNumber: " + request.getFilingNumber());
            }

            String userName = null;
            String designation = null;

            JsonNode additionalDetails = null;

            if (courtCase.getAdditionalDetails() != null) {
                additionalDetails = objectMapper.convertValue(
                        courtCase.getAdditionalDetails(),
                        JsonNode.class
                );
            }
            
            if (additionalDetails != null) {
                // Check complainant details
                JsonNode complainantDetails = additionalDetails.has("complainantDetails") ? additionalDetails.get("complainantDetails") : null;
                if (complainantDetails != null && complainantDetails.has("formdata")) {
                    JsonNode formData = complainantDetails.get("formdata");
                    if (formData.isArray() && !formData.isEmpty()) {
                        JsonNode complainantData = formData.get(0).get("data");
                        if (complainantData != null) {
                            JsonNode complainantVerification = complainantData.has("complainantVerification") ? complainantData.get("complainantVerification") : null;
                            if (complainantVerification != null) {
                                String mobile = complainantVerification.has("mobileNumber") ? complainantVerification.get("mobileNumber").asText() : null;
                                if (mobile != null && mobile.equals(request.getMobileNumber())) {
                                    userName = extractName(complainantData, "complainant");
                                    designation = "Complainant";
                                }
                            }
                        }
                    }
                }
                
                // Check respondent details if not found in complainant
                if (userName == null) {
                    JsonNode respondentDetails = additionalDetails.has("respondentDetails") ? additionalDetails.get("respondentDetails") : null;
                    if (respondentDetails != null && respondentDetails.has("formdata")) {
                        JsonNode formData = respondentDetails.get("formdata");
                        if (formData.isArray()) {
                            for (JsonNode respondentForm : formData) {
                                JsonNode respondentData = respondentForm.get("data");
                                if (respondentData != null) {
                                    JsonNode phonenumbers = respondentData.has("phonenumbers") ? respondentData.get("phonenumbers") : null;
                                    if (phonenumbers != null && phonenumbers.has("textfieldValue")) {
                                        String mobile = phonenumbers.get("textfieldValue").asText();
                                        if (mobile != null && mobile.equals(request.getMobileNumber())) {
                                            userName = extractName(respondentData, "respondent");
                                            designation = "Accused";
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                
                // Check advocate details if not found yet
                if (userName == null) {
                    JsonNode advocateDetails = additionalDetails.has("advocateDetails") ? additionalDetails.get("advocateDetails") : null;
                    if (advocateDetails != null && advocateDetails.has("formdata")) {
                        JsonNode formData = advocateDetails.get("formdata");
                        if (formData.isArray() && !formData.isEmpty()) {
                            JsonNode advocateData = formData.get(0).get("data");
                            if (advocateData != null) {
                                JsonNode multipleAdvocates = advocateData.has("multipleAdvocatesAndPip") ? advocateData.get("multipleAdvocatesAndPip") : null;
                                if (multipleAdvocates != null) {
                                    // Check boxComplainant (complainant's advocate)
                                    JsonNode boxComplainant = multipleAdvocates.has("boxComplainant") ? multipleAdvocates.get("boxComplainant") : null;
                                    if (boxComplainant != null) {
                                        String mobile = boxComplainant.has("mobileNumber") ? boxComplainant.get("mobileNumber").asText() : null;
                                        if (mobile != null && mobile.equals(request.getMobileNumber())) {
                                            userName = extractName(boxComplainant, "advocate");
                                            designation = "Advocate";
                                        }
                                    }
                                    
                                    // Check multiple advocate name details
                                    if (userName == null && multipleAdvocates.has("multipleAdvocateNameDetails")) {
                                        JsonNode advocateNameDetails = multipleAdvocates.get("multipleAdvocateNameDetails");
                                        if (advocateNameDetails.isArray()) {
                                            for (JsonNode advocateDetail : advocateNameDetails) {
                                                JsonNode advocateNameData = advocateDetail.get("advocateNameDetails");
                                                if (advocateNameData != null) {
                                                    String mobile = advocateNameData.has("advocateMobileNumber") ? advocateNameData.get("advocateMobileNumber").asText() : null;
                                                    if (mobile != null && mobile.equals(request.getMobileNumber())) {
                                                        userName = extractName(advocateNameData, "advocate");
                                                        designation = "Advocate";
                                                        break;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // Check POA holders if not found yet
                if(userName == null){
                    List<String> uuids = new ArrayList<>();
                    if (courtCase.getPoaHolders() != null && !courtCase.getPoaHolders().isEmpty()) {
                        for (POAHolder poaHolder : courtCase.getPoaHolders()) {
                            if (poaHolder.getAdditionalDetails() != null) {
                                try {
                                    JsonNode additionalDetailsNode = objectMapper.valueToTree(poaHolder.getAdditionalDetails());
                                    if (additionalDetailsNode.has("uuid") && additionalDetailsNode.get("uuid") != null) {
                                        String uuid = additionalDetailsNode.get("uuid").asText();
                                        if (!uuid.isEmpty()) {
                                            uuids.add(uuid);
                                        }
                                    }
                                } catch (Exception e) {
                                    log.warn("Failed to extract UUID from POA holder additional details: {}", e.getMessage());
                                }
                            }
                        }
                    }

                    if (!uuids.isEmpty()) {
                        List<String> uuidList = new ArrayList<>(uuids);
                        List<Individual> individuals = individualService.getIndividuals(request.getRequestInfo(), uuidList);

                        for (Individual ind : individuals) {
                            if (ind.getMobileNumber() != null && ind.getMobileNumber().equalsIgnoreCase(request.getMobileNumber())) {
                                log.info("Mobile number matched for POA holder UUID: {}", ind.getUserUuid());

                                userName = extractNameFromIndividual(ind);
                                designation = "POA";
                                break;
                            }
                        }
                    }
                }

                // Check advocate offices if not found yet
                if(userName == null){
                    List<String> uuids = new ArrayList<>();
                    if (courtCase.getAdvocateOffices() != null && !courtCase.getAdvocateOffices().isEmpty()) {
                        for (AdvocateOffice advocateOffice : courtCase.getAdvocateOffices()) {
                            // Add office advocate UUID if present
                            if (advocateOffice.getOfficeAdvocateUserUuid() != null && !advocateOffice.getOfficeAdvocateUserUuid().isEmpty()) {
                                uuids.add(advocateOffice.getOfficeAdvocateUserUuid());
                            }

                            // Add advocate member UUIDs
                            if (advocateOffice.getAdvocates() != null && !advocateOffice.getAdvocates().isEmpty()) {
                                for (AdvocateOfficeMember advocate : advocateOffice.getAdvocates()) {
                                    if (advocate.getMemberUserUuid() != null && !advocate.getMemberUserUuid().isEmpty()) {
                                        uuids.add(advocate.getMemberUserUuid());
                                    }
                                }
                            }

                            // Add clerk member UUIDs
                            if (advocateOffice.getClerks() != null && !advocateOffice.getClerks().isEmpty()) {
                                for (AdvocateOfficeMember clerk : advocateOffice.getClerks()) {
                                    if (clerk.getMemberUserUuid() != null && !clerk.getMemberUserUuid().isEmpty()) {
                                        uuids.add(clerk.getMemberUserUuid());
                                    }
                                }
                            }
                        }
                    }

                    if (!uuids.isEmpty()) {
                        List<String> uuidList = new ArrayList<>(uuids);
                        List<Individual> individuals = individualService.getIndividuals(request.getRequestInfo(), uuidList);

                        for (Individual ind : individuals) {
                            if (ind.getMobileNumber() != null && ind.getMobileNumber().equalsIgnoreCase(request.getMobileNumber())) {
                                log.info("Mobile number matched for advocate office UUID: {}", ind.getUserUuid());

                                userName = extractNameFromIndividual(ind);
                                designation = "advocate";
                                break;
                            }
                        }
                    }
                }
            }

            return ValidateUserInfo.builder()
                    .userName(userName)
                    .designation(designation)
                    .mobileNumber(request.getMobileNumber())
                    .filingNumber(request.getFilingNumber())
                    .courtId(request.getCourtId())
                    .build();

        } catch (Exception e) {
            log.error("Error validating user for CTC application: {}", e.toString());
            throw new CustomException("VALIDATE_USER_ERROR", "Error validating user: " + e.getMessage());
        }
    }
    
    private String extractName(JsonNode data, String type) {
        String firstName = null;
        String middleName = null;
        String lastName = null;
        
        if (type.equals("complainant")) {
            firstName = data.has("complainantFirstName") ? data.get("complainantFirstName").asText() : null;
            middleName = data.has("complainantMiddleName") ? data.get("complainantMiddleName").asText() : null;
            lastName = data.has("complainantLastName") ? data.get("complainantLastName").asText() : null;
        } else if (type.equals("respondent")) {
            firstName = data.has("respondentFirstName") ? data.get("respondentFirstName").asText() : null;
            middleName = data.has("respondentMiddleName") ? data.get("respondentMiddleName").asText() : null;
            lastName = data.has("respondentLastName") ? data.get("respondentLastName").asText() : null;
        } else if (type.equals("advocate")) {
            firstName = data.has("firstName") ? data.get("firstName").asText() : null;
            middleName = data.has("middleName") ? data.get("middleName").asText() : null;
            lastName = data.has("lastName") ? data.get("lastName").asText() : null;
        }
        
        return (firstName != null ? firstName : "") +
               (middleName != null ? " " + middleName : "") +
               (lastName != null ? " " + lastName : "");
    }
    
    private String extractNameFromIndividual(Individual individual) {
        if (individual == null || individual.getName() == null) {
            return "";
        }
        
        String givenName = individual.getName().getGivenName();
        String otherNames = individual.getName().getOtherNames();
        String familyName = individual.getName().getFamilyName();
        
        return (givenName != null ? givenName : "") +
               (otherNames != null ? " " + otherNames : "") +
               (familyName != null ? " " + familyName : "");
    }
}
