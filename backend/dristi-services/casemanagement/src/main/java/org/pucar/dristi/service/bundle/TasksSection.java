package org.pucar.dristi.service.bundle;

import org.egov.common.contract.models.Document;
import org.pucar.dristi.service.CaseBundleSection;
import org.pucar.dristi.web.models.BundleData;
import org.pucar.dristi.web.models.CaseBundleNode;
import org.pucar.dristi.web.models.CourtCase;
import org.pucar.dristi.web.models.Task;
import org.pucar.dristi.web.models.docpreview.DocPreviewRequest;
 

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

public class TasksSection implements CaseBundleSection {

    @Override
    public String getOrder() {
        return "16";
    }

    @Override
    public CaseBundleNode build(BundleData data) {
        if (data == null || data.getTasks() == null || data.getTasks().isEmpty()) return null;

        List<CaseBundleNode> children = new ArrayList<>();
        int idx = 0;
        for (Task task : data.getTasks()) {
            if (task == null || task.getDocuments() == null || task.getDocuments().isEmpty()) continue;

            String fileStoreId = task.getDocuments().stream()
                    .filter(Objects::nonNull)
                    .map(Document::getFileStore)
                    .filter(Objects::nonNull)
                    .findFirst()
                    .orElse(null);

            if (fileStoreId == null) continue;

            String title = BundleSectionUtils.firstNonBlank(task.getTaskType(), task.getTaskNumber(), "TASK");

            children.add(CaseBundleNode.builder()
                    .id("task-" + idx++)
                    .title(title)
                    .fileStoreId(fileStoreId)
                    .build());
        }

        if (children.isEmpty()) return null;

        return CaseBundleNode.builder()
                .id("tasks")
                .title("TASKS")
                .children(children)
                .build();
    }
}
