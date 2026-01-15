package org.pucar.dristi.service;


import com.fasterxml.jackson.core.type.TypeReference;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.Role;
import org.egov.common.contract.workflow.ProcessInstanceRequest;
import org.egov.common.contract.workflow.State;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.enrichment.CaseRegistrationEnrichment;
import org.pucar.dristi.kafka.Producer;
import org.pucar.dristi.repository.CaseRepository;
import org.pucar.dristi.util.EncryptionDecryptionUtil;
import org.pucar.dristi.web.models.*;
import org.pucar.dristi.web.models.task.TaskRequest;
import org.pucar.dristi.web.models.task.TaskResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

import java.util.*;

import static org.pucar.dristi.config.ServiceConstants.*;
import static org.pucar.dristi.config.ServiceConstants.FSO_VALIDATED;

@Slf4j
@Service
public class PaymentUpdateService {

    private WorkflowService workflowService;

    private ObjectMapper mapper;

    private CaseRepository repository;

    private Producer producer;

    private Configuration configuration;

    private CacheService cacheService;

    private NotificationService notificationService;

    private CaseService caseService;

    private CaseRegistrationEnrichment enrichmentUtil;

    private EncryptionDecryptionUtil encryptionDecryptionUtil;

    @Autowired
    public PaymentUpdateService(WorkflowService workflowService, ObjectMapper mapper, CaseRepository repository,
                                Producer producer, Configuration configuration, CacheService cacheService, CaseService caseService, CaseRegistrationEnrichment enrichmentUtil,EncryptionDecryptionUtil encryptionDecryptionUtil) {
        this.workflowService = workflowService;
        this.mapper = mapper;
        this.repository = repository;
        this.producer = producer;
        this.configuration = configuration;
        this.cacheService = cacheService;
        this.caseService = caseService;
        this.enrichmentUtil = enrichmentUtil;
        this.encryptionDecryptionUtil = encryptionDecryptionUtil;
    }

    public void process(Map<String, Object> record) {

        try {

            PaymentRequest paymentRequest = mapper.convertValue(record, PaymentRequest.class);
            RequestInfo requestInfo = paymentRequest.getRequestInfo();

            List<PaymentDetail> paymentDetails = paymentRequest.getPayment().getPaymentDetails();
            String tenantId = paymentRequest.getPayment().getTenantId();

            for (PaymentDetail paymentDetail : paymentDetails) {
                updateWorkflowForCasePayment(requestInfo, tenantId, paymentDetail, paymentRequest.getPayment().getPaymentMode());
            }
        } catch (Exception e) {
            log.error("KAFKA_PROCESS_ERROR:", e);
        }

    }

    public void updateJoinCaseDetails(Map<String, Object> record) {

        try {
            TaskRequest taskRequest = mapper.convertValue(record, TaskRequest.class);
            if(JOIN_CASE_PAYMENT.equalsIgnoreCase(taskRequest.getTask().getTaskType()) && COMPLETED.equalsIgnoreCase(taskRequest.getTask().getStatus())) {
                Object taskDetails = taskRequest.getTask().getTaskDetails();
                Map<String, Object> taskDetailsMap = mapper.convertValue(taskDetails, new TypeReference<Map<String, Object>>() {
                });

                RequestInfo requestInfo = mapper.convertValue(taskDetailsMap.get("RequestInfo"), RequestInfo.class);
                JoinCaseDataV2 joinCaseData = mapper.convertValue(taskDetailsMap.get("joinCaseData"), JoinCaseDataV2.class);

                JoinCaseV2Request joinCaseRequest = JoinCaseV2Request.builder().requestInfo(requestInfo).joinCaseData(joinCaseData).build();

                String filingNumber = joinCaseData.getFilingNumber();
                List<CaseCriteria> existingCases = repository.getCases(Collections.singletonList(CaseCriteria.builder().filingNumber(filingNumber).build()), joinCaseRequest.getRequestInfo());
                log.info("Existing case list size :: {}", existingCases.size());

                CourtCase courtCase = caseService.validateAccessCodeAndReturnCourtCase(joinCaseRequest, existingCases);

                CourtCase caseObj = CourtCase.builder()
                        .id(courtCase.getId())
                        .filingNumber(courtCase.getFilingNumber())
                        .build();

                AuditDetails auditDetails = AuditDetails.builder()
                        .createdBy(requestInfo.getUserInfo().getUuid())
                        .createdTime(System.currentTimeMillis())
                        .lastModifiedBy(requestInfo.getUserInfo().getUuid())
                        .lastModifiedTime(System.currentTimeMillis()).build();
                AdvocateMapping existingRepresentative = caseService.validateAdvocateAlreadyRepresenting(courtCase, joinCaseData);
                caseService.joinCaseAdvocate(joinCaseRequest, courtCase, caseObj, auditDetails, existingRepresentative);
            }
        } catch (Exception e) {
            log.error("KAFKA_PROCESS_ERROR:", e);
        }

    }

