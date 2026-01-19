package org.pucar.dristi.web.models.witnessdeposition;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class OpenApiEvidenceUpdateRequestTest {

    @Test
    void testNoArgsConstructor() {
        OpenApiEvidenceUpdateRequest request = new OpenApiEvidenceUpdateRequest();
        assertNull(request.getTenantId());
        assertNull(request.getArtifactNumber());
        assertNull(request.getPartyType());
        assertNull(request.getMobileNumber());
        assertNull(request.getFileStoreId());
    }

    @Test
    void testAllArgsConstructor() {
        OpenApiEvidenceUpdateRequest request = new OpenApiEvidenceUpdateRequest(
                "tenant123",
                "artifactABC",
                "partyTypeX",
                "9876543210",
                "filestoreXYZ"
        );

        assertEquals("tenant123", request.getTenantId());
        assertEquals("artifactABC", request.getArtifactNumber());
        assertEquals("partyTypeX", request.getPartyType());
        assertEquals("9876543210", request.getMobileNumber());
        assertEquals("filestoreXYZ", request.getFileStoreId());
    }

    @Test
    void testBuilder() {
        OpenApiEvidenceUpdateRequest request = OpenApiEvidenceUpdateRequest.builder()
                .tenantId("tenant123")
                .artifactNumber("artifactABC")
                .partyType("partyTypeX")
                .mobileNumber("9876543210")
                .fileStoreId("filestoreXYZ")
                .build();

        assertEquals("tenant123", request.getTenantId());
        assertEquals("artifactABC", request.getArtifactNumber());
        assertEquals("partyTypeX", request.getPartyType());
        assertEquals("9876543210", request.getMobileNumber());
        assertEquals("filestoreXYZ", request.getFileStoreId());
    }

    @Test
    void testSettersAndGetters() {
        OpenApiEvidenceUpdateRequest request = new OpenApiEvidenceUpdateRequest();

        request.setTenantId("tenant001");
        request.setArtifactNumber("art001");
        request.setPartyType("individual");
        request.setMobileNumber("9999999999");
        request.setFileStoreId("fs001");

        assertEquals("tenant001", request.getTenantId());
        assertEquals("art001", request.getArtifactNumber());
        assertEquals("individual", request.getPartyType());
        assertEquals("9999999999", request.getMobileNumber());
        assertEquals("fs001", request.getFileStoreId());
    }

}
