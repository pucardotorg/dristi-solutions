package digit.validators;

import digit.repository.DigitalizedDocumentRepository;
import digit.web.models.*;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MediationDocumentValidatorTest {

    @Mock
    private DigitalizedDocumentRepository repository;

    @InjectMocks
    private MediationDocumentValidator validator;

    private MediationDetails validDetails;

    @BeforeEach
    void setup() {
        validDetails = MediationDetails.builder()
                .natureOfComplainant("Nature")
                .dateOfInstitution(1L)
                .caseStage("Stage")
                .hearingDate(2L)
                .partyDetails(List.of(
                        MediationPartyDetails.builder()
                                .partyType(PartyTypeEnum.COMPLAINANT)
                                .uniqueId("U1")
                                .mobileNumber("9999999999")
                                .partyName("John Doe")
                                .partyIndex(1)
                                .hasSigned(true)
                                .build()
                ))
                .build();
    }

    // ---------------- validateCreateMediationDocument ----------------

    @Test
    void validateCreateMediationDocument_WithValidPayload_DoesNotThrow() {
        DigitalizedDocument doc = DigitalizedDocument.builder()
                .orderNumber("ORD-1")
                .mediationDetails(validDetails)
                .build();

        assertDoesNotThrow(() -> validator.validateCreateMediationDocument(doc));
    }

    @Test
    void validateCreateMediationDocument_WhenOrderNumberNull_Throws() {
        DigitalizedDocument doc = DigitalizedDocument.builder()
                .orderNumber(null)
                .mediationDetails(validDetails)
                .build();

        CustomException ex = assertThrows(CustomException.class, () -> validator.validateCreateMediationDocument(doc));
        assertEquals("INVALID_ORDER_NUMBER", ex.getCode());
    }

    @Test
    void validateCreateMediationDocument_WhenDetailsNull_Throws() {
        DigitalizedDocument doc = DigitalizedDocument.builder()
                .orderNumber("ORD-1")
                .mediationDetails(null)
                .build();

        CustomException ex = assertThrows(CustomException.class, () -> validator.validateCreateMediationDocument(doc));
        assertEquals("INVALID_MEDIATION_DETAILS", ex.getCode());
    }

    @Test
    void validateCreateMediationDocument_WhenPartyFieldMissing_Throws() {
        MediationDetails badDetails = MediationDetails.builder()
                .natureOfComplainant("Nature")
                .dateOfInstitution(1L)
                .caseStage("Stage")
                .hearingDate(2L)
                .partyDetails(List.of(
                        MediationPartyDetails.builder()
                                .partyType(null) // missing mandatory field
                                .uniqueId("U1")
                                .mobileNumber("9999999999")
                                .partyName("John Doe")
                                .partyIndex(1)
                                .hasSigned(true)
                                .build()
                ))
                .build();

        DigitalizedDocument doc = DigitalizedDocument.builder()
                .orderNumber("ORD-1")
                .mediationDetails(badDetails)
                .build();

        CustomException ex = assertThrows(CustomException.class, () -> validator.validateCreateMediationDocument(doc));
        assertEquals("INVALID_MEDIATION_DETAILS", ex.getCode());
        assertTrue(ex.getMessage().toLowerCase().contains("party type"));
    }

    // ---------------- validateUpdateMediationDocument ----------------

    @Test
    void validateUpdateMediationDocument_WhenFound_ReturnsExisting() {
        DigitalizedDocument input = DigitalizedDocument.builder()
                .id("ID-1")
                .documentNumber("DN-1")
                .tenantId("t1")
                .orderNumber("ORD-1")
                .build();

        DigitalizedDocument existing = DigitalizedDocument.builder().id("X").build();
        when(repository.getDigitalizedDocumentByDocumentNumber(eq("DN-1"), eq("t1"))).thenReturn(existing);

        DigitalizedDocument out = validator.validateUpdateMediationDocument(input);
        assertSame(existing, out);
    }

    @Test
    void validateUpdateMediationDocument_WhenIdMissing_Throws() {
        DigitalizedDocument input = DigitalizedDocument.builder()
                .id(null)
                .documentNumber("DN-1")
                .tenantId("t1")
                .orderNumber("ORD-1")
                .build();

        CustomException ex = assertThrows(CustomException.class, () -> validator.validateUpdateMediationDocument(input));
        assertEquals("INVALID_MEDIATION_DETAILS", ex.getCode());
        assertTrue(ex.getMessage().contains("Id cannot be null"));
    }

    @Test
    void validateUpdateMediationDocument_WhenOrderNumberMissing_Throws() {
        DigitalizedDocument input = DigitalizedDocument.builder()
                .id("ID-1")
                .documentNumber("DN-1")
                .tenantId("t1")
                .orderNumber(null)
                .build();

        CustomException ex = assertThrows(CustomException.class, () -> validator.validateUpdateMediationDocument(input));
        assertEquals("INVALID_ORDER_NUMBER", ex.getCode());
    }

    @Test
    void validateUpdateMediationDocument_WhenNotFound_Throws() {
        DigitalizedDocument input = DigitalizedDocument.builder()
                .id("ID-1")
                .documentNumber("DN-404")
                .tenantId("t1")
                .orderNumber("ORD-1")
                .build();

        when(repository.getDigitalizedDocumentByDocumentNumber(eq("DN-404"), eq("t1"))).thenReturn(null);

        CustomException ex = assertThrows(CustomException.class, () -> validator.validateUpdateMediationDocument(input));
        assertEquals("VALIDATION_ERROR", ex.getCode());
        assertTrue(ex.getMessage().contains("does not exist"));
    }
}
