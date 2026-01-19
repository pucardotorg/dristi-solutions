package digit.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import digit.repository.DigitalizedDocumentRepository;
import digit.config.Configuration;
import digit.util.CipherUtil;
import digit.util.ESignUtil;
import digit.util.FileStoreUtil;
import digit.util.XmlRequestGenerator;
import digit.web.models.*;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.*;

import static digit.config.ServiceConstants.ATTRIBUTE;
import static digit.config.ServiceConstants.CERTIFICATE;
import static digit.config.ServiceConstants.COMMAND;
import static digit.config.ServiceConstants.CO_ORDINATES;
import static digit.config.ServiceConstants.CREATE_DIGITALIZED_DOCUMENT_FAILED;
import static digit.config.ServiceConstants.DATA;
import static digit.config.ServiceConstants.DATE_FORMAT;
import static digit.config.ServiceConstants.ESIGN_DATE_FORMAT;
import static digit.config.ServiceConstants.FILE;
import static digit.config.ServiceConstants.NAME;
import static digit.config.ServiceConstants.PAGE;
import static digit.config.ServiceConstants.PDF;
import static digit.config.ServiceConstants.PKI_NETWORK_SIGN;
import static digit.config.ServiceConstants.SIGN;
import static digit.config.ServiceConstants.SIZE;
import static digit.config.ServiceConstants.TIME_STAMP;
import static digit.config.ServiceConstants.TXN;
import static digit.config.ServiceConstants.TYPE;
import static digit.config.ServiceConstants.UPDATE_DIGITALIZED_DOCUMENT_FAILED;
import static digit.config.ServiceConstants.VALUE;

@Service
@Slf4j
public class DigitalizedDocumentService {

    private final DocumentTypeServiceFactory serviceFactory;
    private final ESignUtil eSignUtil;
    private final FileStoreUtil fileStoreUtil;
    private final CipherUtil cipherUtil;
    private final XmlRequestGenerator xmlRequestGenerator;
    private final DigitalizedDocumentRepository repository;
    private final ObjectMapper objectMapper;
    private final Configuration configuration;

    @Autowired
    public DigitalizedDocumentService(DocumentTypeServiceFactory serviceFactory,
                                      ESignUtil eSignUtil,
                                      FileStoreUtil fileStoreUtil,
                                      CipherUtil cipherUtil,
                                      XmlRequestGenerator xmlRequestGenerator,
                                      DigitalizedDocumentRepository repository,
                                      ObjectMapper objectMapper,
                                      Configuration configuration) {
        this.serviceFactory = serviceFactory;
        this.eSignUtil = eSignUtil;
        this.fileStoreUtil = fileStoreUtil;
        this.cipherUtil = cipherUtil;
        this.xmlRequestGenerator = xmlRequestGenerator;
        this.repository = repository;
        this.objectMapper = objectMapper;
        this.configuration = configuration;
    }

    public DigitalizedDocument createDigitalizedDocument(DigitalizedDocumentRequest digitalizedDocumentRequest) {
        try {

            log.info("operation = createDigitalizedDocument ,  result = IN_PROGRESS");

            DigitalizedDocument document = digitalizedDocumentRequest.getDigitalizedDocument();

            // Process document using appropriate service based on type
            log.info("Processing digitalized document with type: {}", document.getType());

            DocumentTypeService documentTypeService = serviceFactory.getService(document.getType());

            log.info("operation = createDigitalizedDocument ,  result = SUCCESS");

            return documentTypeService.createDocument(digitalizedDocumentRequest);
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error processing create digitalized document: {}", e.getMessage());
            throw new CustomException(CREATE_DIGITALIZED_DOCUMENT_FAILED, "Error while creating digitalized document : " + e.getMessage());
        }
    }

    public DigitalizedDocument updateDigitalizedDocument(DigitalizedDocumentRequest digitalizedDocumentRequest) {
        try {

            log.info("operation = updateDigitalizedDocument ,  result = IN_PROGRESS");

            DigitalizedDocument document = digitalizedDocumentRequest.getDigitalizedDocument();

            DocumentTypeService documentTypeService = serviceFactory.getService(document.getType());

            log.info("operation = updateDigitalizedDocument ,  result = SUCCESS");

            return documentTypeService.updateDocument(digitalizedDocumentRequest);
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error processing update digitalized document: {}", e.getMessage());
            throw new CustomException(UPDATE_DIGITALIZED_DOCUMENT_FAILED, "Error while updating digitalized document : " + e.getMessage());
        }
    }

