package digit.service;

import digit.repository.BailRepository;
import digit.util.*;
import digit.web.models.*;
import digit.enrichment.BailRegistrationEnrichment;
import digit.kafka.Producer;
import digit.config.Configuration;
import digit.validators.BailRegistrationValidator;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.*;
import java.util.function.BiConsumer;
import java.util.function.Function;
import java.util.stream.Collectors;

import static digit.config.ServiceConstants.*;
import static org.postgresql.jdbc.EscapedFunctions.SIGN;

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
    private final CipherUtil cipherUtil;
    private final Configuration configuration;
    private final ESignUtil eSignUtil;
    private final XmlRequestGenerator xmlRequestGenerator;
    private final SuretyUtil suretyUtil;

    @Autowired
    public BailService(BailRepository bailRepository,
                      BailRegistrationEnrichment enrichmentUtil,
                      Producer producer,
                      Configuration config,
                      WorkflowService workflowService,
                      BailRegistrationValidator validator,
                       FileStoreUtil fileStoreUtil,
                       CipherUtil cipherUtil,
                       Configuration configuration,
                       ESignUtil eSignUtil,
                       XmlRequestGenerator xmlRequestGenerator,
                       SuretyUtil suretyUtil) {
        this.bailRepository = bailRepository;
        this.enrichmentUtil = enrichmentUtil;
        this.producer = producer;
        this.config = config;
        this.workflowService = workflowService;
        this.validator = validator;
        this.fileStoreUtil = fileStoreUtil;
        this.cipherUtil = cipherUtil;
        this.configuration = configuration;
        this.eSignUtil = eSignUtil;
        this.xmlRequestGenerator = xmlRequestGenerator;
        this.suretyUtil = suretyUtil;
    }

    public List<Bail> searchBail(BailSearchRequest request) {
        try {
            if (request == null) {
                throw new CustomException(BAIL_SEARCH_EXCEPTION, "Search request cannot be null");
            }
            return bailRepository.getBails(request);
        }  catch (Exception e) {
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
        bail.setIsActive(incoming.getIsActive() != null ? incoming.getIsActive() : bail.getIsActive());
        bail.setLitigantId(incoming.getLitigantId());
        bail.setLitigantName(incoming.getLitigantName());
        bail.setLitigantFatherName(incoming.getLitigantFatherName());
        bail.setLitigantSigned(incoming.getLitigantSigned());
        bail.setSureties(incoming.getSureties());
        bail.setShortenedURL(incoming.getShortenedURL());
        bail.setDocuments(incoming.getDocuments());
        bail.setAdditionalDetails(incoming.getAdditionalDetails());
        bail.setCourtId(incoming.getCourtId());
        bail.setCaseTitle(incoming.getCaseTitle());
        bail.setCnrNumber(incoming.getCnrNumber());
        bail.setFilingNumber(incoming.getFilingNumber());
        bail.setCaseType(incoming.getCaseType());
        bail.setBailId(incoming.getBailId());
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

    public List<BailToSign> createBailToSignRequest(BailsToSignRequest request) {
        log.info("creating bail to sign request, result= IN_PROGRESS, bailCriteria:{}", request.getCriteria().size());

        List<CoordinateCriteria> coordinateCriteria = new ArrayList<>();
        Map<String, BailsCriteria> bailsCriteriaMap = new HashMap<>();

        request.getCriteria().forEach(criterion -> {
            CoordinateCriteria criteria = new CoordinateCriteria();
            criteria.setFileStoreId(criterion.getFileStoreId());
            criteria.setPlaceholder(criterion.getPlaceholder());
            criteria.setTenantId(criterion.getTenantId());
            coordinateCriteria.add(criteria);
            bailsCriteriaMap.put(criterion.getFileStoreId(), criterion);
        });

        CoordinateRequest coordinateRequest = CoordinateRequest.builder()
                .requestInfo(request.getRequestInfo())
                .criteria(coordinateCriteria).build();
        List<Coordinate> coordinateForSign = eSignUtil.getCoordinateForSign(coordinateRequest);

        if (coordinateForSign.isEmpty() || coordinateForSign.size() != request.getCriteria().size()) {
            throw new CustomException(COORDINATES_ERROR, "error in co-ordinates");
        }

        List<BailToSign> bailToSign = new ArrayList<>();
        for (Coordinate coordinate : coordinateForSign) {
            BailToSign bail = new BailToSign();
            Resource resource = null;
            try {
                resource = fileStoreUtil.fetchFileStoreObjectById(coordinate.getFileStoreId(), coordinate.getTenantId());
            } catch (Exception e) {
                throw new CustomException(FILE_STORE_UTILITY_EXCEPTION, "something went wrong while signing");
            }
            try {
                String base64Document = cipherUtil.encodePdfToBase64(resource);
                String coord = (int) Math.floor(coordinate.getX()) + "," + (int) Math.floor(coordinate.getY());
                String txnId = UUID.randomUUID().toString();
                String pageNo = String.valueOf(coordinate.getPageNumber());
                ZonedDateTime timestamp = ZonedDateTime.now(ZoneId.of(configuration.getZoneId()));

                String xmlRequest = generateRequest(base64Document, timestamp.toString(), txnId, coord, pageNo);
                String bailId = bailsCriteriaMap.get(coordinate.getFileStoreId()).getBailId();
                bail.setBailId(bailId);
                bail.setRequest(xmlRequest);

                bailToSign.add(bail);
            } catch (Exception e) {
                throw new CustomException(BAIL_SIGN_ERROR, "something went wrong while signing");
            }
        }
        log.info("creating bail to sign request, result= SUCCESS, bailCriteria:{}", request.getCriteria().size());
        return bailToSign;
    }

    private String generateRequest(String base64Doc, String timeStamp, String txnId, String coordination, String pageNumber) {
        log.info("generating request, result= IN_PROGRESS, timeStamp:{}, txnId:{}, coordination:{}, pageNumber:{}", timeStamp, txnId, coordination, pageNumber);
        Map<String, Object> requestData = new LinkedHashMap<>();

        requestData.put(COMMAND, PKI_NETWORK_SIGN);
        requestData.put(TIME_STAMP, timeStamp);
        requestData.put(TXN, txnId);

        List<Map<String, Object>> certificateAttributes = new ArrayList<>();
        certificateAttributes.add(createAttribute("CN", ""));
        certificateAttributes.add(createAttribute("O", ""));
        certificateAttributes.add(createAttribute("OU", ""));
        certificateAttributes.add(createAttribute("T", ""));
        certificateAttributes.add(createAttribute("E", ""));
        certificateAttributes.add(createAttribute("SN", ""));
        certificateAttributes.add(createAttribute("CA", ""));
        certificateAttributes.add(createAttribute("TC", "SG"));
        certificateAttributes.add(createAttribute("AP", "1"));
        requestData.put(CERTIFICATE, certificateAttributes);

        Map<String, Object> file = new LinkedHashMap<>();
        file.put(ATTRIBUTE, Map.of(NAME, TYPE, VALUE, PDF));
        requestData.put(FILE, file);

        Map<String, Object> pdf = new LinkedHashMap<>();
        pdf.put(PAGE, pageNumber);
        pdf.put(CO_ORDINATES, coordination);
        pdf.put(SIZE, "150,100");
        requestData.put(PDF, pdf);

        requestData.put(DATA, base64Doc);

        String xmlRequest = xmlRequestGenerator.createXML("request", requestData);
        log.info("generating request, result= SUCCESS, timeStamp:{}, txnId:{}, coordination:{}, pageNumber:{}", timeStamp, txnId, coordination, pageNumber);

        return xmlRequest;
    }

    public List<Bail> updateBailWithSignDoc(@Valid UpdateSignedBailRequest request) {
        List<Bail> updatedBails = new ArrayList<>();
        for (SignedBail signedBail : request.getSignedBails()) {
            String bailId = signedBail.getBailId();
            String signedBailData = signedBail.getSignedBailData();
            Boolean isSigned = signedBail.getSigned();
            String tenantId = signedBail.getTenantId();

            if (isSigned) {
                try {
                    // Fetch the bail
                    BailCriteria criteria = BailCriteria.builder()
                            .bailId(bailId)
                            .tenantId(tenantId).build();
                    Pagination pagination = Pagination.builder().limit(10.0).offSet(0.0).build();
                    BailSearchRequest bailSearchRequest = BailSearchRequest.builder()
                            .criteria(List.of(criteria))
                            .pagination(pagination)
                            .build();
                    List<Bail> bailList = bailRepository.getBails(bailSearchRequest);

                    if (bailList.isEmpty()) {
                        throw new CustomException(EMPTY_BAILS_ERROR, "empty bails found for the given criteria");
                    }
                    Bail bail = bailList.get(0);

                    // Update document with signed PDF
                    String pdfName = "BailBond.pdf";
                    MultipartFile multipartFile = cipherUtil.decodeBase64ToPdf(signedBailData, pdfName);
                    String fileStoreId = fileStoreUtil.storeFileInFileStore(multipartFile, tenantId);

                    bail.getDocuments().stream()
                            .filter(document -> document.getDocumentType().equals(UNSIGNED))
                            .findFirst()
                            .ifPresent(document -> {
                                document.setFileStore(fileStoreId);
                                document.setDocumentType(SIGNED);
                                document.setAdditionalDetails(Map.of(NAME, pdfName));
                            });
                    //ToDo: We need to check if surety needs to be created here
                    if (bail.getSureties() != null) {
                        for (Surety surety : bail.getSureties()) {
                            try {
                                suretyUtil.createSurety(surety, request.getRequestInfo());
                            } catch (Exception e) {
                                log.error("Error while creating surety for bailNumber: {}", bailId, e);
                            }
                        }
                    }

                    // Set workflow action to SIGN and update bail
                    WorkflowObject workflowObject = new WorkflowObject();
                    workflowObject.setAction(SIGN);
                    bail.setWorkflow(workflowObject);

                    BailRequest bailUpdateRequest = BailRequest.builder()
                            .bail(bail)
                            .requestInfo(request.getRequestInfo())
                            .build();

                    updateBail(bailUpdateRequest);

                    updatedBails.add(bail);

                } catch (Exception e) {
                    log.error("Error while updating bail, bailNumber:{}", bailId);
                    log.error("Error : ", e);
                    throw new CustomException(BAILS_BULK_SIGN_EXCEPTION, "Error while updating bail: " + e.getMessage());
                }
            }
        }
        return updatedBails;
    }


    private Map<String, Object> createAttribute(String name, String value) {
        Map<String, Object> attribute = new LinkedHashMap<>();
        Map<String, String> attrData = new LinkedHashMap<>();
        attrData.put(NAME, name);
        attrData.put(VALUE, value);
        attribute.put(ATTRIBUTE, attrData);
        return attribute;
    }


    // Implement callNotificationService and other helpers as needed
}
