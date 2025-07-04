package digit.service;

import digit.repository.BailRepository;
import digit.util.FileStoreUtil;
import digit.web.models.*;
import digit.enrichment.BailRegistrationEnrichment;
import digit.kafka.Producer;
import digit.config.Configuration;
import digit.validators.BailRegistrationValidator;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.function.BiConsumer;
import java.util.function.Function;
import java.util.stream.Collectors;

import static digit.config.ServiceConstants.*;

@Service
@Slf4j
public class BailService {
    private final BailRepository bailRepository;
    private final BailRegistrationEnrichment enrichmentUtil;
    private final Producer producer;
    private final Configuration config;
    private final WorkflowService workflowService;
    private final BailRegistrationValidator validator;
    private final FileStoreUtil fileStoreUtil;

    @Autowired
    public BailService(BailRepository bailRepository,
                      BailRegistrationEnrichment enrichmentUtil,
                      Producer producer,
                      Configuration config,
                      WorkflowService workflowService,
                      BailRegistrationValidator validator,
                       FileStoreUtil fileStoreUtil) {
        this.bailRepository = bailRepository;
        this.enrichmentUtil = enrichmentUtil;
        this.producer = producer;
        this.config = config;
        this.workflowService = workflowService;
        this.validator = validator;
        this.fileStoreUtil = fileStoreUtil;
    }

    public List<Bail> searchBail(BailSearchRequest request) {
        try {
            return bailRepository.getBails(request);
        } catch (CustomException e) {
            log.error("Custom Exception occurred while searching");
            throw e;
        } catch (Exception e) {
            log.error("Error while fetching search results");
            throw new CustomException(BAIL_SEARCH_EXCEPTION, e.getMessage());
        }
    }

    public Bail createBail(BailRequest body) {
        try {
            validator.validateBailRegistration(body);

            enrichmentUtil.enrichBailRegistration(body);

            workflowService.updateWorkflowStatus(body);

            producer.push(config.getBailCreateTopic(), body);

            //TODO:Implement Notification

            return body.getBail();
        } catch (CustomException e) {
            log.error("Custom Exception occurred while creating bail");
            throw e;
        } catch (Exception e) {
            log.error("Error occurred while creating bail");
            throw new CustomException(BAIL_CREATE_EXCEPTION, e.getMessage());
        }
    }

    public BailExists isBailExist(BailExistsRequest body) {
        try {
            BailExists order = body.getOrder();
            BailCriteria criteria = BailCriteria.builder()
                    .id(order.getId())
                    .caseId(order.getCaseId())
                    .tenantId(body.getRequestInfo().getUserInfo().getTenantId())
                    .build();
            Pagination pagination = Pagination.builder().limit(1.0).offSet(0.0).build();
            BailSearchRequest bailSearchRequest = BailSearchRequest.builder()
                    .criteria(List.of(criteria))
                    .pagination(pagination)
                    .build();
            List<Bail> bailList = bailRepository.getBails(bailSearchRequest);
            order.setExists(!bailList.isEmpty());
            return order;
        } catch (CustomException e) {
            log.error("Custom Exception occurred while verifying bail");
            throw e;
        } catch (Exception e) {
            log.error("Error occurred while verifying bail");
            throw new CustomException(BAIL_SEARCH_EXCEPTION, "Error occurred while searching bail: " + e.getMessage());
        }
    }

    public Bail updateBail(BailRequest bailRequest) {
        try {
            // Validate existence
            Bail bail = validator.validateBailExistence(bailRequest.getBail());

            // Update fields from the incoming request
            Bail incoming = bailRequest.getBail();
            updateBailFields(bail, incoming);

            bailRequest.setBail(bail);

            // Enrich application upon update
            enrichmentUtil.enrichBailBondUponUpdate(bailRequest);

            deleteFileStoreDocumentsIfInactive(bail);


            if (bail.getWorkflow() != null) {
                workflowService.updateWorkflowStatus(bailRequest);
            }


            producer.push(config.getBailUpdateTopic(), bailRequest);

            String updatedState = bailRequest.getBail().getStatus();


            //TODO:Implement Notification


             filterDocuments(Collections.singletonList(bail), Bail::getDocuments, Bail::setDocuments);

            return bailRequest.getBail();

        } catch (CustomException e) {
            log.error("Custom Exception occurred while updating bail");
            throw e;
        } catch (Exception e) {
            log.error("Error occurred while updating bail");
            throw new CustomException(BAIL_UPDATE_EXCEPTION, "Error occurred while updating bail: " + e.getMessage());
        }
    }

    private void updateBailFields(Bail bail, Bail incoming) {
        bail.setWorkflow(incoming.getWorkflow());
        bail.setStartDate(incoming.getStartDate());
        bail.setEndDate(incoming.getEndDate());
        bail.setBailAmount(incoming.getBailAmount());
        bail.setBailType(incoming.getBailType());
        bail.setStatus(incoming.getStatus());
        bail.setAccusedId(incoming.getAccusedId());
        bail.setAdvocateId(incoming.getAdvocateId());
        bail.setSuretyIds(incoming.getSuretyIds());
        bail.setDocuments(incoming.getDocuments());
        bail.setAdditionalDetails(incoming.getAdditionalDetails());
        bail.setIsActive(incoming.getIsActive() != null ? incoming.getIsActive() : bail.getIsActive());
    }

    private <T> void filterDocuments(List<T> entities,
                                     Function<T, List<Document>> getDocs,
                                     BiConsumer<T, List<Document>> setDocs) {
        if (entities == null) return;

        for (T entity : entities) {
            List<Document> docs = getDocs.apply(entity);
            if (docs != null) {
                List<Document> activeDocs = docs.stream()
                        .filter(Document::getIsActive)
                        .collect(Collectors.toList());
                setDocs.accept(entity, activeDocs); // set it back
            }
        }
    }

    private void deleteFileStoreDocumentsIfInactive(Bail bail) {

        if (bail.getDocuments() != null) {
            List<String> fileStoreIds = new ArrayList<>();
            for (Document document : bail.getDocuments()) {
                if (!document.getIsActive()) {
                    fileStoreIds.add(document.getFileStore());
                }
            }
            if (!fileStoreIds.isEmpty()) {
                fileStoreUtil.deleteFilesByFileStore(fileStoreIds, bail.getTenantId());
                log.info("Deleted files from file store with ids: {}", fileStoreIds);
            }
        }
    }


    // Implement callNotificationService and other helpers as needed
}
