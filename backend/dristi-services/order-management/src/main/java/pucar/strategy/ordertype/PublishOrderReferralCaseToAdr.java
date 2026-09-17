package pucar.strategy.ordertype;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import pucar.config.Configuration;
import pucar.service.FileStoreService;
import pucar.strategy.OrderUpdateStrategy;
import pucar.util.DigitalizedDocumentUtil;
import pucar.util.MdmsV2Util;
import pucar.util.PdfServiceUtil;
import pucar.util.JsonUtil;
import pucar.web.models.Order;
import pucar.web.models.OrderRequest;
import pucar.web.models.WorkflowObject;
import pucar.web.models.adiary.CaseDiaryEntry;
import pucar.web.models.digitalizeddocument.*;

import java.util.*;
import static pucar.config.ServiceConstants.*;

@Component
@Slf4j
public class PublishOrderReferralCaseToAdr implements OrderUpdateStrategy {

    private final DigitalizedDocumentUtil digitalizedDocumentUtil;
    private final ObjectMapper objectMapper;
    private final Configuration configuration;
    private final PdfServiceUtil pdfServiceUtil;
    private final FileStoreService fileStoreService;
    private final JsonUtil jsonUtil;
    private final MdmsV2Util mdmsV2Util;

    @Autowired
    public PublishOrderReferralCaseToAdr(DigitalizedDocumentUtil digitalizedDocumentUtil, ObjectMapper objectMapper, Configuration configuration, PdfServiceUtil pdfServiceUtil, FileStoreService fileStoreService, JsonUtil jsonUtil, MdmsV2Util mdmsV2Util) {
        this.digitalizedDocumentUtil = digitalizedDocumentUtil;
        this.objectMapper = objectMapper;
        this.configuration = configuration;
        this.pdfServiceUtil = pdfServiceUtil;
        this.fileStoreService = fileStoreService;
        this.jsonUtil = jsonUtil;
        this.mdmsV2Util = mdmsV2Util;
    }

    @Override
    public boolean supportsPreProcessing(OrderRequest orderRequest) {
        Order order = orderRequest.getOrder();
        String action = order.getWorkflow().getAction();
        return order.getOrderType() != null && SAVE_DRAFT.equalsIgnoreCase(action) && REFERRAL_CASE_TO_ADR.equalsIgnoreCase(order.getOrderType());
    }

    @Override
    public boolean supportsPostProcessing(OrderRequest orderRequest) {
        return false;
    }

    @Override
    public boolean supportsCommon(OrderRequest orderRequest) {
        return false;
    }

    @Override
    public CaseDiaryEntry execute(OrderRequest request) {
        return null;
    }

