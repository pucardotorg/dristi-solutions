package org.pucar.dristi.service;

import org.pucar.dristi.web.models.BundleData;
import org.pucar.dristi.web.models.CaseBundleNode;
import org.pucar.dristi.web.models.CourtCase;
import org.pucar.dristi.web.models.docpreview.DocPreviewRequest;

public interface CaseBundleSection {

    String getOrder();

    default String getSectionKey() {
        return getClass().getSimpleName();
    }

    CaseBundleNode build(BundleData data);
}
