package digit.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import digit.config.Configuration;
import digit.enrichment.BailRegistrationEnrichment;
import digit.kafka.Producer;
import digit.repository.BailRepository;
import digit.util.CaseUtil;
import digit.util.EncryptionDecryptionUtil;
import digit.util.FileStoreUtil;
import digit.util.IndexerUtils;
import digit.validator.BailValidator;
import digit.web.models.*;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.ObjectUtils;

import java.util.*;

import static digit.config.ServiceConstants.*;

@Service
@Slf4j
public class BailService {

    private final BailValidator validator;
    private final BailRegistrationEnrichment enrichmentUtil;
    private final Producer producer;
    private final Configuration config;
    private final WorkflowService workflowService;
    private final BailRepository bailRepository;
    private final EncryptionDecryptionUtil encryptionDecryptionUtil;
    private final ObjectMapper objectMapper;
    private final FileStoreUtil fileStoreUtil;
    private final IndexerUtils indexerUtils;

    @Autowired
    public BailService(BailValidator validator, BailRegistrationEnrichment enrichmentUtil, Producer producer, Configuration config, WorkflowService workflowService, BailRepository bailRepository, EncryptionDecryptionUtil encryptionDecryptionUtil, ObjectMapper objectMapper, IndexerUtils indexerUtils, FileStoreUtil fileStoreUtil) {
        this.validator = validator;
        this.enrichmentUtil = enrichmentUtil;
        this.producer = producer;
        this.config = config;
        this.workflowService = workflowService;
        this.bailRepository = bailRepository;
        this.encryptionDecryptionUtil = encryptionDecryptionUtil;
        this.objectMapper = objectMapper;
        this.indexerUtils = indexerUtils;
        this.fileStoreUtil = fileStoreUtil;
    }


    // add document comment and logs
    public Bail createBail(BailRequest bailRequest) {

        // Validation
        validator.validateBailRegistration(bailRequest);

        // Enrichment
        enrichmentUtil.enrichBailOnCreation(bailRequest);

        // Workflow update
        if(!ObjectUtils.isEmpty(bailRequest.getBail().getWorkflow())){
            workflowService.updateWorkflowStatus(bailRequest);
        }

        Bail originalBail = bailRequest.getBail();

        Bail encryptedBail = encryptionDecryptionUtil.encryptObject(originalBail, config.getBailEncrypt(), Bail.class);
        bailRequest.setBail(encryptedBail);

        producer.push(config.getBailCreateTopic(), bailRequest);

        return originalBail;
    }

    private Set<String> getFilestoreToDelete(BailRequest bailRequest, Bail existingBail) {
        Set<String> fileStoreToDeleteIds = new HashSet<>();

        Set<String> newFileStoreIds = new HashSet<>();
        Set<String> existingFileStoreIds = new HashSet<>();

        // Collect all existing filestore IDs from DB
        if (existingBail.getDocuments() != null) {
            for (Document document : existingBail.getDocuments()) {
                existingFileStoreIds.add(document.getFileStore());
            }
        }
        if (existingBail.getSureties() != null) {
            for (Surety surety : existingBail.getSureties()) {
                if (surety.getDocuments() != null) {
                    for (Document document : surety.getDocuments()) {
                        existingFileStoreIds.add(document.getFileStore());
                    }
                }
            }
        }

        // Collect all new filestore IDs from request
        if (bailRequest.getBail().getDocuments() != null) {
            for (Document document : bailRequest.getBail().getDocuments()) {
                newFileStoreIds.add(document.getFileStore());

                // mark for deletion if isActive=false
                if (!document.getIsActive()) {
                    fileStoreToDeleteIds.add(document.getFileStore());
                }
            }
        }
        if (bailRequest.getBail().getSureties() != null) {
            for (Surety surety : bailRequest.getBail().getSureties()) {
                if (surety.getDocuments() != null) {
                    for (Document document : surety.getDocuments()) {
                        newFileStoreIds.add(document.getFileStore());

                        // mark for deletion if isActive=false
                        if (!document.getIsActive()) {
                            fileStoreToDeleteIds.add(document.getFileStore());
                        }
                    }
                }
            }
        }

        // Add the ones that existed before but are no longer present in the new request
        for (String oldFilestore : existingFileStoreIds) {
            if (!newFileStoreIds.contains(oldFilestore)) {
                fileStoreToDeleteIds.add(oldFilestore);
            }
        }

        return fileStoreToDeleteIds;
    }


