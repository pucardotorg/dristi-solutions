package org.pucar.dristi.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.Role;
import org.egov.common.contract.workflow.ProcessInstanceRequest;
import org.egov.common.contract.workflow.State;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.enrichment.ApplicationEnrichment;
import org.pucar.dristi.kafka.Producer;
import org.pucar.dristi.repository.ApplicationRepository;
import org.pucar.dristi.util.CaseUtil;
import org.pucar.dristi.util.SmsNotificationUtil;
import org.pucar.dristi.web.models.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;


import java.util.*;

import static org.pucar.dristi.config.ServiceConstants.*;
import static org.pucar.dristi.util.SmsNotificationUtil.*;

@Slf4j
@Service
public class PaymentUpdateService {

    private final WorkflowService workflowService;
    private final ObjectMapper mapper;
    private final ApplicationRepository repository;
    private final Producer producer;
    private final Configuration configuration;
    private final ApplicationEnrichment enrichment;
    private final List<String> allowedBusinessServices;
    private final SmsNotificationUtil smsNotificationUtil;
    private final CaseUtil caseUtil;
    private final ObjectMapper objectMapper;
    private final IndividualService individualService;
    private final SmsNotificationService notificationService;

    @Autowired
    public PaymentUpdateService(WorkflowService workflowService, ObjectMapper mapper, ApplicationRepository repository, Producer producer, Configuration configuration, ApplicationEnrichment enrichment, SmsNotificationUtil smsNotificationUtil, CaseUtil caseUtil, ObjectMapper objectMapper, IndividualService individualService, SmsNotificationService notificationService) {
        this.workflowService = workflowService;
        this.mapper = mapper;
        this.repository = repository;
        this.producer = producer;
        this.configuration = configuration;
        this.enrichment = enrichment;
       this.allowedBusinessServices= Arrays.asList(
                configuration.getAsyncOrderSubBusinessServiceName(),
                configuration.getAsyncOrderSubWithResponseBusinessServiceName(),
                configuration.getAsyncVoluntarySubBusinessServiceName(),
                configuration.getBailVoluntarySubBusinessServiceName()
        );
        this.smsNotificationUtil = smsNotificationUtil;
        this.caseUtil = caseUtil;
        this.objectMapper = objectMapper;
        this.individualService = individualService;
        this.notificationService = notificationService;
    }

    public void process(Map<String, Object> record) {
        try {

            log.info("allowed business service for payment {}", allowedBusinessServices);
            PaymentRequest paymentRequest = mapper.convertValue(record, PaymentRequest.class);
            RequestInfo requestInfo = paymentRequest.getRequestInfo();
            List<PaymentDetail> paymentDetails = paymentRequest.getPayment().getPaymentDetails();
            String tenantId = paymentRequest.getPayment().getTenantId();

            for (PaymentDetail paymentDetail : paymentDetails) {

                log.info("inside payment update, currently checking for {}",paymentDetail.getBusinessService());
                if (allowedBusinessServices.contains(paymentDetail.getBusinessService())) {
                    updateWorkflowForApplicationPayment(requestInfo, tenantId, paymentDetail);
                }
            }
        } catch (Exception e) {
            log.error("KAFKA_PROCESS_ERROR: {}", e.getMessage(), e);
        }
    }

    public void updateWorkflowForApplicationPayment(RequestInfo requestInfo, String tenantId, PaymentDetail paymentDetail) {
        try {
            Bill bill = paymentDetail.getBill();
            String consumerCode = bill.getConsumerCode();
            log.info("updating payment for consumer code {}",consumerCode);
            String[] consumerCodeSplitArray = consumerCode.split("_", 2);
            String applicationNumber = consumerCodeSplitArray[0];
            ApplicationCriteria criteria = ApplicationCriteria.builder()
                    .applicationNumber(applicationNumber)
                    .build();
            ApplicationSearchRequest applicationSearchRequest = new ApplicationSearchRequest();
            applicationSearchRequest.setRequestInfo(requestInfo);
            applicationSearchRequest.setCriteria(criteria);

            List<Application> applications = repository.getApplications(applicationSearchRequest);

            if (CollectionUtils.isEmpty(applications)) {
                throw new CustomException("INVALID_RECEIPT", "No applications found for the consumerCode " + criteria.getFilingNumber());
            }

            Role role = Role.builder().code("SYSTEM_ADMIN").tenantId(tenantId).build();
            requestInfo.getUserInfo().getRoles().add(role);

            for (Application application : applications) {
                ApplicationSearchRequest updateRequest = ApplicationSearchRequest.builder()
                        .requestInfo(requestInfo)
                        .criteria(criteria)
                        .build();

                ProcessInstanceRequest wfRequest = workflowService.getProcessInstanceForApplicationPayment(updateRequest, tenantId, paymentDetail.getBusinessService());

                State state = workflowService.callWorkFlow(wfRequest);

                application.setStatus(state.getState());

                AuditDetails auditDetails = application.getAuditDetails();
                auditDetails.setLastModifiedBy(paymentDetail.getAuditDetails().getLastModifiedBy());
                auditDetails.setLastModifiedTime(paymentDetail.getAuditDetails().getLastModifiedTime());
                application.setAuditDetails(auditDetails);

                ApplicationRequest applicationRequest = new ApplicationRequest();
                applicationRequest.setApplication(application);
                applicationRequest.setRequestInfo(requestInfo);

                if (PENDINGAPPROVAL.equalsIgnoreCase(application.getStatus()) || PENDINGREVIEW.equalsIgnoreCase(application.getStatus()) || (COMPLETED.equalsIgnoreCase(application.getStatus()) && REQUEST_FOR_BAIL.equalsIgnoreCase(application.getApplicationType()))) {
                    enrichment.enrichApplicationNumberByCMPNumber(applicationRequest);
                }

                String applicationType = application.getApplicationType();

                try{
                    log.info("Sending SMS for application [{}]", application.getApplicationNumber());
                    getSmsAfterPayment(applicationRequest, applicationType);
                    smsNotificationUtil.callNotificationService(applicationRequest, state.getState(), applicationType, false);
                    log.info("SMS sent for application [{}]", application.getApplicationNumber());
                } catch (Exception e) {
                    log.error("Error while sending SMS for application [{}]: {}", application.getApplicationNumber(), e.getMessage(), e);
                }
                producer.push(configuration.getApplicationUpdateStatusTopic(), applicationRequest);
            }
        } catch (Exception e) {
            log.error("Error updating workflow for application payment: {}", e.getMessage(), e);
        }
    }

