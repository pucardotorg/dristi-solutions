package org.pucar.dristi.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.jayway.jsonpath.JsonPath;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.pucar.dristi.util.FileStoreUtil;
import org.pucar.dristi.web.models.*;
import org.springframework.beans.factory.annotation.Value;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.ElasticSearchRepository;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.util.MdmsV2Util;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.core.io.Resource;

import java.io.IOException;
import java.util.*;

import static org.pucar.dristi.config.ServiceConstants.*;

@Slf4j
@Component
public class CaseBundleIndexBuilderService {

    private final Configuration configuration;
    private final ObjectMapper objectMapper;
    private final CaseBundleService caseBundleService;
    private final MdmsV2Util mdmsV2Util;
    private final ServiceRequestRepository serviceRequestRepository;
    private final ElasticSearchRepository esRepository;
    private final FileStoreUtil fileStoreUtil;

    @Value("classpath:CaseBundleDefault.json")
    private Resource caseDataResource;

    @Autowired
    public CaseBundleIndexBuilderService(Configuration configuration, ObjectMapper objectMapper, CaseBundleService caseBundleService, MdmsV2Util mdmsV2Util,
                                         ServiceRequestRepository serviceRequestRepository, ElasticSearchRepository esRepository, FileStoreUtil fileStoreUtil) {

        this.configuration = configuration;
        this.objectMapper = objectMapper;
        this.caseBundleService=caseBundleService;
        this.mdmsV2Util=mdmsV2Util;
        this.serviceRequestRepository=serviceRequestRepository;
        this.esRepository=esRepository;
        this.fileStoreUtil = fileStoreUtil;
    }

    public Boolean isValidState(String moduleName, String businessService, String state,String tenantID,RequestInfo requestInfo){

        Map<String, String> filters = new HashMap<>();
        filters.put("state", state);
        filters.put("moduleName",moduleName);
        filters.put("businessservice",businessService);

        List<Mdms> mdmsData = mdmsV2Util.fetchMdmsV2Data(requestInfo,tenantID,null,null,configuration.getStateMasterSchema(),true,filters);

        return !mdmsData.isEmpty();
    }

    public Boolean isDelayRequired(String moduleName, String businessService, String state,String tenantID, RequestInfo requestInfo){

        Map<String, String> filters = new HashMap<>();
        filters.put("state", state);
        filters.put("moduleName",moduleName);
        filters.put("businessservice",businessService);

        List<Mdms> mdmsData = mdmsV2Util.fetchMdmsV2Data(requestInfo,tenantID,null,null,configuration.getStateMasterSchema(),true,filters);

        JsonNode dataNode = mdmsData.get(0).getData();

        return dataNode != null && dataNode.has("isDelayRequired") && dataNode.get("isDelayRequired").asBoolean();

    }

    public String getCaseNumber(RequestInfo requestInfo, String filingNumber, String tenantId) {
        String caseId=null;
        CaseSearchRequest caseSearchRequest = new CaseSearchRequest();
        caseSearchRequest.setTenantId(tenantId);
        CaseCriteria caseCriteria = new CaseCriteria();
        caseCriteria.setFilingNumber(filingNumber);
        caseCriteria.setDefaultFields(false);
        List<CaseCriteria> caseList = new ArrayList<>();
        caseList.add(caseCriteria);
        caseSearchRequest.setCriteria(caseList);
        caseSearchRequest.setRequestInfo(requestInfo);
        caseSearchRequest.setFlow(FLOW_JAC);

        StringBuilder uri = new StringBuilder();
        uri.append(configuration.getCaseHost()).append(configuration.getCaseSearchUrl());

        Object response = null;
        try {
            response = serviceRequestRepository.fetchResult(uri, caseSearchRequest);
        } catch (Exception e) {
            log.error("Error while fetching case data from service request repository", e);
        }


        try {
            Map<String, Object> responseMap = (Map<String, Object>) response;
            List<Map<String, Object>> criteriaList = (List<Map<String, Object>>) responseMap.get("criteria");

            if (criteriaList == null || criteriaList.isEmpty()) {
                log.error(CASE_ERROR_MESSAGE);
                throw new CustomException(CASE_NOT_FOUND, CASE_ERROR_MESSAGE);
            }

            Map<String, Object> criteria = criteriaList.get(0);

            List<Map<String,Object>> responseList  = (List<Map<String,Object>>) criteria.get("responseList");

            if (responseList != null) {
                caseId = responseList.get(0).get("id").toString();
            }
            else {
                log.error(CASE_ERROR_MESSAGE);
                throw new CustomException(CASE_NOT_FOUND, CASE_ERROR_MESSAGE);
            }

        } catch (Exception e) {
            log.error("Error processing case response", e);
        }

        return caseId;
    }

