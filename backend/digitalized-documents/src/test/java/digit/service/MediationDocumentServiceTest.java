package digit.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import digit.config.Configuration;
import digit.enrichment.MediationEnrichment;
import digit.kafka.Producer;
import digit.util.FileStoreUtil;
import digit.validators.MediationDocumentValidator;
import digit.web.models.*;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.Role;
import org.egov.common.contract.request.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.util.ObjectUtils;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class MediationDocumentServiceTest {

    @Mock private MediationDocumentValidator validator;
    @Mock private MediationEnrichment enrichment;
    @Mock private Producer producer;
    @Mock private Configuration config;
    @Mock private WorkflowService workflowService;
    @Mock private FileStoreUtil fileStoreUtil;
    @Mock private ObjectMapper objectMapper;

    @InjectMocks private MediationDocumentService service;

    private DigitalizedDocumentRequest request;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        // Ensure service can create additionalDetails ObjectNode safely
        when(objectMapper.createObjectNode()).thenReturn(new ObjectMapper().createObjectNode());
        WorkflowObject workflowObject = new WorkflowObject();
        workflowObject.setAction("CREATE");
        User user = User.builder().uuid("u1").roles(new ArrayList<>()).build();
        RequestInfo ri = RequestInfo.builder().userInfo(user).build();
        DigitalizedDocument document = DigitalizedDocument.builder()
                .type(TypeEnum.MEDIATION)
                .tenantId("t1")
                .courtId("court")
                .caseId("c1")
                .caseFilingNumber("cf1")
                .workflow(workflowObject)
                .mediationDetails(MediationDetails.builder().partyDetails(new ArrayList<>()).build())
                .build();
        request = DigitalizedDocumentRequest.builder().requestInfo(ri).digitalizedDocument(document).build();
    }

    @Test
    void createDocument_Success() {
        when(config.getMediationDigitalizedDocumentCreateTopic()).thenReturn("topic.create");

        DigitalizedDocument result = service.createDocument(request);

        assertNotNull(result);
        verify(validator).validateCreateMediationDocument(eq(result));
        verify(enrichment).enrichCreateMediationDocument(eq(request));
        verify(workflowService).updateWorkflowStatus(eq(request));
        verify(producer).push(eq("topic.create"), eq(request));
    }

    @Test
    void updateDocument_AssignsNextSigners_AndDeletesRemovedFiles() {
        when(config.getMediationDigitalizedDocumentUpdateTopic()).thenReturn("topic.update");
        // existing doc has A,B with tenant t1 to match the request's tenant for file deletion
        DigitalizedDocument existing = DigitalizedDocument.builder()
                .tenantId("t1")
                .documents(List.of(Document.builder().fileStore("A").build(), Document.builder().fileStore("B").build()))
                .build();
        when(validator.validateUpdateMediationDocument(any(DigitalizedDocument.class))).thenReturn(existing);

        // updated doc has B,C and party details where one not signed -> expect assignes set
        DigitalizedDocument updated = request.getDigitalizedDocument();
        updated.setDocuments(new ArrayList<>());
        updated.getDocuments().add(Document.builder().fileStore("B").build());
        updated.getDocuments().add(Document.builder().fileStore("C").build());
        WorkflowObject workflowObject = new WorkflowObject();
        workflowObject.setAction("E-SIGN");
        updated.setWorkflow(workflowObject);
        updated.setMediationDetails(MediationDetails.builder()
                .partyDetails(List.of(
                        MediationPartyDetails.builder().userUuid("p1").hasSigned(false).build(),
                        MediationPartyDetails.builder().userUuid("p2").hasSigned(true).build()
                ))
                .build());

        ArgumentCaptor<DigitalizedDocumentRequest> reqCaptor = ArgumentCaptor.forClass(DigitalizedDocumentRequest.class);

        DigitalizedDocument result = service.updateDocument(request);

        assertNotNull(result);
        verify(workflowService, atLeastOnce()).updateWorkflowStatus(reqCaptor.capture());
        List<DigitalizedDocumentRequest> captured = reqCaptor.getAllValues();
        // first workflow status call should have assignes set with only p1
        List<String> assignes = captured.get(0).getDigitalizedDocument().getWorkflow().getAssignes();
        assertNotNull(assignes);
        assertTrue(assignes.contains("p1"));
        assertTrue(assignes.contains("p2"));

        // file delete should remove only A
        verify(fileStoreUtil).deleteFilesByFileStore(eq(List.of("A")), eq("t1"));
        verify(producer).push(eq("topic.update"), eq(request));
    }

    @Test
    void updateDocument_WhenAllSigned_CompletesWorkflow() {
        when(config.getMediationDigitalizedDocumentUpdateTopic()).thenReturn("topic.update");
        DigitalizedDocument existing = DigitalizedDocument.builder().build();
        when(validator.validateUpdateMediationDocument(any(DigitalizedDocument.class))).thenReturn(existing);

        DigitalizedDocument updated = request.getDigitalizedDocument();
        WorkflowObject workflowObject = new WorkflowObject();
        workflowObject.setAction("E-SIGN");
        updated.setWorkflow(workflowObject);
        updated.setMediationDetails(MediationDetails.builder()
                .partyDetails(List.of(
                        MediationPartyDetails.builder().userUuid("p1").hasSigned(true).build(),
                        MediationPartyDetails.builder().userUuid("p2").hasSigned(true).build()
                ))
                .build());

        // capture calls to workflow service
        ArgumentCaptor<DigitalizedDocumentRequest> reqCaptor = ArgumentCaptor.forClass(DigitalizedDocumentRequest.class);

        service.updateDocument(request);

        verify(workflowService, atLeast(1)).updateWorkflowStatus(reqCaptor.capture());
        // After completion, workflow action should be E_SIGN_COMPLETE in the document set by service
        boolean completedFound = reqCaptor.getAllValues().stream()
                .anyMatch(r -> r.getDigitalizedDocument().getWorkflow() != null &&
                        "E-SIGN_COMPLETE".equals(r.getDigitalizedDocument().getWorkflow().getAction()));
        assertTrue(completedFound);
    }
}
