package org.pucar.dristi.service.bundle;

import org.egov.common.contract.models.Document;
import org.pucar.dristi.service.CaseBundleSection;
import org.pucar.dristi.web.models.BundleData;
import org.pucar.dristi.web.models.CaseBundleNode;
import org.pucar.dristi.web.models.task.TaskCase;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Component
public class ProcessesSection implements CaseBundleSection {

    private static final Map<String, String> ORDER_TYPE_MAP = new LinkedHashMap<>();
    static {
        ORDER_TYPE_MAP.put("NOTICE", "NOTICE");
        ORDER_TYPE_MAP.put("WARRANT", "WARRANT");
        ORDER_TYPE_MAP.put("SUMMONS", "SUMMONS");
    }

    @Override
    public String getOrder() {
        return "12";
    }

    @Override
    public CaseBundleNode build(BundleData data) {

        if (data == null || data.getTaskCases() == null)
            return null;

        Map<String, List<TaskCase>> grouped = new LinkedHashMap<>();
        for (String key : ORDER_TYPE_MAP.keySet()) {
            grouped.put(key, new ArrayList<>());
        }

        for (TaskCase tc : data.getTaskCases()) {
            if (tc == null || tc.getOrderType() == null) continue;
            String type = tc.getOrderType().toUpperCase();
            if (type.contains("NOTICE")) grouped.get("NOTICE").add(tc);
            else if (type.contains("WARRANT")) grouped.get("WARRANT").add(tc);
            else if (type.contains("SUMMON")) grouped.get("SUMMONS").add(tc);
        }

        List<CaseBundleNode> children = new ArrayList<>();

        for (Map.Entry<String, List<TaskCase>> entry : grouped.entrySet()) {
            List<TaskCase> tasks = entry.getValue();
            if (tasks.isEmpty()) continue;

            List<CaseBundleNode> taskNodes = new ArrayList<>();
            int idx = 1;
            for (TaskCase tc : tasks) {
                String fileStoreId = extractProcessDocument(tc);
                if (fileStoreId == null) continue;
                taskNodes.add(CaseBundleNode.builder()
                        .id("process-" + tc.getId())
                        .title(entry.getKey() + " " + idx)
                        .fileStoreId(fileStoreId)
                        .build());
                idx++;
            }

            if (!taskNodes.isEmpty()) {
                children.add(CaseBundleNode.builder()
                        .id("process-group-" + entry.getKey().toLowerCase())
                        .title(entry.getKey())
                        .children(taskNodes)
                        .build());
            }
        }

        if (children.isEmpty()) return null;

        return CaseBundleNode.builder()
                .id("process")
                .title("PROCESSES")
                .children(children)
                .build();
    }

    private String extractProcessDocument(TaskCase taskCase) {
        if (taskCase.getDocuments() == null) return null;

        String expectedType;
        if ("SIGN_PENDING".equalsIgnoreCase(taskCase.getDocumentStatus())) {
            expectedType = "GENERATE_TASK_DOCUMENT";
        } else {
            expectedType = "SIGNED_TASK_DOCUMENT";
        }

        String fileStoreId = taskCase.getDocuments().stream()
                .filter(Objects::nonNull)
                .filter(d -> expectedType.equalsIgnoreCase(d.getDocumentType()))
                .map(Document::getFileStore)
                .filter(Objects::nonNull)
                .findFirst()
                .orElse(null);

        if (fileStoreId != null) return fileStoreId;

        return taskCase.getDocuments().stream()
                .map(Document::getFileStore)
                .filter(Objects::nonNull)
                .findFirst()
                .orElse(null);
    }
}