    @Override
    public OrderRequest preProcess(OrderRequest orderRequest) {
        Order order = orderRequest.getOrder();
        RequestInfo requestInfo = orderRequest.getRequestInfo();
        Object orderDetails = order.getOrderDetails();

        log.info("Pre-processing ADR order, orderNumber: {}", order.getOrderNumber());

        try {
            JsonNode adrDetails = objectMapper.convertValue(orderDetails, JsonNode.class);

            // Check if isRequired is true
            JsonNode isMediationChanged = adrDetails.get("isMediationChanged");
            if (isMediationChanged == null || !isMediationChanged.asBoolean()) {
                log.info("isRequired is false or null, skipping digitalized document processing");
                return null;
            }

            log.info("isRequired is true, processing digitalized document");

            // Search for existing digitalized document by orderNumber
            DigitalizedDocumentSearchCriteria criteria = DigitalizedDocumentSearchCriteria.builder()
                    .orderNumber(order.getOrderNumber())
                    .tenantId(order.getTenantId())
                    .courtId(order.getCourtId())
                    .type(TypeEnum.MEDIATION)
                    .build();

            DigitalizedDocumentSearchRequest searchRequest = DigitalizedDocumentSearchRequest.builder()
                    .requestInfo(requestInfo)
                    .criteria(criteria)
                    .build();

            List<DigitalizedDocument> existingDocuments = digitalizedDocumentUtil.searchDigitalizedDocuments(searchRequest);

            String action = adrDetails.has("modeOfSigning") ? adrDetails.get("modeOfSigning").textValue() : null;
            String caseNumber = adrDetails.has("caseNumber") ? adrDetails.get("caseNumber").textValue() : null;

            MediationDetails mediationDetails = buildMediationDetails(adrDetails);

            WorkflowObject workflowObject = new WorkflowObject();
            workflowObject.setAction(action);

            // Fetch court details from MDMS
            Map<String, String> courtDetails = mdmsV2Util.fetchCourtDetails(requestInfo, order.getTenantId(), order.getCourtId());
            String courtName = courtDetails.getOrDefault("courtName", configuration.getCourtName());
            String place = courtDetails.getOrDefault("place", configuration.getPlace());
            String state = courtDetails.getOrDefault("state", configuration.getState());

            if (existingDocuments != null && !existingDocuments.isEmpty()) {
                // Update existing document
                log.info("Found existing digitalized document with id: {}, updating...", existingDocuments.get(0).getDocumentNumber());
                DigitalizedDocument existingDoc = existingDocuments.get(0);
                existingDoc.setMediationDetails(mediationDetails);
                existingDoc.setWorkflow(workflowObject);
                existingDoc.setCaseNumber(caseNumber);
                existingDoc.setCourtName(courtName);
                existingDoc.setPlace(place);
                existingDoc.setState(state);

                DigitalizedDocumentRequest updateRequest = DigitalizedDocumentRequest.builder()
                        .requestInfo(requestInfo)
                        .digitalizedDocument(existingDoc)
                        .build();

                log.info("Generating PDF for updating digitalized document {}", existingDoc.getDocumentNumber());
                generateAndUploadPdf(updateRequest);

                DigitalizedDocument digitalizedDocument = digitalizedDocumentUtil.updateDigitalizedDocument(updateRequest);
                log.info("Updated digitalized document successfully {} : ", digitalizedDocument.getDocumentNumber());
            } else {
                // Create new document
                log.info("No existing digitalized document found, creating new...");

                // Extract caseNumber from adrDetails
                String caseId = adrDetails.has("caseId") ? adrDetails.get("caseId").textValue() : null;

                DigitalizedDocument newDocument = DigitalizedDocument.builder()
                        .type(TypeEnum.MEDIATION)
                        .caseId(caseId)
                        .caseFilingNumber(order.getFilingNumber())
                        .orderNumber(order.getOrderNumber())
                        .orderItemId(getItemId(order))
                        .tenantId(order.getTenantId())
                        .courtName(courtName)
                        .caseNumber(caseNumber)
                        .place(place)
                        .state(state)
                        .courtId(order.getCourtId())
                        .mediationDetails(mediationDetails)
                        .workflow(workflowObject)
                        .build();

                DigitalizedDocumentRequest createRequest = DigitalizedDocumentRequest.builder()
                        .requestInfo(requestInfo)
                        .digitalizedDocument(newDocument)
                        .build();

                log.info("Generating PDF for creating digitalized document {}", newDocument.getDocumentNumber());
                generateAndUploadPdf(createRequest);

                DigitalizedDocument digitalizedDocument = digitalizedDocumentUtil.createDigitalizedDocument(createRequest);
                log.info("Created digitalized document successfully {} : ", digitalizedDocument.getDocumentNumber());
            }

        } catch (Exception e) {
            log.error("Error processing digitalized document for ADR order", e);
            throw new RuntimeException("Error processing digitalized document: " + e.getMessage(), e);
        }

        return null;
    }

    private String getItemId(Order order) {
        if(COMPOSITE.equalsIgnoreCase(order.getOrderCategory())){
            return jsonUtil.getNestedValue(order.getAdditionalDetails(), List.of("itemId"), String.class);
        }
        return null;
    }

    /**
     * Generates PDF, uploads to filestore, and attaches as document to the digitalized document
     *
     * @param request The digitalized document request
     */
    private void generateAndUploadPdf(DigitalizedDocumentRequest request) {
        try {
            DigitalizedDocument digitalizedDocument = request.getDigitalizedDocument();

            // Generate PDF
            byte[] pdfBytes = generatePdf(request);

            // Upload to filestore
            String fileStoreId = fileStoreService.upload(
                    pdfBytes,
                    "mediation_document.pdf",
                    "application/pdf",
                    digitalizedDocument.getTenantId()
            );

            if (fileStoreId == null || fileStoreId.isEmpty()) {
                log.error("File upload failed: fileStoreId is null or empty");
                throw new RuntimeException("Failed to upload PDF to filestore");
            }

            // Create document object
            Document document = Document.builder()
                    .id(UUID.randomUUID().toString())
                    .isActive(true)
                    .fileStore(fileStoreId)
                    .additionalDetails(Map.of("name", "Mediation.pdf"))
                    .build();

            // Attach document to digitalized document
            List<Document> documents = new ArrayList<>();
            documents.add(document);
            digitalizedDocument.setDocuments(documents);

            log.info("PDF generated and uploaded successfully, fileStoreId: {}", fileStoreId);
        } catch (Exception e) {
            log.error("Error generating and uploading PDF for digitalized document", e);
            throw new RuntimeException("Error generating and uploading PDF: " + e.getMessage(), e);
        }
    }

