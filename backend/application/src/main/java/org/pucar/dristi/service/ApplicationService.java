package org.pucar.dristi.service;


import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.Role;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.enrichment.ApplicationEnrichment;
import org.pucar.dristi.kafka.Producer;
import org.pucar.dristi.repository.ApplicationRepository;
import org.pucar.dristi.util.FileStoreUtil;
import org.pucar.dristi.util.SmsNotificationUtil;
import org.pucar.dristi.validator.ApplicationValidator;
import org.pucar.dristi.web.models.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.function.BiConsumer;
import java.util.function.Function;
import java.util.stream.Collectors;

import static org.pucar.dristi.config.ServiceConstants.*;

@Service
@Slf4j
public class ApplicationService {
    private final ApplicationValidator validator;
    private final ApplicationEnrichment enrichmentUtil;
    private final ApplicationRepository applicationRepository;
    private final WorkflowService workflowService;
    private final Configuration config;
    private final Producer producer;
    private final SmsNotificationUtil smsNotificationUtil;
    private final ObjectMapper objectMapper;
    private final FileStoreUtil fileStoreUtil;

    @Autowired
    public ApplicationService(
            ApplicationValidator validator,
            ApplicationEnrichment enrichmentUtil,
            ApplicationRepository applicationRepository,
            WorkflowService workflowService,
            Configuration config,
            Producer producer, SmsNotificationUtil smsNotificationUtil, ObjectMapper objectMapper, FileStoreUtil fileStoreUtil) {
        this.validator = validator;
        this.enrichmentUtil = enrichmentUtil;
        this.applicationRepository = applicationRepository;
        this.workflowService = workflowService;
        this.config = config;
        this.producer = producer;
        this.smsNotificationUtil = smsNotificationUtil;
        this.objectMapper = objectMapper;
        this.fileStoreUtil = fileStoreUtil;
    }

    public Application createApplication(ApplicationRequest body) {
        try {
            validator.validateApplication(body);
            enrichmentUtil.enrichApplication(body);
            validator.validateOrderDetails(body);
            if (body.getApplication().getWorkflow() != null)
                workflowService.updateWorkflowStatus(body);

            if (body.getApplication().getWorkflow() != null && (PENDINGAPPROVAL.equalsIgnoreCase(body.getApplication().getStatus())
                    || PENDINGREVIEW.equalsIgnoreCase(body.getApplication().getStatus()))) {
                enrichmentUtil.enrichApplicationNumberByCMPNumber(body);
            }

            producer.push(config.getApplicationCreateTopic(), body);
            return body.getApplication();
        } catch (Exception e) {
            log.error("Error occurred while creating application {}", e.getMessage());
            throw new CustomException(CREATE_APPLICATION_ERR, e.getMessage());
        }
    }

    public Application updateApplication(ApplicationRequest applicationRequest, Boolean isFromRelatedUpdate) {
        try {
            Application application = applicationRequest.getApplication();

            if (!validator.validateApplicationExistence(applicationRequest.getRequestInfo(), application)) {
                throw new CustomException(VALIDATION_ERR, "Error occurred while validating existing application");
            }
            // Enrich application upon update
            enrichmentUtil.enrichApplicationUponUpdate(applicationRequest);
            validator.validateOrderDetails(applicationRequest);
            if (application.getWorkflow() != null)
                workflowService.updateWorkflowStatus(applicationRequest);

            if (application.getWorkflow() != null && (PENDINGAPPROVAL.equalsIgnoreCase(application.getStatus())
                    || PENDINGREVIEW.equalsIgnoreCase(application.getStatus()))) {
                enrichmentUtil.enrichApplicationNumberByCMPNumber(applicationRequest);
            }

            if (application.getWorkflow() != null && SUBMIT_BAIL_DOCUMENTS.equalsIgnoreCase(application.getApplicationType()) && (APPROVE.equalsIgnoreCase(application.getWorkflow().getAction()) || REJECT.equalsIgnoreCase(application.getWorkflow().getAction())) && !isFromRelatedUpdate) {

                updateRelatedApplication(application, applicationRequest.getRequestInfo());

            }
            List<String> fileStoreIds = new ArrayList<>();
            for(Document document : applicationRequest.getApplication().getDocuments()) {
                if(!document.getIsActive()) {
                    fileStoreIds.add(document.getFileStore());
                }
            }
            if(!fileStoreIds.isEmpty()){
                fileStoreUtil.deleteFilesByFileStore(fileStoreIds, applicationRequest.getApplication().getTenantId());
                log.info("Deleted files for application with ids: {}", fileStoreIds);
            }
            smsNotificationUtil.callNotificationService(applicationRequest, application.getStatus(), application.getApplicationType());
            producer.push(config.getApplicationUpdateTopic(), applicationRequest);

            filterDocuments(new ArrayList<>() {{
                                add(application);
                            }},
                    Application::getDocuments,
                    Application::setDocuments);

            return applicationRequest.getApplication();

        } catch (CustomException e) {
            log.error("Custom Exception occurred while updating application {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Error occurred while updating application {}", e.getMessage());
            throw new CustomException(UPDATE_APPLICATION_ERR, "Error occurred while updating application: " + e.getMessage());
        }
    }