    public CourtCase getCourtCase(RequestInfo requestInfo, String filingNumber, String tenantId) {
        CourtCase courtCase = CourtCase.builder().build();
        CaseSearchRequest caseSearchRequest = new CaseSearchRequest();
        caseSearchRequest.setTenantId(tenantId);
        CaseCriteria caseCriteria = new CaseCriteria();
        caseCriteria.setFilingNumber(filingNumber);
        caseCriteria.setDefaultFields(false);
        List<CaseCriteria> caseList = new ArrayList<>();
        caseList.add(caseCriteria);
        caseSearchRequest.setCriteria(caseList);
        caseSearchRequest.setRequestInfo(requestInfo);

        StringBuilder uri = new StringBuilder();
        uri.append(configuration.getCaseHost()).append(configuration.getCaseSearchUrl());

        Object response = null;
        try {
            response = serviceRequestRepository.fetchResult(uri, caseSearchRequest);
        } catch (Exception e) {
            log.error("Error while fetching case data from service request repository", e);
        }


        try {
            Map<String, Object> responseMap = (Map<String, Object>) response;
            List<Map<String, Object>> criteriaList = (List<Map<String, Object>>) responseMap.get("criteria");

            if (criteriaList == null || criteriaList.isEmpty()) {
                log.error(CASE_ERROR_MESSAGE);
                throw new CustomException(CASE_NOT_FOUND, CASE_ERROR_MESSAGE);
            }

            Map<String, Object> criteria = criteriaList.get(0);

            List<Map<String,Object>> responseList  = (List<Map<String,Object>>) criteria.get("responseList");

            if (responseList != null) {
                courtCase = objectMapper.convertValue(responseList.get(0), CourtCase.class);
            }

        } catch (Exception e) {
            log.error("Error processing case response", e);
        }

        return courtCase;

    }

    @KafkaListener(topics = {"${casemanagement.kafka.workflow.transition.topic}"})
    public void listen(final HashMap<String, Object> record) {
        List<Map<String, Object>> processInstances = (List<Map<String, Object>>) record.get("ProcessInstances");
        String moduleName =null ;
        String businessService=null ;
        String businessId =null;
        String tenantId=null ;
        String stateName=null;
        RequestInfo requestInfo = objectMapper.convertValue(record.get("RequestInfo"), RequestInfo.class);

        if (processInstances != null && !processInstances.isEmpty()) {
            Map<String, Object> processInstance = processInstances.get(0);
            moduleName = (String) processInstance.get("moduleName");
            businessService = (String) processInstance.get("businessService");
            businessId = (String) processInstance.get("businessId");
            tenantId = (String) processInstance.get("tenantId");
            Map<String, Object> state = (Map<String, Object>) processInstance.get("state");
            stateName = (String) state.get("state");
        }

        String filingNumber;

        Boolean isValid = isValidState(moduleName, businessService, stateName, tenantId,requestInfo);
        if(isValid){
            boolean isDelayRequired = isDelayRequired(moduleName, businessService, stateName, tenantId, requestInfo);
            filingNumber = getFilingNumberFromBusinessId(businessId, moduleName);
            enrichCaseBundlePdfIndex(requestInfo, filingNumber, tenantId, stateName, isDelayRequired);
        }


    }

    private String getFilingNumberFromBusinessId(String businessId, String moduleName) {
        if ("case".equalsIgnoreCase(moduleName)) {
            return businessId;
        }
        else {
            String[] parts = businessId.split("-");
            String result = String.join("-", parts[0], parts[1], parts[2]);
            log.info(result);
            return result;
        }
    }

