package org.pucar.dristi.service;

import lombok.RequiredArgsConstructor;
import org.pucar.dristi.util.*;
import org.pucar.dristi.web.models.BundleData;
import org.pucar.dristi.web.models.CaseBundleNode;
import org.pucar.dristi.web.models.CourtCase;
import org.pucar.dristi.web.models.docpreview.DocPreviewRequest;
import org.springframework.stereotype.Service;

import java.util.List;

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

    private final CaseBundleEngine engine;

    public List<CaseBundleNode> getBundle(DocPreviewRequest request) {

        CourtCase courtCase = caseUtil.getCase(request.getFilingNumber(),request.getCourtId());

        BundleData data = loadAllData(request.getFilingNumber(), request.getCourtId(),courtCase);

        return engine.build(data);
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
