package org.pucar.dristi.service;


import com.fasterxml.jackson.databind.ObjectMapper;
import digit.models.coremodels.Bill;
import digit.models.coremodels.PaymentDetail;
import digit.models.coremodels.PaymentRequest;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.Role;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.kafka.Producer;
import org.pucar.dristi.repository.CtcApplicationRepository;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.util.*;
import org.pucar.dristi.web.models.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class PaymentUpdateService {

    private final WorkflowService workflowService;
    private final ObjectMapper mapper;
    private final CtcApplicationRepository repository;
    private final Producer producer;
    private final Configuration config;
    private final MdmsUtil mdmsUtil;
    private final ObjectMapper objectMapper;
    private final EtreasuryUtil etreasuryUtil;
    private final CaseUtil caseUtil;

    private ServiceRequestRepository serviceRequestRepository;

    @Autowired
    public PaymentUpdateService(WorkflowService workflowService, ObjectMapper mapper, CtcApplicationRepository repository, Producer producer, Configuration config, MdmsUtil mdmsUtil, ObjectMapper objectMapper, ServiceRequestRepository serviceRequestRepository, EtreasuryUtil etreasuryUtil, CaseUtil caseUtil) {
        this.workflowService = workflowService;
        this.mapper = mapper;
        this.repository = repository;
        this.producer = producer;
        this.config = config;
        this.mdmsUtil = mdmsUtil;
        this.objectMapper = objectMapper;
        this.serviceRequestRepository = serviceRequestRepository;
        this.etreasuryUtil = etreasuryUtil;
        this.caseUtil = caseUtil;
    }

    public void process(Map<String, Object> record) {

        try {

            PaymentRequest paymentRequest = mapper.convertValue(record, PaymentRequest.class);
            RequestInfo requestInfo = paymentRequest.getRequestInfo();

            List<PaymentDetail> paymentDetails = paymentRequest.getPayment().getPaymentDetails();
            String tenantId = paymentRequest.getPayment().getTenantId();

            for (PaymentDetail paymentDetail : paymentDetails) {
                if (paymentDetail.getBusinessService().equals(config.getCtcBusinessServiceName())) {
                    updateWorkflowForCTCPayment(requestInfo, tenantId, paymentDetail);
                }
            }
        } catch (Exception e) {
            log.error("KAFKA_PROCESS_ERROR:", e);
        }

    }

    private void updateWorkflowForCTCPayment(RequestInfo requestInfo, String tenantId, PaymentDetail paymentDetail) {

        Bill bill = paymentDetail.getBill();

        String consumerCode = bill.getConsumerCode();
        String[] consumerCodeSplitArray = consumerCode.split("_", 2);
        String ctcApplicationNumber = consumerCodeSplitArray[0];

        CtcApplicationSearchCriteria criteria = CtcApplicationSearchCriteria.builder()
                .ctcApplicationNumber(ctcApplicationNumber)
                .build();
        List<CtcApplication> ctcApplications = repository.getCtcApplication(CtcApplicationSearchRequest.builder().criteria(criteria).build());

        if (CollectionUtils.isEmpty(ctcApplications))
            throw new CustomException("INVALID RECEIPT", "No applications found for the consumerCode " + consumerCode);

        Role role = Role.builder().code("SYSTEM_ADMIN").tenantId(tenantId).build();
        requestInfo.getUserInfo().getRoles().add(role);

        CtcApplication ctcApplication = ctcApplications.get(0);
        AuditDetails auditDetails = ctcApplication.getAuditDetails();
        auditDetails.setLastModifiedBy(paymentDetail.getAuditDetails().getLastModifiedBy());
        auditDetails.setLastModifiedTime(paymentDetail.getAuditDetails().getLastModifiedTime());
        ctcApplication.setAuditDetails(auditDetails);

        log.info("Updating pending payment status for ctcApplication: {}", ctcApplication);
        WorkflowObject workflow = new WorkflowObject();
        if(ctcApplication.getIsPartyToCase())
         workflow.setAction("PAY_PARTY_OF_CASE");
        else
         workflow.setAction("PAY_NOT_PARTY_OF_CASE");
        ctcApplication.setWorkflow(workflow);
        workflowService.updateWorkflowStatus(ctcApplication,requestInfo);
//        Document document = getPaymentReceipt(requestInfo, ctcApplication);
//        if (document != null) {
//            if (ctcApplication.getDocuments() == null) {
//                ctcApplication.setDocuments(new ArrayList<>());
//            }
//            ctcApplication.getDocuments().add(document);
//        }
        CtcApplicationRequest ctcApplicationRequest = CtcApplicationRequest.builder().requestInfo(requestInfo).ctcApplication(ctcApplication).build();
        producer.push("update-ctc-application", ctcApplicationRequest);
    }

}
