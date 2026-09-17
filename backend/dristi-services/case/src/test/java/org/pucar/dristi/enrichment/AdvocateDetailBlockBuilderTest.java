package org.pucar.dristi.enrichment;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.pucar.dristi.web.models.AdvocateMapping;
import org.pucar.dristi.web.models.CourtCase;
import org.pucar.dristi.web.models.Document;
import org.pucar.dristi.web.models.Party;
import org.pucar.dristi.web.models.advocateDetails.AdvocateDetailBlock;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.pucar.dristi.config.ServiceConstants.VAKALATNAMA_DOC;

class AdvocateDetailBlockBuilderTest {

    private final AdvocateDetailBlockBuilder builder = new AdvocateDetailBlockBuilder(new ObjectMapper());

    @Test
    void shouldAttachOnlyMatchingRepresentingPartyVakalatnamaToEachComplainantBlock() {
        Party complainantOne = Party.builder()
                .id(UUID.randomUUID())
                .caseId("case-1")
                .individualId("IND-1")
                .partyType("complainant.primary")
                .isActive(true)
                .additionalDetails(Map.of("firstName", "Baburao", "fullName", "Baburao"))
                .build();

        Party complainantTwo = Party.builder()
                .id(UUID.randomUUID())
                .caseId("case-1")
                .individualId("IND-2")
                .partyType("complainant.additional")
                .isActive(true)
                .additionalDetails(Map.of("firstName", "Nitish", "fullName", "Nitish"))
                .build();

        Document vakalatnamaOne = Document.builder()
                .id("doc-1")
                .documentType(VAKALATNAMA_DOC)
                .fileStore("store-1")
                .documentUid("uid-1")
                .build();

        Document vakalatnamaTwo = Document.builder()
                .id("doc-2")
                .documentType(VAKALATNAMA_DOC)
                .fileStore("store-2")
                .documentUid("uid-2")
                .build();

        Party representedPartyOne = Party.builder()
                .id(UUID.randomUUID())
                .individualId("IND-1")
                .partyType("complainant.primary")
                .isActive(true)
                .documents(List.of(vakalatnamaOne))
                .build();

        Party representedPartyTwo = Party.builder()
                .id(UUID.randomUUID())
                .individualId("IND-2")
                .partyType("complainant.additional")
                .isActive(true)
                .documents(List.of(vakalatnamaTwo))
                .build();

        AdvocateMapping representative = AdvocateMapping.builder()
                .id(UUID.randomUUID().toString())
                .caseId("case-1")
                .isActive(true)
                .representing(List.of(representedPartyOne, representedPartyTwo))
                .build();

        CourtCase courtCase = CourtCase.builder()
                .id(UUID.randomUUID())
                .tenantId("kl")
                .litigants(List.of(complainantOne, complainantTwo))
                .representatives(List.of(representative))
                .documents(List.of(vakalatnamaOne, vakalatnamaTwo))
                .build();

        builder.buildAndSet(courtCase);

        List<AdvocateDetailBlock> blocks = courtCase.getAdvocateDetailBlock();
        assertNotNull(blocks);
        assertEquals(2, blocks.size());

        AdvocateDetailBlock firstBlock = blocks.get(0);
        assertEquals("IND-1", firstBlock.getComplainant().getIndividualId());
        assertEquals(1, firstBlock.getDocuments().getVakalatnama().size());
        assertEquals("uid-1", firstBlock.getDocuments().getVakalatnama().get(0).getDocumentUid());

        AdvocateDetailBlock secondBlock = blocks.get(1);
        assertEquals("IND-2", secondBlock.getComplainant().getIndividualId());
        assertEquals(1, secondBlock.getDocuments().getVakalatnama().size());
        assertEquals("uid-2", secondBlock.getDocuments().getVakalatnama().get(0).getDocumentUid());
    }

