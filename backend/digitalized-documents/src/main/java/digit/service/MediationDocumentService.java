package digit.service;

import digit.config.Configuration;
import digit.enrichment.MediationEnrichment;
import digit.kafka.Producer;
import digit.validators.MediationDocumentValidator;
import digit.web.models.*;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.Role;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.ObjectUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static digit.config.ServiceConstants.*;

/**
 * Service for processing MEDIATION type documents
 */
@Service
@Slf4j
public class MediationDocumentService implements DocumentTypeService {

    private final MediationDocumentValidator validator;

    private final MediationEnrichment enrichment;

    private final Producer producer;

    private final Configuration configuration;

    private final WorkflowService workflowService;

    @Autowired
    public MediationDocumentService(MediationDocumentValidator validator, MediationEnrichment enrichment, Producer producer, Configuration configuration, WorkflowService workflowService) {
        this.validator = validator;
        this.enrichment = enrichment;
        this.producer = producer;
        this.configuration = configuration;
        this.workflowService = workflowService;
    }

    @Override
    public DigitalizedDocument createDocument(DigitalizedDocumentRequest documentRequest) {

        log.info("operation = createDocument ,  result = IN_PROGRESS");

        DigitalizedDocument document = documentRequest.getDigitalizedDocument();

        validator.validateCreateMediationDocument(document);

        enrichment.enrichCreateMediationDocument(documentRequest);

        workflowService.updateWorkflowStatus(documentRequest);

        producer.push(configuration.getMediationDigitalizedDocumentCreateTopic(), documentRequest);

        log.info("operation = createDocument ,  result = SUCCESS");
        return document;
    }

    @Override
    public DigitalizedDocument updateDocument(DigitalizedDocumentRequest request) {

        log.info("operation = updateDocument, result = IN_PROGRESS");

        DigitalizedDocument document = request.getDigitalizedDocument();

        WorkflowObject workflow = document.getWorkflow();

        validator.validateUpdateMediationDocument(document);

        enrichment.enrichUpdateMediationDocument(request);

        handleEditAction(document);

        handleSubmitAndSkipSignAction(document);

        boolean isLastSign = isLastSignature(document);

        if (!ObjectUtils.isEmpty(workflow)) {
            if (!isLastSign) {
                List<String> assignees = computeAssignees(document.getMediationDetails());
            }
            workflowService.updateWorkflowStatus(request);
        }

        try {
            if (isLastSign) {
                completeSigningWorkflow(request, document);
            }
        } catch (Exception e) {
            log.error("Error updating mediation document workflow", e);
            throw new CustomException(WORKFLOW_SERVICE_EXCEPTION, e.getMessage());
        }

        producer.push(configuration.getMediationDigitalizedDocumentUpdateTopic(), request);

        log.info("operation = updateDocument, result = SUCCESS");

        return document;
    }

    private List<String> computeAssignees(@Valid MediationDetails mediationDetails) {

        List<String> assignees = new ArrayList<>();

        if (ObjectUtils.isEmpty(mediationDetails.getPartyDetails())) {
            return assignees;
        }

        assignees = mediationDetails.getPartyDetails().stream()
                .filter(party -> Boolean.FALSE.equals(party.getHasSigned()))
                .flatMap(party -> Stream.of(party.getUniqueId(), party.getPoaUuid()))
                .filter(Objects::nonNull)  // Remove null values
                .collect(Collectors.toList());

        return assignees;
    }

    private void handleEditAction(DigitalizedDocument document) {

        WorkflowObject workflow = document.getWorkflow();
        if (workflow == null) return;

        if (EDIT.equalsIgnoreCase(workflow.getAction())) {
            document.getMediationDetails()
                    .getPartyDetails()
                    .forEach(party -> party.setHasSigned(false));
        }
    }

    private void handleSubmitAndSkipSignAction(DigitalizedDocument document) {

        WorkflowObject workflow = document.getWorkflow();
        if (workflow == null) return;

        if (SKIP_SIGN_AND_SUBMIT.equalsIgnoreCase(workflow.getAction())) {
            List<MediationPartyDetails> signedPartyDetails = document.getMediationDetails().getPartyDetails().stream().filter(MediationPartyDetails::getHasSigned).toList();
            if (signedPartyDetails.isEmpty()) {
                throw new CustomException(INVALID_MEDIATION_DETAILS, "No party details found signed to perform skip sign and submit action: " + document.getId());
            }
        }
    }

    private boolean isLastSignature(DigitalizedDocument document) {

        WorkflowObject workflow = document.getWorkflow();

        if (workflow == null || !E_SIGN.equalsIgnoreCase(workflow.getAction())) {
            log.info("Workflow action is not E_SIGN for document: {}", document.getId());
            return false;
        }

        if (document.getMediationDetails() == null ||
                ObjectUtils.isEmpty(document.getMediationDetails().getPartyDetails())) {
            log.info("No party details found for mediation document: {}", document.getId());
            return false;
        }

        boolean allSigned = document.getMediationDetails()
                .getPartyDetails()
                .stream()
                .allMatch(p -> Boolean.TRUE.equals(p.getHasSigned()));

        if (!allSigned) {
            log.info("Not all parties have signed for mediation document: {}", document.getId());
            return false;
        }

        log.info("All parties have signed for mediation document: {}", document.getId());
        return true;
    }

    private void completeSigningWorkflow(DigitalizedDocumentRequest request, DigitalizedDocument document) {

        log.info("All parties signed. Completing mediation document workflow");

        WorkflowObject completedWorkflow = new WorkflowObject();
        completedWorkflow.setAction(E_SIGN_COMPLETE);
        document.setWorkflow(completedWorkflow);

        addSystemRole(request);

        workflowService.updateWorkflowStatus(request);
    }

    private void addSystemRole(DigitalizedDocumentRequest request) {
        request.getRequestInfo()
                .getUserInfo()
                .getRoles()
                .add(
                        Role.builder()
                                .id(123L)
                                .code(SYSTEM)
                                .name(SYSTEM)
                                .tenantId(request.getDigitalizedDocument().getTenantId())
                                .build()
                );
    }


}
