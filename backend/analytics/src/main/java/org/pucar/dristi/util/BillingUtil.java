package org.pucar.dristi.util;


import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.Gson;
import com.jayway.jsonpath.JsonPath;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.egov.tracer.model.ServiceCallException;
import org.json.JSONObject;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.util.CaseUtil;
import org.pucar.dristi.util.IndexerUtils;
import org.pucar.dristi.util.MdmsUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

import static org.pucar.dristi.config.ServiceConstants.*;

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


    public String buildPayload(String jsonItem, JSONObject requestInfo, Long paymentCompletedDate) {

        String id = JsonPath.read(jsonItem, ID_PATH);
        String businessService = JsonPath.read(jsonItem, BUSINESS_SERVICE_PATH);
        String status = JsonPath.read(jsonItem, STATUS_PATH);
        String tenantId = JsonPath.read(jsonItem, TENANT_ID_PATH);
        String consumerCode = JsonPath.read(jsonItem, CONSUMER_CODE_PATH);
        String[] consumerCodeSplitArray = consumerCode.split("_", 2);
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
                config.getBillingIndex(), id, id, tenantId, paymentCreatedDate,paymentCompletedDate,caseTitle, caseNumber,caseStage, caseId, caseType, paymentType, totalAmount, status, consumerCode, businessService, auditJsonString
        );
    }

    public String buildString(JSONObject jsonObject) {
        return indexerUtil.buildString(jsonObject);
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
