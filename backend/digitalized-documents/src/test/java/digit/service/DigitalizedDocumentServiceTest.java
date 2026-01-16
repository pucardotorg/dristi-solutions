package digit.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import digit.config.Configuration;
import digit.repository.DigitalizedDocumentRepository;
import digit.util.CipherUtil;
import digit.util.ESignUtil;
import digit.util.FileStoreUtil;
import digit.util.XmlRequestGenerator;
import digit.web.models.*;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.core.io.Resource;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class DigitalizedDocumentServiceTest {

    @Mock private DocumentTypeServiceFactory factory;
    @Mock private ESignUtil eSignUtil;
    @Mock private FileStoreUtil fileStoreUtil;
    @Mock private CipherUtil cipherUtil;
    @Mock private XmlRequestGenerator xmlRequestGenerator;
    @Mock private DigitalizedDocumentRepository repository;
    @Mock private Configuration configuration;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks private DigitalizedDocumentService service;

    private DigitalizedDocument document;
    private DigitalizedDocumentRequest request;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        WorkflowObject workflowObject = new WorkflowObject();
        workflowObject.setAction("CREATE");
        document = DigitalizedDocument.builder()
                .type(TypeEnum.PLEA)
                .caseId("C1")
                .caseFilingNumber("CF1")
                .tenantId("t1")
                .courtId("court")
                .workflow(workflowObject)
                .build();
        request = DigitalizedDocumentRequest.builder()
                .requestInfo(RequestInfo.builder().userInfo(User.builder().uuid("u1").build()).build())
                .digitalizedDocument(document)
                .build();

        ReflectionTestUtils.setField(service, "objectMapper", objectMapper);
    }

    @Test
    void createDigitalizedDocument_DelegatesToTypeService() {
        DocumentTypeService typeService = mock(DocumentTypeService.class);
        when(factory.getService(TypeEnum.PLEA)).thenReturn(typeService);
        when(typeService.createDocument(eq(request))).thenReturn(document);

        DigitalizedDocument result = service.createDigitalizedDocument(request);

        assertSame(document, result);
        verify(factory).getService(TypeEnum.PLEA);
        verify(typeService).createDocument(eq(request));
    }

    @Test
    void updateDigitalizedDocument_DelegatesToTypeService() {
        DocumentTypeService typeService = mock(DocumentTypeService.class);
        when(factory.getService(TypeEnum.PLEA)).thenReturn(typeService);
        when(typeService.updateDocument(eq(request))).thenReturn(document);

        DigitalizedDocument result = service.updateDigitalizedDocument(request);

        assertSame(document, result);
        verify(factory).getService(TypeEnum.PLEA);
        verify(typeService).updateDocument(eq(request));
    }

    @Test
    void searchDigitalizedDocument_ReturnsFromRepository() {
        DigitalizedDocumentSearchRequest searchRequest = DigitalizedDocumentSearchRequest.builder()
                .criteria(DigitalizedDocumentSearchCriteria.builder().tenantId("t1").build())
                .pagination(Pagination.builder().limit(5d).offSet(0d).build())
                .build();
        when(repository.getDigitalizedDocuments(any(), any())).thenReturn(List.of(document));

        List<DigitalizedDocument> result = service.searchDigitalizedDocument(searchRequest);

        assertEquals(1, result.size());
        verify(repository).getDigitalizedDocuments(eq(searchRequest.getCriteria()), eq(searchRequest.getPagination()));
    }

    @Test
    void searchDigitalizedDocument_WhenRepoThrows_WrapsAsCustomException() {
        DigitalizedDocumentSearchRequest searchRequest = DigitalizedDocumentSearchRequest.builder()
                .criteria(DigitalizedDocumentSearchCriteria.builder().tenantId("t1").build())
                .pagination(Pagination.builder().limit(5d).offSet(0d).build())
                .build();
        when(repository.getDigitalizedDocuments(any(), any())).thenThrow(new RuntimeException("db error"));

        CustomException ex = assertThrows(CustomException.class, () -> service.searchDigitalizedDocument(searchRequest));
        assertEquals("DIGITALIZED_DOCUMENT_SEARCH_FAILED", ex.getCode());
    }

    @Test
    void getDigitalizedDocumentsToSign_Success() throws IOException {
        // Arrange request for two criteria
        DigitalizedDocumentsToSignRequest signRequest = DigitalizedDocumentsToSignRequest.builder()
                .requestInfo(RequestInfo.builder().userInfo(User.builder().uuid("u1").build()).build())
                .criteria(new ArrayList<>())
                .build();
        signRequest.getCriteria().add(DigitalizedDocumentsCriteria.builder().fileStoreId("FS1").documentNumber("D1").tenantId("t1").placeholder("p1").build());
        signRequest.getCriteria().add(DigitalizedDocumentsCriteria.builder().fileStoreId("FS2").documentNumber("D2").tenantId("t1").placeholder("p2").build());

        // EsignUtil returns two coordinates in same order
        List<Coordinate> coords = List.of(
                Coordinate.builder().fileStoreId("FS1").x(10.0).y(20.0).pageNumber(1).tenantId("t1").build(),
                Coordinate.builder().fileStoreId("FS2").x(30.0).y(40.0).pageNumber(2).tenantId("t1").build()
        );
        when(eSignUtil.getCoordinateForSign(any(CoordinateRequest.class))).thenReturn(coords);

        // file store + encoding + xml
        when(fileStoreUtil.fetchFileStoreObjectById(anyString(), anyString())).thenReturn(mock(Resource.class));
        when(cipherUtil.encodePdfToBase64(any(Resource.class))).thenReturn("BASE64");
        when(xmlRequestGenerator.createXML(anyString(), any(Map.class))).thenReturn("<xml/>");

        List<DigitalizedDocumentToSign> result = service.getDigitalizedDocumentsToSign(signRequest);

        assertEquals(2, result.size());
        assertEquals("D1", result.get(0).getDocumentNumber());
        assertEquals("<xml/>", result.get(0).getRequest());
        assertEquals("D2", result.get(1).getDocumentNumber());
    }

    @Test
    void getDigitalizedDocumentsToSign_WhenCoordinatesMissing_Throws() {
        DigitalizedDocumentsToSignRequest signRequest = DigitalizedDocumentsToSignRequest.builder()
                .requestInfo(RequestInfo.builder().userInfo(User.builder().uuid("u1").build()).build())
                .criteria(new ArrayList<>())
                .build();
        signRequest.getCriteria().add(DigitalizedDocumentsCriteria.builder().fileStoreId("FS1").tenantId("t1").placeholder("p1").build());
        // Return empty coords
        when(eSignUtil.getCoordinateForSign(any(CoordinateRequest.class))).thenReturn(List.of());

        CustomException ex = assertThrows(CustomException.class, () -> service.getDigitalizedDocumentsToSign(signRequest));
        assertEquals("COORDINATES_ERROR", ex.getCode());
    }

    @Test
    void updateSignedDigitalizedDocuments_SignedFlow_UpdatesAndReturns() throws IOException {
        UpdateSignedDigitalizedDocumentRequest updReq = UpdateSignedDigitalizedDocumentRequest.builder()
                .requestInfo(RequestInfo.builder().userInfo(User.builder().uuid("u1").build()).build())
                .signedDocuments(new ArrayList<>())
                .build();
        updReq.getSignedDocuments().add(SignedDigitalizedDocument.builder()
                .documentNumber("DN")
                .signed(true)
                .signedDocumentData("BASE64")
                .tenantId("t1")
                .build());

        // Repo returns an existing doc
        Map<String, String> documentAdditionalDetails = new HashMap<>();
        documentAdditionalDetails.put("name", "CF1-DD1");
        Document signedDocument = Document.builder()
                .additionalDetails(documentAdditionalDetails)
                .build();
        DigitalizedDocument existing = DigitalizedDocument.builder()
                .type(TypeEnum.PLEA)
                .tenantId("t1")
                .caseId("C1")
                .caseFilingNumber("CF1")
                .courtId("court")
                .auditDetails(AuditDetails.builder().build())
                .documents(Collections.singletonList(signedDocument))
                .build();
        when(repository.getDigitalizedDocumentByDocumentNumber(eq("DN"), eq("t1"))).thenReturn(existing);

        // Decode + store
        MultipartFile mockFile = mock(MultipartFile.class);
        when(cipherUtil.decodeBase64ToPdf(anyString(), anyString())).thenReturn(mockFile);
        when(fileStoreUtil.storeFileInFileStore(eq(mockFile), eq("t1"))).thenReturn("FS-SIGNED");

        // Factory service to process internal updateDigitalizedDocument call
        DocumentTypeService typeService = mock(DocumentTypeService.class);
        when(factory.getService(TypeEnum.PLEA)).thenReturn(typeService);
        when(typeService.updateDocument(any(DigitalizedDocumentRequest.class))).thenAnswer(inv -> inv.getArgument(0, DigitalizedDocumentRequest.class).getDigitalizedDocument());

        List<DigitalizedDocument> updated = service.updateSignedDigitalizedDocuments(updReq);

        assertEquals(1, updated.size());
        verify(factory).getService(TypeEnum.PLEA);
        verify(typeService, atLeastOnce()).updateDocument(any(DigitalizedDocumentRequest.class));
    }
}