    private byte[] generatePdf(DigitalizedDocumentRequest updateRequest) {
        try {
            log.info("Generating PDF for digitalized document");
            byte[] pdfBytes = pdfServiceUtil.generatePdf(
                    updateRequest,
                    updateRequest.getDigitalizedDocument().getTenantId(),
                    configuration.getPdfDigitisationMediationTemplateKey()
            );

            if (pdfBytes == null || pdfBytes.length == 0) {
                log.error("PDF generation failed or returned empty content");
                throw new RuntimeException("Failed to generate PDF: empty response from PDF service");
            }

            log.info("PDF generated successfully, size: {} bytes", pdfBytes.length);
            return pdfBytes;
        } catch (Exception e) {
            log.error("Error generating PDF for digitalized document", e);
            throw new RuntimeException("Error generating PDF: " + e.getMessage(), e);
        }
    }

    /**
     * Builds MediationDetails from orderDetails JsonNode
     */
    private MediationDetails buildMediationDetails(JsonNode adrDetails) {
        List<MediationPartyDetails> partyDetailsList = new ArrayList<>();

        JsonNode partiesNode = adrDetails.path("parties");
        if (partiesNode.isArray()) {
            for (JsonNode party : partiesNode) {
                MediationPartyDetails partyDetail = MediationPartyDetails.builder()
                        .partyType(parsePartyType(party))
                        .uniqueId(getTextValue(party, "uniqueId"))
                        .userUuid(getTextValue(party, "userUuid"))
                        .poaUuid(getTextValue(party, "poaUuid"))
                        .mobileNumber(getTextValue(party, "mobileNumber"))
                        .partyName(getTextValue(party, "partyName"))
                        .partyIndex(getIntValue(party))
                        .hasSigned(party.path("hasSigned").asBoolean(false))
                        .counselName(party.path("counselName").asText())
                        .build();
                partyDetailsList.add(partyDetail);
            }
        }

        Long hearingDate = adrDetails.hasNonNull("hearingDate")
                ? adrDetails.get("hearingDate").asLong()
                : null;

        String mediationCentre = adrDetails.hasNonNull("mediationCentre")
                ? adrDetails.get("mediationCentre").asText()
                : null;

        Long dateOfInstitution = adrDetails.hasNonNull("dateOfInstitution")
                ? adrDetails.get("dateOfInstitution").asLong()
                : null;

        String caseStage = adrDetails.hasNonNull("caseStage")
                ? adrDetails.get("caseStage").asText()
                : null;

        Long dateOfEndADR = adrDetails.hasNonNull("dateOfEndADR")
                ? adrDetails.get("dateOfEndADR").asLong()
                : null;

        return MediationDetails.builder()
                .hearingDate(hearingDate)
                .pdfCreatedDate(System.currentTimeMillis())
                .mediationCentre(mediationCentre)
                .dateOfInstitution(dateOfInstitution)
                .dateOfEndADR(dateOfEndADR)
                .natureOfComplainant(configuration.getNatureOfComplainant())
                .caseStage(caseStage)
                .partyDetails(partyDetailsList.isEmpty() ? null : partyDetailsList)
                .build();
    }

    private String getTextValue(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.get(field).asText() : null;
    }

    private Integer getIntValue(JsonNode node) {
        return node.hasNonNull("partyIndex") ? node.get("partyIndex").asInt() : null;
    }

    private PartyTypeEnum parsePartyType(JsonNode node) {
        if (!node.hasNonNull("partyType")) {
            return null;
        }
        try {
            return PartyTypeEnum.valueOf(node.get("partyType").asText().trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            log.error("Invalid partyType value: {}", node.get("partyType").asText());
            return null;
        }
    }

    @Override
    public OrderRequest postProcess(OrderRequest orderRequest) {
        return null;
    }
}
