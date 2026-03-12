package org.pucar.dristi.validators;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.ServiceConstants;
import org.pucar.dristi.repository.CtcApplicationRepository;
import org.pucar.dristi.util.CaseUtil;
import org.pucar.dristi.web.models.*;
import org.pucar.dristi.web.models.courtcase.AdvocateMapping;
import org.pucar.dristi.web.models.courtcase.CourtCase;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

import static org.pucar.dristi.config.ServiceConstants.*;

@Component
@Slf4j
public class CtcApplicationValidator {

    private final CaseUtil caseUtil;
    private final ObjectMapper objectMapper;
    private final CtcApplicationRepository ctcApplicationRepository;

    @Autowired
    public CtcApplicationValidator(CaseUtil caseUtil, ObjectMapper objectMapper, CtcApplicationRepository ctcApplicationRepository) {
        this.caseUtil = caseUtil;
        this.objectMapper = objectMapper;
        this.ctcApplicationRepository = ctcApplicationRepository;
    }

    public void validateCreateRequest(CtcApplicationRequest request) {

        if (request == null) {
            throw new CustomException(ServiceConstants.CTC_VALIDATION_EXCEPTION, "Request cannot be null");
        }

        if (request.getCtcApplication() == null) {
            throw new CustomException(ServiceConstants.CTC_VALIDATION_EXCEPTION, "CTC Application cannot be null");
        }

        validateAndEnrichUser(request.getRequestInfo(), request.getCtcApplication());

    }

    public void validateUpdateRequest(CtcApplicationRequest request) {
        CtcApplication application = request.getCtcApplication();
        if (application.getCtcApplicationNumber() == null || application.getCtcApplicationNumber().isEmpty()) {
            throw new CustomException(ServiceConstants.CTC_VALIDATION_EXCEPTION, "CTC Application Number cannot be null or empty");
        }
        CtcApplicationSearchRequest ctcApplicationSearchRequest = new CtcApplicationSearchRequest();
        ctcApplicationSearchRequest.setCriteria(CtcApplicationSearchCriteria.builder().ctcApplicationNumber(application.getCtcApplicationNumber()).build());
        ctcApplicationSearchRequest.setPagination(Pagination.builder().limit(1.0).offSet(0.0).build());
        ctcApplicationSearchRequest.setRequestInfo(request.getRequestInfo());

        // Check if application exists
        List<CtcApplication> existingApplication = ctcApplicationRepository.getCtcApplication(ctcApplicationSearchRequest);
        if (existingApplication == null || existingApplication.isEmpty()) {
            throw new CustomException(ServiceConstants.CTC_APPLICATION_UPDATE_EXCEPTION, "CTC application not found with ID: " + application.getId());
        }

        if (existingApplication.get(0) != null && request.getCtcApplication() != null) {

            Boolean existingIsParty = existingApplication.get(0).getIsPartyToCase();
            Boolean requestIsParty = request.getCtcApplication().getIsPartyToCase();

            if (!java.util.Objects.equals(existingIsParty, requestIsParty)) {
                request.getCtcApplication().setIsPartyToCase(existingIsParty);
            }

            if (existingApplication.get(0).getCaseBundles() != null && !existingApplication.get(0).getCaseBundles().isEmpty()) {
                request.getCtcApplication().setCaseBundles(existingApplication.get(0).getCaseBundles());
            }
        }
    }

    public void validateAndEnrichUser(RequestInfo requestInfo, CtcApplication application) {

        try {

            boolean isAdvocate = requestInfo.getUserInfo().getRoles().stream()
                    .anyMatch(role -> role.getCode().equals(ADVOCATE_ROLE));

            CourtCase courtCase = caseUtil.getCase(application.getFilingNumber(), application.getCourtId(), requestInfo);

            if (courtCase == null) {
                application.setPartyDesignation(null);
                application.setIsPartyToCase(false);
                return;
            }

            UserMatchResult result = findUser(requestInfo, courtCase, isAdvocate);

            if (result != null) {
                application.setApplicantName(result.name());
                application.setPartyDesignation(result.designation());
                application.setIsPartyToCase(true);
            }

        } catch (Exception e) {
            log.error("Error validating user", e);
            throw new CustomException("VALIDATE_USER_ERROR", e.getMessage());
        }
    }


    private UserMatchResult findUser(RequestInfo requestInfo, CourtCase courtCase, boolean isAdvocate) {

        if (isAdvocate) {
                    UserMatchResult result = findUserFromAdvocate(requestInfo, courtCase);
                    if (result != null) {
                        return result;
                    }
                    return findUserFromPoaHolder(requestInfo, courtCase);
        } else {
            // non advocate
                    UserMatchResult result = findUserFromLitigant(requestInfo, courtCase);
                    if (result != null) {
                        return result;
                    }
                    return findUserFromPoaHolder(requestInfo, courtCase);
        }
    }

    private UserMatchResult findUserFromLitigant(RequestInfo requestInfo, CourtCase courtCase) {

        String userUuid = requestInfo.getUserInfo().getUuid();

        Map<String, String> complainantUuids = caseUtil.extractComplainantUuids(courtCase);
        if (complainantUuids.containsKey(userUuid)) {
            return new UserMatchResult(complainantUuids.get(userUuid), COMPLAINANT);
        }

        Map<String, String> respondentUuids = caseUtil.extractRespondentUuids(courtCase);
        if (respondentUuids.containsKey(userUuid)) {
            return new UserMatchResult(respondentUuids.get(userUuid), ACCUSED);
        }

        return null;
    }

    private UserMatchResult findUserFromAdvocate(RequestInfo requestInfo, CourtCase courtCase) {
        try {

            log.info("inside findUserFromAdvocate");

            List<AdvocateMapping> advocateMappings = courtCase.getRepresentatives();

            if (advocateMappings != null && !advocateMappings.isEmpty()) {

                String advocateUserUuid = requestInfo.getUserInfo().getUuid();

                for (AdvocateMapping advocateMapping : advocateMappings) {
                    log.info("advocateMapping: {}", advocateMapping);
                    JsonNode additionalDetails = objectMapper.convertValue(advocateMapping.getAdditionalDetails(), JsonNode.class);
                    String advocateName = additionalDetails.path(ADVOCATE_NAME).asText(null);
                    String advocateUserUuidFromAdditionalDetails = additionalDetails.path(ADVOCATE_UUID).asText(null);
                    if (advocateUserUuidFromAdditionalDetails != null && advocateUserUuidFromAdditionalDetails.equals(advocateUserUuid)) {
                        return new UserMatchResult(advocateName, ADVOCATE);
                    }
                }
            } else {
                log.info("advocateMappings is null or empty skipping findUserFromAdvocate");
                return null;
            }
        } catch (Exception e) {
            log.error("Error in findUserFromAdvocate", e);
            return null;
        }
        return null;
    }

    private UserMatchResult findUserFromPoaHolder(RequestInfo requestInfo, CourtCase courtCase) {

        Map<String, String> uuidsNameMapping = caseUtil.extractPoaHolderUuids(courtCase);

        String userUuid = requestInfo.getUserInfo().getUuid();

        if (uuidsNameMapping.containsKey(userUuid)) {
            return new UserMatchResult(uuidsNameMapping.get(userUuid), POA);
        }
        return null;
    }

    private record UserMatchResult(String name, String designation) {
    }
}