    private void getSmsAfterPayment(ApplicationRequest applicationRequest,String applicationType) throws JsonProcessingException {
        CaseSearchRequest caseSearchRequest = createCaseSearchRequest(applicationRequest.getRequestInfo(), applicationRequest.getApplication());
        JsonNode caseDetails = caseUtil.searchCaseDetails(caseSearchRequest);

        Object additionalDetailsObject = applicationRequest.getApplication().getAdditionalDetails();
        String jsonData = objectMapper.writeValueAsString(additionalDetailsObject);
        JsonNode additionalData = objectMapper.readTree(jsonData);

        String owner = additionalData.get("onBehalOfName").asText();
        String party = getPartyTypeByName(caseDetails.get("litigants"), owner);
        JsonNode formData = additionalData.path("formdata");

        Set<String> individualIds = extractIndividualIds(caseDetails, party);

        if (party != null && party.contains("complainant")) {
            extractPoaHoldersIndividualIds(caseDetails, individualIds);
        }

        Set<String> phoneNumbers = callIndividualService(applicationRequest.getRequestInfo(), individualIds);

        SmsTemplateData smsTemplateData = SmsTemplateData.builder()
                .courtCaseNumber(caseDetails.has("courtCaseNumber") ? caseDetails.get("courtCaseNumber").textValue() : "")
                .cmpNumber(caseDetails.has("cmpNumber") ? caseDetails.get("cmpNumber").textValue() : "")
                .applicationType(applicationType)
                .originalHearingDate(formData.has("initialHearingDate") ? formData.get("initialHearingDate").textValue() : "")
                .reScheduledHearingDate(formData.has("changedHearingDate") ? formData.get("changedHearingDate").textValue() : "")
                .tenantId(applicationRequest.getApplication().getTenantId()).build();

        for (String number : phoneNumbers) {
            notificationService.sendNotification(applicationRequest.getRequestInfo(), smsTemplateData, PAYMENT_COMPLETED_SUCCESSFULLY, number);
        }
    }

    private CaseSearchRequest createCaseSearchRequest(RequestInfo requestInfo, Application application) {
        CaseSearchRequest caseSearchRequest = new CaseSearchRequest();
        caseSearchRequest.setRequestInfo(requestInfo);
        CaseCriteria caseCriteria = CaseCriteria.builder().filingNumber(application.getFilingNumber()).defaultFields(false).build();
        caseSearchRequest.addCriteriaItem(caseCriteria);
        if(APPLICATION_TO_CHANGE_POWER_OF_ATTORNEY_DETAILS.equalsIgnoreCase(application.getApplicationType())) {
            caseSearchRequest.setFlow(FLOW_JAC);
        }
        return caseSearchRequest;
    }

    public  Set<String> extractIndividualIds(JsonNode caseDetails, String receiver) {
        Set<String> uuids = new HashSet<>();
        String partyTypeToMatch = (receiver != null) ? receiver.toLowerCase() : "";

        JsonNode litigantNode = caseDetails.get("litigants");
        if (litigantNode.isArray()) {
            for (JsonNode node : litigantNode) {
                String partyType = node.get("partyType").asText().toLowerCase();
                if (partyType.contains(partyTypeToMatch)) {
                    String uuid = node.path("additionalDetails").get("uuid").asText();
                    if (!uuid.isEmpty()) {
                        uuids.add(uuid);
                    }
                }
            }
        }
        return uuids;
    }

    private Set<String> callIndividualService(RequestInfo requestInfo, Set<String> ids) {

        Set<String> mobileNumber = new HashSet<>();

        List<Individual> individuals = individualService.getIndividualsBylId(requestInfo, new ArrayList<>(ids));
        for(Individual individual : individuals) {
            if (individual.getMobileNumber() != null) {
                mobileNumber.add(individual.getMobileNumber());
            }
        }

        return mobileNumber;
    }



}
