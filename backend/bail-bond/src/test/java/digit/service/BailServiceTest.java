package digit.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import digit.config.Configuration;
import digit.enrichment.BailRegistrationEnrichment;
import digit.kafka.Producer;
import digit.repository.BailRepository;
import digit.util.*;
import digit.validator.BailValidator;
import digit.web.models.*;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.*;
import org.mockito.*;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link BailService}
 */
class BailServiceTest {

    @Mock private BailValidator validator;
    @Mock private BailRegistrationEnrichment enrichmentUtil;
    @Mock private Producer producer;
    @Mock private Configuration config;
    @Mock private WorkflowService workflowService;
    @Mock private BailRepository bailRepository;
    @Mock private EncryptionDecryptionUtil encryptionDecryptionUtil;
    @Mock private ObjectMapper objectMapper;
    @Mock private FileStoreUtil fileStoreUtil;
    @Mock private CipherUtil cipherUtil;
    @Mock private ESignUtil eSignUtil;
    @Mock private XmlRequestGenerator xmlRequestGenerator;

    @InjectMocks
    private BailService bailService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        when(config.getBailCreateTopic()).thenReturn("bail-create");
        when(config.getBailUpdateTopic()).thenReturn("bail-update");
        when(config.getBailEncrypt()).thenReturn("ENCRYPT");
        when(config.getBailDecrypt()).thenReturn("DECRYPT");
        when(config.getZoneId()).thenReturn("Asia/Kolkata");
    }

    // ---- TESTS FOR createBail() ----

    @Test
    void givenValidBailRequest_whenCreateBail_thenSavesAndReturnsOriginalBail() {
        BailRequest request = mock(BailRequest.class);
        Bail bail = mock(Bail.class);
        when(request.getBail()).thenReturn(bail);
        when(encryptionDecryptionUtil.encryptObject(eq(bail), anyString(), eq(Bail.class))).thenReturn(bail);

        Bail result = bailService.createBail(request);

        verify(validator).validateBailRegistration(request);
        verify(enrichmentUtil).enrichBailOnCreation(request);
        verify(producer).push(eq("bail-create"), eq(request));
        assertEquals(bail, result);
    }

    @Test
    void whenCreateBailWithWorkflow_thenWorkflowServiceIsCalled() {
        BailRequest request = mock(BailRequest.class);
        Bail bail = mock(Bail.class);
        when(request.getBail()).thenReturn(bail);
        when(bail.getWorkflow()).thenReturn(mock(WorkflowObject.class));
        when(encryptionDecryptionUtil.encryptObject(eq(bail), anyString(), eq(Bail.class))).thenReturn(bail);

        bailService.createBail(request);

        verify(workflowService).updateWorkflowStatus(request);
    }




    // ---- TESTS FOR searchBail() ----

    @Test
    void whenSearchBail_withCriteria_thenEncryptionAndDecryptionApplied() {
        BailSearchRequest searchReq = new BailSearchRequest();
        BailSearchCriteria crit = new BailSearchCriteria();
        searchReq.setCriteria(crit);
        searchReq.setRequestInfo(RequestInfo.builder().userInfo(User.builder().type("system").build()).build());
        List<Bail> retList = List.of(mock(Bail.class));
        when(bailRepository.getBails(any())).thenReturn(retList);
        when(encryptionDecryptionUtil.decryptObject(any(), any(), eq(Bail.class), any())).thenReturn(retList.get(0));

        List<Bail> result = bailService.searchBail(searchReq);

        verify(bailRepository).getBails(searchReq);
        verify(encryptionDecryptionUtil).decryptObject(any(), any(), eq(Bail.class), any());
        assertEquals(1, result.size());
    }

    @Test
    void whenSearchBail_noCriteria_thenNoEncryptionOnCriteria() {
        BailSearchRequest searchReq = new BailSearchRequest();
        searchReq.setRequestInfo(RequestInfo.builder().userInfo(User.builder().type("system").build()).build());
        List<Bail> retList = List.of(mock(Bail.class));
        when(bailRepository.getBails(any())).thenReturn(retList);
        when(encryptionDecryptionUtil.decryptObject(any(), any(), eq(Bail.class), any())).thenReturn(retList.get(0));

        List<Bail> result = bailService.searchBail(searchReq);
        assertEquals(1, result.size());
    }

    @Test
    void whenSearchBail_bailRepositoryThrows_thenThrowsCustomException() {
        BailSearchRequest searchReq = new BailSearchRequest();
        searchReq.setRequestInfo(RequestInfo.builder().userInfo(User.builder().type("system").build()).build());
        when(bailRepository.getBails(any())).thenThrow(new RuntimeException("DB down"));
        CustomException ex = assertThrows(CustomException.class,
                () -> bailService.searchBail(searchReq));
        assertEquals("BAIL_SEARCH_ERR", ex.getCode());
    }

    // ---- TESTS FOR createBailToSignRequest() ----

    @Test
    void whenCreateBailToSignRequest_allHappy_thenReturnsList() throws Exception {
        BailsToSignRequest req = mock(BailsToSignRequest.class);
        List<BailsCriteria> criteriaList = List.of(new BailsCriteria());
        when(req.getCriteria()).thenReturn(criteriaList);

        Coordinate coordinate = new Coordinate();
        coordinate.setFileStoreId("fsId");
        coordinate.setX(200);
        coordinate.setY(100);
        coordinate.setPageNumber(1);
        coordinate.setTenantId("tenantId");

        when(eSignUtil.getCoordinateForSign(any())).thenReturn(List.of(coordinate));
        when(fileStoreUtil.fetchFileStoreObjectById("fsId", "tenantId")).thenReturn(mock(Resource.class));
        when(cipherUtil.encodePdfToBase64(any())).thenReturn("base64str");
        when(xmlRequestGenerator.createXML(any(), any())).thenReturn("<xml></xml>");

        BailsCriteria bailsCriteria = new BailsCriteria();
        bailsCriteria.setFileStoreId("fsId");
        bailsCriteria.setPlaceholder("plc");
        bailsCriteria.setTenantId("tenantId");
        bailsCriteria.setBailId("bailId");
        when(req.getCriteria()).thenReturn(List.of(bailsCriteria));
        when(req.getRequestInfo()).thenReturn(mock(RequestInfo.class));

        List<BailToSign> result = bailService.createBailToSignRequest(req);

        assertEquals(1, result.size());
        assertNotNull(result.get(0).getRequest());
        assertEquals("bailId", result.get(0).getBailId());
    }

    @Test
    void whenCreateBailToSignRequest_coordinatesEmpty_thenThrowsCustomException() {
        BailsToSignRequest req = mock(BailsToSignRequest.class);
        List<BailsCriteria> criteriaList = List.of(new BailsCriteria());
        when(req.getCriteria()).thenReturn(criteriaList);

        when(eSignUtil.getCoordinateForSign(any())).thenReturn(Collections.emptyList());
        CustomException ex = assertThrows(CustomException.class,
                () -> bailService.createBailToSignRequest(req));
        assertEquals("COORDINATES_ERROR", ex.getCode());
    }

    @Test
    void whenCreateBailToSignRequest_fileStoreUtilFails_thenThrowsCustomException() {
        BailsToSignRequest req = mock(BailsToSignRequest.class);
        BailsCriteria bailsCriteria = new BailsCriteria();
        bailsCriteria.setFileStoreId("fsId");
        bailsCriteria.setPlaceholder("plc");
        bailsCriteria.setTenantId("tenantId");
        when(req.getCriteria()).thenReturn(List.of(bailsCriteria));
        when(req.getRequestInfo()).thenReturn(mock(RequestInfo.class));
        Coordinate coordinate = new Coordinate();
        coordinate.setFileStoreId("fsId");
        coordinate.setX(100);
        coordinate.setY(200);
        coordinate.setPageNumber(1);
        coordinate.setTenantId("tenantId");
        when(eSignUtil.getCoordinateForSign(any())).thenReturn(List.of(coordinate));
        when(fileStoreUtil.fetchFileStoreObjectById("fsId", "tenantId"))
                .thenThrow(new RuntimeException("fail"));
        assertThrows(CustomException.class, () -> bailService.createBailToSignRequest(req));
    }

    // ---- TESTS FOR updateBailWithSignDoc() ----

    @Test
    void whenUpdateBailWithSignDoc_validSignedBail_thenApprovesAndSaves() throws Exception {
        UpdateSignedBailRequest updateReq = mock(UpdateSignedBailRequest.class);
        SignedBail signedBail = mock(SignedBail.class);
        when(signedBail.getSigned()).thenReturn(true);
        when(signedBail.getBailId()).thenReturn("BAILID");
        when(signedBail.getTenantId()).thenReturn("tenantId");
        when(signedBail.getSignedBailData()).thenReturn("PDFBASE64");
        List<SignedBail> signedBails = List.of(signedBail);
        when(updateReq.getSignedBails()).thenReturn(signedBails);
        when(updateReq.getRequestInfo()).thenReturn(mock(RequestInfo.class));
        Bail bail = mock(Bail.class);

        BailSearchCriteria searchCrit = BailSearchCriteria.builder()
                .bailId("BAILID").tenantId("tenantId").build();
        Pagination pagination = Pagination.builder().limit(1).offSet(0).build();
        BailSearchRequest bailSearchRequest = BailSearchRequest.builder()
                .criteria(searchCrit).pagination(pagination).build();
        when(bailRepository.getBails(any())).thenReturn(List.of(bail));
        when(encryptionDecryptionUtil.decryptObject(any(), any(), eq(Bail.class), any())).thenReturn(bail);
        MultipartFile file = mock(MultipartFile.class);
        when(cipherUtil.decodeBase64ToPdf(eq("PDFBASE64"), anyString())).thenReturn(file);
        when(fileStoreUtil.storeFileInFileStore(file, "tenantId")).thenReturn("filestore123");
        when(bail.getDocuments()).thenReturn(new ArrayList<>());

        // Partial mocking for updateBail method to avoid recursion/NPE
        BailService spyService = Mockito.spy(bailService);
        doReturn(bail).when(spyService).updateBail(any(BailRequest.class));

        List<Bail> updated = spyService.updateBailWithSignDoc(updateReq);

        assertEquals(1, updated.size());
        verify(bailRepository).getBails(any());
        verify(cipherUtil).decodeBase64ToPdf(eq("PDFBASE64"), anyString());
        verify(fileStoreUtil).storeFileInFileStore(file, "tenantId");
        verify(spyService).updateBail(any());
    }

    @Test
    void whenUpdateBailWithSignDoc_noBailsFound_thenThrowsCustomException() {
        UpdateSignedBailRequest updateReq = mock(UpdateSignedBailRequest.class);
        SignedBail signedBail = mock(SignedBail.class);
        when(signedBail.getSigned()).thenReturn(true);
        when(signedBail.getBailId()).thenReturn("bail123");
        when(signedBail.getTenantId()).thenReturn("tenantId");
        when(updateReq.getSignedBails()).thenReturn(List.of(signedBail));
        when(updateReq.getRequestInfo()).thenReturn(mock(RequestInfo.class));
        when(bailRepository.getBails(any())).thenReturn(Collections.emptyList());
        CustomException ex = assertThrows(CustomException.class,
                () -> bailService.updateBailWithSignDoc(updateReq));
        assertEquals("BAILS_BULK_SIGN_EXCEPTION", ex.getCode());
    }

    @Test
    void whenUpdateBailWithSignDoc_fileStoreThrows_thenThrowsCustomException() throws Exception {
        UpdateSignedBailRequest updateReq = mock(UpdateSignedBailRequest.class);
        SignedBail signedBail = mock(SignedBail.class);
        when(signedBail.getSigned()).thenReturn(true);
        when(signedBail.getBailId()).thenReturn("bailX");
        when(signedBail.getTenantId()).thenReturn("tenantY");
        when(signedBail.getSignedBailData()).thenReturn("PDFDATA");
        when(updateReq.getSignedBails()).thenReturn(List.of(signedBail));
        when(updateReq.getRequestInfo()).thenReturn(mock(RequestInfo.class));

        Bail bail = mock(Bail.class);
        when(bail.getDocuments()).thenReturn(new ArrayList<>());

        // Partial mocking for updateBail as spy
        BailService spyService = Mockito.spy(bailService);
        doReturn(bail).when(spyService).updateBail(any(BailRequest.class));

        when(bailRepository.getBails(any())).thenReturn(List.of(bail));
        MultipartFile file = mock(MultipartFile.class);
        when(cipherUtil.decodeBase64ToPdf(eq("PDFDATA"), anyString())).thenReturn(file);
        when(fileStoreUtil.storeFileInFileStore(eq(file), eq("tenantY")))
                .thenThrow(new RuntimeException("fail store!"));

        CustomException ex = assertThrows(CustomException.class,
                () -> spyService.updateBailWithSignDoc(updateReq));
        assertEquals("BAILS_BULK_SIGN_EXCEPTION", ex.getCode());
    }

    // --- UTILITY FOR MOCK SURETY ---
    private Surety mockSurety(boolean hasSigned) {
        Surety s = mock(Surety.class);
        when(s.getHasSigned()).thenReturn(hasSigned);
        return s;
    }
}
