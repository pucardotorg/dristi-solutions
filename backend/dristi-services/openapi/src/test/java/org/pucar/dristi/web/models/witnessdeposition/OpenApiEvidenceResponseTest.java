package org.pucar.dristi.web.models.witnessdeposition;

import org.egov.common.contract.models.Document;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class OpenApiEvidenceResponseTest {

    @Test
    void testNoArgsConstructor() {
        OpenApiEvidenceResponse response = new OpenApiEvidenceResponse();

        assertNull(response.getArtifactNumber());
        assertNull(response.getMobileNumber());
        assertNull(response.getSourceType());
        assertNull(response.getFile());
    }

    @Test
    void testAllArgsConstructor() {
        Document document = new Document();
        OpenApiEvidenceResponse response = new OpenApiEvidenceResponse(
                "artifact123",
                "9876543210",
                "SOURCE_TYPE",
                "PW1",
                "PENDING_E-SIGN",
                document
        );

        assertEquals("artifact123", response.getArtifactNumber());
        assertEquals("9876543210", response.getMobileNumber());
        assertEquals("SOURCE_TYPE", response.getSourceType());
        assertEquals(document, response.getFile());
    }

    @Test
    void testBuilder() {
        Document document = new Document();
        OpenApiEvidenceResponse response = OpenApiEvidenceResponse.builder()
                .artifactNumber("artifact456")
                .mobileNumber("9999999999")
                .sourceType("MANUAL")
                .file(document)
                .build();

        assertEquals("artifact456", response.getArtifactNumber());
        assertEquals("9999999999", response.getMobileNumber());
        assertEquals("MANUAL", response.getSourceType());
        assertEquals(document, response.getFile());
    }

    @Test
    void testSettersAndGetters() {
        OpenApiEvidenceResponse response = new OpenApiEvidenceResponse();

        Document doc = new Document();
        response.setArtifactNumber("artifact789");
        response.setMobileNumber("1234567890");
        response.setSourceType("AUTO");
        response.setFile(doc);

        assertEquals("artifact789", response.getArtifactNumber());
        assertEquals("1234567890", response.getMobileNumber());
        assertEquals("AUTO", response.getSourceType());
        assertEquals(doc, response.getFile());
    }
}
