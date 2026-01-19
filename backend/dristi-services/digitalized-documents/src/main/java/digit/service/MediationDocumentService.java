package digit.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import digit.config.Configuration;
import digit.enrichment.MediationEnrichment;
import digit.kafka.Producer;
import digit.util.FileStoreUtil;
import digit.validators.MediationDocumentValidator;
import digit.web.models.*;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.Role;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.ObjectUtils;

import java.util.*;
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

    private final FileStoreUtil fileStoreUtil;

    private final ObjectMapper objectMapper;


    @Autowired
    public MediationDocumentService(MediationDocumentValidator validator, MediationEnrichment enrichment, Producer producer, Configuration configuration, WorkflowService workflowService, FileStoreUtil fileStoreUtil, ObjectMapper objectMapper) {
        this.validator = validator;
        this.enrichment = enrichment;
        this.producer = producer;
        this.configuration = configuration;
        this.workflowService = workflowService;
        this.fileStoreUtil = fileStoreUtil;
        this.objectMapper = objectMapper;
    }

    @Override
    public DigitalizedDocument createDocument(DigitalizedDocumentRequest documentRequest) {

        log.info("operation = createDocument ,  result = IN_PROGRESS");

        DigitalizedDocument document = documentRequest.getDigitalizedDocument();

        validator.validateCreateMediationDocument(document);

        enrichment.enrichCreateMediationDocument(documentRequest);

        if (!ObjectUtils.isEmpty(document.getWorkflow()) && 
                INITIATE_E_SIGN.equalsIgnoreCase(document.getWorkflow().getAction())) {
            List<String> assignees = computeAssignees(document.getMediationDetails());
            documentRequest.getDigitalizedDocument().getWorkflow().setAssignes(assignees);
            updateWorkflowAdditionalDetails(documentRequest.getDigitalizedDocument().getWorkflow(), document.getMediationDetails());
        }

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

        DigitalizedDocument existingDocument = validator.validateUpdateMediationDocument(document);

        enrichment.enrichUpdateMediationDocument(request);

        handleEditAction(document);

        handleSubmitAndSkipSignAction(document);

        boolean isLastSign = isLastSignature(document);

        if (!ObjectUtils.isEmpty(workflow)) {
            if (!isLastSign) {
                if (INITIATE_E_SIGN.equalsIgnoreCase(workflow.getAction()) || E_SIGN.equalsIgnoreCase(workflow.getAction())) {
                    List<String> assignees = computeAssignees(document.getMediationDetails());
                    request.getDigitalizedDocument().getWorkflow().setAssignes(assignees);
                    updateWorkflowAdditionalDetails(request.getDigitalizedDocument().getWorkflow(), document.getMediationDetails());
                }
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

        List<String> fileStoreIdsToDelete = extractInactiveFileStoreIds(request,existingDocument);

        if (!fileStoreIdsToDelete.isEmpty()) {
            fileStoreUtil.deleteFilesByFileStore(fileStoreIdsToDelete, request.getDigitalizedDocument().getTenantId());
            log.info("Deleted files for ids: {}", fileStoreIdsToDelete);
        }

        producer.push(configuration.getMediationDigitalizedDocumentUpdateTopic(), request);

        log.info("operation = updateDocument, result = SUCCESS");

        return document;
    }

    public List<String> extractInactiveFileStoreIds(
            DigitalizedDocumentRequest digitalizedDocumentRequest,
            DigitalizedDocument existingDocument) {

        List<String> inactiveFileStoreIds = new ArrayList<>();

        DigitalizedDocument updatedDocument = digitalizedDocumentRequest.getDigitalizedDocument();

        // Collect filestoreIds present in updated document
        Set<String> updatedFileStores = new HashSet<>();
        if (updatedDocument.getDocuments() != null) {
            updatedDocument.getDocuments().stream()
                    .filter(Objects::nonNull)
                    .map(Document::getFileStore)
                    .filter(Objects::nonNull)
                    .forEach(updatedFileStores::add);
        }

        // Compare with existing document → extract filestores missing from updatedDocument
        if (existingDocument.getDocuments() != null) {
            existingDocument.getDocuments().stream()
                    .filter(Objects::nonNull)
                    .map(Document::getFileStore)
                    .filter(Objects::nonNull)
                    .filter(fs -> !updatedFileStores.contains(fs))   // filestore removed in updated payload
                    .forEach(inactiveFileStoreIds::add);
        }

        return inactiveFileStoreIds;
    }


    private List<String> computeAssignees(@Valid MediationDetails mediationDetails) {

        List<String> assignees = new ArrayList<>();

        if (ObjectUtils.isEmpty(mediationDetails.getPartyDetails())) {
            return assignees;
        }

        assignees = mediationDetails.getPartyDetails().stream()
                .flatMap(party -> Stream.of(party.getUserUuid(), party.getPoaUuid()))
                .filter(Objects::nonNull)  // Remove null values
                .distinct()  // Ensure unique UUIDs only
                .collect(Collectors.toList());

        return assignees;
    }

    private void updateWorkflowAdditionalDetails(WorkflowObject workflow, MediationDetails mediationDetails) {
        ObjectNode detailsNode;
        if (workflow.getAdditionalDetails() == null) {
            detailsNode = objectMapper.createObjectNode();
        } else {
            detailsNode = objectMapper.convertValue(workflow.getAdditionalDetails(), ObjectNode.class);
        }
        ArrayNode excludeRolesArray = detailsNode.putArray("excludeRoles");
        excludeRolesArray.add(MEDIATION_CREATOR);
        excludeRolesArray.add(SYSTEM_ADMIN);
        excludeRolesArray.add(SYSTEM);

        // Exclude parties who have already signed
        if (mediationDetails != null && !ObjectUtils.isEmpty(mediationDetails.getPartyDetails())) {
            ArrayNode excludedAssignedUuidsArray = detailsNode.putArray("excludedAssignedUuids");

            mediationDetails.getPartyDetails().stream()
                    .filter(party -> Boolean.TRUE.equals(party.getHasSigned()))
                    .flatMap(party -> Stream.of(party.getUserUuid(), party.getPoaUuid()))
                    .filter(Objects::nonNull)
                    .distinct()
                    .forEach(excludedAssignedUuidsArray::add);
        }

        workflow.setAdditionalDetails(detailsNode);
    }

    private void handleEditAction(DigitalizedDocument document) {

        WorkflowObject workflow = document.getWorkflow();
        if (workflow == null) return;

        if (INITIATE_E_SIGN.equalsIgnoreCase(workflow.getAction())) {
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
        if (request == null || request.getRequestInfo() == null) {
            throw new CustomException("INVALID_REQUEST", "Request or RequestInfo cannot be null");
        }
        
        if (request.getRequestInfo().getUserInfo() == null) {
            throw new CustomException("INVALID_REQUEST", "UserInfo cannot be null");
        }
        
        List<Role> roles = request.getRequestInfo().getUserInfo().getRoles();
        if (roles == null) {
            roles = new ArrayList<>();
            request.getRequestInfo().getUserInfo().setRoles(roles);
        }
        
        roles.add(
                Role.builder()
                        .id(123L)
                        .code(SYSTEM)
                        .name(SYSTEM)
                        .tenantId(request.getDigitalizedDocument().getTenantId())
                        .build()
        );
    }


}
