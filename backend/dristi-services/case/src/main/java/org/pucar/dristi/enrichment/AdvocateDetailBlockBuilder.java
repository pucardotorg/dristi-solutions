package org.pucar.dristi.enrichment;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.pucar.dristi.web.models.*;
import org.pucar.dristi.web.models.advocateDetails.*;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.pucar.dristi.config.ServiceConstants.*;

/**
 * Centralized builder to populate AdvocateDetailBlock for a CourtCase.
 * Can be reused by v1 and v2 search flows.
 */
@Slf4j
@Component
public class AdvocateDetailBlockBuilder {

    private final ObjectMapper objectMapper;

    public AdvocateDetailBlockBuilder(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /**
     * Build and set AdvocateDetailBlock on the provided courtCase. Safe to call with null fields.
     */
    public void buildAndSet(CourtCase courtCase) {
        if (courtCase == null) return;

        try {
            List<AdvocateDetailBlock> blocks = new ArrayList<>();

            List<Document> caseDocuments = courtCase.getDocuments() != null ? courtCase.getDocuments() : new ArrayList<>();

            if (courtCase.getLitigants() != null) {
                int idx = 0;
                for (Party litigant : courtCase.getLitigants()) {
                    if (litigant == null) continue;
                    // Build a block for every complainant (primary or additional)
                    if (litigant.getPartyType() != null && litigant.getPartyType().toLowerCase().startsWith("complainant")) {
                        Complainant complainant = Complainant.builder()
                                .index(idx++)
                                .individualId(litigant.getIndividualId())
                                .caseId(litigant.getCaseId())
                                .partyType(litigant.getPartyType())
                                .organisationID(litigant.getOrganisationID())
                                .isActive(litigant.getIsActive())
                                .isPartyInPerson(litigant.isPartyInPerson())
                                .documents(litigant.getDocuments() != null ? new java.util.ArrayList<>(litigant.getDocuments()) : null)
                                .additionalDetails(litigant.getAdditionalDetails())
                                .firstName(null)
                                .middleName(null)
                                .lastName(null)
                                .mobileNumber(null)
                                .fullName(null)
                                .build();

                        try {
                            if (litigant.getAdditionalDetails() != null) {
                                JsonNode litNode = objectMapper.convertValue(litigant.getAdditionalDetails(), JsonNode.class);
                                if (litNode.has("firstName")) complainant.setFirstName(litNode.get("firstName").asText());
                                if (litNode.has("middleName")) complainant.setMiddleName(litNode.get("middleName").asText());
                                if (litNode.has("lastName")) complainant.setLastName(litNode.get("lastName").asText());
                                if (litNode.has("mobileNumber")) complainant.setMobileNumber(litNode.get("mobileNumber").asText());
                                // if additionalDetails contains a display/full name, prefer that
                                if (litNode.has("fullName")) complainant.setFullName(litNode.get("fullName").asText());
                            }
                        } catch (Exception ignored) { }

                        // Derive fullName if not set explicitly
                        if (complainant.getFullName() == null) {
                            StringBuilder nameBuilder = new StringBuilder();
                            if (complainant.getFirstName() != null && !complainant.getFirstName().isBlank()) nameBuilder.append(complainant.getFirstName());
                            if (complainant.getMiddleName() != null && !complainant.getMiddleName().isBlank()) {
                                if (nameBuilder.length() > 0) nameBuilder.append(' ');
                                nameBuilder.append(complainant.getMiddleName());
                            }
                            if (complainant.getLastName() != null && !complainant.getLastName().isBlank()) {
                                if (nameBuilder.length() > 0) nameBuilder.append(' ');
                                nameBuilder.append(complainant.getLastName());
                            }
                            if (nameBuilder.length() > 0) complainant.setFullName(nameBuilder.toString());
                        }

                        List<Document> vakalatnama = getVakalatnamaDocumentsForLitigant(courtCase, litigant);

                        List<Document> pipAffidavit = caseDocuments.stream()
                                .filter(d -> {
                                    if (d == null) return false;
                                    Object additional = d.getAdditionalDetails();
                                    try {
                                        if (additional != null) {
                                            JsonNode node = objectMapper.convertValue(additional, JsonNode.class);
                                            String docName = node.has("documentName") ? node.get("documentName").asText() : "";
                                            return UPLOAD_PIP_AFFIDAVIT.equalsIgnoreCase(docName) || "pipAffidavit".equalsIgnoreCase(docName);
                                        }
                                    } catch (Exception ignored) { }
                                    return false;
                                })
                                .collect(Collectors.toList());

                        Documents docs = Documents.builder().vakalatnama(vakalatnama).pipAffidavit(pipAffidavit).build();

                        // Build advocates list by finding representatives who represent this litigant (match by individualId)
                        List<Advocate> advocates = new ArrayList<>();
                        if (courtCase.getRepresentatives() != null && litigant.getIndividualId() != null) {
                            for (AdvocateMapping rep : courtCase.getRepresentatives()) {
                                if (rep == null) continue;
                                boolean representsLitigant = false;
                                if (rep.getRepresenting() != null) {
                                    for (Party p : rep.getRepresenting()) {
                                        if (p != null && p.getIndividualId() != null && p.getIndividualId().equalsIgnoreCase(litigant.getIndividualId())) {
                                            representsLitigant = true;
                                            break;
                                        }
                                    }
                                }
                                if (!representsLitigant) continue;

                                Advocate adv = Advocate.builder().build();

                                // Prefer joined Advocate (from DB) when available
                                try {
                                    if (rep.getAdvocate() != null) {
                                        Advocate joined = rep.getAdvocate();
                                        if (joined.getId() != null) adv.setId(joined.getId());
                                        if (joined.getTenantId() != null) adv.setTenantId(joined.getTenantId());
                                        if (joined.getApplicationNumber() != null) adv.setApplicationNumber(joined.getApplicationNumber());
                                        if (joined.getBarRegistrationNumber() != null) adv.setBarRegistrationNumber(joined.getBarRegistrationNumber());
                                        if (joined.getIndividualId() != null) adv.setIndividualId(joined.getIndividualId());
                                        if (joined.getAdvocateType() != null) adv.setAdvocateType(joined.getAdvocateType());
                                        if (joined.getAdvocateUuid() != null) adv.setAdvocateUuid(joined.getAdvocateUuid());
                                        if (joined.getFirstName() != null) adv.setFirstName(joined.getFirstName());
                                        if (joined.getMiddleName() != null) adv.setMiddleName(joined.getMiddleName());
                                        if (joined.getLastName() != null) adv.setLastName(joined.getLastName());
                                        if (joined.getMobileNumber() != null) adv.setMobileNumber(joined.getMobileNumber());
                                        if (joined.getDocuments() != null) adv.setDocuments(new ArrayList<>(joined.getDocuments()));
                                    }
                                } catch (Exception ignored) { }

                                // Fallback to representative.additionalDetails
                                try {
                                    if ((adv.getFirstName() == null || adv.getFirstName().isBlank() || adv.getAdvocateUuid() == null) && rep.getAdditionalDetails() != null) {
                                        JsonNode repNode = objectMapper.convertValue(rep.getAdditionalDetails(), JsonNode.class);
                                        if (repNode.has("uuid") && !repNode.get("uuid").isNull() && adv.getId() == null) {
                                            try { adv.setId(UUID.fromString(repNode.get("uuid").asText())); } catch (Exception ignored) {}
                                        }
                                        if (repNode.has("advocateUuid") && !repNode.get("advocateUuid").isNull() && adv.getAdvocateUuid() == null) {
                                            try { adv.setAdvocateUuid(UUID.fromString(repNode.get("advocateUuid").asText())); } catch (Exception ignored) {}
                                        }
                                        if (repNode.has("firstName") && (adv.getFirstName() == null || adv.getFirstName().isBlank())) adv.setFirstName(repNode.get("firstName").asText());
                                        if (repNode.has("middleName") && (adv.getMiddleName() == null || adv.getMiddleName().isBlank())) adv.setMiddleName(repNode.get("middleName").asText());
                                        if (repNode.has("lastName") && (adv.getLastName() == null || adv.getLastName().isBlank())) adv.setLastName(repNode.get("lastName").asText());
                                        if (repNode.has("mobileNumber") && (adv.getMobileNumber() == null || adv.getMobileNumber().isBlank())) adv.setMobileNumber(repNode.get("mobileNumber").asText());
                                        if (repNode.has("advocateName") && (adv.getFirstName() == null || adv.getFirstName().isBlank())) adv.setFirstName(repNode.get("advocateName").asText());
                                    }
                                } catch (Exception ignored) { }

                                // Also try to read name/details from case-level additionalDetails (advocateDetails formdata) as last resort
                                try {
                                    if ((adv.getFirstName() == null || adv.getFirstName().isBlank()) && courtCase.getAdditionalDetails() != null) {
                                        JsonNode root = objectMapper.convertValue(courtCase.getAdditionalDetails(), JsonNode.class);
                                        if (root.has("advocateDetails")) {
                                            JsonNode formdata = root.path("advocateDetails").path("formdata");
                                            if (formdata.isArray()) {
                                                for (JsonNode item : formdata) {
                                                    JsonNode data = item.path("data").path("multipleAdvocatesAndPip");
                                                    if (data.isObject()) {
                                                        JsonNode arr = data.path("multipleAdvocateNameDetails");
                                                        if (arr.isArray()) {
                                                            for (JsonNode n : arr) {
                                                                JsonNode nameDetails = n.path("advocateNameDetails");
                                                                JsonNode bar = n.path("advocateBarRegNumberWithName");
                                                                if (bar.has("advocateId") && adv.getIndividualId() != null && adv.getIndividualId().equalsIgnoreCase(bar.path("individualId").asText())) {
                                                                    if (nameDetails.has("firstName")) adv.setFirstName(nameDetails.get("firstName").asText());
                                                                    if (nameDetails.has("middleName")) adv.setMiddleName(nameDetails.get("middleName").asText());
                                                                    if (nameDetails.has("lastName")) adv.setLastName(nameDetails.get("lastName").asText());
                                                                    if (nameDetails.has("advocateMobileNumber")) adv.setMobileNumber(nameDetails.get("advocateMobileNumber").asText());
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                } catch (Exception ignored) { }

                                // copy rep documents if any
                                if (rep.getDocuments() != null) adv.setDocuments(new ArrayList<>(rep.getDocuments()));

                                advocates.add(adv);
                            }
                        }

                        PipStatus pipStatus = new PipStatus();
                        pipStatus.setIsEnabled(!pipAffidavit.isEmpty());
                        pipStatus.setCode(pipAffidavit.isEmpty() ? "NO" : "YES");
                        pipStatus.setLabel(pipAffidavit.isEmpty() ? "No" : "Yes");

                        UiFlags uiFlags = UiFlags.builder()
                                .showAffidavit(!pipAffidavit.isEmpty())
                                .showVakalatNamaUpload(!vakalatnama.isEmpty())
                                .build();


            AdvocateDetailBlock block = AdvocateDetailBlock.builder()
                .complainant(complainant)
                .documents(docs)
                .advocates(advocates)
                .advocateCount(advocates != null ? advocates.size() : 0)
                .isEnabled(true)
                .isFormCompleted(!advocates.isEmpty())
                .displayIndex(0)
                .isComplainantPip(pipStatus)
                .uiFlags(uiFlags)
                .build();

                        blocks.add(block);
                    }
                }
            }

            courtCase.setAdvocateDetailBlock(blocks);
        } catch (Exception e) {
            log.error("Error while building AdvocateDetailBlock: {}", e.toString());
        }
    }

    private List<Document> getVakalatnamaDocumentsForLitigant(CourtCase courtCase, Party litigant) {
        if (litigant == null) {
            return Collections.emptyList();
        }

        Map<String, Document> vakalatnamaByKey = new LinkedHashMap<>();
        String litigantIndividualId = litigant.getIndividualId();

        if (courtCase.getRepresentatives() != null && litigantIndividualId != null) {
            for (AdvocateMapping rep : courtCase.getRepresentatives()) {
                if (rep == null || rep.getRepresenting() == null) {
                    continue;
                }

                rep.getRepresenting().stream()
                        .filter(Objects::nonNull)
                        .filter(party -> party.getIndividualId() != null && party.getIndividualId().equalsIgnoreCase(litigantIndividualId))
                        .map(Party::getDocuments)
                        .filter(Objects::nonNull)
                        .flatMap(List::stream)
                        .filter(this::isVakalatnamaDocument)
                        .forEach(document -> vakalatnamaByKey.putIfAbsent(getDocumentIdentity(document), document));
            }
        }

        if (!vakalatnamaByKey.isEmpty()) {
            return new ArrayList<>(vakalatnamaByKey.values());
        }

        return Optional.ofNullable(litigant.getDocuments()).orElse(Collections.emptyList()).stream()
                .filter(this::isVakalatnamaDocument)
                .collect(Collectors.toMap(this::getDocumentIdentity, document -> document, (existing, duplicate) -> existing, LinkedHashMap::new))
                .values()
                .stream()
                .collect(Collectors.toList());
    }

    private boolean isVakalatnamaDocument(Document document) {
        return document != null
                && document.getDocumentType() != null
                && document.getDocumentType().equalsIgnoreCase(VAKALATNAMA_DOC);
    }

    private String getDocumentIdentity(Document document) {
        if (document == null) {
            return UUID.randomUUID().toString();
        }
        if (document.getFileStore() != null && !document.getFileStore().isBlank()) {
            return "filestore:" + document.getFileStore();
        }
        if (document.getDocumentUid() != null && !document.getDocumentUid().isBlank()) {
            return "documentUid:" + document.getDocumentUid();
        }
        if (document.getId() != null && !document.getId().isBlank()) {
            return "id:" + document.getId();
        }
        return document.getDocumentType() + ":" + Objects.toString(document.getDocumentName(), "") + ":" + Objects.toString(document.getFileName(), "");
    }
}
