package digit.validators;

import digit.repository.DigitalizedDocumentRepository;
import digit.web.models.DigitalizedDocument;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PleaValidatorTest {

    @Mock
    private DigitalizedDocumentRepository repository;

    @InjectMocks
    private PleaValidator validator;

    @Test
    void validateDigitalizedDocument_WhenFound_ReturnsExisting() {
        DigitalizedDocument input = DigitalizedDocument.builder()
                .documentNumber("DN-1")
                .tenantId("t1")
                .build();
        DigitalizedDocument existing = DigitalizedDocument.builder().id("X").build();

        when(repository.getDigitalizedDocumentByDocumentNumber(eq("DN-1"), eq("t1"))).thenReturn(existing);

        DigitalizedDocument out = validator.validateDigitalizedDocument(input);
        assertSame(existing, out);
    }

    @Test
    void validateDigitalizedDocument_WhenMissing_ThrowsValidationError() {
        DigitalizedDocument input = DigitalizedDocument.builder()
                .documentNumber("DN-404")
                .tenantId("t1")
                .build();

        when(repository.getDigitalizedDocumentByDocumentNumber(eq("DN-404"), eq("t1"))).thenReturn(null);

        CustomException ex = assertThrows(CustomException.class, () -> validator.validateDigitalizedDocument(input));
        assertEquals("VALIDATION_ERROR", ex.getCode());
        assertTrue(ex.getMessage().contains("does not exist"));
    }
}
