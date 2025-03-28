package org.pucar.dristi.service;


import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.models.individual.Individual;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.enrichment.AdvocateRegistrationEnrichment;
import org.pucar.dristi.kafka.Producer;
import org.pucar.dristi.repository.AdvocateRepository;
import org.pucar.dristi.validators.AdvocateRegistrationValidator;
import org.pucar.dristi.web.models.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.pucar.dristi.config.ServiceConstants.*;

@Service
@Slf4j
public class AdvocateService {

    private final AdvocateRegistrationValidator validator;
    private final AdvocateRegistrationEnrichment enrichmentUtil;
    private final WorkflowService workflowService;
    private final AdvocateRepository advocateRepository;
    private final Producer producer;
    private final Configuration config;

    private final SmsNotificationService notificationService;

    private final IndividualService individualService;

    @Autowired
    public AdvocateService(
            AdvocateRegistrationValidator validator,
            AdvocateRegistrationEnrichment enrichmentUtil,
            WorkflowService workflowService,
            AdvocateRepository advocateRepository,
            Producer producer,
            Configuration config, SmsNotificationService notificationService, IndividualService individualService) {
        this.validator = validator;
        this.enrichmentUtil = enrichmentUtil;
        this.workflowService = workflowService;
        this.advocateRepository = advocateRepository;
        this.producer = producer;
        this.config = config;
        this.notificationService = notificationService;
        this.individualService = individualService;
    }

    public Advocate createAdvocate(AdvocateRequest body) {
        try {

            // Validate applications
            validator.validateAdvocateRegistration(body);

            // Enrich applications
            enrichmentUtil.enrichAdvocateRegistration(body);

            // Initiate workflow for the new application-
            workflowService.updateWorkflowStatus(body);

            // Push the application to the topic for persister to listen and persist

            producer.push(config.getAdvocateCreateTopic(), body);

            return body.getAdvocate();
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error occurred while creating advocate :: {}", e.toString());
            throw new CustomException(ADVOCATE_CREATE_EXCEPTION, e.getMessage());
        }
    }

    public void searchAdvocate(RequestInfo requestInfo, List<AdvocateSearchCriteria> advocateSearchCriteria, String tenantId, Integer limit, Integer offset) {

        try {
            if (limit == null)
                limit = 10;
            if (offset == null)
                offset = 0;

            // Fetch applications from database according to the given search criteria
            advocateRepository.getAdvocates(advocateSearchCriteria, tenantId, limit, offset);

            // If no applications are found matching the given criteria, return an empty list

            for (AdvocateSearchCriteria searchCriteria : advocateSearchCriteria){
                searchCriteria.getResponseList().forEach(application -> application.setWorkflow(workflowService.getWorkflowFromProcessInstance(workflowService.getCurrentWorkflow(requestInfo, application.getTenantId(), application.getApplicationNumber()))));
            }

        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error while fetching to search results : {}", e.toString());
            throw new CustomException(ADVOCATE_SEARCH_EXCEPTION, e.getMessage());
        }
    }

    public List<Advocate> searchAdvocateByStatus(AdvocateSimpleSearchRequest body, String status, String tenantId, Integer limit, Integer offset) {
        try {
            if (body == null) {
                throw new CustomException(ADVOCATE_SEARCH_EXCEPTION, "Request body cannot be null");
            }

            RequestInfo requestInfo = body.getRequestInfo();
            AdvocateSearchCriteria searchCriteria = null;
            if (body.getAdvocateSearchCriteria() != null) {
                searchCriteria = body.getAdvocateSearchCriteria();
            }
            if (limit == null)
                limit = 10;
            if (offset == null)
                offset = 0;

            // Fetch applications from database according to the given search criteria
            List<Advocate> applications = advocateRepository.getListApplicationsByStatus(searchCriteria, status, tenantId, limit, offset);
            log.info("Application size :: {}", applications.size());

            // If no applications are found matching the given criteria, return an empty list
            if (CollectionUtils.isEmpty(applications))
                return new ArrayList<>();

            applications.forEach(application -> application.setWorkflow(workflowService.getWorkflowFromProcessInstance(workflowService.getCurrentWorkflow(requestInfo, application.getTenantId(), application.getApplicationNumber()))));

            return applications;
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error while fetching to search results :: {}", e.toString());
            throw new CustomException(ADVOCATE_SEARCH_EXCEPTION, e.getMessage());
        }
    }

