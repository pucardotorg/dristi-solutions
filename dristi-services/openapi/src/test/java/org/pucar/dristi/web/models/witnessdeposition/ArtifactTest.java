package org.pucar.dristi.web.models.witnessdeposition;

import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.models.Document;
import org.junit.jupiter.api.Test;
import org.pucar.dristi.web.models.WorkflowObject;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class ArtifactTest {

    @Test
    void testNoArgsConstructor() {
        Artifact artifact = new Artifact();
        assertNull(artifact.getId());
        assertNull(artifact.getTenantId());
        assertNull(artifact.getArtifactNumber());
        assertNull(artifact.getFilingNumber());
        assertTrue(artifact.getIsActive()); // Default
        assertFalse(artifact.getIsEvidence()); // Default
    }

    @Test
    void testAllArgsConstructor() {
        UUID id = UUID.randomUUID();
        String tenantId = "tenant";
        String artifactNumber = "artifact123";
        String filingNumber = "filing456";
        String caseId = "case789";
        Document document = new Document();
        AuditDetails auditDetails = new AuditDetails();
        WorkflowObject workflow = new WorkflowObject();
        List<String> applicableTo = Arrays.asList("role1", "role2");
        List<String> witnessMobileNumbers = List.of("9999999999");
        List<String> witnessEmails = List.of("s6V0C@example.com");
        Comment comment = new Comment();

        Artifact artifact = new Artifact(
                id,
                tenantId,
                artifactNumber,
                "ev123",
                filingNumber,
                "extRef456",
                "courtId123",
                caseId,
                "app",
                "hearing",
                "order",
                "cnr123",
                "video",
                "typeA",
                "sourceTypeX",
                "srcId",
                "srcName",
                applicableTo,
                123456789L,
                987654321L,
                true,
                true,
                "IN_PROGRESS",
                "filingTypeA",
                true,
                "duplicate",
                document,
                document,
                "desc",
                null,
                List.of(comment),
                null,
                auditDetails,
                workflow,
                "short.ly/xyz",
                witnessMobileNumbers,
                witnessEmails,
                "PW1",
                "PENDING_E-SIGN",
                false,
                "uuid"
        );

        assertEquals(id, artifact.getId());
        assertEquals("tenant", artifact.getTenantId());
        assertEquals("artifact123", artifact.getArtifactNumber());
        assertEquals("filing456", artifact.getFilingNumber());
        assertEquals("IN_PROGRESS", artifact.getStatus());
        assertEquals("short.ly/xyz", artifact.getShortenedUrl());
        assertEquals(witnessMobileNumbers, artifact.getWitnessMobileNumbers());
        assertEquals("case789", artifact.getCaseId());
        assertTrue(artifact.getIsActive());
        assertTrue(artifact.getIsEvidence());
        assertEquals("extRef456", artifact.getExternalRefNumber());
        assertEquals("courtId123", artifact.getCourtId());
        assertEquals("ev123", artifact.getEvidenceNumber());
        assertEquals(workflow, artifact.getWorkflow());
        assertEquals(auditDetails, artifact.getAuditdetails());
        assertEquals(document, artifact.getFile());
    }

    @Test
    void testBuilder() {
        UUID id = UUID.randomUUID();
        AuditDetails auditDetails = new AuditDetails();
        Document document = new Document();

        Artifact artifact = Artifact.builder()
                .id(id)
                .tenantId("tenant")
                .artifactNumber("art-001")
                .filingNumber("filing001")
                .caseId("case001")
                .isActive(true)
                .isEvidence(false)
                .file(document)
                .auditdetails(auditDetails)
                .build();

        assertEquals(id, artifact.getId());
        assertEquals("tenant", artifact.getTenantId());
        assertEquals("art-001", artifact.getArtifactNumber());
        assertEquals("filing001", artifact.getFilingNumber());
        assertEquals("case001", artifact.getCaseId());
        assertTrue(artifact.getIsActive());
        assertFalse(artifact.getIsEvidence());
        assertEquals(auditDetails, artifact.getAuditdetails());
        assertEquals(document, artifact.getFile());
    }

    @Test
    void testAddApplicableToItem() {
        Artifact artifact = new Artifact();
        Artifact artifact1 = artifact.addApplicableToItem("roleX");

        assertSame(artifact, artifact1);
        assertNotNull(artifact.getApplicableTo());
        assertEquals(1, artifact.getApplicableTo().size());
        assertTrue(artifact.getApplicableTo().contains("roleX"));
    }

    @Test
    void testAddCommentsItem() {
        Artifact artifact = new Artifact();
        Comment comment = new Comment();
        Artifact artifact1 = artifact.addCommentsItem(comment);

        assertSame(artifact, artifact1);
        assertNotNull(artifact.getComments());
        assertEquals(1, artifact.getComments().size());
        assertSame(comment, artifact.getComments().get(0));
    }

    @Test
    void testSettersAndGetters() {
        Artifact artifact = new Artifact();
        UUID id = UUID.randomUUID();
        artifact.setId(id);
        artifact.setTenantId("tenant");
        artifact.setArtifactNumber("art-001");
        artifact.setFilingNumber("filing001");
        artifact.setCaseId("case001");

        assertEquals(id, artifact.getId());
        assertEquals("tenant", artifact.getTenantId());
        assertEquals("art-001", artifact.getArtifactNumber());
        assertEquals("filing001", artifact.getFilingNumber());
        assertEquals("case001", artifact.getCaseId());
    }
}
