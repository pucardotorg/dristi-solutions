package org.pucar.dristi.service;

import lombok.RequiredArgsConstructor;
import org.pucar.dristi.util.*;
import org.pucar.dristi.web.models.BundleData;
import org.pucar.dristi.web.models.CaseBundleNode;
import org.pucar.dristi.web.models.CourtCase;
import org.pucar.dristi.web.models.docpreview.DocPreviewRequest;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class DocPreviewService {

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

        CourtCase courtCase = caseUtil.getCase(request.getFilingNumber(),request.getCourtId());

        BundleData data = loadAllData(request.getFilingNumber(), request.getCourtId(),courtCase);

        return engine.build(data,request,courtCase);
    }

    private BundleData loadAllData(String filingNumber, String courtId,CourtCase courtCase) {

        return BundleData.builder()
                .cases(courtCase)
                .evidences(evidenceUtil.searchEvidence(filingNumber,courtId))
                .applications(applicationUtil.searchApplications(filingNumber,courtId))
                .orders(orderUtil.getOrders(filingNumber,courtId))
                .tasks(taskUtil.searchTask(filingNumber,courtId))
                .digitalDocs(digitalizedDocumentUtil.searchDigitalizedDocuments(String.valueOf(courtCase.getId()),courtId))
                .build();
    }

}
