package digit.service;

import digit.config.Configuration;
import digit.enrichment.BailRegistrationEnrichment;
import digit.kafka.Producer;
import digit.repository.BailRepository;
import digit.util.CaseUtil;
import digit.validator.BailValidator;
import digit.web.models.*;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.ObjectUtils;

import java.util.ArrayList;
import java.util.List;

import static digit.config.ServiceConstants.E_SIGN;
import static digit.config.ServiceConstants.E_SIGN_COMPLETE;
import static digit.config.ServiceConstants.PENDING_E_SIGN;

@Service
@Slf4j
@AllArgsConstructor
public class BailService {

    private final BailValidator validator;
    private final BailRegistrationEnrichment enrichmentUtil;
    private final Producer producer;
    private final Configuration config;
    private final WorkflowService workflowService;
    private final CaseUtil caseUtil;
    private final BailRepository bailRepository;


    // add document comment and logs
    public Bail createBail(BailRequest bailRequest) {

        // Validation
        validator.validateBailRegistration(bailRequest);

        // Enrichment
        enrichmentUtil.enrichBailOnCreation(bailRequest);

        // Workflow update
        workflowService.updateWorkflowStatus(bailRequest);

        producer.push(config.getBailCreateTopic(), bailRequest);

        return bailRequest.getBail();
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

        // Workflow update
        producer.push(config.getBailUpdateTopic(), bailRequest);

        return bailRequest.getBail();
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
            return bailRepository.getBails(bailSearchRequest);
        } catch (Exception e) {
            log.error("Error while fetching to search results {}", e.toString());
            throw new CustomException("BAIL_SEARCH_ERR", e.getMessage());
        }
    }
}
