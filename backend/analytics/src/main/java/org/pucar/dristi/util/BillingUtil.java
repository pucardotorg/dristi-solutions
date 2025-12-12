package org.pucar.dristi.util;


import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.Gson;
import com.jayway.jsonpath.JsonPath;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.models.RequestInfoWrapper;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.egov.tracer.model.ServiceCallException;
import org.json.JSONObject;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.util.CaseUtil;
import org.pucar.dristi.util.IndexerUtils;
import org.pucar.dristi.util.MdmsUtil;
import org.pucar.dristi.web.models.CaseSearchRequest;
import org.pucar.dristi.web.models.CaseCriteria;
import org.pucar.dristi.web.models.OfflinePaymentTask;
import org.pucar.dristi.web.models.billingservice.Demand;
import org.pucar.dristi.web.models.billingservice.DemandDetail;
import org.pucar.dristi.web.models.billingservice.DemandResponse;
import org.pucar.dristi.web.models.enums.StatusEnum;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

import static org.pucar.dristi.config.ServiceConstants.*;
import static org.pucar.dristi.config.ServiceConstants.CASE_COURTCASENUMBER_PATH;

@Slf4j
@Component
public class BillingUtil {

    private final Configuration config;
    private final IndexerUtils indexerUtil;
    private final ServiceRequestRepository requestRepository;
    private final CaseUtil caseUtil;
    private final ObjectMapper objectMapper;
    private final MdmsUtil mdmsUtil;

    @Autowired
    public BillingUtil(Configuration config, IndexerUtils indexerUtil, ServiceRequestRepository requestRepository, CaseUtil caseUtil, ObjectMapper objectMapper, MdmsUtil mdmsUtil) {
        this.config = config;
        this.indexerUtil = indexerUtil;
        this.requestRepository = requestRepository;
        this.caseUtil = caseUtil;
        this.objectMapper = objectMapper;
        this.mdmsUtil = mdmsUtil;
    }

    public String buildPayload(Demand demand, RequestInfo requestInfo, OfflinePaymentTask offlinePaymentTask) {

        String id = demand.getId();
        String businessService = demand.getBusinessService();
        String status = demand.getStatus().toString();
        Long paymentCompletedDate = null;
        if (offlinePaymentTask.getStatus().equals(StatusEnum.CANCELLED) || offlinePaymentTask.getStatus().equals(StatusEnum.PAID)) {
            status = offlinePaymentTask.getStatus().toString();
            paymentCompletedDate = System.currentTimeMillis();
        }
        String tenantId = demand.getTenantId();
        String consumerCode = demand.getConsumerCode();
        String[] consumerCodeSplitArray = splitConsumerCode(consumerCode);
        String paymentType = getPaymentType(consumerCodeSplitArray[1], businessService);
        String filingNumber = offlinePaymentTask.getFilingNumber();


        CaseSearchRequest caseSearchRequest = createCaseSearchRequest(requestInfo, filingNumber);
        JsonNode caseObject = caseUtil.searchCaseDetails(caseSearchRequest);
        JsonNode caseJsonNode = (caseObject == null || caseObject.isNull() || caseObject.isEmpty()) ? null : caseObject.get(0);
        if (caseJsonNode == null) {
            log.error("case not found with the filing number {}", filingNumber);
            throw new CustomException("CASE_NOT_FOUND", "case not found with the filing number " + filingNumber);
        }
        String caseTitle = JsonPath.read(caseJsonNode.toString(), CASE_TITLE_PATH);
        String cmpNumber = JsonPath.read(caseJsonNode.toString(), CASE_CMPNUMBER_PATH);
        String courtCaseNumber = JsonPath.read(caseJsonNode.toString(), CASE_COURTCASENUMBER_PATH);
        String courtId = JsonPath.read(caseJsonNode.toString(), CASE_COURTID_PATH);
        String caseNumber = filingNumber;
        AuditDetails auditDetails = demand.getAuditDetails();
        Long paymentCreatedDate = demand.getAuditDetails().getCreatedTime();
        Gson gson = new Gson();
        String auditJsonString = gson.toJson(auditDetails);

        if(courtCaseNumber!=null && !courtCaseNumber.isEmpty()){
            caseNumber = courtCaseNumber;
        }else if(cmpNumber!=null && !cmpNumber.isEmpty()){
            caseNumber = cmpNumber;
        }

        Double totalAmount = getTotalTaxAmount(demand.getDemandDetails());

        String caseId = JsonPath.read(caseJsonNode.toString(), CASEID_PATH);
        String caseStage = JsonPath.read(caseJsonNode.toString(), CASE_STAGE_PATH);
        net.minidev.json.JSONArray statutesAndSections = JsonPath.read(caseJsonNode.toString(), CASE_STATUTES_AND_SECTIONS);
        String caseType = getCaseType(statutesAndSections);

        return String.format(
                ES_INDEX_HEADER_FORMAT + ES_INDEX_BILLING_FORMAT,
                config.getBillingIndex(), id, id, tenantId, paymentCreatedDate,paymentCompletedDate,caseTitle, caseNumber,caseStage, caseId, caseType, paymentType, totalAmount, status, consumerCode, filingNumber,businessService, courtId, auditJsonString
        );

    }