    @Test
    void shouldDeduplicateVakalatnamaWhenTwoAdvocatesRepresentSameComplainant() {
        Party complainant = Party.builder()
                .id(UUID.randomUUID())
                .caseId("case-1")
                .individualId("IND-1")
                .partyType("complainant.primary")
                .isActive(true)
                .additionalDetails(Map.of("firstName", "Baburao", "fullName", "Baburao"))
                .build();

        Document sharedVakalatnama = Document.builder()
                .id("doc-1")
                .documentType(VAKALATNAMA_DOC)
                .fileStore("store-1")
                .documentUid("uid-1")
                .build();

        Party representedByAdvocateOne = Party.builder()
                .id(UUID.randomUUID())
                .individualId("IND-1")
                .partyType("complainant.primary")
                .isActive(true)
                .documents(List.of(sharedVakalatnama))
                .build();

        Party representedByAdvocateTwo = Party.builder()
                .id(UUID.randomUUID())
                .individualId("IND-1")
                .partyType("complainant.primary")
                .isActive(true)
                .documents(List.of(sharedVakalatnama))
                .build();

        AdvocateMapping representativeOne = AdvocateMapping.builder()
                .id(UUID.randomUUID().toString())
                .caseId("case-1")
                .isActive(true)
                .representing(List.of(representedByAdvocateOne))
                .build();

        AdvocateMapping representativeTwo = AdvocateMapping.builder()
                .id(UUID.randomUUID().toString())
                .caseId("case-1")
                .isActive(true)
                .representing(List.of(representedByAdvocateTwo))
                .build();

        CourtCase courtCase = CourtCase.builder()
                .id(UUID.randomUUID())
                .tenantId("kl")
                .litigants(List.of(complainant))
                .representatives(List.of(representativeOne, representativeTwo))
                .documents(List.of(sharedVakalatnama))
                .build();

        builder.buildAndSet(courtCase);

        List<AdvocateDetailBlock> blocks = courtCase.getAdvocateDetailBlock();
        assertNotNull(blocks);
        assertEquals(1, blocks.size());
        assertEquals(1, blocks.get(0).getDocuments().getVakalatnama().size());
        assertEquals("uid-1", blocks.get(0).getDocuments().getVakalatnama().get(0).getDocumentUid());
        assertEquals(2, blocks.get(0).getAdvocates().size());
    }

    @Test
    void shouldDeduplicateVakalatnamaWhenSameFileHasDifferentDocumentIdsAcrossAdvocates() {
        Party complainant = Party.builder()
                .id(UUID.randomUUID())
                .caseId("case-1")
                .individualId("IND-1")
                .partyType("complainant.primary")
                .isActive(true)
                .additionalDetails(Map.of("firstName", "Baburao", "fullName", "Baburao"))
                .build();

        Document vakalatnamaFromAdvocateOne = Document.builder()
                .id("doc-1")
                .documentType(VAKALATNAMA_DOC)
                .fileStore("shared-store")
                .documentUid("uid-1")
                .documentName("downloadedFile.pdf")
                .fileName("VAKALATNAMA")
                .build();

        Document vakalatnamaFromAdvocateTwo = Document.builder()
                .id("doc-2")
                .documentType(VAKALATNAMA_DOC)
                .fileStore("shared-store")
                .documentUid("uid-2")
                .documentName("downloadedFile.pdf")
                .fileName("VAKALATNAMA")
                .build();

        Party representedByAdvocateOne = Party.builder()
                .id(UUID.randomUUID())
                .individualId("IND-1")
                .partyType("complainant.primary")
                .isActive(true)
                .documents(List.of(vakalatnamaFromAdvocateOne))
                .build();

        Party representedByAdvocateTwo = Party.builder()
                .id(UUID.randomUUID())
                .individualId("IND-1")
                .partyType("complainant.primary")
                .isActive(true)
                .documents(List.of(vakalatnamaFromAdvocateTwo))
                .build();

        AdvocateMapping representativeOne = AdvocateMapping.builder()
                .id(UUID.randomUUID().toString())
                .caseId("case-1")
                .isActive(true)
                .representing(List.of(representedByAdvocateOne))
                .build();

        AdvocateMapping representativeTwo = AdvocateMapping.builder()
                .id(UUID.randomUUID().toString())
                .caseId("case-1")
                .isActive(true)
                .representing(List.of(representedByAdvocateTwo))
                .build();

        CourtCase courtCase = CourtCase.builder()
                .id(UUID.randomUUID())
                .tenantId("kl")
                .litigants(List.of(complainant))
                .representatives(List.of(representativeOne, representativeTwo))
                .documents(List.of(vakalatnamaFromAdvocateOne, vakalatnamaFromAdvocateTwo))
                .build();

        builder.buildAndSet(courtCase);

        List<AdvocateDetailBlock> blocks = courtCase.getAdvocateDetailBlock();
        assertNotNull(blocks);
        assertEquals(1, blocks.size());
        assertEquals(1, blocks.get(0).getDocuments().getVakalatnama().size());
        assertEquals("shared-store", blocks.get(0).getDocuments().getVakalatnama().get(0).getFileStore());
        assertEquals(2, blocks.get(0).getAdvocates().size());
    }
}