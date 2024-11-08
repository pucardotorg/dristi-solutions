package org.pucar.dristi.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.AuditDetails;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.CaseBundleRepository;
import org.pucar.dristi.repository.ElasticSearchRepository;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.web.models.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.egov.tracer.model.CustomException;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.pucar.dristi.config.ServiceConstants.*;


@Service
@Slf4j
public class CaseBundleService {

    private final ElasticSearchRepository esRepository;
    private final Configuration configuration;
    private final ObjectMapper objectMapper;
    private final ServiceRequestRepository serviceRequestRepository;
    private final CaseBundleRepository caseBundleRepository;

    @Autowired
    public CaseBundleService(ElasticSearchRepository esRepository, Configuration configuration, ObjectMapper objectMapper,ServiceRequestRepository serviceRequestRepository,
                             CaseBundleRepository caseBundleRepository) {
        this.esRepository = esRepository;
        this.configuration = configuration;
        this.objectMapper = objectMapper;
        this.serviceRequestRepository=serviceRequestRepository;
        this.caseBundleRepository=caseBundleRepository;
    }

    public String getCaseNumber(RequestInfo requestInfo , String caseId, String tenantId){
        String caseNumber;
        CaseSearchRequest caseSearchRequest = new CaseSearchRequest();
        caseSearchRequest.setTenantId(tenantId);
        CaseCriteria caseCriteria = new CaseCriteria();
        caseCriteria.setCaseId(caseId);
        caseCriteria.setDefaultFields(false);
        List<CaseCriteria> caseList = new ArrayList<>();
        caseList.add(caseCriteria);
        caseSearchRequest.setCriteria(caseList);
        caseSearchRequest.setRequestInfo(requestInfo);
        StringBuilder uri = new StringBuilder();
        uri.append(configuration.getCaseHost()).append(configuration.getCaseSearchUrl());
        Object response = serviceRequestRepository.fetchResult(uri,caseSearchRequest);

        try {
            Map<String, Object> responseMap = (Map<String, Object>) response;
            List<Map<String, Object>> criteriaList = (List<Map<String, Object>>) responseMap.get("criteria");

            Map<String, Object> criteria = criteriaList.get(0);
            List<Map<String, Object>> responseList = (List<Map<String, Object>>) criteria.get("responseList");

            if (responseList == null || responseList.isEmpty()) {
                throw new CustomException("NO_RESPONSE_LIST", "No response list found in the criteria");
            }

            Map<String, Object> caseData = responseList.get(0);
            String courtCaseNumber = (String) caseData.get("courtCaseNumber");
            String cmpNumber = (String) caseData.get("cmpNumber");
            String filingNumber = (String) caseData.get("filingNumber");

            if (courtCaseNumber != null) {
                caseNumber = courtCaseNumber;
            } else if (cmpNumber != null) {
                caseNumber = cmpNumber;
            } else if (filingNumber != null) {
                caseNumber = filingNumber;
            } else {
                throw new CustomException("CASE_NUMBER_NOT_FOUND", "No valid case number found in the response");
            }
        }catch (Exception e){
            throw new RuntimeException("Error processing Case response", e);
        }

        return caseNumber;
    }

    public String getCaseBundle(CaseBundleRequest caseBundleRequest){
        CaseBundleTracker caseBundleTracker = new CaseBundleTracker();
        caseBundleTracker.setStartTime(System.currentTimeMillis());
        caseBundleTracker.setId(UUID.randomUUID().toString());
        AuditDetails auditDetails = AuditDetails.builder().createdBy(caseBundleRequest.getRequestInfo().getUserInfo().getUuid()).createdTime(System.currentTimeMillis()).lastModifiedBy(caseBundleRequest.getRequestInfo().getUserInfo().getUuid()).lastModifiedTime(System.currentTimeMillis()).build();
        caseBundleTracker.setAuditDetails(auditDetails);
        String tenantId  = caseBundleRequest.getTenantId();
        String caseId = caseBundleRequest.getCaseId();
        String fileStoreId;
        log.info("Retrieving documents from index: {} with id: {}", configuration.getCaseBundleIndex(), caseId);
        String uri = configuration.getEsHostUrl() + configuration.getCaseBundleIndex() + configuration.getSearchPath();
        String request = String.format(
                ES_IDS_QUERY,
                caseId
        );
        String response = esRepository.fetchDocuments(uri, request);
        try {
            JsonNode rootNode = objectMapper.readTree(response);
            JsonNode hitsNode = rootNode.path("hits").path("hits");
            if (hitsNode.isArray() && hitsNode.isEmpty()) {
                throw new CustomException("CASE_NOT_FOUND", "Unable to find case with given caseId");
            }
            else{
                JsonNode indexJson = hitsNode.get(0).path("_source");

                long contentLastModified = indexJson.path("contentLastModified").asLong();
                long pdfCreatedDate = indexJson.path("pdfCreatedDate").asLong();

                if (contentLastModified <= pdfCreatedDate) {
                    log.info("No content update. Reusing existing PDF bundle.");
                    String fileStore = indexJson.path("fileStoreId").asText();
                    return fileStore;

                }
                else{
                    String caseNumber = getCaseNumber(caseBundleRequest.getRequestInfo(),caseId,tenantId);
                    CaseBundlePdfRequest caseBundlePdfRequest = new CaseBundlePdfRequest();
                    caseBundlePdfRequest.setRequestInfo(caseBundleRequest.getRequestInfo());
                    caseBundlePdfRequest.setIndex(indexJson);
                    caseBundlePdfRequest.setCaseNumber(caseNumber);
                    StringBuilder url = new StringBuilder();
                    url.append(configuration.getCaseBundlePdfHost() ).append(configuration.getCaseBundelPdfPath()) ;
                    Object pdfResponse =   serviceRequestRepository.fetchResult(url,caseBundlePdfRequest);
                    ObjectMapper objectMapper = new ObjectMapper();
                    Map<String, Object> pdfResponseMap = objectMapper.convertValue(pdfResponse, Map.class);
                    Map<String, Object> indexMap = (Map<String, Object>) pdfResponseMap.get("index");
                    fileStoreId = (String) indexMap.get("fileStoreId");
                    String esUrL = configuration.getEsHostUrl() + configuration.getCaseBundleIndex() + "/_update" + caseId;
                    String esRequest = String.format(
                            ES_UPDATE_QUERY,
                            objectMapper.writeValueAsString(indexMap)
                    );
                    String esResponse = esRepository.fetchDocuments(uri, esRequest);

                }
            }
        }
        catch (Exception e) {
           throw new RuntimeException("Error while reading data from ", e);
        }

        caseBundleTracker.setPageCount(1);
        caseBundleTracker.setEndTime(System.currentTimeMillis());
        caseBundleRepository.insertCaseTracker(caseBundleTracker);

        return  fileStoreId;
    }
}
