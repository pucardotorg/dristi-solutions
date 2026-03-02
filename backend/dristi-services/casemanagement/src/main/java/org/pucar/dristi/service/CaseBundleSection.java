package org.pucar.dristi.service;

import org.pucar.dristi.web.models.BundleData;
import org.pucar.dristi.web.models.CaseBundleNode;

public interface CaseBundleSection {

    String getOrder();

    CaseBundleNode build(BundleData data);
}
