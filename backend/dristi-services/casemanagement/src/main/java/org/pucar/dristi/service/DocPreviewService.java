package org.pucar.dristi.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import org.egov.common.contract.request.RequestInfo;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.ElasticSearchRepository;
import org.pucar.dristi.util.*;
import org.pucar.dristi.web.models.*;
import org.pucar.dristi.web.models.docpreview.DocPreviewRequest;
import org.pucar.dristi.web.models.task.TaskCaseSearchCriteria;
import org.pucar.dristi.web.models.taskManagement.TaskSearchCriteria;
import org.pucar.dristi.web.models.taskManagement.TaskSearchRequest;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;

import static org.pucar.dristi.config.ServiceConstants.ES_IDS_QUERY;

@Service
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

    private final CaseBundleEngine engine;

    public List<CaseBundleNode> getBundle(DocPreviewRequest request) {


        if (StringUtils.hasText(request.getCtcApplicationNumber())) {
            Boolean isPartyToCase = ctcUtil.isPartyToCase(request.getCtcApplicationNumber(), request.getCourtId(), request.getRequestInfo());
            if (Boolean.FALSE.equals(isPartyToCase)) {
                return null;
            }
        }

        CourtCase courtCase = caseUtil.getCase(request.getFilingNumber(), request.getCourtId());

        List<CaseBundleNode> cachedNodes = fetchCachedPreviewNodes(courtCase);
        if (cachedNodes != null) {
            return cachedNodes;
        }

        BundleData data = loadAllData(courtCase);

        List<CaseBundleNode> nodes = engine.build(data);
        upsertPreviewIndex(courtCase, nodes);
        return nodes;
    }

    private List<CaseBundleNode> fetchCachedPreviewNodes(CourtCase courtCase) {
        if (courtCase == null || courtCase.getId() == null) return null;

        String caseId = String.valueOf(courtCase.getId());
        String uri = configuration.getEsHostUrl() + configuration.getCasePreviewIndex() + configuration.getSearchPath();
        String esRequest = String.format(ES_IDS_QUERY, caseId);

        String response;
        try {
            response = esRepository.fetchDocuments(uri, esRequest);
        } catch (Exception e) {
            return null;
        }

        try {
            JsonNode rootNode = objectMapper.readTree(response);
            JsonNode hitsNode = rootNode.path("hits").path("hits");
            if (!hitsNode.isArray() || hitsNode.isEmpty()) return null;

            JsonNode indexJson = hitsNode.get(0).path("_source");

            JsonNode cachedNodesNode = indexJson.get("caseBundleNodes");
            if (cachedNodesNode == null || cachedNodesNode.isNull() || !cachedNodesNode.isArray()) return null;

            return objectMapper.convertValue(cachedNodesNode, new TypeReference<List<CaseBundleNode>>() {
            });
        } catch (Exception e) {
            return null;
        }
    }

    private void upsertPreviewIndex(CourtCase courtCase, List<CaseBundleNode> nodes) {
        if (courtCase == null || courtCase.getId() == null) return;
        String caseId = String.valueOf(courtCase.getId());

        try {
            ObjectNode indexJson = objectMapper.createObjectNode();
            indexJson.put("tenantId", courtCase.getTenantId());
            indexJson.put("caseID", caseId);
            indexJson.put("courtId", courtCase.getCourtId());

            long lastModified = System.currentTimeMillis();
            if (courtCase.getAuditdetails() != null && courtCase.getAuditdetails().getLastModifiedTime() != null) {
                lastModified = Math.max(lastModified, courtCase.getAuditdetails().getLastModifiedTime());
            }
            indexJson.put("contentLastModified", lastModified);

            indexJson.set("caseBundleNodes", objectMapper.valueToTree(nodes));

            String esDocUrl = configuration.getEsHostUrl() + configuration.getCasePreviewIndex() + "/_doc/" + caseId;
            String esBody = objectMapper.writeValueAsString(indexJson);
            esRepository.fetchDocuments(esDocUrl, esBody);
        } catch (Exception e) {
            // intentionally ignored, preview should still work even if cache update fails
        }
    }

    private BundleData loadAllData(CourtCase courtCase) {

        RequestInfo requestInfo = RequestInfo.builder().build();
        TaskCriteria taskCriteria = TaskCriteria.builder()
                .status("COMPLETED")
                .taskType("GENERIC")
                .tenantId(courtCase.getTenantId())
                .courtId(courtCase.getCourtId())
                .filingNumber(courtCase.getFilingNumber())
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
                .searchText(courtCase.getCnrNumber())
                .courtId(courtCase.getCourtId())
                .build();

        TaskSearchRequest taskSearchRequest = TaskSearchRequest.builder()
                .criteria(TaskSearchCriteria.builder().status("COMPLETED").filingNumber(courtCase.getFilingNumber()).tenantId(courtCase.getTenantId()).build())
                .pagination(Pagination.builder().order(OrderPagination.ASC).limit(100).sortBy("last_modified_time").build())
                .build();

        return BundleData.builder()
                .cases(courtCase)
                .evidences(evidenceUtil.searchEvidence(courtCase.getFilingNumber(), courtCase.getCourtId()))
                .applications(applicationUtil.searchAllApplications(courtCase.getFilingNumber(), courtCase.getCourtId()))
                .orders(orderUtil.getOrders(courtCase.getFilingNumber(), courtCase.getCourtId()))
                .tasks(taskUtil.searchTask(taskCriteria, requestInfo))
                .taskCases(taskUtil.searchTaskTable(taskCaseSearchCriteria, requestInfo))
                .taskManagements(taskManagementUtil.searchTaskManagement(taskSearchRequest))
                .digitalDocs(digitalizedDocumentUtil.searchDigitalizedDocuments(String.valueOf(courtCase.getId()), courtCase.getCourtId()))
                .build();
    }

}
