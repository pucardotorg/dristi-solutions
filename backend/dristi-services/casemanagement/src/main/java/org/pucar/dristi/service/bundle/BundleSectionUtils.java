package org.pucar.dristi.service.bundle;

import org.pucar.dristi.web.models.digitalizeddocument.DigitalizedDocument;
import org.pucar.dristi.web.models.order.Document;

import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

public class BundleSectionUtils {

    private BundleSectionUtils() {
    }

    public static String safe(String value) {
        return value == null ? "" : value;
    }

    public static String firstNonBlank(String... values) {
        if (values == null) return null;
        for (String value : values) {
            if (value != null && !value.isBlank()) return value;
        }
        return null;
    }

    public static String findFileStoreId(List<Document> documents, String expectedDocumentType) {
        if (documents == null || documents.isEmpty() || expectedDocumentType == null) return null;
        return documents.stream()
                .filter(Objects::nonNull)
                .filter(d -> expectedDocumentType.equalsIgnoreCase(d.getDocumentType()))
                .map(Document::getFileStore)
                .filter(Objects::nonNull)
                .findFirst()
                .orElse(null);
    }

    public static String findAnyFileStoreId(List<Document> documents) {
        if (documents == null || documents.isEmpty()) return null;
        return documents.stream()
                .filter(Objects::nonNull)
                .map(Document::getFileStore)
                .filter(Objects::nonNull)
                .findFirst()
                .orElse(null);
    }

    public static String digitalizedFileStoreId(DigitalizedDocument dd) {
        if (dd == null || dd.getDocuments() == null || dd.getDocuments().isEmpty()) return null;
        return dd.getDocuments().stream()
                .filter(Objects::nonNull)
                .map(org.pucar.dristi.web.models.digitalizeddocument.Document::getFileStore)
                .filter(Objects::nonNull)
                .findFirst()
                .orElse(null);
    }

    public static <T> List<T> sortByCreatedTime(List<T> list, java.util.function.Function<T, Long> createdTimeFn) {
        if (list == null) return List.of();
        return list.stream()
                .filter(Objects::nonNull)
                .sorted(Comparator.comparing(o -> Optional.ofNullable(createdTimeFn.apply(o)).orElse(0L)))
                .toList();
    }
}