    private <T> void filterDocuments(List<T> entities,
                                     Function<T, List<Document>> getDocs,
                                     BiConsumer<T, List<Document>> setDocs) {
        if (entities == null) return;

        for (T entity : entities) {
            List<Document> docs = getDocs.apply(entity);
            if (docs != null) {
                List<Document> activeDocs = docs.stream()
                        .filter(Document::getIsActive)
                        .collect(Collectors.toList());
                setDocs.accept(entity, activeDocs); // ✅ set it back
            }
        }
    }

    private void updateRelatedApplication(Application application, RequestInfo requestInfo) {

        Object applicationDetails = application.getApplicationDetails();

        Role role = Role.builder().code("SYSTEM_ADMIN").tenantId(application.getTenantId()).build();
        requestInfo.getUserInfo().getRoles().add(role);

        JsonNode jsonNode = objectMapper.valueToTree(applicationDetails);
        if (jsonNode != null && jsonNode.has("relatedApplication")) {

            JsonNode relatedApplication = jsonNode.get("relatedApplication");
            if (relatedApplication.isArray()) {
                for (JsonNode applicationIdNode : relatedApplication) {
                    String applicationId = applicationIdNode.asText();
                    ApplicationSearchRequest searchRequest = ApplicationSearchRequest.builder()
                            .requestInfo(requestInfo)
                            .criteria(ApplicationCriteria.builder().applicationNumber(applicationId).build())
                            .build();

                    List<Application> relatedApplications = searchApplications(searchRequest);

                    if (!relatedApplications.isEmpty()) {
                        Application parentApplication = relatedApplications.get(0);
                        parentApplication.setWorkflow(application.getWorkflow());
                        updateApplication(ApplicationRequest.builder().application(parentApplication)
                                .requestInfo(requestInfo).build(), true);

                    } else {
                        log.info("Application with id : {} not found in DB", applicationId);
                    }
                }
            } else {
                log.info("relatedApplication is not an array.");
            }

        } else {
            log.info("No relatedApplication found in applicationDetails.");
        }


    }

    public List<Application> searchApplications(ApplicationSearchRequest request) {
        try {
            // Fetch applications from database according to the given search params
            log.info("Starting application search with parameters :: {}", request);
            List<Application> applicationList = applicationRepository.getApplications(request);
            log.info("Application list fetched with size :: {}", applicationList.size());
            // If no applications are found, return an empty list
            if (CollectionUtils.isEmpty(applicationList))
                return new ArrayList<>();
            return applicationList;
        } catch (Exception e) {
            log.error("Error while fetching to search results {}", e.toString());
            throw new CustomException(APPLICATION_SEARCH_ERR, e.getMessage());
        }
    }

    public List<ApplicationExists> existsApplication(ApplicationExistsRequest applicationExistsRequest) {
        try {
            return applicationRepository.checkApplicationExists(applicationExistsRequest.getApplicationExists());
        } catch (CustomException e) {
            log.error("Error while checking application exist {}", e.toString());
            throw e;
        } catch (Exception e) {
            log.error("Error while checking application exist {}", e.toString());
            throw new CustomException(APPLICATION_EXIST_EXCEPTION, e.getMessage());
        }
    }

    public void addComments(ApplicationAddCommentRequest applicationAddCommentRequest) {
        try {
            ApplicationAddComment applicationAddComment = applicationAddCommentRequest.getApplicationAddComment();
            List<Application> applicationList = searchApplications(ApplicationSearchRequest.builder().criteria(ApplicationCriteria.builder().applicationNumber(applicationAddComment.getApplicationNumber()).tenantId(applicationAddComment.getTenantId()).build()).requestInfo(applicationAddCommentRequest.getRequestInfo()).build());
            if (CollectionUtils.isEmpty(applicationList)) {
                throw new CustomException(VALIDATION_ERR, "Application not found");
            }
            AuditDetails auditDetails = AuditDetails.builder()
                    .createdBy(applicationAddCommentRequest.getRequestInfo().getUserInfo().getUuid())
                    .createdTime(System.currentTimeMillis())
                    .lastModifiedBy(applicationAddCommentRequest.getRequestInfo().getUserInfo().getUuid())
                    .lastModifiedTime(System.currentTimeMillis())
                    .build();
            applicationAddComment.getComment().forEach(comment -> enrichmentUtil.enrichCommentUponCreate(comment, auditDetails));
            Application applicationToUpdate = applicationList.get(0);
            if (applicationToUpdate.getComment() == null)
                applicationToUpdate.setComment(new ArrayList<>());
            applicationToUpdate.getComment().addAll(applicationAddComment.getComment());
            applicationAddComment.setComment(applicationToUpdate.getComment());
            AuditDetails applicationAuditDetails = applicationToUpdate.getAuditDetails();
            applicationAuditDetails.setLastModifiedBy(auditDetails.getLastModifiedBy());
            applicationAuditDetails.setLastModifiedTime(auditDetails.getLastModifiedTime());

            ApplicationRequest applicationRequest = ApplicationRequest.builder().application(applicationToUpdate)
                    .requestInfo(applicationAddCommentRequest.getRequestInfo()).build();
            producer.push(config.getApplicationUpdateCommentsTopic(), applicationRequest);
        } catch (CustomException e) {
            log.error("Error while adding comments {}", e.toString());
            throw e;
        } catch (Exception e) {
            log.error("Error while adding comments {}", e.toString());
            throw new CustomException(COMMENT_ADD_ERR, e.getMessage());
        }
    }
}