    public String buildPayload(String jsonItem, JSONObject requestInfo, Long paymentCompletedDate) {

        String id = JsonPath.read(jsonItem, ID_PATH);
        String businessService = JsonPath.read(jsonItem, BUSINESS_SERVICE_PATH);
        String status = JsonPath.read(jsonItem, STATUS_PATH);
        String tenantId = JsonPath.read(jsonItem, TENANT_ID_PATH);
        String consumerCode = JsonPath.read(jsonItem, CONSUMER_CODE_PATH);
        String[] consumerCodeSplitArray = splitConsumerCode(consumerCode);
        String paymentType = getPaymentType(consumerCodeSplitArray[1], businessService);

        // Extract demandDetails array
        List<Map<String, Object>> demandDetails = JsonPath.read(jsonItem, DEMAND_DETAILS_PATH);
        Double totalAmount = getTotalAmount(demandDetails);
        // Extract audit details
        Map<String, Object> auditDetails = JsonPath.read(jsonItem, AUDIT_DETAILS_PATH);
        Long paymentCreatedDate = JsonPath.read(jsonItem, PAYMENT_CREATED_TIME_PATH);
        log.info("paymentCreatedDate: {}, paymentCompletedDate: {}", paymentCreatedDate, paymentCompletedDate);
        Gson gson = new Gson();
        String auditJsonString = gson.toJson(auditDetails);

        log.info("Inside billing utils build payload:: entityType: {}, referenceId: {}, status: {},  tenantId: {}", businessService, consumerCode, status, tenantId);

        JSONObject request = new JSONObject();
        request.put(REQUEST_INFO, requestInfo);
        Map<String, String> details = indexerUtil.processEntityByType(businessService, request, consumerCodeSplitArray[0], null);

        String cnrNumber = details.get(CNR_NUMBER_KEY);
        String filingNumber = details.get(FILING_NUMBER);
        String caseNumber = filingNumber;

        // fetch case detail
        Object caseObject = caseUtil.getCase(request, tenantId, cnrNumber, filingNumber, null);
        String caseTitle = JsonPath.read(caseObject.toString(), CASE_TITLE_PATH);
        String cmpNumber = JsonPath.read(caseObject.toString(), CASE_CMPNUMBER_PATH);
        String courtCaseNumber = JsonPath.read(caseObject.toString(), CASE_COURTCASENUMBER_PATH);
        String courtId = JsonPath.read(caseObject.toString(), CASE_COURTID_PATH);

        if(courtCaseNumber!=null && !courtCaseNumber.isEmpty()){
            caseNumber = courtCaseNumber;
        }else if(cmpNumber!=null && !cmpNumber.isEmpty()){
            caseNumber = cmpNumber;
        }

        String caseId = JsonPath.read(caseObject.toString(), CASEID_PATH);
        String caseStage = JsonPath.read(caseObject.toString(), CASE_STAGE_PATH);
        net.minidev.json.JSONArray statutesAndSections = JsonPath.read(caseObject.toString(), CASE_STATUTES_AND_SECTIONS);
        String caseType = getCaseType(statutesAndSections);

        return String.format(
                ES_INDEX_HEADER_FORMAT + ES_INDEX_BILLING_FORMAT,
                config.getBillingIndex(), id, id, tenantId, paymentCreatedDate,paymentCompletedDate,caseTitle, caseNumber,caseStage, caseId, caseType, paymentType, totalAmount, status, consumerCode, filingNumber,businessService, courtId, auditJsonString
        );
    }

    private String[] splitConsumerCode(String consumerCode) {
        String[] temp = consumerCode.split("_", 2);
        String suffix = temp[1].replaceFirst("-\\d+$", "");
        return new String[] { temp[0], suffix };
    }

    private String getCourtId(String filingNumber, RequestInfo request) {
        try {
            org.pucar.dristi.web.models.CaseSearchRequest caseSearchRequest = createCaseSearchRequest(request, filingNumber);
            JsonNode caseDetails = caseUtil.searchCaseDetails(caseSearchRequest);
            return caseDetails.get(0).get("courtId").textValue();
        } catch (Exception e) {
            log.error("Error occurred while getting court id: {}", e.toString());
        }
        return null;

    }

    public CaseSearchRequest createCaseSearchRequest(RequestInfo requestInfo, String filingNumber) {
        CaseSearchRequest caseSearchRequest = new CaseSearchRequest();
        caseSearchRequest.setRequestInfo(requestInfo);
        CaseCriteria caseCriteria = CaseCriteria.builder().filingNumber(filingNumber).defaultFields(false).build();
        caseSearchRequest.addCriteriaItem(caseCriteria);
        return caseSearchRequest;
    }

