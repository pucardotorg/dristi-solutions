package org.pucar.dristi.web.models;

import lombok.Builder;
import lombok.Getter;
import org.pucar.dristi.web.models.digitalizeddocument.DigitalizedDocument;
import org.pucar.dristi.web.models.digitalizeddocument.Document;
import org.pucar.dristi.web.models.order.Order;

import java.util.List;
import java.util.Map;

@Getter
@Builder
public class BundleData {

    private final CourtCase cases;

    private final List<Artifact> evidences;

    private final List<Application> applications;

    private final List<Order> orders;

    private final List<Task> tasks;

    private final List<DigitalizedDocument> digitalDocs;

    private final Map<String, List<Document>> documentsGroupedByType;

}
