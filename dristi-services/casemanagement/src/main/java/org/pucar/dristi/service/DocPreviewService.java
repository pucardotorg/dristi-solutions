package org.pucar.dristi.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.kafka.Producer;
import org.pucar.dristi.repository.ElasticSearchRepository;
import org.pucar.dristi.util.*;
import org.pucar.dristi.web.models.*;
import org.pucar.dristi.web.models.docpreview.DocPreviewRequest;
import org.pucar.dristi.web.models.task.TaskCaseSearchCriteria;
import org.pucar.dristi.web.models.taskManagement.TaskSearchCriteria;
import org.pucar.dristi.web.models.taskManagement.TaskSearchRequest;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@Slf4j
@RequiredArgsConstructor
public class DocPreviewService {

    private final ElasticSearchRepository esRepository;
    private final Configuration configuration;
    private final ObjectMapper objectMapper;

    private final CaseUtil caseUtil;
    private final EvidenceUtil evidenceUtil;
    private final ApplicationUtil applicationUtil;
    private final TaskUtil taskUtil;
    private final DigitalizedDocumentUtil digitalizedDocumentUtil;
    private final TaskManagementUtil taskManagementUtil;
    private final OrderUtil orderUtil;
    private final CtcUtil ctcUtil;
    private final Producer producer;

    private final MdmsV2Util mdmsV2Util;

    private final CaseBundleEngine engine;

    public List<CaseBundleNode> getBundle(DocPreviewRequest request) {

        Boolean isPartyToCase = false;
        if (request.getCtcApplicationNumber() != null && StringUtils.hasText(request.getCtcApplicationNumber())) {
            isPartyToCase = ctcUtil.isPartyToCase(request.getCtcApplicationNumber(), request.getCourtId(), request.getRequestInfo());
        }
        if (Boolean.TRUE.equals(request.getIsCaseFileView())) {
            isPartyToCase = true;
        }

        CourtCase courtCase = caseUtil.getCase(request.getFilingNumber(), request.getCourtId(), request.getTenantId(), request.getIsCaseFileView(), request.getRequestInfo());

        BundleData data = loadAllData(courtCase, request.getRequestInfo());
        List<CaseBundleNode> caseBundleNodes =  engine.build(data);

        // Store the full caseBundles (with fileStoreIds) in the CTC application
        if (StringUtils.hasText(request.getCtcApplicationNumber())) {
            storeCaseBundlesInCtcApplication(request.getCtcApplicationNumber(), caseBundleNodes, request.getRequestInfo());
        }

        if (Boolean.TRUE.equals(isPartyToCase)) {
            return caseBundleNodes;
        }

        stripFileStoreIds(caseBundleNodes);
        return caseBundleNodes;
    }

    private void storeCaseBundlesInCtcApplication(String ctcApplicationNumber, List<CaseBundleNode> caseBundleNodes, RequestInfo requestInfo) {
        try {
            Map<String, Object> message = new HashMap<>();
            message.put("ctcApplicationNumber", ctcApplicationNumber);
            message.put("caseBundles", caseBundleNodes);
            message.put("lastModifiedBy", requestInfo.getUserInfo().getUuid());
            message.put("lastModifiedTime", System.currentTimeMillis());
            producer.push(configuration.getUpdateCaseBundlesTopic(), message);
            log.info("Pushed caseBundles update to Kafka for CTC application: {}", ctcApplicationNumber);
        } catch (Exception e) {
            log.error("Error pushing caseBundles update to Kafka for CTC application: {}", ctcApplicationNumber, e);
        }
    }

    private void stripFileStoreIds(List<CaseBundleNode> nodes) {
        if (nodes == null) return;
        for (CaseBundleNode node : nodes) {
            node.setFileStoreId(null);
            stripFileStoreIds(node.getChildren());
        }
    }

    private BundleData loadAllData(CourtCase courtCase, RequestInfo requestInfo) {

        String tenantId = courtCase.getTenantId();
        String courtId = courtCase.getCourtId();
        String filingNumber = courtCase.getFilingNumber();

        TaskCriteria taskCriteria = TaskCriteria.builder()
                .status("COMPLETED")
                .taskType("GENERIC")
                .tenantId(tenantId)
                .courtId(courtId)
                .filingNumber(filingNumber)
                .build();

        TaskCaseSearchCriteria taskCaseSearchCriteria = TaskCaseSearchCriteria.builder()
                .completeStatus(List.of(
                        "ISSUE_SUMMON",
                        "ISSUE_NOTICE",
                        "ISSUE_WARRANT",
                        "ISSUE_PROCLAMATION",
                        "ISSUE_ATTACHMENT",
                        "OTHER",
                        "ABATED",
                        "SUMMON_SENT",
                        "EXECUTED",
                        "NOT_EXECUTED",
                        "WARRANT_SENT",
                        "PROCLAMATION_SENT",
                        "ATTACHMENT_SENT",
                        "DELIVERED",
                        "UNDELIVERED",
                        "NOTICE_SENT"))
                .searchText(resolveSearchText(courtCase))
                .courtId(courtId)
                .tenantId(tenantId)
                .build();

        TaskSearchRequest taskSearchRequest = TaskSearchRequest.builder()
                .requestInfo(requestInfo)
                .criteria(TaskSearchCriteria.builder().status("COMPLETED").filingNumber(courtCase.getFilingNumber()).tenantId(tenantId).build())
                .pagination(Pagination.builder().order(OrderPagination.ASC).limit(100).sortBy("last_modified_time").build())
                .build();

        List<Mdms> sectionConfig = fetchSectionConfigFromMdms(requestInfo, tenantId);
        List<Mdms> caseBundleMaster = fetchCaseBundleMasterFromMdms(requestInfo, tenantId);

        return BundleData.builder()
                .cases(courtCase)
                .evidences(evidenceUtil.searchEvidence(filingNumber, courtId, tenantId, requestInfo))
                .additionalFilingEvidences(evidenceUtil.searchAdditionalFilingEvidence(filingNumber, courtId, tenantId, requestInfo))
                .applications(applicationUtil.searchAllApplications(filingNumber, courtId, tenantId, requestInfo))
                .orders(orderUtil.getOrders(courtCase.getFilingNumber(), courtCase.getCourtId(), requestInfo))
                .tasks(taskUtil.searchTask(taskCriteria, requestInfo))
                .taskCases(taskUtil.searchTaskTable(taskCaseSearchCriteria, requestInfo))
                .taskManagements(taskManagementUtil.searchTaskManagement(taskSearchRequest))
                .digitalDocs(digitalizedDocumentUtil.searchDigitalizedDocuments(String.valueOf(courtCase.getId()), courtCase.getCourtId() ,requestInfo, tenantId))
                .sectionOrders(parseSectionOrders(sectionConfig))
                .inactiveSections(parseInactiveSections(sectionConfig))
                .sectionSortFields(parseSectionSortFields(caseBundleMaster))
                .sectionDoctypeOrder(parseSectionDoctypeOrder(caseBundleMaster))
                .build();
    }