    public List<DigitalizedDocument> searchDigitalizedDocument(DigitalizedDocumentSearchRequest digitalizedDocumentSearchRequest) {
        try {
            log.info("operation = searchDigitalizedDocument , result = IN_PROGRESS, request: {}", digitalizedDocumentSearchRequest);

            DigitalizedDocumentSearchCriteria criteria = digitalizedDocumentSearchRequest.getCriteria();
            Pagination pagination = digitalizedDocumentSearchRequest.getPagination();

            List<DigitalizedDocument> documents = repository.getDigitalizedDocuments(criteria, pagination);

            log.info("operation = searchDigitalizedDocument , result = SUCCESS, documents found: {}", documents.size());
            return documents;

        } catch (Exception e) {
            log.error("Error searching digitalized documents: {}", e.getMessage());
            throw new CustomException("DIGITALIZED_DOCUMENT_SEARCH_FAILED", "Error searching digitalized documents: " + e.getMessage());
        }
    }

    public List<DigitalizedDocumentToSign> getDigitalizedDocumentsToSign(DigitalizedDocumentsToSignRequest request) {
        log.info("Method=getDigitalizedDocumentsToSign, result= IN_PROGRESS, criteria:{}", request.getCriteria().size());

        List<CoordinateCriteria> coordinateCriteria = new ArrayList<>();
        Map<String, DigitalizedDocumentsCriteria> criteriaMap = new HashMap<>();

        request.getCriteria().forEach(criterion -> {
            CoordinateCriteria criteria = new CoordinateCriteria();
            criteria.setFileStoreId(criterion.getFileStoreId());
            criteria.setPlaceholder(criterion.getPlaceholder());
            criteria.setTenantId(criterion.getTenantId());
            coordinateCriteria.add(criteria);
            criteriaMap.put(criterion.getFileStoreId(), criterion);
        });

        CoordinateRequest coordinateRequest = CoordinateRequest.builder()
                .requestInfo(request.getRequestInfo())
                .criteria(coordinateCriteria).build();
        List<Coordinate> coordinateForSign = eSignUtil.getCoordinateForSign(coordinateRequest);

        if (coordinateForSign.isEmpty() || coordinateForSign.size() != request.getCriteria().size()) {
            throw new CustomException("COORDINATES_ERROR", "CoordinateResponse does not contain coordinates for some criteria");
        }

        List<DigitalizedDocumentToSign> documentsToSign = new ArrayList<>();
        for (Coordinate coordinate : coordinateForSign) {
            DigitalizedDocumentToSign documentToSign = new DigitalizedDocumentToSign();
            Resource resource;
            try {
                resource = fileStoreUtil.fetchFileStoreObjectById(coordinate.getFileStoreId(), coordinate.getTenantId());
            } catch (Exception e) {
                throw new CustomException("FILE_STORE_UTILITY_EXCEPTION", e.getMessage());
            }
            try {
                String base64Document = cipherUtil.encodePdfToBase64(resource);
                String coord = (int) Math.floor(coordinate.getX()) + "," + (int) Math.floor(coordinate.getY());
                String txnId = UUID.randomUUID().toString();
                String pageNo = String.valueOf(coordinate.getPageNumber());
                ZonedDateTime timestamp = ZonedDateTime.now(ZoneId.of("Asia/Kolkata"));

                String xmlRequest = generateRequest(base64Document, timestamp.toString(), txnId, coord, pageNo);
                DigitalizedDocumentsCriteria mapped = criteriaMap.get(coordinate.getFileStoreId());
                if (mapped == null) {
                    throw new CustomException("COORDINATES_ERROR", "No matching criteria for fileStoreId: " + coordinate.getFileStoreId());
                }
                String documentNumber = mapped.getDocumentNumber();
                documentToSign.setDocumentNumber(documentNumber);
                documentToSign.setRequest(xmlRequest);

                documentsToSign.add(documentToSign);
            } catch (Exception e) {
                log.error("Error while creating digitalized documents to sign: ", e);
                throw new CustomException("DOCUMENT_SIGN_ERROR", "Something went wrong while signing: " + e.getMessage());
            }
        }
        log.info("Method=getDigitalizedDocumentsToSign, result= SUCCESS, criteria:{}", request.getCriteria().size());
        return documentsToSign;
    }

