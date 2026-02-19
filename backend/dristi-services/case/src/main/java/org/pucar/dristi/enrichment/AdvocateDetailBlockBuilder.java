package org.pucar.dristi.enrichment;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import org.pucar.dristi.web.models.*;
import org.pucar.dristi.web.models.advocateDetails.*;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
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
                    if (litigant.getPartyType() != null && litigant.getPartyType().equalsIgnoreCase("complainant.primary")) {
                        Complainant complainant = Complainant.builder()
                                .index(idx++)
                                .individualId(litigant.getIndividualId())
                                .firstName(null)
                                .middleName(null)
                                .lastName(null)
                                .mobileNumber(null)
                                .build();

                        try {
                            if (litigant.getAdditionalDetails() != null) {
                                JsonNode litNode = objectMapper.convertValue(litigant.getAdditionalDetails(), JsonNode.class);
                                if (litNode.has("firstName")) complainant.setFirstName(litNode.get("firstName").asText());
                                if (litNode.has("middleName")) complainant.setMiddleName(litNode.get("middleName").asText());
                                if (litNode.has("lastName")) complainant.setLastName(litNode.get("lastName").asText());
                                if (litNode.has("mobileNumber")) complainant.setMobileNumber(litNode.get("mobileNumber").asText());
                            }
                        } catch (Exception ignored) { }

                        List<Document> vakalatnama = caseDocuments.stream()
                                .filter(d -> d != null && d.getDocumentType() != null && d.getDocumentType().equalsIgnoreCase("VAKALATNAMA_DOC"))
                                .collect(Collectors.toList());

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

                        List<Advocate> advocates = new ArrayList<>();
                        if (courtCase.getRepresentatives() != null) {
                            for (AdvocateMapping rep : courtCase.getRepresentatives()) {
                                if (rep != null && Boolean.TRUE.equals(rep.getHasSigned())) {
                                    Advocate adv = Advocate.builder().build();
                                    try {
                                        if (rep.getAdditionalDetails() != null) {
                                            JsonNode repNode = objectMapper.convertValue(rep.getAdditionalDetails(), JsonNode.class);
                                            if (repNode.has("uuid") && !repNode.get("uuid").isNull()) {
                                                try { adv.setId(UUID.fromString(repNode.get("uuid").asText())); } catch (Exception ignored) {}
                                            }
                                            if (repNode.has("individualId")) adv.setIndividualId(repNode.get("individualId").asText());
                                            if (repNode.has("advocateType")) adv.setAdvocateType(repNode.get("advocateType").asText());
                                            if (repNode.has("barRegistrationNumber")) adv.setBarRegistrationNumber(repNode.get("barRegistrationNumber").asText());
                                            if (repNode.has("applicationNumber")) adv.setApplicationNumber(repNode.get("applicationNumber").asText());
                                            if (repNode.has("tenantId")) adv.setTenantId(repNode.get("tenantId").asText());
                                        }
                                    } catch (Exception ignored) { }

                                    if (rep.getDocuments() != null) adv.setDocuments(new ArrayList<>(rep.getDocuments()));
                                    // If AdvocateMapping has a populated Advocate object (from a DB join), prefer those fields
                                    try {
                                        if (rep.getAdvocate() != null) {
                                            Advocate joined = rep.getAdvocate();
                                            if (joined.getId() != null) adv.setId(joined.getId());
                                            if (joined.getTenantId() != null) adv.setTenantId(joined.getTenantId());
                                            if (joined.getApplicationNumber() != null) adv.setApplicationNumber(joined.getApplicationNumber());
                                            if (joined.getBarRegistrationNumber() != null) adv.setBarRegistrationNumber(joined.getBarRegistrationNumber());
                                            if (joined.getIndividualId() != null) adv.setIndividualId(joined.getIndividualId());
                                            if (joined.getAdvocateType() != null) adv.setAdvocateType(joined.getAdvocateType());
                                        }
                                    } catch (Exception ignored) { }

                                    advocates.add(adv);
                                }
                            }
                        }

                        PipStatus pipStatus = new PipStatus();
                        pipStatus.setIsEnabled(!pipAffidavit.isEmpty());
                        pipStatus.setCode(pipAffidavit.isEmpty() ? "NOT_UPLOADED" : "UPLOADED");
                        pipStatus.setLabel(pipAffidavit.isEmpty() ? "Not uploaded" : "Uploaded");

                        UiFlags uiFlags = UiFlags.builder()
                                .showAffidavit(!pipAffidavit.isEmpty())
                                .showVakalatNamaUpload(!vakalatnama.isEmpty())
                                .build();

                        AdvocateDetailBlock block = AdvocateDetailBlock.builder()
                                .complainant(complainant)
                                .documents(docs)
                                .advocates(advocates)
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
}