    private void updateWorkflowForCasePayment(RequestInfo requestInfo, String tenantId, PaymentDetail paymentDetail, String paymentMode) {

        Bill bill  = paymentDetail.getBill();

        String consumerCode = bill.getConsumerCode();
        String[] consumerCodeSplitArray = consumerCode.split("_", 2);
        String fillingNumber=consumerCodeSplitArray[0];

        CaseCriteria criteria = CaseCriteria.builder()
                .filingNumber(fillingNumber)
//                .tenantId(tenantId)
                .build();
        List<CaseCriteria> criterias = new ArrayList<>();
        criterias.add(criteria);
        List<CaseCriteria> caseCriterias = repository.getCases(criterias, requestInfo);

        if (CollectionUtils.isEmpty(caseCriterias.get(0).getResponseList()))
            throw new CustomException("INVALID RECEIPT",
                    "No applications found for the consumerCode " + criteria.getFilingNumber());

        Role role = Role.builder().code("SYSTEM_ADMIN").tenantId(tenantId).build();
        requestInfo.getUserInfo().getRoles().add(role);

        caseCriterias.forEach(caseCriteria -> {

            CaseSearchRequest updateRequest = CaseSearchRequest.builder().requestInfo(requestInfo)
                    .criteria(Collections.singletonList(caseCriteria)).build();

            ProcessInstanceRequest wfRequest = workflowService.getProcessInstanceForCasePayment(updateRequest,tenantId);

            State state = workflowService.callWorkFlow(wfRequest);

            CourtCase courtCase = updateRequest.getCriteria().get(0).getResponseList().get(0);
            courtCase.setStatus(state.getState());
            enrichmentUtil.enrichCaseRegistrationFillingDate(courtCase);
            AuditDetails auditDetails = courtCase.getAuditdetails();
            auditDetails.setLastModifiedBy(paymentDetail.getAuditDetails().getLastModifiedBy());
            auditDetails.setLastModifiedTime(paymentDetail.getAuditDetails().getLastModifiedTime());
            courtCase.setAuditdetails(auditDetails);
            CourtCase decryptedCourtCase = encryptionDecryptionUtil.decryptObject(courtCase, configuration.getCaseDecryptSelf(), CourtCase.class, requestInfo);

            CaseRequest caseRequest = new CaseRequest();
            caseRequest.setRequestInfo(requestInfo);
            caseRequest.setCases(decryptedCourtCase);
            if(UNDER_SCRUTINY.equalsIgnoreCase(courtCase.getStatus())) {
                caseService.callNotificationService(caseRequest, CASE_FILED, null);
            }
            enrichmentUtil.enrichAccessCode(caseRequest);
            Document paymentReceipt = null;
            if(ONLINE.equals(paymentMode)){
                paymentReceipt = enrichmentUtil.enrichCasePaymentReceipt(caseRequest, bill.getId(), consumerCode);
            }
            log.info("In Payment Update, Encrypting: {}", caseRequest.getCases().getId());
            caseRequest.setCases(encryptionDecryptionUtil.encryptObject(caseRequest.getCases(), configuration.getCourtCaseEncrypt(), CourtCase.class));
            cacheService.save(requestInfo.getUserInfo().getTenantId() + ":" + courtCase.getId().toString(), caseRequest.getCases());
            if(paymentReceipt!=null){
                caseRequest.getCases().setDocuments(List.of(paymentReceipt));
            }
            producer.push(configuration.getCaseUpdateStatusTopic(),caseRequest);

        });
    }


}
