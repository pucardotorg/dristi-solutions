package org.pucar.dristi.web.models;

import lombok.Builder;
import lombok.Getter;
import org.pucar.dristi.web.models.digitalizeddocument.DigitalizedDocument;
import org.pucar.dristi.web.models.digitalizeddocument.Document;
import org.pucar.dristi.web.models.order.Order;
import org.pucar.dristi.web.models.task.TaskCase;
import org.pucar.dristi.web.models.taskManagement.TaskManagement;

import java.util.List;
import java.util.Map;
import java.util.Set;

@Getter
@Builder
public class BundleData {

    private final CourtCase cases;

    private final List<Artifact> evidences;

    private final List<Artifact> additionalFilingEvidences;

    private final List<Application> applications;

    private final List<Order> orders;

    private final List<Task> tasks;

    private final List<TaskCase> taskCases;

    private final List<TaskManagement> taskManagements;

    private final List<DigitalizedDocument> digitalDocs;

    private final Map<String, List<Document>> documentsGroupedByType;

    private final Map<String, String> sectionOrders;

    private final Set<String> inactiveSections;

    private final Map<String, String> sectionSortFields;

    private final Map<String, List<String>> sectionDoctypeOrder;

}