    @KafkaListener(topics = {"#{'${casemanagement.kafka.non.workflow.transition.topics}'.split(',')}"})
    public void listenTopics(final HashMap<String, Object> record) {
        RequestInfo requestInfo = objectMapper.convertValue(record.get("RequestInfo"), RequestInfo.class);

        String tenantId = requestInfo.getUserInfo().getTenantId();

        String filingNumber = extractFilingNumber(record);

        CourtCase courtCase = getCourtCase(requestInfo, filingNumber, tenantId);

        List<String> allowedStatuses = configuration.getCaseAllowedStatusesList();

        String caseStatus = courtCase.getStatus();
        boolean canCaseBundleEnrich = allowedStatuses.stream()
                .anyMatch(status -> status.equalsIgnoreCase(caseStatus));



        String stateName = extractStatus(record);

        if (canCaseBundleEnrich) {
            enrichCaseBundlePdfIndex(requestInfo, filingNumber, tenantId, stateName, true);
        }


    }

    private String extractStatus(HashMap<String, Object> record) {
        for (Map.Entry<String, Object> entry : record.entrySet()) {
            String key = entry.getKey();

            if ("RequestInfo".equalsIgnoreCase(key)) {
                continue;
            }

            Object value = entry.getValue();

            if (value instanceof Map<?, ?> valueMap) {
                Object status = valueMap.get("status");
                if (status != null) {
                    return status.toString();
                }
            }
        }
        return null;
    }

    private String extractFilingNumber(Map<String, Object> record) {
        for (Map.Entry<String, Object> entry : record.entrySet()) {
            String key = entry.getKey();

            // Skip "RequestInfo"
            if ("RequestInfo".equalsIgnoreCase(key)) {
                continue;
            }

            Object value = entry.getValue();

            if (value instanceof Map<?, ?> valueMap) {
                Object filingNumber = valueMap.get("filingNumber");
                if (filingNumber != null) {
                    return filingNumber.toString();
                }
            }
        }
        return null;
    }


    public void enrichCaseBundlePdfIndex(RequestInfo requestInfo, String businessId, String tenantId, String stateName , boolean isDelayRequired) {

            String caseID = getCaseNumber(requestInfo,businessId,tenantId);
            if(caseID!=null){
                String uri = configuration.getEsHostUrl() + configuration.getCaseBundleIndex() + configuration.getSearchPath();
                String request = String.format(ES_IDS_QUERY, caseID);
                String response =null;

                try {
                    response = esRepository.fetchDocuments(uri, request);
                } catch (Exception e) {
                    log.error("Error while fetching documents from ElasticSearch", e);

                }

                try {
                    JsonNode rootNode = objectMapper.readTree(response);
                    JsonNode hitsNode = rootNode.path("hits").path("hits");

                    if (hitsNode.isArray() && hitsNode.isEmpty()) {
                        log.error("not able to get data from es for given case ID");
                    } else {
                        ObjectNode indexJson = (ObjectNode) hitsNode.get(0).path("_source");
                        long contentLastModified = System.currentTimeMillis();
                        indexJson.put("contentLastModified", contentLastModified);
                        JsonNode updateIndexJson = objectMapper.valueToTree(indexJson);
                        String esUpdateUrl = configuration.getEsHostUrl() + configuration.getCaseBundleIndex() + "/_update/" + caseID;
                        String esRequest;
                        try {
                            esRequest = String.format(ES_UPDATE_QUERY, objectMapper.writeValueAsString(updateIndexJson));
                            esRepository.fetchDocuments(esUpdateUrl, esRequest);
                        } catch (IOException e) {
                            log.error("Error updating ElasticSearch index with new data", e);
                        }

                    }
                }catch(Exception e){
                    log.error("Not able to parse json body : {} ", e.getMessage());
                }

            }
            else{
                log.error("No case present for processing");
            }


    }

    private void removeFileStore(List<String> curFileStore, List<String> fileStoreIds, String tenantId) {
        List<String> fileStoreToRemove = new ArrayList<>();
        try {
             fileStoreToRemove = curFileStore.stream()
                    .filter(fileStoreId -> !fileStoreIds.contains(fileStoreId))
                    .toList();
             if(fileStoreToRemove.isEmpty()) {
                 log.info("No files to delete.");
                 return;
             }
            fileStoreUtil.deleteFilesByFileStore(fileStoreToRemove, tenantId);
        } catch (Exception e) {
            log.error("Error deleting files :: {}", fileStoreToRemove);
        }
    }

