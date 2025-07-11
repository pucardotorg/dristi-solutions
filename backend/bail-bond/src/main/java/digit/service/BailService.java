package digit.service;

import digit.config.Configuration;
import digit.enrichment.BailRegistrationEnrichment;
import digit.kafka.Producer;
import digit.util.CaseUtil;
import digit.validator.BailValidator;
import digit.web.models.Bail;
import digit.web.models.BailRequest;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import static digit.config.ServiceConstants.E_SIGN;

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

        // Workflow update
        workflowService.updateWorkflowStatus(bailRequest);

        Boolean lastSigned = checkItsLastSign(bailRequest);

        producer.push(config.getBailUpdateTopic(), bailRequest);

        return bailRequest.getBail();
    }

    private Boolean checkItsLastSign(BailRequest bailRequest) {

        if (E_SIGN.equalsIgnoreCase(bailRequest.getBail().getWorkflow().getAction())) {


            return true;

        }
        log.info("Method=checkItsLastSign, Result= SUCCESS, Not last e-sign for case {}", bailRequest.getBail().getId());
        return false;
    }
}
