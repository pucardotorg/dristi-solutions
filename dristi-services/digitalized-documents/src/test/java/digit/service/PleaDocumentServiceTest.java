package digit.service;

import digit.config.Configuration;
import digit.enrichment.DigitalizedDocumentEnrichment;
import digit.enrichment.PleaEnrichment;
import digit.kafka.Producer;
import digit.util.FileStoreUtil;
import digit.validators.PleaValidator;
import digit.web.models.*;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class PleaDocumentServiceTest {

    @Mock
    private PleaValidator validator;
    @Mock
    private DigitalizedDocumentEnrichment enrichment;
    @Mock
    private PleaEnrichment pleaEnrichment;
    @Mock
    private WorkflowService workflowService;
    @Mock
    private Producer producer;
    @Mock
    private Configuration config;
    @Mock
    private FileStoreUtil fileStoreUtil;

    @InjectMocks
    private PleaDocumentService service;

    private DigitalizedDocumentRequest request;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        WorkflowObject workflowObject = new WorkflowObject();
        workflowObject.setAction("CREATE");
        DigitalizedDocument document = DigitalizedDocument.builder()
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
    }

    @Test
    void createDocument_Success_FlowsAndPush() {
        when(config.getPleaDigitalizedDocumentCreateTopic()).thenReturn("topic.create");

        DigitalizedDocument result = service.createDocument(request);

        assertNotNull(result);
        verify(enrichment).enrichDigitalizedDocument(eq(request));
        verify(pleaEnrichment).enrichDocumentOnCreation(eq(request));
        verify(workflowService).updateWorkflowStatus(eq(request));
        verify(producer).push(eq("topic.create"), eq(request));
    }

    @Test
    void updateDocument_DeletesRemovedFilesAndPushes() {
        // existing document in DB has fileStores A and B
        DigitalizedDocument existing = DigitalizedDocument.builder()
                .documents(List.of(
                        Document.builder().fileStore("A").build(),
                        Document.builder().fileStore("B").build()
                ))
                .build();
        when(validator.validateDigitalizedDocument(any(DigitalizedDocument.class))).thenReturn(existing);
        when(config.getPleaDigitalizedDocumentUpdateTopic()).thenReturn("topic.update");

        // updated payload only has B and a new C => A should be deleted
        DigitalizedDocument updated = request.getDigitalizedDocument();
        updated.setDocuments(new ArrayList<>());
        updated.getDocuments().add(Document.builder().fileStore("B").build());
        updated.getDocuments().add(Document.builder().fileStore("C").build());

        DigitalizedDocument result = service.updateDocument(request);

        assertNotNull(result);
        verify(pleaEnrichment).enrichDocumentOnUpdate(eq(request));
        verify(workflowService).updateWorkflowStatus(eq(request));
        verify(fileStoreUtil, times(1)).deleteFilesByFileStore(eq(List.of("A")), eq("t1"));
        verify(producer).push(eq("topic.update"), eq(request));
    }
}
