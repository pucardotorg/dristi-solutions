package digit.validators;

import com.fasterxml.jackson.databind.ObjectMapper;
import digit.web.models.*;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import digit.config.Configuration;
import digit.repository.BailRepository;
import digit.service.IndividualService;
import digit.util.CaseUtil;
import digit.util.FileStoreUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.util.ObjectUtils;

import java.util.*;

import static digit.config.ServiceConstants.*;

@Component
@Slf4j
public class BailRegistrationValidator {
    private final IndividualService individualService;
    private final FileStoreUtil fileStoreUtil;
    private final CaseUtil caseUtil;
    private final BailRepository bailRepository;

    @Autowired
    public BailRegistrationValidator(
            IndividualService individualService,
            FileStoreUtil fileStoreUtil,
            CaseUtil caseUtil,
            BailRepository bailRepository) {
        this.individualService = individualService;
        this.fileStoreUtil = fileStoreUtil;
        this.caseUtil = caseUtil;
        this.bailRepository = bailRepository;
    }

    /**
     * @param bailRequest bail application request
     * @throws CustomException VALIDATION_EXCEPTION -> if tenantId or caseId not present
     *                         ILLEGAL_ARGUMENT_EXCEPTION_CODE-> if individualId doesn't exist
     */
    public void validateBailRegistration(BailRequest bailRequest) throws CustomException {
        RequestInfo requestInfo = bailRequest.getRequestInfo();
        Bail bail = bailRequest.getBail();

        // Validate userInfo and tenantId
        baseValidations(requestInfo);

        // Validate accusedId, advocateId, suretyIds
        validateIndividualExistence(requestInfo, bail);

        // Validate case existence
        validateCaseExistence(requestInfo, bail);

        // Validate documents
        validateDocuments(bail);
    }

    private void baseValidations(RequestInfo requestInfo) {
        if (requestInfo.getUserInfo() == null || requestInfo.getUserInfo().getTenantId() == null)
            throw new CustomException(VALIDATION_EXCEPTION, "User info not found!!!");
    }

    private void validateIndividualExistence(RequestInfo requestInfo, Bail bail) {
        if (ObjectUtils.isEmpty(bail.getAccusedId()))
            throw new CustomException(ILLEGAL_ARGUMENT_EXCEPTION_CODE, "accusedId is mandatory for bail");
        if (!individualService.searchIndividual(requestInfo, bail.getAccusedId(), new HashMap<>()))
            throw new CustomException(INDIVIDUAL_NOT_FOUND, "Accused not found or does not exist. ID: " + bail.getAccusedId());

        if (!ObjectUtils.isEmpty(bail.getAdvocateId())) {
            if (!individualService.searchIndividual(requestInfo, bail.getAdvocateId(), new HashMap<>()))
                throw new CustomException(INDIVIDUAL_NOT_FOUND, "Advocate not found or does not exist. ID: " + bail.getAdvocateId());
        }

        if (bail.getSuretyIds() != null && !bail.getSuretyIds().isEmpty()) {
            // TODO:Validate suretyIds using Suretyutil
        }
    }

    private void validateCaseExistence(RequestInfo requestInfo, Bail bail) {
        if (ObjectUtils.isEmpty(bail.getCaseId()))
            throw new CustomException(VALIDATION_EXCEPTION, "caseId is mandatory for bail");
        CaseExistsRequest caseExistsRequest = createCaseExistsRequest(requestInfo, bail);
        CaseExistsResponse caseExistsResponse = caseUtil.fetchCaseDetails(caseExistsRequest);
        caseExistsResponse.getCriteria().forEach(caseExists -> {
            if (!caseExists.getExists()) {
                String error = " does not exist ";
                if (caseExists.getCaseId() != null) error = "CaseId: " + caseExists.getCaseId() + error;
                else error = "Error while validating caseId";
                throw new CustomException(VALIDATION_EXCEPTION, error);
            }
        });
    }

    private void validateDocuments(Bail bail) {
        if (bail.getDocuments() != null && !bail.getDocuments().isEmpty()) {
            for (Document document : bail.getDocuments()) {
                if (document.getFileStore() != null) {
                    if (!fileStoreUtil.doesFileExist(bail.getTenantId(), document.getFileStore()))
                        throw new CustomException(INVALID_FILESTORE_ID, INVALID_DOCUMENT_DETAILS);
                } else
                    throw new CustomException(INVALID_FILESTORE_ID, INVALID_DOCUMENT_DETAILS);
            }
        }
    }

    /**
     * @param bail bail details
     * @throws CustomException VALIDATION_EXCEPTION -> if bail is not present
     */
    public Bail validateBailExistence(Bail bail) {
        try {
            List<Bail> existingBails = bailRepository.checkBailExist(bail);
            log.info("Existing Bail :: {}", existingBails);
            if (existingBails.isEmpty())
                throw new CustomException(VALIDATION_EXCEPTION, "Bail does not exist");
            validateDocuments(bail);

            return existingBails.get(0);

        } catch (CustomException e) {
            log.error("Custom Exception occurred while verifying bail existence");
            throw e;
        } catch (Exception e) {
            log.error("Error occurred while verifying bail existence");
            throw new CustomException(BAIL_SEARCH_EXCEPTION, "Error occurred while searching bail: " + e.getMessage());
        }
    }





    public CaseExistsRequest createCaseExistsRequest(RequestInfo requestInfo, Bail bail) {
        CaseExistsRequest caseExistsRequest = new CaseExistsRequest();
        caseExistsRequest.setRequestInfo(requestInfo);
        List<CaseExists> criteriaList = new ArrayList<>();
        CaseExists caseExists = new CaseExists();
        caseExists.setFilingNumber(bail.getCaseId());
        criteriaList.add(caseExists);
        caseExistsRequest.setCriteria(criteriaList);
        return caseExistsRequest;
    }
}

