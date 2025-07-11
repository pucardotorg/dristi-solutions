package digit.service;

import digit.config.Configuration;
import digit.enrichment.BailRegistrationEnrichment;
import digit.kafka.Producer;
import digit.util.CaseUtil;
import digit.validator.BailValidator;
import digit.web.models.Bail;
import digit.web.models.BailRequest;
import digit.web.models.Surety;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.ObjectUtils;

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
        enrichmentUtil.enrichSureties(bailRequest);


        Boolean lastSigned = checkItsLastSign(bailRequest);
        if (lastSigned) {
            bailRequest.getBail().getWorkflow().setAction(E_SIGN_COMPLETE);
        }


        // Workflow update
        workflowService.updateWorkflowStatus(bailRequest);

        producer.push(config.getBailUpdateTopic(), bailRequest);

        return bailRequest.getBail();
    }

    private Boolean checkItsLastSign(BailRequest bailRequest) {
        boolean allSuretiesSigned = false;
        if(bailRequest.getBail()==null) return false;
        if(!ObjectUtils.isEmpty(bailRequest.getBail().getSureties())){
            allSuretiesSigned = bailRequest.getBail().getSureties().stream()
                    .allMatch(Surety::getHasSigned);
        }
        if(!allSuretiesSigned){
            log.info("Some sureties have not signed");
            return false;
        }
        if(!bailRequest.getBail().getLitigantSigned()){
            log.info("Litigant has not signed");
            return false;
        }
        log.info("All sureties and litigant have signed");
        return true;
    }
}