    public List<Advocate> searchAdvocateByApplicationNumber(RequestInfo requestInfo, String applicationNumber, String tenantId, Integer limit, Integer offset) {
        try {
            if (limit == null)
                limit = 10;
            if (offset == null)
                offset = 0;

            // Fetch applications from database according to the given search criteria
            List<Advocate> applications = advocateRepository.getListApplicationsByApplicationNumber(applicationNumber, tenantId, limit, offset);
            log.info("Application size :: {}", applications.size());

            // If no applications are found matching the given criteria, return an empty list
            if (CollectionUtils.isEmpty(applications))
                return new ArrayList<>();

            applications.forEach(application -> application.setWorkflow(workflowService.getWorkflowFromProcessInstance(workflowService.getCurrentWorkflow(requestInfo, application.getTenantId(), application.getApplicationNumber()))));

            return applications;

        } catch (CustomException e) {
            log.error("Custom Exception occurred while searching :: {}", e.toString());
            throw e;
        } catch (Exception e) {
            log.error("Error while fetching to search results :: {}", e.toString());
            throw new CustomException(ADVOCATE_SEARCH_EXCEPTION, e.getMessage());
        }
    }

    public Advocate updateAdvocate(AdvocateRequest advocateRequest) {

        try {
            Advocate existingApplication = validateExistingApplication(advocateRequest.getAdvocate());
            existingApplication.setWorkflow(advocateRequest.getAdvocate().getWorkflow());
            advocateRequest.setAdvocate(existingApplication);

            // Enrich application upon update
            enrichmentUtil.enrichAdvocateApplicationUponUpdate(advocateRequest);

            workflowService.updateWorkflowStatus(advocateRequest);

            if (APPLICATION_ACTIVE_STATUS.equalsIgnoreCase(advocateRequest.getAdvocate().getStatus())) {
                //setting true once application approved
                advocateRequest.getAdvocate().setIsActive(true);
            }

            producer.push(config.getAdvocateUpdateTopic(), advocateRequest);

            String messageCode = getMessageCode(advocateRequest.getAdvocate().getStatus());
            if(messageCode != null){
                callNotificationService(advocateRequest, messageCode);
            }

            return advocateRequest.getAdvocate();

        } catch (CustomException e) {
            log.error("Custom Exception occurred while updating advocate :: {}", e.toString());
            throw e;
        } catch (Exception e) {
            log.error("Error occurred while updating advocate :: {}", e.toString());
            throw new CustomException(ADVOCATE_UPDATE_EXCEPTION, "Error occurred while updating advocate: " + e.getMessage());
        }

    }
    private String getMessageCode(String updatedStatus) {
        if (updatedStatus.equalsIgnoreCase(ACTIVE)){
            return ADVOCATE_REGISTERED;
        }
        return null;
    }

    public void callNotificationService(AdvocateRequest advocateRequest, String messageCode) {
        try {

            List<String> individualIds = Collections.singletonList(advocateRequest.getAdvocate().getIndividualId());

            List<String> phonenumbers = callIndividualService(advocateRequest.getRequestInfo(), individualIds);
            SmsTemplateData smsTemplateData = SmsTemplateData.builder()
                    .tenantId(advocateRequest.getAdvocate().getTenantId()).build();
            for (String number : phonenumbers) {
                notificationService.sendNotification(advocateRequest.getRequestInfo(), smsTemplateData, messageCode, number);
            }
        } catch (Exception e) {
            // Log the exception and continue the execution without throwing
            log.error("Error occurred while sending notification: {}", e.toString());
        }
    }

    private List<String> callIndividualService(RequestInfo requestInfo, List<String> individualIds) {

        List<String> mobileNumber = new ArrayList<>();
        try {
            for(String id : individualIds){
                List<Individual> individuals = individualService.getIndividualsByIndividualId(requestInfo, id);
                if(individuals != null && individuals.get(0).getMobileNumber() != null){
                    mobileNumber.add(individuals.get(0).getMobileNumber());
                }
            }
        }
        catch (Exception e) {
            // Log the exception and continue the execution without throwing
            log.error("Error occurred while sending notification: {}", e.toString());
        }

        return mobileNumber;
    }

    private Advocate validateExistingApplication(Advocate advocate) {
        try {
            return validator.validateApplicationExistence(advocate);
        } catch (Exception e) {
            log.error("Error validating existing application :: {}", e.toString());
            throw new CustomException(VALIDATION_EXCEPTION, "Error validating existing application: " + e.getMessage());
        }
    }


}
