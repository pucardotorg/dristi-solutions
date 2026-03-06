package org.pucar.dristi.service.bundle;

import org.egov.common.contract.models.Document;
import org.pucar.dristi.service.CaseBundleSection;
import org.pucar.dristi.web.models.BundleData;
import org.pucar.dristi.web.models.CaseBundleNode;
import org.pucar.dristi.web.models.CourtCase;
import org.pucar.dristi.web.models.Party;
import org.pucar.dristi.web.models.AdvocateMapping;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

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

        List<CaseBundleNode> children = new ArrayList<>();

        Set<UUID> representedLitigantIds = new HashSet<>();
        if (courtCase.getRepresentatives() != null) {
            for (AdvocateMapping rep : courtCase.getRepresentatives()) {
                if (rep == null || !Boolean.TRUE.equals(rep.getIsActive())) continue;
                if (rep.getRepresenting() != null) {
                    for (Party p : rep.getRepresenting()) {
                        if (p != null && p.getId() != null) {
                            representedLitigantIds.add(p.getId());
                        }
                    }
                }
            }
        }

        int pipIdx = 1;
        if (courtCase.getLitigants() != null) {
            for (Party p : courtCase.getLitigants()) {
                if (p == null || !Boolean.TRUE.equals(p.getIsActive())) continue;
                if (representedLitigantIds.contains(p.getId())) continue;
                if (p.getDocuments() == null) continue;
                for (Document doc : p.getDocuments()) {
                    if (doc == null || doc.getFileStore() == null) continue;
                    children.add(CaseBundleNode.builder()
                            .id("pip-" + pipIdx)
                            .title("PIP " + pipIdx)
                            .fileStoreId(doc.getFileStore())
                            .build());
                    pipIdx++;
                }
            }
        }

        int vakIdx = 1;
        if (courtCase.getRepresentatives() != null) {
            for (AdvocateMapping rep : courtCase.getRepresentatives()) {
                if (rep == null || !Boolean.TRUE.equals(rep.getIsActive())) continue;
                if (rep.getDocuments() == null) continue;
                for (Document doc : rep.getDocuments()) {
                    if (doc == null || doc.getFileStore() == null) continue;
                    children.add(CaseBundleNode.builder()
                            .id("vakalat-" + vakIdx)
                            .title("VAKALATNAMA " + vakIdx)
                            .fileStoreId(doc.getFileStore())
                            .build());
                    vakIdx++;
                }
            }
        }

        if (children.isEmpty()) return null;

        return CaseBundleNode.builder()
                .id("vakalatnama")
                .title("VAKALATNAMA")
                .children(children)
                .build();
    }
}
