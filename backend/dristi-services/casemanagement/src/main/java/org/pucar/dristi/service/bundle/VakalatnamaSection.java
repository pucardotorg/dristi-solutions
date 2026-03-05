package org.pucar.dristi.service.bundle;

import org.egov.common.contract.models.Document;
import org.pucar.dristi.service.CaseBundleSection;
import org.pucar.dristi.web.models.*;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class VakalatnamaSection implements CaseBundleSection {

    @Override
    public String getOrder() {
        return "05";
    }

    @Override
    public CaseBundleNode build(BundleData data) {

        if (data == null || data.getCases() == null) return null;
        CourtCase courtCase = data.getCases();

        if (courtCase.getLitigants() == null) return null;

        // Collect fileStore records with isPip flag and dateOfAddition
        List<FileStoreRecord> fileStoreRecords = new ArrayList<>();
        Set<String> addedFileStoreIds = new HashSet<>();

        for (Party litigant : courtCase.getLitigants()) {
            if (litigant == null || !Boolean.TRUE.equals(litigant.getIsActive())) continue;

            // Find representatives for this litigant (matched via individualId)
            List<AdvocateMapping> matchingReps = findRepresentativesForLitigant(
                    courtCase.getRepresentatives(), litigant.getIndividualId());

            if (matchingReps.isEmpty()) {
                // No representative → PIP (party-in-person) using litigant's own document
                String fileStoreId = getFirstFileStoreId(litigant.getDocuments());
                if (fileStoreId != null && addedFileStoreIds.add(fileStoreId)) {
                    long dateOfAddition = litigant.getAuditDetails() != null
                            ? litigant.getAuditDetails().getCreatedTime() : 0L;
                    fileStoreRecords.add(new FileStoreRecord(fileStoreId, true, dateOfAddition));
                }
            } else {
                // Has representative(s) → VAKALATNAMA using the nested party's document
                for (AdvocateMapping rep : matchingReps) {
                    if (rep == null || !Boolean.TRUE.equals(rep.getIsActive())) continue;

                    // Find the nested party in rep.representing that matches this litigant
                    Party updatedLitigant = findMatchingPartyInRepresenting(
                            rep.getRepresenting(), litigant.getIndividualId());
                    if (updatedLitigant == null) continue;

                    String fileStoreId = getFirstFileStoreId(updatedLitigant.getDocuments());
                    if (fileStoreId != null && addedFileStoreIds.add(fileStoreId)) {
                        long dateOfAddition = rep.getAuditDetails() != null
                                ? rep.getAuditDetails().getCreatedTime() : 0L;
                        fileStoreRecords.add(new FileStoreRecord(fileStoreId, false, dateOfAddition));
                    }
                }
            }
        }

        // Sort by dateOfAddition (ascending) before assigning numbers
        fileStoreRecords.sort(Comparator.comparingLong(r -> r.dateOfAddition));

        // Build children with separate PIP and VAKALATNAMA counters
        List<CaseBundleNode> children = new ArrayList<>();
        int pipIdx = 1;
        int vakIdx = 1;
        int index = 0;

        for (FileStoreRecord record : fileStoreRecords) {
            String id = "vakalatnama-" + index;
            String title;
            if (record.isPip) {
                title = "PIP " + pipIdx++;
            } else {
                title = "VAKALATNAMA " + vakIdx++;
            }
            children.add(CaseBundleNode.builder()
                    .id(id)
                    .title(title)
                    .fileStoreId(record.fileStoreId)
                    .build());
            index++;
        }

        if (children.isEmpty()) return null;

        return CaseBundleNode.builder()
                .id("vakalatnama")
                .title("VAKALATS")
                .children(children)
                .build();
    }

    /**
     * Finds all active representatives whose representing list contains a party
     * with the given individualId.
     */
    private List<AdvocateMapping> findRepresentativesForLitigant(
            List<AdvocateMapping> representatives, String individualId) {
        List<AdvocateMapping> result = new ArrayList<>();
        if (representatives == null || individualId == null) return result;
        for (AdvocateMapping rep : representatives) {
            if (rep == null || rep.getRepresenting() == null) continue;
            for (Party p : rep.getRepresenting()) {
                if (p != null && individualId.equals(p.getIndividualId())) {
                    result.add(rep);
                    break;
                }
            }
        }
        return result;
    }

    /**
     * Finds the party within a representing list that matches the given individualId.
     */
    private Party findMatchingPartyInRepresenting(List<Party> representing, String individualId) {
        if (representing == null || individualId == null) return null;
        for (Party p : representing) {
            if (p != null && individualId.equals(p.getIndividualId())) {
                return p;
            }
        }
        return null;
    }

    /**
     * Returns the fileStore from the first document in the list, or null.
     */
    private String getFirstFileStoreId(List<Document> documents) {
        if (documents == null || documents.isEmpty()) return null;
        Document first = documents.get(0);
        return first != null ? first.getFileStore() : null;
    }

    /**
         * Internal record to hold a fileStoreId with its isPip flag and dateOfAddition
         * before sorting and numbering.
         */
        private record FileStoreRecord(String fileStoreId, boolean isPip, long dateOfAddition) {
    }
}