    private List<String> extractFileStore(JsonNode indexJson) {
        List<String> fileStoreIds = new ArrayList<>();
        String fileStoreIdFromIndex = indexJson.path("fileStoreId").textValue();
        if(fileStoreIdFromIndex!=null && !fileStoreIdFromIndex.isEmpty()) {
            fileStoreIds.add(fileStoreIdFromIndex);
        }
        JsonNode sections = indexJson.path("sections");
        if (sections.isArray()) {
            for (JsonNode section : sections) {
                JsonNode lineItems = section.path("lineItems");
                if (lineItems.isArray()) {
                    for (JsonNode item : lineItems) {
                        JsonNode fileStoreId = item.get("fileStoreId");
                        if (fileStoreId != null && !fileStoreId.isNull()) {
                            fileStoreIds.add(fileStoreId.textValue());
                        }
                    }
                }
            }
        }
        return fileStoreIds;
    }

    @KafkaListener(topics = {"${casemanagement.kafka.case.application.topic}"})
    public void listenCaseApplication(final HashMap<String, Object> record) throws IOException {

        String caseId = ((LinkedHashMap<String, Object>) record.get("cases")).get("id").toString();

        String tenantId = ((LinkedHashMap<String, Object>) record.get("cases")).get("tenantId").toString();

        JsonNode caseData = objectMapper.readTree(caseDataResource.getInputStream());

        if (caseData.has("caseID") && caseData instanceof ObjectNode) {
            ((ObjectNode) caseData).put("caseID", caseId);
        }

        if (caseData.has("tenantId") && caseData instanceof ObjectNode) {
            ((ObjectNode) caseData).put("tenantId", tenantId);
        }

        String esUpdateUrl = configuration.getEsHostUrl() + configuration.getCaseBundleIndex() + "/_doc/" + caseId;
        String esRequest;
        try {
            esRequest = String.format(objectMapper.writeValueAsString(caseData));
            esRepository.fetchDocuments(esUpdateUrl, esRequest);
        } catch (IOException e) {
            log.error("Error enriching  ElasticSearch index with new data to initiate index", e);
        }


    }

    @KafkaListener(topics = {"${kafka.case.update.last.modified.time}"})
    public void listenForCaseLastModifiedUpdates(ConsumerRecord<String, Object> record) {
        log.info("Received Topic {} with value {}", record.topic(), record.value());
        String caseId = JsonPath.read(record.value(), "$.id");
        String uri = configuration.getEsHostUrl() + configuration.getCaseBundleIndex() + configuration.getSearchPath();
        String request = String.format(ES_IDS_QUERY, caseId);
        String response =null;

        try {
            response = esRepository.fetchDocuments(uri, request);
        } catch (Exception e) {
            log.error("Error while fetching documents from ElasticSearch", e);
        }

        try {
            JsonNode rootNode = objectMapper.readTree(response);
            JsonNode hitsNode = rootNode.path("hits").path("hits");

            if (hitsNode.isArray() && hitsNode.isEmpty()) {
                log.error("Not able to get data from es for given case ID: {}", caseId);
            } else {
                JsonNode indexJson = hitsNode.get(0).path("_source");
                ObjectNode indexJsonObject = (ObjectNode) indexJson;
                indexJsonObject.put("contentLastModified", System.currentTimeMillis());
                String esUpdateUrl = configuration.getEsHostUrl() + configuration.getCaseBundleIndex() + "/_update/" + caseId;
                String esRequest;
                try {
                    esRequest = String.format(ES_UPDATE_QUERY, objectMapper.writeValueAsString(indexJson));
                    esRepository.fetchDocuments(esUpdateUrl, esRequest);
                } catch (IOException e) {
                    log.error("Error updating ElasticSearch index with new data", e);
                }
            }
        }catch(Exception e){
            log.error("Not able to parse json body for case ID: {}", caseId, e);
        }

    }
}
