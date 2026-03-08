package org.pucar.dristi.service.bundle;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.egov.common.contract.models.Document;
import org.pucar.dristi.service.CaseBundleSection;
import org.pucar.dristi.web.models.BundleData;
import org.pucar.dristi.web.models.CaseBundleNode;
import org.pucar.dristi.web.models.CourtCase;
import org.pucar.dristi.web.models.taskManagement.TaskManagement;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Component
@RequiredArgsConstructor
public class PaymentReceiptSection implements CaseBundleSection {

    private final ObjectMapper objectMapper;

    @Override
    public String getOrder() {
        return "13";
    }

    @Override
    public CaseBundleNode build(BundleData data) {

        List<CaseBundleNode> children = new ArrayList<>();

        if (data == null || data.getCases() == null) return null;

        // 1. Case filing receipt (from CourtCase.documents where documentType == PAYMENT_RECEIPT)
        //    Sorted by additionalDetails.consumerCode (matching UI logic)
        CourtCase courtCase = data.getCases();
        if (courtCase.getDocuments() != null) {
            List<Document> paymentDocs = courtCase.getDocuments().stream()
                    .filter(Objects::nonNull)
                    .filter(doc -> "PAYMENT_RECEIPT".equalsIgnoreCase(doc.getDocumentType()))
                    .filter(doc -> doc.getFileStore() != null)
                    .sorted(Comparator.comparing(
                            this::extractConsumerCode,
                            Comparator.nullsLast(String::compareTo)))
                    .toList();

            int idx = 0;
            for (Document doc : paymentDocs) {
                children.add(CaseBundleNode.builder()
                        .id("PAYMENT_RECEIPT_" + (idx++))
                        .title("CASE_FILING_PAYMENT_RECEIPT")
                        .fileStoreId(doc.getFileStore())
                        .build());
            }
        }

        // 2. Generic task documents (from data.tasks with taskType GENERIC, status COMPLETED)
        if (data.getTasks() != null) {
            int taskIdx = 0;
            for (org.pucar.dristi.web.models.Task task : data.getTasks()) {
                if (task == null || task.getDocuments() == null) continue;
                for (Document taskDoc : task.getDocuments()) {
                    if (taskDoc == null || taskDoc.getFileStore() == null) continue;
                    children.add(CaseBundleNode.builder()
                            .id("GENRIC_PAYMENT_RECEIPT_" + (taskIdx++))
                            .title("CASE_FILING_GENRIC_TASK_PAYMENT_RECEIPT")
                            .fileStoreId(taskDoc.getFileStore())
                            .build());
                }
            }
        }

        // 3. Task management receipts (from TaskManagement.additionalDetails.documents)
        if (data.getTaskManagements() != null) {
            int tmIdx = 0;
            for (TaskManagement tm : data.getTaskManagements()) {
                if (tm == null) continue;
                String fs = extractReceipt(tm);
                if (fs == null) continue;

                children.add(CaseBundleNode.builder()
                        .id("TASK_MANAGEMENT_PAYMENT_RECEIPT_" + (tmIdx++))
                        .title(tm.getTaskType() + "_TASK_PAYMENT_RECEIPT")
                        .fileStoreId(fs)
                        .build());
            }
        }

        if (children.isEmpty()) return null;

        return CaseBundleNode.builder()
                .id("payment-receipt")
                .title("PAYMENT_RECEIPT_CASE_PDF")
                .children(children)
                .build();
    }

    @SuppressWarnings("unchecked")
    private String extractConsumerCode(Document doc) {
        if (doc == null || doc.getAdditionalDetails() == null) return null;
        if (doc.getAdditionalDetails() instanceof Map) {
            Object code = ((Map<String, Object>) doc.getAdditionalDetails()).get("consumerCode");
            return code instanceof String ? (String) code : null;
        }
        return null;
    }

    private String extractReceipt(TaskManagement tm) {
        if (tm == null || tm.getAdditionalDetails() == null) return null;
        JsonNode node = objectMapper.valueToTree(tm.getAdditionalDetails());
        JsonNode documentsNode = node.get("documents");
        if (documentsNode == null || !documentsNode.isArray()) return null;

        for (JsonNode doc : documentsNode) {
            if (doc == null || doc.isNull()) continue;
            String documentType = doc.path("documentType").asText(null);
            if (!"PAYMENT_RECEIPT".equalsIgnoreCase(documentType)) continue;
            String fileStore = doc.path("fileStore").asText(null);
            if (fileStore != null && !fileStore.isBlank()) return fileStore;
        }

        return null;
    }
}
