package digit.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import digit.config.Configuration;
import digit.enrichment.BailRegistrationEnrichment;
import digit.kafka.Producer;
import digit.repository.BailRepository;
import digit.util.CaseUtil;
import digit.util.EncryptionDecryptionUtil;
import digit.validator.BailValidator;
import digit.web.models.*;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.ObjectUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static digit.config.ServiceConstants.E_SIGN;
import static digit.config.ServiceConstants.E_SIGN_COMPLETE;
import static digit.config.ServiceConstants.PENDING_E_SIGN;

@Service
@Slf4j
public class BailService {

    private final BailValidator validator;
    private final BailRegistrationEnrichment enrichmentUtil;
    private final Producer producer;
    private final Configuration config;
    private final WorkflowService workflowService;
    private final BailRepository bailRepository;
    private final EncryptionDecryptionUtil encryptionDecryptionUtil;
    private final ObjectMapper objectMapper;

    @Autowired
    public BailService(BailValidator validator, BailRegistrationEnrichment enrichmentUtil, Producer producer, Configuration config, WorkflowService workflowService, BailRepository bailRepository, EncryptionDecryptionUtil encryptionDecryptionUtil, ObjectMapper objectMapper) {
        this.validator = validator;
        this.enrichmentUtil = enrichmentUtil;
        this.producer = producer;
        this.config = config;
        this.workflowService = workflowService;
        this.bailRepository = bailRepository;
        this.encryptionDecryptionUtil = encryptionDecryptionUtil;
        this.objectMapper = objectMapper;
    }


    // add document comment and logs
    public Bail createBail(BailRequest bailRequest) {

        // Validation
        validator.validateBailRegistration(bailRequest);

        // Enrichment
        enrichmentUtil.enrichBailOnCreation(bailRequest);

        // Workflow update
        workflowService.updateWorkflowStatus(bailRequest);

        Bail originalBail = bailRequest.getBail();

        Bail encryptedBail = encryptionDecryptionUtil.encryptObject(originalBail, config.getBailEncrypt(), Bail.class);
        bailRequest.setBail(encryptedBail);

        producer.push(config.getBailCreateTopic(), bailRequest);

        return originalBail;
    }

    public Bail updateBail(BailRequest bailRequest) {

        // Check if bail exists
        validator.validateBailExists(bailRequest);

        // Enrich new sureties if any
        enrichmentUtil.enrichBailUponUpdate(bailRequest);

        Boolean lastSigned = checkItsLastSign(bailRequest);
        workflowService.updateWorkflowStatus(bailRequest);
        try {
            if (lastSigned) {
                log.info("Updating Bail Workflow");
                WorkflowObject workflowObject = new WorkflowObject();
                workflowObject.setAction(E_SIGN_COMPLETE);

                bailRequest.getBail().setWorkflow(workflowObject);
                workflowService.updateWorkflowStatus(bailRequest);
            }
        } catch (Exception e) {
            log.error("Error updating bail workflow", e);
        }

        Bail originalBail = bailRequest.getBail();

        Bail encryptedBail = encryptionDecryptionUtil.encryptObject(originalBail, config.getBailEncrypt(), Bail.class);
        bailRequest.setBail(encryptedBail);

        producer.push(config.getBailUpdateTopic(), bailRequest);

        return originalBail;
    }

    private Boolean checkItsLastSign(BailRequest bailRequest) {

        // Check only if action is E-SIGN
        String action = bailRequest.getBail().getWorkflow().getAction();

        if (E_SIGN.equalsIgnoreCase(action)) {
            if (!bailRequest.getBail().getLitigantSigned()) {
                log.info("Litigant has not signed");
                return false;
            }
            boolean allSuretiesSigned = false;
            if (!ObjectUtils.isEmpty(bailRequest.getBail().getSureties())) {
                allSuretiesSigned = bailRequest.getBail().getSureties().stream()
                        .allMatch(Surety::getHasSigned);
            }
            if (!allSuretiesSigned) {
                log.info("Some sureties have not signed");
                return false;
            }

            log.info("All sureties and litigant have signed");
            return true;
        } else {
            return false;
        }
    }

    public List<Bail> searchBail(BailSearchRequest bailSearchRequest) {
        try {
            log.info("Starting bail search with parameters :: {}", bailSearchRequest);
            List<Bail> bailList = bailRepository.getBails(bailSearchRequest);
            List<Bail> decryptedBailList = new ArrayList<>();
            bailList.forEach(bail -> {
                decryptedBailList.add(encryptionDecryptionUtil.decryptObject(bail, config.getBailDecrypt(), Bail.class, bailSearchRequest.getRequestInfo()));
            });
            return decryptedBailList;

        } catch (Exception e) {
            log.error("Error while fetching to search results {}", e.toString());
            throw new CustomException("BAIL_SEARCH_ERR", e.getMessage());
        }
    }

    public void updateCaseNumberBail(Map<String, Object> body) {
        try {
            log.info("operation=updateCaseNumberBail, status=IN_PROGRESS, filingNumber={}", body.get("filingNumber").toString());
            RequestInfo requestInfo = objectMapper.convertValue(body.get("requestInfo"), RequestInfo.class);
            String filingNumber = body.get("filingNumber").toString();
            BailSearchRequest request = BailSearchRequest.builder()
                    .requestInfo(requestInfo)
                    .criteria(BailSearchCriteria.builder().filingNumber(filingNumber).build())
                    .build();
            List<Bail> bailList = searchBail(request);
            for (Bail bail : bailList) {
                bail.setCnrNumber(body.get("cnrNumber") != null ? body.get("cnrNumber").toString() : null);
                if (body.get("courtCaseNumber") != null) {
                    bail.setCaseNumber(body.get("courtCaseNumber").toString());
                } else if (body.get("cmpNumber") != null) {
                    bail.setCaseNumber(body.get("cmpNumber").toString());
                } else {
                    bail.setCaseNumber(filingNumber);
                }
                BailRequest bailRequest = BailRequest.builder()
                        .requestInfo(requestInfo)
                        .bail(bail)
                        .build();
                updateBail(bailRequest);
            }
            log.info("operation=updateCaseNumberBail, status=SUCCESS, filingNumber={}", body.get("filingNumber").toString());
        } catch (Exception e) {
            log.info("operation=updateCaseNumberBail, status=FAILURE, filingNumber={}", body.get("filingNumber").toString());
            throw new CustomException("Error updating case number: {}", e.getMessage());
        }
    }
}
