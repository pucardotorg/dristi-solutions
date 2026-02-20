package org.pucar.dristi.service;

import com.jayway.jsonpath.JsonPath;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.jetbrains.annotations.NotNull;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.util.BillingUtil;
import org.pucar.dristi.util.IndexerUtils;
import org.pucar.dristi.util.MdmsUtil;
import org.pucar.dristi.util.Util;
import org.pucar.dristi.web.models.OfflinePaymentTaskRequest;
import org.pucar.dristi.web.models.billingservice.Demand;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Set;

import static org.pucar.dristi.config.ServiceConstants.*;
import static org.pucar.dristi.config.ServiceConstants.PAYMENT_TRANSACTION_DATE_PATH;

@Service
@Slf4j
public class BillingService {

    private final BillingUtil billingUtil;
    private final Util util;
    private final Configuration config;
    private final IndexerUtils indexerUtils;
    private final MdmsUtil mdmsUtil;

    @Autowired
    public BillingService(BillingUtil billingUtil, Util util, Configuration config, IndexerUtils indexerUtils, MdmsUtil mdmsUtil) {
        this.billingUtil = billingUtil;
        this.util = util;
        this.config = config;
        this.indexerUtils = indexerUtils;
        this.mdmsUtil = mdmsUtil;
    }

    public void processOfflinePayment(OfflinePaymentTaskRequest offlinePaymentTaskRequest) {

        String consumerCode = offlinePaymentTaskRequest.getOfflinePaymentTask().getConsumerCode();

        String tenantId = offlinePaymentTaskRequest.getOfflinePaymentTask().getTenantId();

        RequestInfo requestInfo = offlinePaymentTaskRequest.getRequestInfo();

        List<Demand> demands = billingUtil.getDemandByConsumerCode(consumerCode, ACTIVE,  tenantId , requestInfo);

        if (demands == null || demands.isEmpty()) {
            log.warn("No active demands found for consumer code: {}", consumerCode);
            return;
        }

        Demand demand = demands.get(0);

        String payload = billingUtil.buildPayload(demand, requestInfo, offlinePaymentTaskRequest.getOfflinePaymentTask());

        if (payload != null) {
            String uri = config.getEsHostUrl() + config.getBulkPath();
            try {
                indexerUtils.esPostManual(uri, payload);
            } catch (Exception e) {
                log.error("Error indexing document", e);
                throw new CustomException("INDEXING_ERROR", "Error indexing document");
            }
        }
    }

    public void process(String topic, String kafkaJson) {

        log.info("Inside billing service:: Topic: {}, kafkaJson: {}", topic, kafkaJson);
        String demandGenerateTopic = config.getDemandGenerateTopic();
        String paymentCollectTopic = config.getPaymentCollectTopic();


        if (topic.equals(demandGenerateTopic)) {
            processDemand(kafkaJson,null);
        } else if (topic.equals(paymentCollectTopic)) {
            processPayment(kafkaJson);
        } else {
            throw new CustomException(UNKNOWN_TOPIC_EXCEPTION, "Unexpected topic: " + topic);
        }

    }


    private void processPayment(String payment) {
        try {
            JSONArray paymentDetailsArray = util.constructArray(payment, PAYMENT_PAYMENT_DETAILS_PATH);
            Long paymentCompletedDate =  ((Number) JsonPath.read(payment, PAYMENT_TRANSACTION_DATE_PATH)).longValue();
            LinkedHashMap<String, Object> requestInfoMap = JsonPath.read(payment, REQUEST_INFO_PATH);
            JSONObject requestInfo = new JSONObject();
            requestInfo.put(REQUEST_INFO, requestInfoMap);
            Set<String> demandSet = extractDemandIds(paymentDetailsArray);
            String tenantId = config.getStateLevelTenantId();
            updateDemandStatus(demandSet, tenantId, requestInfoMap,paymentCompletedDate);
        } catch (Exception e) {
            log.error("Error processing payment", e);
        }
    }

    private Set<String> extractDemandIds(JSONArray paymentDetailsArray) throws JSONException {
        Set<String> demandSet = new HashSet<>();
        for (int i = 0; i < paymentDetailsArray.length(); i++) {
            JSONObject paymentDetails = paymentDetailsArray.getJSONObject(i);
            JSONArray billDetailsArray = null;
            try {
                billDetailsArray = util.constructArray(paymentDetails.toString(), PAYMENT_PAYMENT_BILL_DETAILS_PATH);
            } catch (Exception e) {
                log.error("Error processing bill details array", e);
                throw new CustomException(EXTRACT_DEMAND_ID_ERROR, e.getMessage());
            }
            for (int j = 0; j < billDetailsArray.length(); j++) {
                JSONObject billDetails = billDetailsArray.getJSONObject(i);
                String demandId = billDetails.getString(DEMAND_ID);
                demandSet.add(demandId);
            }
        }
        return demandSet;
    }