    public List<DigitalizedDocument> updateSignedDigitalizedDocuments(UpdateSignedDigitalizedDocumentRequest request) {
        log.info("Method=updateSignedDigitalizedDocuments, result= IN_PROGRESS, signedDocuments:{}", request.getSignedDocuments().size());
        List<DigitalizedDocument> updatedDocuments = new ArrayList<>();

        for (SignedDigitalizedDocument signedDocument : request.getSignedDocuments()) {
            String documentNumber = signedDocument.getDocumentNumber();
            String signedDocumentData = signedDocument.getSignedDocumentData();
            Boolean isSigned = signedDocument.getSigned();
            String tenantId = signedDocument.getTenantId();

            if (isSigned) {
                try {
                    DigitalizedDocument document = repository.getDigitalizedDocumentByDocumentNumber(documentNumber, tenantId);

                    // Update document with signed PDF
                    MultipartFile multipartFile = cipherUtil.decodeBase64ToPdf(signedDocumentData, "signed_digitalized_document.pdf");
                    String fileStoreId = fileStoreUtil.storeFileInFileStore(multipartFile, tenantId);

                    List<Document> existingDocuments = document.getDocuments();
                    if (existingDocuments == null || existingDocuments.isEmpty()) {
                        throw new CustomException("DOCUMENT_UPDATE_ERROR", "No documents found in digitalized document");
                    }
                    Object documentAdditionalDetails = existingDocuments.get(0).getAdditionalDetails();
                    JsonNode documentAdditionalDetailsJsonNode = objectMapper.convertValue(documentAdditionalDetails, JsonNode.class);
                    String documentName = documentAdditionalDetailsJsonNode.path("name").asText();
                    if (documentName == null || documentName.trim().isEmpty()) {
                        log.error("Name not set for document {}", documentNumber);
                        documentName = "signed_digitalized_document.pdf";
                    }

                    // Create signed document
                    Document signedDoc = Document.builder()
                            .documentType("SIGNED_DIGITALIZED_DOCUMENT")
                            .fileStore(fileStoreId)
                            .isActive(true)
                            .additionalDetails(Map.of("name", documentName))
                            .build();

                    // Update document's documents list
                    List<Document> documents = new ArrayList<>();
                    documents.add(signedDoc);
                    document.setDocuments(documents);

                    // Update audit details
                    Long currentTime = System.currentTimeMillis();
                    document.getAuditDetails().setLastModifiedTime(currentTime);
                    document.getAuditDetails().setLastModifiedBy(request.getRequestInfo().getUserInfo().getUuid());

                    WorkflowObject workflowObject = new WorkflowObject();
                    workflowObject.setAction(SIGN);
                    document.setWorkflow(workflowObject);

                    // Save the updated document to database
                    DigitalizedDocumentRequest digitalizedDocumentRequest = DigitalizedDocumentRequest.builder()
                            .requestInfo(request.getRequestInfo())
                            .digitalizedDocument(document)
                            .build();
                    DigitalizedDocument updatedDoc = updateDigitalizedDocument(digitalizedDocumentRequest);
                    updatedDocuments.add(updatedDoc);

                    log.info("Method=updateSignedDigitalizedDocuments, result= SUCCESS, documentNumber:{}", documentNumber);

                } catch (Exception e) {
                    log.error("Error while updating signed digitalized document {}", documentNumber, e);
                    throw new CustomException("DOCUMENT_UPDATE_ERROR", "Error while updating signed document: " + e.getMessage());
                }
            }
        }
        return updatedDocuments;
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
        pdf.put(SIZE, configuration.getEsignSignatureWidth() + "," + configuration.getEsignSignatureHeight());
        pdf.put(DATE_FORMAT, ESIGN_DATE_FORMAT);
        requestData.put(PDF, pdf);

        requestData.put(DATA, base64Doc);

        String xmlRequest = xmlRequestGenerator.createXML("request", requestData);
        log.info("generating request, result= SUCCESS, timeStamp:{}, txnId:{}, coordination:{}, pageNumber:{}", timeStamp, txnId, coordination, pageNumber);

        return xmlRequest;
    }

    private Map<String, Object> createAttribute(String name, String value) {
        Map<String, Object> attribute = new LinkedHashMap<>();
        Map<String, String> attrData = new LinkedHashMap<>();
        attrData.put(NAME, name);
        attrData.put(VALUE, value);
        attribute.put(ATTRIBUTE, attrData);
        return attribute;
    }
}
