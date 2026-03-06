package org.pucar.dristi.service.bundle;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.egov.common.contract.models.Document;
import org.pucar.dristi.service.CaseBundleSection;
import org.pucar.dristi.web.models.BundleData;
import org.pucar.dristi.web.models.CaseBundleNode;
import org.pucar.dristi.web.models.task.TaskCase;
import org.pucar.dristi.web.models.taskManagement.TaskManagement;


import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@RequiredArgsConstructor
public class TaskManagementSection implements CaseBundleSection {

    private final ObjectMapper objectMapper;

    @Override
    public String getOrder() {
        return "17";
    }

    @Override
    public CaseBundleNode build(BundleData data) {
        if (data == null) return null;

        List<CaseBundleNode> children = new ArrayList<>();

        CaseBundleNode processesNode = buildProcessesNode(data.getTaskCases());
        if (processesNode != null) {
            children.add(processesNode);
        }

        CaseBundleNode taskManagementReceiptsNode = buildTaskManagementPaymentReceiptsNode(data.getTaskManagements());
        if (taskManagementReceiptsNode != null) {
            children.add(taskManagementReceiptsNode);
        }

        if (children.isEmpty()) return null;

        return CaseBundleNode.builder()
                .id("task-management")
                .title("TASK_MANAGEMENT")
                .children(children)
                .build();
    }

    private CaseBundleNode buildProcessesNode(List<TaskCase> taskCases) {
        if (taskCases == null || taskCases.isEmpty()) return null;

        Map<String, List<String>> groupedByOrderType = new LinkedHashMap<>();
        groupedByOrderType.put("NOTICE", new ArrayList<>());
        groupedByOrderType.put("WARRANT", new ArrayList<>());
        groupedByOrderType.put("SUMMONS", new ArrayList<>());

        for (TaskCase taskCase : taskCases) {
            if (taskCase == null) continue;
            if (taskCase.getOrderType() == null || !groupedByOrderType.containsKey(taskCase.getOrderType())) continue;

            String expectedType;
            if ("SIGN_PENDING".equalsIgnoreCase(taskCase.getDocumentStatus())) {
                expectedType = "GENERATE_TASK_DOCUMENT";
            } else {
                expectedType = "SIGNED_TASK_DOCUMENT";
            }

            String fileStoreId = null;
            if (taskCase.getDocuments() != null) {
                fileStoreId = taskCase.getDocuments().stream()
                        .filter(Objects::nonNull)
                        .filter(d -> expectedType.equalsIgnoreCase(d.getDocumentType()))
                        .map(Document::getFileStore)
                        .filter(Objects::nonNull)
                        .findFirst()
                        .orElse(null);
            }

            if (fileStoreId != null) {
                groupedByOrderType.get(taskCase.getOrderType()).add(fileStoreId);
            }
        }

        List<CaseBundleNode> processTypeNodes = new ArrayList<>();
        for (Map.Entry<String, List<String>> entry : groupedByOrderType.entrySet()) {
            String type = entry.getKey();
            List<String> fileStoreIds = entry.getValue();
            if (fileStoreIds == null || fileStoreIds.isEmpty()) continue;

            List<CaseBundleNode> docs = new ArrayList<>();
            for (int i = 0; i < fileStoreIds.size(); i++) {
                String fsId = fileStoreIds.get(i);
                if (fsId == null) continue;

                docs.add(CaseBundleNode.builder()
                        .id("process-" + type.toLowerCase() + "-" + (i + 1))
                        .title(type + " " + (i + 1))
                        .fileStoreId(fsId)
                        .build());
            }

            if (!docs.isEmpty()) {
                processTypeNodes.add(CaseBundleNode.builder()
                        .id("process-" + type.toLowerCase())
                        .title(type)
                        .children(docs)
                        .build());
            }
        }

        if (processTypeNodes.isEmpty()) return null;

        return CaseBundleNode.builder()
                .id("processes")
                .title("PROCESSES_CASE_PDF")
                .children(processTypeNodes)
                .build();
    }

    private CaseBundleNode buildTaskManagementPaymentReceiptsNode(List<TaskManagement> taskManagements) {
        if (taskManagements == null || taskManagements.isEmpty()) return null;

        List<CaseBundleNode> children = new ArrayList<>();
        int idx = 0;

        for (TaskManagement tm : taskManagements) {
            if (tm == null) continue;

            String fileStoreId = extractPaymentReceiptFileStoreId(tm);
            if (fileStoreId == null) continue;

            String title = BundleSectionUtils.firstNonBlank(tm.getTaskType(), tm.getTaskManagementNumber(), "TASK_MANAGEMENT_PAYMENT_RECEIPT");

            children.add(CaseBundleNode.builder()
                    .id("task-management-payment-receipt-" + (idx++))
                    .title(title)
                    .fileStoreId(fileStoreId)
                    .build());
        }

        if (children.isEmpty()) return null;

        return CaseBundleNode.builder()
                .id("task-management-payment-receipts")
                .title("TASK_MANAGEMENT_PAYMENT_RECEIPT")
                .children(children)
                .build();
    }

    private String extractPaymentReceiptFileStoreId(TaskManagement tm) {
        Object additionalDetails = tm.getAdditionalDetails();
        if (additionalDetails == null) return null;

        JsonNode node = objectMapper.valueToTree(additionalDetails);
        JsonNode documentsNode = node.get("documents");
        if (documentsNode == null || !documentsNode.isArray()) return null;

        for (JsonNode doc : documentsNode) {
            if (doc == null || doc.isNull()) continue;
            String documentType = doc.path("documentType").asText(null);
            if (!"PAYMENT_RECEIPT".equalsIgnoreCase(documentType)) continue;

            String fileStore = doc.path("fileStore").asText(null);
            if (fileStore != null && !fileStore.isBlank()) {
                return fileStore;
            }
        }

        return null;
    }
}