    private void updateDemandStatus(Set<String> demandSet, String tenantId, LinkedHashMap<String, Object> requestInfoMap,Long paymentCompletedDate) throws JSONException {

        JSONObject requestInfo = new JSONObject();
        requestInfo.put(REQUEST_INFO, requestInfoMap);
        for (String demandId : demandSet) {

            String demand = billingUtil.getDemand(tenantId, demandId, requestInfo);
            JSONArray demandArray = null;
            try {
                demandArray = util.constructArray(demand, DEMAND_PATH);
            } catch (Exception e) {

                log.error("Error processing bill details array", e);
                throw new CustomException(UPDATE_DEMAND_ERROR, e.getMessage());
            }
            for (int i = 0; i < demandArray.length(); i++) {
                JSONObject demandObject = demandArray.getJSONObject(i);
                demandObject.put(STATUS_KEY, STATUS_PAID);
            }
            JSONObject demandRequest = new JSONObject();
            demandRequest.put(REQUEST_INFO, requestInfoMap);
            demandRequest.put(DEMANDS, demandArray);
            processDemand(demandRequest.toString(),paymentCompletedDate);
        }

    }


    private void processDemand(String demands, Long paymentCompletedDate) {
        try {
            JSONArray kafkaJsonArray = util.constructArray(demands, DEMAND_PATH);

            LinkedHashMap<String, Object> requestInfoMap = JsonPath.read(demands, REQUEST_INFO_PATH);
            JSONObject requestInfo = new JSONObject(requestInfoMap);

            StringBuilder bulkRequest = buildBulkRequest(kafkaJsonArray, requestInfo,paymentCompletedDate);

            if (!bulkRequest.isEmpty()) {
                String uri = config.getEsHostUrl() + config.getBulkPath();
                indexerUtils.esPost(uri, bulkRequest.toString());
            }
        } catch (Exception e) {

        }
    }

    StringBuilder buildBulkRequest(JSONArray kafkaJsonArray, JSONObject requestInfo,Long paymentCompletedDate) {
        StringBuilder bulkRequest = new StringBuilder();
        try {
            for (int i = 0; i < kafkaJsonArray.length(); i++) {
                JSONObject jsonObject = kafkaJsonArray.optJSONObject(i);
                if (jsonObject != null) {
                    processJsonObject(jsonObject, bulkRequest, requestInfo,paymentCompletedDate);
                }
            }
        } catch (JSONException e) {
            log.error("Error processing JSON array", e);
        }

        return bulkRequest;
    }

    void processJsonObject(JSONObject jsonObject, StringBuilder bulkRequest, JSONObject requestInfo,Long paymentCompletedDate) {
        try {
            String stringifiedObject = billingUtil.buildString(jsonObject);
            String consumerCode = JsonPath.read(stringifiedObject, CONSUMER_CODE_PATH);
            String[] consumerCodeSplitArray = splitConsumerCode(consumerCode);

            if (isOfflinePaymentAvailable(consumerCodeSplitArray[1])) {
                String payload = billingUtil.buildPayload(stringifiedObject, requestInfo, paymentCompletedDate);
                if (payload != null && !payload.isEmpty())
                    bulkRequest.append(payload);
            } else {
                throw new CustomException(OFFLINE_PAYMENT_ERROR, OFFLINE_PAYMENT_ERROR_MESSAGE);
            }

        } catch (Exception e) {
            log.error("Error while processing JSON object: {}", jsonObject, e);
        }
    }

    private String[] splitConsumerCode(String consumerCode) {
        String[] temp = consumerCode.split("_", 2);
        String suffix = temp[1].replaceFirst("-\\d+$", "");
        return new String[] { temp[0], suffix };
    }

    private boolean isOfflinePaymentAvailable(String suffix) {

        RequestInfo requestInfo = RequestInfo.builder().build();
        net.minidev.json.JSONArray paymentMode = mdmsUtil.fetchMdmsData(requestInfo, config.getStateLevelTenantId(), PAYMENT_MODULE_NAME, List.of(PAYMENT_MODE_MASTER_NAME))
                .get(PAYMENT_MODULE_NAME).get(PAYMENT_MODE_MASTER_NAME);

        String filterString = String.format(FILTER_PAYMENT_MODE, suffix, OFFLINE);

        net.minidev.json.JSONArray payment = JsonPath.read(paymentMode, filterString);
        return !payment.isEmpty();

    }
}
