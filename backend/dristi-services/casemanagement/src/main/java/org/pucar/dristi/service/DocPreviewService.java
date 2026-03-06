package org.pucar.dristi.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.pucar.dristi.config.ServiceConstants.ES_IDS_QUERY;

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

    private final CaseBundleEngine engine;

    public List<CaseBundleNode> getBundle(DocPreviewRequest request) {

        Boolean isPartyToCase = false;
        if (StringUtils.hasText(request.getCtcApplicationNumber())) {
            isPartyToCase = ctcUtil.isPartyToCase(request.getCtcApplicationNumber(), request.getCourtId(), request.getRequestInfo());
        }

        CourtCase courtCase = caseUtil.getCase(request.getFilingNumber(), request.getCourtId(), request.getTenantId());

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
            Map<String, Object> ctcApplication = new HashMap<>();
            ctcApplication.put("ctcApplicationNumber", ctcApplicationNumber);
            ctcApplication.put("caseBundles", caseBundleNodes);
            ctcUtil.updateCtcApplication(ctcApplication, requestInfo);
            log.info("Stored caseBundles in CTC application: {}", ctcApplicationNumber);
        } catch (Exception e) {
            log.error("Error storing caseBundles in CTC application: {}", ctcApplicationNumber, e);
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

        return BundleData.builder()
                .cases(courtCase)
                .evidences(evidenceUtil.searchEvidence(filingNumber, courtId, tenantId))
                .additionalFilingEvidences(evidenceUtil.searchAdditionalFilingEvidence(filingNumber, courtId, tenantId))
                .applications(applicationUtil.searchAllApplications(filingNumber, courtId, tenantId))
                .orders(orderUtil.getOrders(courtCase.getFilingNumber(), courtCase.getCourtId()))
                .tasks(taskUtil.searchTask(taskCriteria, requestInfo))
                .taskCases(taskUtil.searchTaskTable(taskCaseSearchCriteria, requestInfo))
                .taskManagements(taskManagementUtil.searchTaskManagement(taskSearchRequest))
                .digitalDocs(digitalizedDocumentUtil.searchDigitalizedDocuments(String.valueOf(courtCase.getId()), courtCase.getCourtId() ,requestInfo, tenantId))
                .build();
    }

    private String resolveSearchText(CourtCase courtCase) {
        if (StringUtils.hasText(courtCase.getCnrNumber())) return courtCase.getCnrNumber();
        if (StringUtils.hasText(courtCase.getCourtCaseNumber())) return courtCase.getCourtCaseNumber();
        return courtCase.getFilingNumber();
    }

}