    public String buildString(JSONObject jsonObject) {
        return indexerUtil.buildString(jsonObject);
    }

    public List<Demand> getDemandByConsumerCode(String consumerCode, String status, String tenantId, RequestInfo requestInfo) {
        String baseUrl = config.getDemandHost() + config.getDemandEndPoint();
        String url = String.format(CONSUMER_CODE_FORMAT, baseUrl, tenantId, consumerCode, status);
        Object response = null;
        try {
            RequestInfoWrapper wrapper = new RequestInfoWrapper();
            wrapper.setRequestInfo(requestInfo);
            response = requestRepository.fetchResult(new StringBuilder(url), wrapper);
            DemandResponse demandResponse = objectMapper.convertValue(response, DemandResponse.class);
            return demandResponse.getDemands();
        } catch (ServiceCallException e) {
            log.error("Error while fetching demand by consumer code: {}", e.toString());
            throw new CustomException(DEMAND_SERVICE_EXCEPTION, DEMAND_SERVICE_CONSUMER_CODE_EXCEPTION_MESSAGE);
        }
    }


    public String getDemand(String tenantId, String demandId, JSONObject requestInfo) {

        String baseUrl = config.getDemandHost() + config.getDemandEndPoint();
        String url = String.format(STRING_FORMAT, baseUrl, tenantId, demandId);
        String response = null;
        try {
            response = requestRepository.fetchResult(new StringBuilder(url), requestInfo);
        } catch (ServiceCallException e) {
            // we are not throwing error here
            log.error(DEMAND_SERVICE_EXCEPTION, DEMAND_SERVICE_EXCEPTION_MESSAGE);
        }

        return response;
    }

    private String getPaymentType(String suffix, String businessService) {
        RequestInfo requestInfo = RequestInfo.builder().build();
        String tenantId = config.getStateLevelTenantId();
        net.minidev.json.JSONArray paymentMode = mdmsUtil.fetchMdmsData(requestInfo, tenantId, PAYMENT_MODULE_NAME, List.of(PAYMENT_TYPE_MASTER_NAME))
                .get(PAYMENT_MODULE_NAME).get(PAYMENT_TYPE_MASTER_NAME);

        String filterString = String.format(FILTER_PAYMENT_TYPE, suffix, businessService);
        net.minidev.json.JSONArray payment = JsonPath.read(paymentMode, filterString);

        try {
            List<Map<String, Object>> maps = filterServiceCode(payment, businessService);
            if (maps.isEmpty()) {
                throw new CustomException(NO_PAYMENT_TYPE_FOUND_CODE, NO_PAYMENT_TYPE_FOUND_MSG);
            }
            return maps.get(0).get(PAYMENT_TYPE).toString();
        } catch (JsonProcessingException e) {
            throw new CustomException(JSON_PROCESSING_EXCEPTION, JSON_PROCESSING_EXCEPTION_MSG);
        }
    }

    private String getCaseType(net.minidev.json.JSONArray jsonArray) {

        StringBuilder caseTypeBuilder = new StringBuilder();

        for (Object obj : jsonArray) {
            JSONObject jsonObject = new org.json.JSONObject(new Gson().toJson(obj));
            String caseType = jsonObject.optString(STATUTE, STATUTE_DEFAULT_VALUE); // TODO: remove when data is fixed

            if (caseTypeBuilder.length() > 0) {
                caseTypeBuilder.append(",");
            }
            caseTypeBuilder.append(caseType);
        }

        return caseTypeBuilder.toString();
    }


    private Double getTotalAmount(List<Map<String, Object>> demandDetails) {
        Double totalAmount = 0.0;
        for (Map<String, Object> demandDetail : demandDetails) {

            Double taxAmount = Double.parseDouble(demandDetail.get(TAX_AMOUNT).toString());
            totalAmount += taxAmount;

        }
        return totalAmount;
    }

    private Double getTotalTaxAmount(List<DemandDetail> demandDetails) {
        Double totalAmount = 0.0;
        for (DemandDetail demandDetail : demandDetails) {

            Double taxAmount = Double.parseDouble(demandDetail.getTaxAmount().toString());
            totalAmount += taxAmount;

        }
        return totalAmount;
    }

    public List<Map<String, Object>> filterServiceCode(net.minidev.json.JSONArray paymentMasterWithDeliveryChannel, String serviceCode) throws JsonProcessingException {


        String jsonString = paymentMasterWithDeliveryChannel.toString();
        List<Map<String, Object>> jsonList = objectMapper.readValue(jsonString, new TypeReference<>() {
        });

        return jsonList.stream()
                .filter(item ->
                        ((List<Map<String, Object>>) item.get("businessService")).stream()
                                .anyMatch(service -> serviceCode.equals(service.get("businessCode")))
                )
                .toList();


    }
}
