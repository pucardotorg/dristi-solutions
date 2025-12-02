package digit.service;

import digit.config.Configuration;
import digit.enrichment.DigitalizedDocumentEnrichment;
import digit.enrichment.PleaEnrichment;
import digit.kafka.Producer;
import digit.util.FileStoreUtil;
import digit.validators.PleaValidator;
import digit.web.models.DigitalizedDocument;
import digit.web.models.DigitalizedDocumentRequest;
import digit.web.models.Document;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for processing PLEA type documents
 */
@Service
@Slf4j
public class PleaDocumentService implements DocumentTypeService {

    private final PleaValidator validator;
    private final DigitalizedDocumentEnrichment enrichment;
    private final PleaEnrichment pleaEnrichment;
    private final WorkflowService workflowService;
    private final Producer producer;
    private final Configuration config;
    private final FileStoreUtil fileStoreUtil;

    public PleaDocumentService(PleaValidator validator, DigitalizedDocumentEnrichment enrichment, PleaEnrichment pleaEnrichment, WorkflowService workflowService, Producer producer, Configuration config, FileStoreUtil fileStoreUtil) {
        this.validator = validator;
        this.enrichment = enrichment;
        this.pleaEnrichment = pleaEnrichment;
        this.workflowService = workflowService;
        this.producer = producer;
        this.config = config;
        this.fileStoreUtil = fileStoreUtil;
    }

    @Override
    public DigitalizedDocument createDocument(DigitalizedDocumentRequest request) {

        enrichment.enrichDigitalizedDocument(request);

        pleaEnrichment.enrichDocumentOnCreation(request);

        workflowService.updateWorkflowStatus(request);

        producer.push(config.getPleaDigitalizedDocumentCreateTopic(), request);

        return request.getDigitalizedDocument();
    }

    @Override
    public DigitalizedDocument updateDocument(DigitalizedDocumentRequest request) {

       DigitalizedDocument existingDocument = validator.validateDigitalizedDocument(request.getDigitalizedDocument());

        pleaEnrichment.enrichDocumentOnUpdate(request);

        workflowService.updateWorkflowStatus(request);

        List<String> fileStoreIdsToDelete = extractInactiveFileStoreIds(request,existingDocument);

        if (!fileStoreIdsToDelete.isEmpty()) {
            fileStoreUtil.deleteFilesByFileStore(fileStoreIdsToDelete, request.getDigitalizedDocument().getTenantId());
            log.info("Deleted files for ids: {}", fileStoreIdsToDelete);
        }

        producer.push(config.getPleaDigitalizedDocumentUpdateTopic(), request);

        return request.getDigitalizedDocument();
    }

    public List<String> extractInactiveFileStoreIds(
            DigitalizedDocumentRequest digitalizedDocumentRequest,
            DigitalizedDocument existingDocument) {

        List<String> inactiveFileStoreIds = new ArrayList<>();

        DigitalizedDocument updatedDocument = digitalizedDocumentRequest.getDigitalizedDocument();

        // Collect filestoreIds present in updated document
        Set<String> updatedFileStores = new HashSet<>();
        if (updatedDocument.getDocuments() != null) {
            updatedDocument.getDocuments().stream()
                    .filter(Objects::nonNull)
                    .map(Document::getFileStore)
                    .filter(Objects::nonNull)
                    .forEach(updatedFileStores::add);
        }

        // Compare with existing document → extract filestores missing from updatedDocument
        if (existingDocument.getDocuments() != null) {
            existingDocument.getDocuments().stream()
                    .filter(Objects::nonNull)
                    .map(Document::getFileStore)
                    .filter(Objects::nonNull)
                    .filter(fs -> !updatedFileStores.contains(fs))   // filestore removed in updated payload
                    .forEach(inactiveFileStoreIds::add);
        }

        return inactiveFileStoreIds;
    }

}
