package org.pucar.dristi.service;

import com.fasterxml.jackson.databind.ObjectMapper;
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

        BundleData data = loadAllData(courtCase);

        return engine.build(data);
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
                .searchText(resolveSearchText(courtCase))
                .courtId(courtCase.getCourtId())
                .tenantId(courtCase.getTenantId())
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

    private String resolveSearchText(CourtCase courtCase) {
        if (StringUtils.hasText(courtCase.getCnrNumber())) return courtCase.getCnrNumber();
        if (StringUtils.hasText(courtCase.getCourtCaseNumber())) return courtCase.getCourtCaseNumber();
        return courtCase.getFilingNumber();
    }

}