    public Bail updateBail(BailRequest bailRequest) {

        // Check if bail exists
        Bail existingBail = validator.validateBailExists(bailRequest);

        // Enrich new documents or sureties if any
        enrichmentUtil.enrichBailUponUpdate(bailRequest);

        Boolean lastSigned = checkItsLastSign(bailRequest);
        if(!ObjectUtils.isEmpty(bailRequest.getBail().getWorkflow())){
            workflowService.updateWorkflowStatus(bailRequest);
        }
        try {
            if (lastSigned) {
                log.info("Updating Bail Workflow");
                WorkflowObject workflowObject = new WorkflowObject();
                workflowObject.setAction(E_SIGN_COMPLETE);

                bailRequest.getBail().setWorkflow(workflowObject);
                workflowService.updateWorkflowStatus(bailRequest);
            }
        } catch (Exception e) {
            log.error("Error updating bail workflow", e);
            throw new CustomException(WORKFLOW_SERVICE_EXCEPTION, e.getMessage());
        }

        Set<String> fileStoreToDeleteIds = getFilestoreToDelete(bailRequest,existingBail);

        if(!fileStoreToDeleteIds.isEmpty()){
            fileStoreUtil.deleteFilesByFileStore(fileStoreToDeleteIds, bailRequest.getBail().getTenantId());
            log.info("Deleted files from file store: {}", fileStoreToDeleteIds);
        }

        Bail originalBail = bailRequest.getBail();

        Bail encryptedBail = encryptionDecryptionUtil.encryptObject(originalBail, config.getBailEncrypt(), Bail.class);
        bailRequest.setBail(encryptedBail);

        insertBailIndexEntry(bailRequest);

        producer.push(config.getBailUpdateTopic(), bailRequest);

        return originalBail;
    }

    private Boolean checkItsLastSign(BailRequest bailRequest) {

        Bail bail = bailRequest.getBail();
        WorkflowObject workflow = bail.getWorkflow();
        if (workflow == null || !E_SIGN.equalsIgnoreCase(workflow.getAction())) {
            return false;
        }
        if (!Boolean.TRUE.equals(bail.getLitigantSigned())) {
            log.info("Litigant has not signed");
            return false;
        }
        boolean allSuretiesSigned = false;
        if (!ObjectUtils.isEmpty(bailRequest.getBail().getSureties())) {
            allSuretiesSigned = bailRequest.getBail().getSureties().stream()
                    .allMatch(Surety::getHasSigned);
        }
        if (!allSuretiesSigned) {
            log.info("Some sureties have not signed");
            return false;
        }
        log.info("All sureties and litigant have signed");
        return true;
    }

    public List<Bail> searchBail(BailSearchRequest bailSearchRequest) {
        try {
            log.info("Starting bail search with parameters :: {}", bailSearchRequest);

            if(bailSearchRequest.getCriteria()!=null && bailSearchRequest.getCriteria().getSuretyMobileNumber() != null) {
                bailSearchRequest.setCriteria(encryptionDecryptionUtil.encryptObject(bailSearchRequest.getCriteria(), "BailSearch", BailSearchCriteria.class));
            }

            List<Bail> bailList = bailRepository.getBails(bailSearchRequest);
            List<Bail> decryptedBailList = new ArrayList<>();
            bailList.forEach(bail -> {
                decryptedBailList.add(encryptionDecryptionUtil.decryptObject(bail, config.getBailDecrypt(), Bail.class, bailSearchRequest.getRequestInfo()));
            });
            return decryptedBailList;

        } catch (Exception e) {
            log.error("Error while fetching to search results {}", e.toString());
            throw new CustomException("BAIL_SEARCH_ERR", e.getMessage());
        }
    }

    public void insertBailIndexEntry(BailRequest bailRequest) {
        try {
            Bail bail = bailRequest.getBail();
            if (bail != null) {
                log.info("Inserting Bail entry in bail-bond-index (inbox): {}", bailRequest);
                String bulkRequest = indexerUtils.buildPayload(bail);
                if (!bulkRequest.isEmpty()) {
                    String uri = config.getEsHostUrl() + config.getBulkPath();
                    indexerUtils.esPostManual(uri, bulkRequest);
                }
            }
        } catch (CustomException e) {
            log.error("Custom Exception occurred while inserting bail index entry");
            throw e;
        } catch (Exception e) {
            log.error("Error occurred while inserting bail index entry");
            throw new CustomException(BAIL_BOND_INDEX_EXCEPTION, e.getMessage());
        }
    }

}