    private List<Mdms> fetchSectionConfigFromMdms(RequestInfo requestInfo, String tenantId) {
        try {
            return mdmsV2Util.fetchMdmsV2Data(
                    requestInfo, tenantId, null, null,
                    configuration.getCaseBundleSectionOrderSchema(), true, null);
        } catch (Exception e) {
            log.warn("Failed to fetch section config from MDMS, using defaults: {}", e.getMessage());
            return List.of();
        }
    }

    private List<Mdms> fetchCaseBundleMasterFromMdms(RequestInfo requestInfo, String tenantId) {
        try {
            return mdmsV2Util.fetchMdmsV2Data(
                    requestInfo, tenantId, null, null,
                    configuration.getCaseBundleMasterSchema(), true, null);
        } catch (Exception e) {
            log.warn("Failed to fetch case bundle master from MDMS, using defaults: {}", e.getMessage());
            return List.of();
        }
    }

    private Map<String, String> parseSectionOrders(List<Mdms> sectionConfig) {
        Map<String, String> orders = new HashMap<>();
        for (Mdms m : sectionConfig) {
            if (m.getData() == null || !m.getData().has("sectionKey") || !m.getData().has("order")) continue;
            if (m.getData().has("isActive") && !m.getData().get("isActive").asBoolean(true)) continue;
            String key = m.getData().get("sectionKey").asText();
            String order = String.format("%02d", m.getData().get("order").asInt());
            orders.put(key, order);
        }
        return orders;
    }

    private Set<String> parseInactiveSections(List<Mdms> sectionConfig) {
        Set<String> inactive = new HashSet<>();
        for (Mdms m : sectionConfig) {
            if (m.getData() == null || !m.getData().has("sectionKey")) continue;
            if (m.getData().has("isActive") && !m.getData().get("isActive").asBoolean(true)) {
                inactive.add(m.getData().get("sectionKey").asText());
            }
        }
        return inactive;
    }

    private Map<String, String> parseSectionSortFields(List<Mdms> caseBundleMaster) {
        Map<String, String> sortFields = new HashMap<>();
        for (Mdms m : caseBundleMaster) {
            if (m.getData() == null || !m.getData().has("name")) continue;
            if (m.getData().has("isActive") && !m.getData().get("isActive").asBoolean(true)) continue;
            String sectionName = m.getData().get("name").asText();
            if (m.getData().has("sorton") && !m.getData().get("sorton").isNull()) {
                sortFields.put(sectionName, m.getData().get("sorton").asText());
            }
        }
        return sortFields;
    }

    private Map<String, List<String>> parseSectionDoctypeOrder(List<Mdms> caseBundleMaster) {
        Map<String, List<com.fasterxml.jackson.databind.JsonNode>> grouped = new HashMap<>();
        for (Mdms m : caseBundleMaster) {
            if (m.getData() == null || !m.getData().has("name") || !m.getData().has("doctype")) continue;
            if (m.getData().has("isActive") && !m.getData().get("isActive").asBoolean(true)) continue;
            String name = m.getData().get("name").asText();
            grouped.computeIfAbsent(name, k -> new ArrayList<>()).add(m.getData());
        }
        Map<String, List<String>> result = new HashMap<>();
        for (Map.Entry<String, List<com.fasterxml.jackson.databind.JsonNode>> entry : grouped.entrySet()) {
            List<String> doctypes = entry.getValue().stream()
                    .sorted(Comparator.comparingInt(node ->
                            node.has("sorton") ? node.get("sorton").asInt(Integer.MAX_VALUE) : Integer.MAX_VALUE))
                    .map(node -> node.get("doctype").asText())
                    .toList();
            result.put(entry.getKey(), doctypes);
        }
        return result;
    }

    private String resolveSearchText(CourtCase courtCase) {
        if (StringUtils.hasText(courtCase.getCnrNumber())) return courtCase.getCnrNumber();
        if (StringUtils.hasText(courtCase.getCourtCaseNumber())) return courtCase.getCourtCaseNumber();
        return courtCase.getFilingNumber();
    }

}
