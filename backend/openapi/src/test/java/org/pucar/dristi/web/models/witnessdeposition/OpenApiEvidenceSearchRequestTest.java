package org.pucar.dristi.web.models.witnessdeposition;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class OpenApiEvidenceSearchRequestTest {

    private static Validator validator;

    @BeforeAll
    static void setupValidator() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    void testNoArgsConstructor() {
        OpenApiEvidenceSearchRequest request = new OpenApiEvidenceSearchRequest();
        assertNull(request.getTenantId());
        assertNull(request.getArtifactNumber());
        assertNull(request.getMobileNumber());
    }

    @Test
    void testAllArgsConstructor() {
        OpenApiEvidenceSearchRequest request = new OpenApiEvidenceSearchRequest(
                "tenant123",
                "SOURCE_XYZ",
                "9876543210"
        );

        assertEquals("tenant123", request.getTenantId());
        assertEquals("SOURCE_XYZ", request.getArtifactNumber());
        assertEquals("9876543210", request.getMobileNumber());
    }

    @Test
    void testBuilder() {
        OpenApiEvidenceSearchRequest request = OpenApiEvidenceSearchRequest.builder()
                .tenantId("tenantABC")
                .artifactNumber("art001")
                .mobileNumber("9999999999")
                .build();

        assertEquals("tenantABC", request.getTenantId());
        assertEquals("art001", request.getArtifactNumber());
        assertEquals("9999999999", request.getMobileNumber());
    }

    @Test
    void testSettersAndGetters() {
        OpenApiEvidenceSearchRequest request = new OpenApiEvidenceSearchRequest();

        request.setTenantId("tenantXYZ");
        request.setArtifactNumber("artifactXYZ");
        request.setMobileNumber("1234567890");

        assertEquals("tenantXYZ", request.getTenantId());
        assertEquals("artifactXYZ", request.getArtifactNumber());
        assertEquals("1234567890", request.getMobileNumber());
    }

    @Test
    void testValidationFailsWhenFieldsMissing() {
        OpenApiEvidenceSearchRequest request = new OpenApiEvidenceSearchRequest();

        Set<ConstraintViolation<OpenApiEvidenceSearchRequest>> violations = validator.validate(request);
        assertEquals(3, violations.size());

        for (ConstraintViolation<OpenApiEvidenceSearchRequest> violation : violations) {
            assertTrue(
                    violation.getPropertyPath().toString().equals("tenantId") ||
                            violation.getPropertyPath().toString().equals("artifactNumber") ||
                            violation.getPropertyPath().toString().equals("sourceType") ||
                            violation.getPropertyPath().toString().equals("mobileNumber")
            );
        }
    }

    @Test
    void testValidationPassesWhenAllFieldsPresent() {
        OpenApiEvidenceSearchRequest request = OpenApiEvidenceSearchRequest.builder()
                .tenantId("tenantABC")
                .artifactNumber("artifact123")
                .mobileNumber("8888888888")
                .build();

        Set<ConstraintViolation<OpenApiEvidenceSearchRequest>> violations = validator.validate(request);
        assertTrue(violations.isEmpty());
    }
}
