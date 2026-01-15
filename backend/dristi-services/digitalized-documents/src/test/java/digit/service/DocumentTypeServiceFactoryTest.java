package digit.service;

import digit.web.models.TypeEnum;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import static org.junit.jupiter.api.Assertions.*;

class DocumentTypeServiceFactoryTest {

    private PleaDocumentService pleaService;
    private ExaminationOfAccusedDocumentService examService;
    private MediationDocumentService mediationService;

    private DocumentTypeServiceFactory factory;

    @BeforeEach
    void setUp() {
        pleaService = Mockito.mock(PleaDocumentService.class);
        examService = Mockito.mock(ExaminationOfAccusedDocumentService.class);
        mediationService = Mockito.mock(MediationDocumentService.class);
        factory = new DocumentTypeServiceFactory(pleaService, examService, mediationService);
    }

    @Test
    void getService_ReturnsMappedService() {
        assertSame(pleaService, factory.getService(TypeEnum.PLEA));
        assertSame(examService, factory.getService(TypeEnum.EXAMINATION_OF_ACCUSED));
        assertSame(mediationService, factory.getService(TypeEnum.MEDIATION));
    }

    @Test
    void getService_WhenTypeNull_ThrowsCustomException() {
        CustomException ex = assertThrows(CustomException.class, () -> factory.getService(null));
        assertEquals("INVALID_DOCUMENT_TYPE", ex.getCode());
    }
}
