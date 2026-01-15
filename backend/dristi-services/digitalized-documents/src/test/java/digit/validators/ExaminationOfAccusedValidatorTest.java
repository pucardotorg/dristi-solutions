package digit.validators;

import digit.repository.DigitalizedDocumentRepository;
import digit.web.models.DigitalizedDocument;
import digit.web.models.DigitalizedDocumentRequest;
import digit.web.models.ExaminationOfAccusedDetails;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ExaminationOfAccusedValidatorTest {

    @Mock
    private DigitalizedDocumentRepository repository;

    @InjectMocks
    private ExaminationOfAccusedValidator validator;

    private RequestInfo requestInfo;

    @BeforeEach
    void init() {
        requestInfo = RequestInfo.builder().userInfo(User.builder().uuid("u1").build()).build();
    }

    // ---------------- validateDigitalizedDocument ----------------

    @Test
    void validateDigitalizedDocument_WithValidPayload_DoesNotThrow() {
        DigitalizedDocument doc = DigitalizedDocument.builder()
                .tenantId("t1")
                .examinationOfAccusedDetails(ExaminationOfAccusedDetails.builder()
                        .accusedUniqueId("ACC-1")
                        .build())
                .build();
        DigitalizedDocumentRequest request = DigitalizedDocumentRequest.builder()
                .requestInfo(requestInfo)
                .digitalizedDocument(doc)
                .build();

        assertDoesNotThrow(() -> validator.validateDigitalizedDocument(request));
    }

    @Test
    void validateDigitalizedDocument_WhenDocumentNull_Throws() {
        DigitalizedDocumentRequest request = DigitalizedDocumentRequest.builder()
                .requestInfo(requestInfo)
                .digitalizedDocument(null)
                .build();

        CustomException ex = assertThrows(CustomException.class, () -> validator.validateDigitalizedDocument(request));
        assertEquals("VALIDATION_ERROR", ex.getCode());
        assertTrue(ex.getMessage().contains("Digitalized document cannot be null"));
    }

    @Test
    void validateDigitalizedDocument_WhenTenantIdNull_Throws() {
        DigitalizedDocument doc = DigitalizedDocument.builder()
                .tenantId(null)
                .examinationOfAccusedDetails(ExaminationOfAccusedDetails.builder().accusedUniqueId("ACC-1").build())
                .build();
        DigitalizedDocumentRequest request = DigitalizedDocumentRequest.builder()
                .requestInfo(requestInfo)
                .digitalizedDocument(doc)
                .build();

        CustomException ex = assertThrows(CustomException.class, () -> validator.validateDigitalizedDocument(request));
        assertEquals("VALIDATION_ERROR", ex.getCode());
        assertTrue(ex.getMessage().contains("Tenant ID cannot be null"));
    }

    @Test
    void validateDigitalizedDocument_WhenDetailsNull_Throws() {
        DigitalizedDocument doc = DigitalizedDocument.builder()
                .tenantId("t1")
                .examinationOfAccusedDetails(null)
                .build();
        DigitalizedDocumentRequest request = DigitalizedDocumentRequest.builder()
                .requestInfo(requestInfo)
                .digitalizedDocument(doc)
                .build();

        CustomException ex = assertThrows(CustomException.class, () -> validator.validateDigitalizedDocument(request));
        assertEquals("VALIDATION_ERROR", ex.getCode());
        assertTrue(ex.getMessage().contains("Examination of Accused Details cannot be null"));
    }

    @Test
    void validateDigitalizedDocument_WhenAccusedUniqueIdNull_Throws() {
        DigitalizedDocument doc = DigitalizedDocument.builder()
                .tenantId("t1")
                .examinationOfAccusedDetails(ExaminationOfAccusedDetails.builder().accusedUniqueId(null).build())
                .build();
        DigitalizedDocumentRequest request = DigitalizedDocumentRequest.builder()
                .requestInfo(requestInfo)
                .digitalizedDocument(doc)
                .build();

        CustomException ex = assertThrows(CustomException.class, () -> validator.validateDigitalizedDocument(request));
        assertEquals("VALIDATION_ERROR", ex.getCode());
        assertTrue(ex.getMessage().contains("Accused unique id cannot be null"));
    }

    // ---------------- checkDigitalizedDocumentExists ----------------

    @Test
    void checkDigitalizedDocumentExists_WhenFound_ReturnsExisting() {
        DigitalizedDocument payload = DigitalizedDocument.builder()
                .documentNumber("DN-1")
                .tenantId("t1")
                .build();
        DigitalizedDocument existing = DigitalizedDocument.builder().id("X").build();
        when(repository.getDigitalizedDocumentByDocumentNumber(eq("DN-1"), eq("t1"))).thenReturn(existing);

        DigitalizedDocument out = validator.checkDigitalizedDocumentExists(payload);
        assertSame(existing, out);
    }

    @Test
    void checkDigitalizedDocumentExists_WhenMissing_Throws() {
        DigitalizedDocument payload = DigitalizedDocument.builder()
                .documentNumber("DN-404")
                .tenantId("t1")
                .build();
        when(repository.getDigitalizedDocumentByDocumentNumber(eq("DN-404"), eq("t1"))).thenReturn(null);

        CustomException ex = assertThrows(CustomException.class, () -> validator.checkDigitalizedDocumentExists(payload));
        assertEquals("VALIDATION_ERROR", ex.getCode());
        assertTrue(ex.getMessage().contains("does not exist"));
    }
}
