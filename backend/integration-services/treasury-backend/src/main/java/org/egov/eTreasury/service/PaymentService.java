package org.egov.eTreasury.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;
import org.egov.common.contract.models.Document;
import org.egov.common.contract.request.RequestInfo;
import org.egov.eTreasury.config.PaymentConfiguration;
import org.egov.eTreasury.enrichment.TreasuryEnrichment;
import org.egov.eTreasury.kafka.Producer;
import org.egov.eTreasury.model.demand.*;
import org.egov.eTreasury.repository.TreasuryMappingRepository;
import org.egov.eTreasury.repository.TreasuryPaymentRepository;
import org.egov.eTreasury.util.*;
import com.fasterxml.jackson.databind.ObjectMapper;

import digit.models.coremodels.PaymentDetail;
import lombok.extern.slf4j.Slf4j;
import org.egov.eTreasury.model.*;
import org.egov.eTreasury.repository.AuthSekRepository;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static org.egov.eTreasury.config.ServiceConstants.*;

@Service
@Slf4j
public class PaymentService {

    private final PaymentConfiguration config;

    private final ETreasuryUtil treasuryUtil;

    private final ObjectMapper objectMapper;

    private final EncryptionUtil encryptionUtil;

    private final Producer producer;

    private final AuthSekRepository repository;

    private final CollectionsUtil collectionsUtil;

    private final FileStorageUtil fileStorageUtil;

    private final TreasuryPaymentRepository treasuryPaymentRepository;

    private final PdfServiceUtil pdfServiceUtil;

    private final TreasuryEnrichment treasuryEnrichment;

    private final MdmsUtil mdmsUtil;

    private final CaseUtil caseUtil;

    private final DemandUtil demandUtil;

    private final TreasuryMappingRepository treasuryMappingRepository;

    private final IndividualService individualService;

    private final SMSNotificationService smsNotificationService;

    @Autowired
    public PaymentService(PaymentConfiguration config, ETreasuryUtil treasuryUtil,
                          ObjectMapper objectMapper, EncryptionUtil encryptionUtil,
                          Producer producer, AuthSekRepository repository, CollectionsUtil collectionsUtil,
                          FileStorageUtil fileStorageUtil, TreasuryPaymentRepository treasuryPaymentRepository, PdfServiceUtil pdfServiceUtil, TreasuryEnrichment treasuryEnrichment, MdmsUtil mdmsUtil, CaseUtil caseUtil, DemandUtil demandUtil, TreasuryMappingRepository treasuryMappingRepository, IndividualService individualService, SMSNotificationService smsNotificationService) {
        this.config = config;
        this.treasuryUtil = treasuryUtil;
        this.objectMapper = objectMapper;
        this.encryptionUtil = encryptionUtil;
        this.producer = producer;
        this.repository = repository;
        this.collectionsUtil = collectionsUtil;
        this.fileStorageUtil = fileStorageUtil;
        this.treasuryPaymentRepository = treasuryPaymentRepository;
        this.pdfServiceUtil = pdfServiceUtil;
        this.treasuryEnrichment = treasuryEnrichment;
        this.mdmsUtil = mdmsUtil;
        this.caseUtil = caseUtil;
        this.demandUtil = demandUtil;
        this.treasuryMappingRepository = treasuryMappingRepository;
        this.individualService = individualService;
        this.smsNotificationService = smsNotificationService;
    }

    public ConnectionStatus verifyConnection() {
        try {
            ResponseEntity<String> responseEntity = treasuryUtil.callConnectionService(config.getServerStatusUrl(), String.class);
            if (responseEntity.getStatusCode().is2xxSuccessful() && responseEntity.getBody() != null) {
                return objectMapper.readValue(responseEntity.getBody(), ConnectionStatus.class);
            } else {
                throw new CustomException(AUTHENTICATION_FAILED, "Authentication request failed with status: " + responseEntity.getStatusCode());
            }
        } catch (Exception e) {
            log.error("Establishing a connection with ETreasury server failed: ", e);
            return ConnectionStatus.builder().status("FAIL").build();
        }
    }

    private Map<String, String> authenticate() {
        Map<String, String> secretMap;
        try {
            // Generate client secret and app key
            secretMap = encryptionUtil.getClientSecretAndAppKey(config.getClientSecret(), config.getPublicKey());
            // Prepare authentication request payload
            AuthRequest authRequest = new AuthRequest(secretMap.get("encodedAppKey"));
            String payload = objectMapper.writeValueAsString(authRequest);
            // Call the authentication service
            ResponseEntity<?> responseEntity = treasuryUtil.callAuthService(config.getClientId(), secretMap.get("encryptedClientSecret"),
            payload, config.getAuthUrl());
            log.info("Status Code: {}", responseEntity.getStatusCode());
            log.info("Response Body: {}", responseEntity.getBody());
            // Process the response
            if (responseEntity.getStatusCode().is2xxSuccessful() && responseEntity.getBody() != null) {
                AuthResponse response = objectMapper.convertValue(responseEntity.getBody(), AuthResponse.class);
                secretMap.put("sek", response.getData().getSek());
                secretMap.put(AUTH_TOKEN, response.getData().getAuthToken());
            } else {
               throw new CustomException(AUTHENTICATION_FAILED, "Authentication request failed with status: " + responseEntity.getStatusCode());
            }
        } catch (Exception e) {
            log.error("Authentication process failed: ", e);
            throw new CustomException(AUTHENTICATION_ERROR, "Error occurred during authentication");
        }
        return secretMap;
    }

    public Payload processPayment(ChallanData challanData, RequestInfo requestInfo) {
        try {
            Map<String, String> secretMap;
            String decryptedSek;
            if(config.isMockEnabled() && challanData.isMockEnabled()){
                //mocking the treasury for authentication
                log.info("Treasury is in mock mode, using mock authentication.");
                secretMap = mockAuthentication();
                decryptedSek = secretMap.get("sek");
            } else {
                // Authenticate and get secret map
                secretMap = authenticate();
                // Decrypt the SEK using the appKey
                decryptedSek = encryptionUtil.decryptAES(secretMap.get("sek"), secretMap.get("appKey"));
            }

            // Prepare the request body
            ChallanDetails challanDetails  = treasuryEnrichment.generateChallanDetails(challanData, requestInfo);

            AuthSek authSek = buildAuthSek(challanData, secretMap, decryptedSek, challanDetails.getDepartmentId());
            saveAuthTokenAndSek(requestInfo, authSek);

            String postBody;
            if(config.isMockEnabled() && challanData.isMockEnabled()) {
                //mocking the treasury for challan generation
                log.info("Treasury is in mock mode, generating post body without encryption.");
                postBody = objectMapper.writeValueAsString(challanDetails);
            } else {
                postBody = generatePostBody(decryptedSek, objectMapper.writeValueAsString(challanDetails));
            }

            // Prepare headers
            Headers headers = new Headers();
            headers.setClientId(config.getClientId());
            headers.setAuthToken(secretMap.get(AUTH_TOKEN));
            String headersData = objectMapper.writeValueAsString(headers);

            return Payload.builder()
                    .url(config.getChallanGenerateUrl())
                    .data(postBody).headers(headersData).grn(treasuryEnrichment.enrichGrn(requestInfo)).build();
        } catch (Exception e) {
            log.error("Payment processing error: ", e);
            throw new CustomException(PAYMENT_PROCESSING_ERROR, "Error occurred during generation oF challan");
        }
    }

    private static Map<String, String> mockAuthentication() {
        // Mock authentication for testing purposes
        Map<String, String> secretMap;
        secretMap = new HashMap<>();
        SecureRandom random = new SecureRandom();
        byte[] sekBytes = new byte[16];
        random.nextBytes(sekBytes);
        StringBuilder sekBuilder = new StringBuilder();
        for (byte b : sekBytes) {
            sekBuilder.append(String.format("%02x", b));
        }
        String sek = sekBuilder.toString();
        String authToken = UUID.randomUUID().toString();
        secretMap.put("sek", sek);
        secretMap.put("authToken", authToken);
        return secretMap;
    }

    private AuthSek buildAuthSek(ChallanData challanData, Map<String, String> secretMap, String decryptedSek, String departmentId) {
        return AuthSek.builder()
                .authToken(secretMap.get(AUTH_TOKEN))
                .decryptedSek(decryptedSek)
                .billId(challanData.getBillId())
                .businessService(challanData.getBusinessService())
                .serviceNumber(challanData.getServiceNumber())
                .mobileNumber(challanData.getMobileNumber())
                .totalDue(challanData.getTotalDue())
                .paidBy(challanData.getPaidBy())
                .sessionTime(System.currentTimeMillis())
                .departmentId(departmentId)
                .build();
    }

    public String printPayInSlipPdf(TreasuryPaymentRequest request) {
        try {
            ByteArrayResource byteArrayResource = pdfServiceUtil.generatePdfFromPdfService(request);
            return fileStorageUtil.saveDocumentToFileStore(byteArrayResource.getByteArray()).getFileStore();
        } catch (Exception e) {
            log.error("Error occurred when creating pdf for payment", e);
            return null;
        }
    }

    public TreasuryPaymentData decryptAndProcessTreasuryPayload(TreasuryParams treasuryParams, RequestInfo requestInfo) {
        log.info("Decrypting Treasury Payload for authToken: {}", treasuryParams.getAuthToken());

        try {
            Optional<AuthSek> optionalAuthSek = repository.getAuthSek(treasuryParams.getAuthToken()).stream().findFirst();
            if (optionalAuthSek.isEmpty()) {
                log.error("No AuthSek found for authToken: {}", treasuryParams.getAuthToken());
                throw new CustomException(AUTH_SEK_NOT_FOUND, "No AuthSek found for the provided authToken");
            }
            AuthSek authSek = optionalAuthSek.get();
            String decryptedData;
            if(config.isMockEnabled() && treasuryParams.isMockEnabled()) {
                //mocking the treasury for decryption
                log.info("Treasury is in mock mode, using mock data.");
                decryptedData = treasuryParams.getData();
            }
            else {
                String decryptedSek = authSek.getDecryptedSek();
                String decryptedRek = encryptionUtil.decryptResponse(treasuryParams.getRek(), decryptedSek);
                decryptedData = encryptionUtil.decryptResponse(treasuryParams.getData(), decryptedRek);
            }
            log.info("Decrypted data: {}", decryptedData);

            TransactionDetails transactionDetails = objectMapper.readValue(decryptedData, TransactionDetails.class);
            TreasuryPaymentData data = createTreasuryPaymentData(transactionDetails, authSek);
            treasuryEnrichment.enrichTreasuryPaymentData(data, requestInfo);
            requestInfo.getUserInfo().setTenantId(config.getEgovStateTenantId());

            log.info("Request info: {}", requestInfo);

            TreasuryPaymentRequest request = TreasuryPaymentRequest.builder()
                    .requestInfo(requestInfo)
                    .treasuryPaymentData(data)
                    .build();

            String fileStore = printPayInSlipPdf(request);
            data.setFileStoreId(fileStore);

            log.info("Saving Payment Data: {}", data);

            producer.push(config.getSaveTreasuryPaymentData(), request);

            return data;

        } catch (Exception e) {
            log.error("Error occurred during decrypting Treasury Response: ", e);
            throw new CustomException(TREASURY_RESPONSE_ERROR, "Error occurred during decrypting Treasury Response");
        }
    }

    private TreasuryPaymentData createTreasuryPaymentData(TransactionDetails transactionDetails, AuthSek authSek) {
        return TreasuryPaymentData.builder()
                .grn(transactionDetails.getGrn())
                .challanTimestamp(transactionDetails.getChallanTimestamp())
                .bankRefNo(transactionDetails.getBankRefNo())
                .bankTimestamp(transactionDetails.getBankTimestamp())
                .bankCode(transactionDetails.getBankCode())
                .status(transactionDetails.getStatus().charAt(0))
                .cin(transactionDetails.getCin())
                .amount(new BigDecimal(transactionDetails.getAmount()))
                .partyName(transactionDetails.getPartyName())
                .departmentId(transactionDetails.getDepartmentId())
                .remarkStatus(transactionDetails.getRemarkStatus())
                .remarks(transactionDetails.getRemarks())
                .billId(authSek.getBillId())
                .businessService(authSek.getBusinessService())
                .totalDue(authSek.getTotalDue())
                .mobileNumber(authSek.getMobileNumber())
                .tenantId(config.getEgovStateTenantId())
                .paidBy(authSek.getPaidBy())
                .build();
    }


    private void saveAuthTokenAndSek(RequestInfo requestInfo, AuthSek authSek) {
        AuthSekRequest request = new AuthSekRequest(requestInfo, authSek);
        producer.push("save-auth-sek", request);
    }

    private String generatePostBody(String decryptedSek, String jsonData) {
        try {
            // Convert SEK to AES key
            SecretKey aesKey = new SecretKeySpec(decryptedSek.getBytes(StandardCharsets.UTF_8), "AES");

            // Initialize AES cipher in encryption mode
            Cipher aesCipher = Cipher.getInstance("AES/ECB/PKCS5Padding");
            aesCipher.init(Cipher.ENCRYPT_MODE, aesKey);

            // Encrypt JSON data
            byte[] encryptedDataBytes = aesCipher.doFinal(jsonData.getBytes(StandardCharsets.UTF_8));
            String encryptedData = Base64.getEncoder().encodeToString(encryptedDataBytes);

            // Generate HMAC using JSON data and SEK
            String hmac = encryptionUtil.generateHMAC(jsonData, decryptedSek);

            // Create PostBody object and convert to JSON string
            PostBody postBody = new PostBody(hmac, encryptedData);
            return objectMapper.writeValueAsString(postBody);
        } catch (Exception e) {
            log.error("Error during post body generation: ", e);
            throw new CustomException("POST_BODY_GENERATION_ERROR", "Error occurred generating post body");
        }
    }

    private Long convertTimestampToMillis(String timestampStr) {
        List<DateTimeFormatter> formatters = new ArrayList<>();
        formatters.add(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSSSSS"));
        formatters.add(DateTimeFormatter.ofPattern("yyyy-MM-dd-HH.mm.ss.SSSSS"));
        LocalDateTime dateTime = null;
        for (DateTimeFormatter formatter : formatters) {
            try {
                dateTime = LocalDateTime.parse(timestampStr, formatter);
                break;
            } catch (Exception e) {
                // Try next formatter if parsing fails
            }
        }
        if (dateTime != null) {
            return dateTime.toInstant(ZoneOffset.UTC).toEpochMilli();
        } else {
            return null;
        }
    }
    public Document getTreasuryPaymentData(String billId) {
        Optional<TreasuryPaymentData> optionalPaymentData = treasuryPaymentRepository.getTreasuryPaymentData(billId)
                .stream().findFirst();
        if (optionalPaymentData.isPresent()) {
            return  Document.builder().fileStore(optionalPaymentData.get().getFileStoreId()).documentType("application/pdf").build();
        } else {
            log.error("No Payment data for given bill Id");
            return null;
        }
    }

    public void callCollectionServiceAndUpdatePayment(TreasuryPaymentRequest request) {

        String paymentStatus = String.valueOf(request.getTreasuryPaymentData().getStatus());
        BigDecimal totalAmountPaid = new BigDecimal(String.valueOf(request.getTreasuryPaymentData().getAmount()));
        log.info("Tracking transaction for billingId : {} with paymentStatus : {} ",request.getTreasuryPaymentData().getBillId(),paymentStatus);
            if (config.isTest()) {
                totalAmountPaid = BigDecimal.valueOf(request.getTreasuryPaymentData().getTotalDue());
            }
            else if(!paymentStatus.equals("Y")){
                log.info("Total Amount Paid : {} ",totalAmountPaid);
                log.info("Total Due : {} ",request.getTreasuryPaymentData().getTotalDue());
                log.info("eTreasury in test mode : {} ",config.isTest());
                log.info("Transaction failed for billingId : {} ",request.getTreasuryPaymentData().getBillId());
                return;
            }
            log.info("Total Amount Paid : {} ",totalAmountPaid);
            log.info("Total Due : {} ",request.getTreasuryPaymentData().getTotalDue());
            log.info("eTreasury in test mode : {} ",config.isTest());

        PaymentDetail paymentDetail = PaymentDetail.builder()
                .billId(request.getTreasuryPaymentData().getBillId())
                .totalDue(BigDecimal.valueOf(request.getTreasuryPaymentData().getTotalDue()))
                .totalAmountPaid(totalAmountPaid)
                .businessService(request.getTreasuryPaymentData().getBusinessService()).build();
        Payment payment = Payment.builder()
                .tenantId(config.getEgovStateTenantId())
                .paymentDetails(Collections.singletonList(paymentDetail))
                .payerName(request.getTreasuryPaymentData().getPartyName())
                .paidBy(request.getTreasuryPaymentData().getPaidBy())
                .mobileNumber(request.getTreasuryPaymentData().getMobileNumber())
                .transactionNumber(request.getTreasuryPaymentData().getGrn())
                .transactionDate(convertTimestampToMillis(request.getTreasuryPaymentData().getChallanTimestamp()))
                .instrumentNumber(request.getTreasuryPaymentData().getBankRefNo())
                .instrumentDate(convertTimestampToMillis(request.getTreasuryPaymentData().getBankTimestamp()))
                .totalAmountPaid(new BigDecimal(String.valueOf(request.getTreasuryPaymentData().getAmount())))
                .paymentMode("ONLINE")
                .fileStoreId(request.getTreasuryPaymentData().getFileStoreId())
                .build();

        if (paymentStatus.equals("Y")) {
            payment.setPaymentStatus("DEPOSITED");
        }
        PaymentRequest paymentRequest = new PaymentRequest(request.getRequestInfo(), payment);
        collectionsUtil.callService(paymentRequest, config.getCollectionServiceHost(), config.getCollectionsPaymentCreatePath());
        sendNotificationForPaymentCompleted(request);
    }

    public void sendNotificationForPaymentCompleted(TreasuryPaymentRequest request) {
        String filingNumber = request.getTreasuryPaymentData().getCaseNumber();
        CourtCase courtCase = fetchCourtCase(filingNumber);
        if(courtCase == null) return;
        Set<String> individualIds = collectIndividualIds(courtCase);
        List<Individual> individuals = fetchIndividuals(individualIds);
        Set<String> phoneNumbers = extractPhoneNumbers(individuals);
        SMSTemplateData smsTemplateData = buildSmsTemplateData(filingNumber, courtCase);

        callNotificationService(smsTemplateData, phoneNumbers, PAYMENT_COMPLETED_SUCCESSFULLY, request.getRequestInfo());
    }


    private CourtCase fetchCourtCase(String filingNumber) {
        CaseCriteria criteria = CaseCriteria.builder()
                .filingNumber(filingNumber)
                .build();

        CaseSearchRequest caseSearchRequest = CaseSearchRequest.builder()
                .criteria(List.of(criteria))
                .build();

        return caseUtil.searchCaseDetails(caseSearchRequest);
    }

    private Set<String> collectIndividualIds(CourtCase courtCase) {
        Set<String> individualIds = new HashSet<>();
        individualIds.addAll(getLitigantIndividualIds(courtCase));
        individualIds.addAll(getPOAIndividualIds(courtCase));
        return individualIds;
    }

    private List<Individual> fetchIndividuals(Set<String> individualIds) {
        return individualService.getIndividualsBylId(null, new ArrayList<>(individualIds));
    }

    private Set<String> extractPhoneNumbers(List<Individual> individuals) {
        return individuals.stream()
                .map(Individual::getMobileNumber)
                .collect(Collectors.toSet());
    }

    private SMSTemplateData buildSmsTemplateData(String filingNumber, CourtCase courtCase) {
        return SMSTemplateData.builder()
                .filingNumber(filingNumber)
                .cmpNumber(courtCase.getCmpNumber())
                .courtCaseNumber(courtCase.getCourtCaseNumber())
                .build();
    }


    private void callNotificationService(SMSTemplateData templateData, Set<String> phoneNumbers, String messageCode, RequestInfo requestInfo) {
        for(String phoneNumber : phoneNumbers){
            smsNotificationService.sendNotification(requestInfo, templateData, messageCode, phoneNumber);

        }
    }

    private Set<String> getLitigantIndividualIds(CourtCase courtCase) {
        return courtCase.getLitigants().stream()
                .map(Party::getIndividualId)
                .collect(Collectors.toSet());
    }

    private Set<String> getPOAIndividualIds(CourtCase courtCase) {
        return courtCase.getPoaHolders().stream()
                .map(POAHolder::getIndividualId)
                .collect(Collectors.toSet());
    }

    public DemandResponse createDemand(DemandCreateRequest demandRequest) {
        try {
            log.info("operation=createDemand, status=IN_PROGRESS, consumerCode={}", demandRequest.getConsumerCode());
            TreasuryMapping treasuryMapping = generateTreasuryMapping(demandRequest);
            if(CASE_DEFAULT_ENTITY_TYPE.equals(demandRequest.getEntityType())) {
                enrichTreasuryMapping(demandRequest, treasuryMapping);
            }
            CourtCase courtCase = fetchCourtCase(demandRequest);
            Demand demand = createDemandObject(demandRequest, courtCase);
            DemandResponse demandResponse = demandUtil.createDemand(DemandRequest.builder()
                    .requestInfo(demandRequest.getRequestInfo())
                    .demands(List.of(demand))
                    .build());
            producer.push(config.getTreasuryMappingSaveTopic(), treasuryMapping);
            log.info("operation=createDemand, status=SUCCESS, consumerCode={}", demandRequest.getConsumerCode());
            return demandResponse;
        } catch (JsonProcessingException e) {
            log.error("Error occurred during demand creation: ", e);
            throw new CustomException(DEMAND_CREATION_ERROR, "Error occurred during demand creation");
        }
    }

    private void enrichTreasuryMapping(DemandCreateRequest demandRequest, TreasuryMapping treasuryMapping) {
        treasuryMapping.setFinalCalcPostResubmission(demandRequest.getFinalCalcPostResubmission() != null ? demandRequest.getFinalCalcPostResubmission() : demandRequest.getCalculation().get(0));
        treasuryMapping.setLastSubmissionConsumerCode(demandRequest.getLastSubmissionConsumerCode());
    }

    private Map<String, String> getTaxHeadMasterCodes(Map<String, Map<String, JSONArray>> mdmsData, String taskBusinessService, String deliveryChannel) {
        if (mdmsData != null && mdmsData.containsKey("payment") && mdmsData.get("payment").containsKey(PAYMENTMASTERCODE)) {
            JSONArray masterCode = mdmsData.get("payment").get(PAYMENTMASTERCODE);
            Map<String, String> result = new HashMap<>();
            for (Object masterCodeObj : masterCode) {
                Map<String, String> subType = (Map<String, String>) masterCodeObj;
                if (taskBusinessService.equals(subType.get("businessService")) && deliveryChannel.equalsIgnoreCase(subType.get("deliveryChannel"))) {
                    result.put(subType.get("type"), subType.get("masterCode"));
                }
            }
            return result;
        }
        return Collections.emptyMap();
    }

    private CourtCase fetchCourtCase(DemandCreateRequest demandRequest) {
        return caseUtil.searchCaseDetails(CaseSearchRequest.builder()
                .requestInfo(demandRequest.getRequestInfo())
                .flow("flow_jac")
                .criteria(List.of(CaseCriteria.builder()
                        .filingNumber(demandRequest.getFilingNumber())
                        .defaultFields(false)
                        .tenantId(demandRequest.getTenantId())
                        .build()))
                .build());
    }

    private Demand createDemandObject(DemandCreateRequest demandRequest, CourtCase courtCase) throws JsonProcessingException {
        Map<String, Map<String, JSONArray>> billingMasterData = mdmsUtil.fetchMdmsData(demandRequest.getRequestInfo(), demandRequest.getTenantId(), "BillingService", List.of("TaxPeriod", "TaxHeadMaster"));
        Map<String, Map<String, JSONArray>> paymentMasterData = mdmsUtil.fetchMdmsData(demandRequest.getRequestInfo(), demandRequest.getTenantId(), "payment", List.of(PAYMENTMASTERCODE));
        JsonNode taxHeadMaster = objectMapper.readTree(billingMasterData.get("BillingService").get("TaxHeadMaster").toJSONString());
        JsonNode taxPeriod = objectMapper.readTree(billingMasterData.get("BillingService").get("TaxPeriod").toJSONString());
        JsonNode taxPeriodData = getTaxPeriod(taxPeriod, demandRequest.getEntityType());

        return Demand.builder()
                .tenantId(demandRequest.getTenantId())
                .consumerCode(demandRequest.getConsumerCode())
                .consumerType(demandRequest.getEntityType())
                .businessService(demandRequest.getEntityType())
                .taxPeriodFrom((taxPeriodData != null) ? taxPeriodData.get("fromDate").asLong() : System.currentTimeMillis())
                .taxPeriodTo((taxPeriodData != null) ? taxPeriodData.get("toDate").asLong() : System.currentTimeMillis())
                .billExpiryTime(getBillExpiryTime(demandRequest.getEntityType()))
                .demandDetails(isSummonDemand(demandRequest.getEntityType())
                        ? getDemandDetailSummons(demandRequest.getCalculation(), demandRequest.getEntityType(), demandRequest.getDeliveryChannel(), paymentMasterData)
                        : List.of(getDemandDetails(demandRequest.getCalculation().get(0).getTotalAmount(), demandRequest.getEntityType(), taxHeadMaster)))
                .additionalDetails(getAdditionalDetails(courtCase, demandRequest.getEntityType(), demandRequest.getCalculation().get(0)))
                .build();
    }

    private Long getBillExpiryTime(String entityType) {
        if(entityType.equalsIgnoreCase("task-summons") || entityType.equalsIgnoreCase("task-notice") || entityType.equalsIgnoreCase("task-warrant") || entityType.equalsIgnoreCase("task-proclamation") || entityType.equalsIgnoreCase("task-attachment")) {
            return TWO_YEARS_IN_MILLISECOND;
        }
        return null;
    }

    private boolean isSummonDemand(String entityType) {
        return entityType.equals("task-summons") || entityType.equals("task-notice") || entityType.equals("task-warrant") || entityType.equals("task-proclamation") || entityType.equals("task-attachment");
    }

    private List<DemandDetail> getDemandDetailSummons(List<Calculation> calculation, String entityType, String deliveryChannel, Map<String, Map<String, JSONArray>> paymentMasterData) {
        Map<String, String> taxHeadMasterCodes = getTaxHeadMasterCodes(paymentMasterData, entityType, deliveryChannel);
        List<DemandDetail> demandDetails = new ArrayList<>();
        if ("EPOST".equalsIgnoreCase(deliveryChannel)) {
            for (BreakDown breakDown : calculation.get(0).getBreakDown()) {
                String taxHeadCode = taxHeadMasterCodes.get(breakDown.getType());
                if (taxHeadCode != null) {
                    demandDetails.add(DemandDetail.builder()
                            .tenantId(config.getEgovStateTenantId())
                            .taxAmount(BigDecimal.valueOf(calculation.get(0).getBreakDown().stream().mapToDouble(BreakDown::getAmount).sum()))
                            .taxHeadMasterCode(taxHeadCode)
                            .build());
                }
            }
        } else {
            for (BreakDown breakDown : calculation.get(0).getBreakDown()) {
                String taxHeadCode = taxHeadMasterCodes.get(breakDown.getType());
                if (taxHeadCode != null) {
                    demandDetails.add(DemandDetail.builder()
                            .tenantId(config.getEgovStateTenantId())
                            .taxAmount(BigDecimal.valueOf(breakDown.getAmount()))
                            .taxHeadMasterCode(taxHeadCode)
                            .build());
                }
            }
        }
        return demandDetails;
    }

    private TreasuryMapping generateTreasuryMapping(DemandCreateRequest demandRequest){
        try {
            Map<String, Map<String, JSONArray>> mdmsData = mdmsUtil.fetchMdmsData(demandRequest.getRequestInfo(), demandRequest.getTenantId(), "payment", List.of(PAYMENT_TO_BREAKUP_MASTER, BREAKUP_TO_HEAD_MASTER, PAYMENT_TYPE_MASTER));
            Map<String, JSONArray> mdmsMasterData = mdmsData.get("payment");
            JsonNode paymentTypeMap = objectMapper.readTree(mdmsMasterData.get(PAYMENT_TYPE_MASTER).toJSONString());
            String paymentType = getPaymentType(demandRequest.getConsumerCode());
            String paymentTypeCode = extractPaymentTypeCode(paymentTypeMap, paymentType, demandRequest.getEntityType());
            JsonNode paymentTypeToBreakUp = extractPaymentBreakUpToType(objectMapper.readTree(mdmsMasterData.get(PAYMENT_TO_BREAKUP_MASTER).toJSONString()), paymentTypeCode);
            List<JsonNode> breakUpList = new ArrayList<>();
            double totalAmount = 0.0;
            JsonNode breakupList = paymentTypeToBreakUp.get("breakUpList");
            for (JsonNode jsonObject : breakupList) {
                String breakupCode = jsonObject.get("breakUpCode").asText();
                JsonNode headCodeList = extractBreakupToHead(objectMapper.readTree(mdmsMasterData.get(BREAKUP_TO_HEAD_MASTER).toJSONString()), breakupCode);
                BreakDown breakDown = getBreakDown(demandRequest.getCalculation().get(0).getBreakDown(), jsonObject.get("breakUpCode").asText());
                if(breakDown != null){
                    JsonNode breakUpHead = getPaymentBreakupHead(headCodeList, breakDown);
                    totalAmount += breakUpHead.get("amount").asDouble();
                    breakUpList.add(breakUpHead);
                }
            }

            Map<String, Object> headAmountMapping = new HashMap<>();
            headAmountMapping.put("totalAmount", totalAmount);
            headAmountMapping.put("breakUpList", breakUpList);

            return TreasuryMapping.builder()
                    .consumerCode(demandRequest.getConsumerCode())
                    .tenantId(demandRequest.getTenantId())
                    .headAmountMapping(objectMapper.convertValue(headAmountMapping, Object.class))
                    .calculation(demandRequest.getCalculation().get(0))
                    .createdTime(System.currentTimeMillis())
                    .lastModifiedTime(System.currentTimeMillis())
                    .build();
        } catch (JsonProcessingException | IllegalArgumentException | CustomException e) {
            log.error("Error occurred during treasury mapping generation: ", e);
            throw new CustomException("TREASURY_MAPPING_ERROR", "Error occurred during treasury mapping generation");
        }
    }

    private BreakDown getBreakDown(List<BreakDown> breakDown,  String breakUpCode) {
        for (BreakDown breakUp : breakDown) {
            if (breakUp.getCode().equalsIgnoreCase(breakUpCode)) {
                return breakUp;
            }
        }
        return null;
    }


    public Object getAdditionalDetails(CourtCase courtCase, String entityType, Calculation calculation) {
        ObjectNode objectNode = objectMapper.createObjectNode();
        objectNode.put("filingNumber", courtCase.getFilingNumber());
        objectNode.put("cnrNumber", courtCase.getCnrNumber());
        objectNode.put("payer", objectMapper.convertValue(courtCase.getLitigants().get(0).getAdditionalDetails(), JsonNode.class).get("fullName"));
        objectNode.put("payerMobileNo", objectMapper.convertValue(courtCase.getAdditionalDetails(), JsonNode.class).get("payerMobileNo"));
        if(entityType.equalsIgnoreCase("case-default")){
            objectNode.put("isDelayCondonation",  getIsDelayCondonation(calculation));
            objectNode.put("chequeDetails", addChequeDetails(courtCase));
        }
        return objectNode;
    }

    private JsonNode addChequeDetails(CourtCase courtCase) {
        JsonNode caseDetails = objectMapper.convertValue(courtCase.getCaseDetails(), JsonNode.class);
        JsonNode debtLiability = caseDetails.get("debtLiabilityDetails").get("formdata").get(0).get("data");
        ObjectNode chequeDetails = objectMapper.createObjectNode();
        if(debtLiability.get("liabilityType").get("code").asText().equalsIgnoreCase(PARTIAL_LIABILITY)) {
            chequeDetails.put("totalAmount", debtLiability.get("totalAmount").asDouble());
        } else {
            JsonNode chequeData = caseDetails.get("chequeDetails").get("formdata");
            BigDecimal totalAmount = BigDecimal.ZERO;
            for (JsonNode data : chequeData) {
                BigDecimal amount = new BigDecimal(data.get("data").get("chequeAmount").asText());
                totalAmount = totalAmount.add(amount);
            }
            chequeDetails.put("totalAmount", totalAmount);
        }
        return  chequeDetails;
    }
    private Boolean getIsDelayCondonation(Calculation calculation) {
        for(BreakDown breakDown : calculation.getBreakDown()) {
            if(breakDown.getCode().equals(DELAY_CONDONATION_FEE)) {
                return true;
            }
        }
        return false;
    }


    public DemandDetail getDemandDetails(Double totalAmount, String entityType, JsonNode taxHeadMaster) {
        return DemandDetail.builder()
                .taxHeadMasterCode(getTaxHeadMasterCode(taxHeadMaster, entityType))
                .taxAmount(BigDecimal.valueOf(totalAmount))
                .collectionAmount(BigDecimal.valueOf(0))
                .build();
    }
    private String getTaxHeadMasterCode(JsonNode taxHeadMaster, String entityType) {
        if(taxHeadMaster.isArray()) {
            for(JsonNode jsonNode: taxHeadMaster) {
                if(jsonNode.get("service").asText().equalsIgnoreCase(entityType)) {
                    return jsonNode.get("code").asText();
                }
            }
        }
        return null;
    }

    private JsonNode getTaxPeriod(JsonNode taxPeriod, String entityType) {
        if(taxPeriod.isArray()) {
            for(JsonNode jsonNode: taxPeriod) {
                if(jsonNode.get("service").asText().equalsIgnoreCase(entityType)) {
                    return jsonNode;
                }
            }
        }
        return null;
    }
    private JsonNode getPaymentBreakupHead(JsonNode headCodeList, BreakDown breakUp) {
        Double amount = breakUp.getAmount();
        List<JSONObject> headIdList = new ArrayList<>();
        for(int i=0; i<headCodeList.size(); i++) {
            JsonNode jsonObject = headCodeList.get(i);
            Double percentage = jsonObject.get("percentage").asDouble();
            Double headAmount = (amount * percentage )/ 100;
            JSONObject headAmountObject = new JSONObject();
            headAmountObject.put("id", jsonObject.get("headId"));
            headAmountObject.put("amount", headAmount);
            headIdList.add(headAmountObject);
        }

        JSONObject headAmountObject = new JSONObject();
        headAmountObject.put("name", breakUp.getType());
        headAmountObject.put("amount", amount);
        headAmountObject.put("headIdList", headIdList);
        return objectMapper.convertValue(headAmountObject, JsonNode.class);
    }
    private String extractPaymentTypeCode(JsonNode paymentTypeMap, String paymentType, String entityType) {
        for (JsonNode jsonObject : paymentTypeMap) {
            if (jsonObject.get("suffix").asText().equals(paymentType) && isValidPaymentType(entityType, jsonObject.get("businessService"))) {
                return jsonObject.get("id").asText();
            }
        }
        throw new CustomException(PAYMENT_TYPE_NOT_FOUND, "No matching payment type code found for: " + paymentType);
    }

    private boolean isValidPaymentType(String entityType, JsonNode businessService) {
        for(JsonNode node : businessService) {
            if(node.get("businessCode").asText().equals(entityType)){
                return true;
            }
        }
        return false;
    }


    private JsonNode extractPaymentBreakUpToType(JsonNode paymentTypeToBreakupMapping, String paymentTypeCode) {
        for (JsonNode jsonObject : paymentTypeToBreakupMapping) {
            if (jsonObject.get(PAYMENT_TYPE_MASTER).asText().equals(paymentTypeCode)) {
                return jsonObject;
            }
        }
        throw new CustomException(PAYMENT_BREAKUP_NOT_FOUND, "No breakup mapping found for payment type code: " + paymentTypeCode);
    }


    private JsonNode extractBreakupToHead(JsonNode breakUpToHeadMapping, String breakupCode) {
        for (JsonNode jsonObject : breakUpToHeadMapping) {
            if (jsonObject.get("breakUpCode").asText().equals(breakupCode)) {
                return jsonObject.get("headCodes");
            }
        }
        throw new CustomException(BREAKUP_TO_HEAD_NOT_FOUND, "No head code mapping found for breakup code: " + breakupCode);
    }

    private String getPaymentType(String consumerCode) {
        Pattern pattern = Pattern.compile("_([A-Z_]+)(?:-[0-9]+)?$");
        Matcher matcher = pattern.matcher(consumerCode);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return null;
    }

    public TreasuryMapping getHeadBreakDown(String consumerCode) {
        return treasuryMappingRepository.getTreasuryMapping(consumerCode);
    }
//    public Payload doubleVerifyPayment(VerificationData verificationData, RequestInfo requestInfo) {
//        try {
//            VerificationDetails verificationDetails = verificationData.getVerificationDetails();
//            // Authenticate and get secret map
//            Map<String, String> secretMap = authenticate();
//
//            // Decrypt the SEK using the appKey
//            String decryptedSek = encryptionUtil.decryptAES(secretMap.get("sek"), secretMap.get("appKey"));
//            AuthSek authSek = AuthSek.builder()
//                    .authToken(secretMap.get("authToken"))
//                    .decryptedSek(decryptedSek)
//                    .billId(verificationData.getBillId())
//                    .businessService(verificationData.getBusinessService())
//                    .serviceNumber(verificationData.getServiceNumber())
//                    .totalDue(verificationData.getTotalDue())
//                    .paidBy(verificationData.getPaidBy())
//                    .sessionTime(System.currentTimeMillis())
//                    .departmentId(verificationDetails.getDepartmentId()).build();
//            saveAuthTokenAndSek(requestInfo, authSek);
//
//            // Prepare the request body
//            verificationDetails.setOfficeCode(config.getOfficeCode());
//            verificationDetails.setServiceDeptCode(config.getServiceDeptCode());
//            String postBody = generatePostBody(decryptedSek, objectMapper.writeValueAsString(verificationDetails));
//
//            // Prepare headers
//            Headers headers = new Headers();
//            headers.setClientId(config.getClientId());
//            headers.setAuthToken(secretMap.get("authToken"));
//            String headersData = objectMapper.writeValueAsString(headers);
//
//            return Payload.builder()
//                    .url(config.getDoubleVerificationUrl())
//                    .data(postBody).headers(headersData).build();
//        } catch (Exception e) {
//            log.error("Double verification Error: ", e);
//            throw new CustomException("DOUBLE_VERIFICATION_ERROR", "Error occurred during double verification");
//        }
//    }

//    public Document printPayInSlip(PrintDetails printDetails, RequestInfo requestInfo) {
//        try {
//            // Authenticate and get secret map
//            Map<String, String> secretMap = authenticate();
//
//            // Decrypt the SEK using the appKey
//            String decryptedSek = encryptionUtil.decryptAES(secretMap.get("sek"), secretMap.get("appKey"));
//
//            // Prepare the request body
//            String postBody = generatePostBody(decryptedSek, objectMapper.writeValueAsString(printDetails));
//
//            // Prepare headers
//            Headers headers = new Headers();
//            headers.setClientId(config.getClientId());
//            headers.setAuthToken(secretMap.get("authToken"));
//            String headersData = objectMapper.writeValueAsString(headers);
//
//            // Call the service
//            ResponseEntity<byte[]> responseEntity = callService(headersData, postBody, config.getPrintSlipUrl(), byte[].class, MediaType.MULTIPART_FORM_DATA);
//
//            // Process the response
//            if (responseEntity.getStatusCode().is2xxSuccessful() && responseEntity.getBody() != null) {
//                 return fileStorageUtil.saveDocumentToFileStore(responseEntity.getBody());
//            } else {
//                throw new CustomException("PRINT_SLIP_FAILED", "Pay in slip request failed");
//            }
//        } catch (Exception e) {
//            log.error("Print slip generation Error: ", e);
//            throw new CustomException("PRINT_SLIP_ERROR", "Error occurred during pay in slip generation");
//        }
//    }


//    public TransactionDetails fetchTransactionDetails(TransactionDetails transactionDetails, RequestInfo requestInfo) {
//        try {
//            // Authenticate and get secret map
//            Map<String, String> secretMap = authenticate();
//
//            // Decrypt the SEK using the appKey
//            String decryptedSek = encryptionUtil.decryptAES(secretMap.get("sek"), secretMap.get("appKey"));
//
//            // Prepare the request body
//            transactionDetails.setDepartmentId(config.getDeptReferenceId());
//            String postBody = generatePostBody(decryptedSek, objectMapper.writeValueAsString(transactionDetails));
//
//            // Prepare headers
//            Headers headers = new Headers();
//            headers.setClientId(config.getClientId());
//            headers.setAuthToken(secretMap.get("authToken"));
//            String headersData = objectMapper.writeValueAsString(headers);
//
//            // Call the service
//            ResponseEntity<TransactionDetails> responseEntity = callService(headersData, postBody, config.getTransactionDetailsUrl(), TransactionDetails.class, MediaType.APPLICATION_JSON);
//            return objectMapper.convertValue(responseEntity.getBody(), TransactionDetails.class);
//        } catch (Exception e) {
//            log.error("Transaction details retrieval failed: ", e);
//            throw new CustomException("TRANSACTION_DETAILS_ERROR", "Error ccurred during transaction details retrieval");
//        }
//    }

//    public RefundData processRefund(RefundDetails refundDetails, RequestInfo requestInfo) {
//        try {
//            // Authenticate and get secret map
//            Map<String, String> secretMap = authenticate();
//
//            // Decrypt the SEK using the appKey
//            String decryptedSek = encryptionUtil.decryptAES(secretMap.get("sek"), secretMap.get("appKey"));
//
//            // Prepare the request body
//            String postBody = generatePostBodyForRefund(decryptedSek, objectMapper.writeValueAsString(refundDetails));
//
//            // Call the service
//            ResponseEntity<TreasuryResponse> responseEntity = treasuryUtil.callRefundService(config.getClientId(), secretMap.get("authToken"), postBody, config.getRefundRequestUrl(), TreasuryResponse.class);
//            TreasuryResponse response = responseEntity.getBody();
//            String decryptedRek = encryptionUtil.decryptResponse(response.getRek(), decryptedSek);
//            String decryptedData = encryptionUtil.decryptResponse(response.getData(), decryptedRek);
//
//            return objectMapper.convertValue(decryptedData, RefundData.class);
//        } catch (Exception e) {
//            log.error("Refund Request failed: ", e);
//            throw new CustomException("REFUND_REQUEST_ERROR", "Error occurred during  refund request");
//        }
//    }

//    public RefundData checkRefundStatus(RefundStatus refundStatus, RequestInfo requestInfo) {
//        try {
//            // Authenticate and get secret map
//            Map<String, String> secretMap = authenticate();
//
//            // Decrypt the SEK using the appKey
//            String decryptedSek = encryptionUtil.decryptAES(secretMap.get("sek"), secretMap.get("appKey"));
//
//            // Prepare the request body
//            String postBody = generatePostBodyForRefund(decryptedSek, objectMapper.writeValueAsString(refundStatus));
//
//            // Call the service
//            ResponseEntity<TreasuryResponse> responseEntity = treasuryUtil.callRefundService(config.getClientId(),
//            secretMap.get("authToken"), postBody, config.getRefundStatusUrl(), TreasuryResponse.class);
//            TreasuryResponse response = responseEntity.getBody();
//            String decryptedRek = encryptionUtil.decryptResponse(response.getRek(), decryptedSek);
//            String decryptedData = encryptionUtil.decryptResponse(response.getData(), decryptedRek);
//
//            return objectMapper.convertValue(decryptedData, RefundData.class);
//        } catch (Exception e) {
//            log.error("Refund Request failed: ", e);
//            throw new CustomException("REFUND_REQUEST_ERROR", "Error occurred during  refund request");
//        }
//    }


//    private <T> ResponseEntity<T> callService(String headersData, String postBody, String url, Class<T> responseType, MediaType mediaType) {
//        return treasuryUtil.callService(headersData, postBody, url, responseType, mediaType);
//    }



//    private String generatePostBodyForRefund(String decryptedSek, String jsonData) {
//        try {
//            // Convert SEK to AES key
//            SecretKey aesKey = new SecretKeySpec(decryptedSek.getBytes(StandardCharsets.UTF_8), "AES");
//
//            // Initialize AES cipher in encryption mode
//            Cipher aesCipher = Cipher.getInstance("AES/ECB/PKCS5Padding");
//            aesCipher.init(Cipher.ENCRYPT_MODE, aesKey);
//
//            // Encrypt JSON data
//            byte[] encryptedDataBytes = aesCipher.doFinal(jsonData.getBytes(StandardCharsets.UTF_8));
//            String encryptedData = Base64.getEncoder().encodeToString(encryptedDataBytes);
//
//            // Generate HMAC using JSON data and SEK
//            String hmac = encryptionUtil.generateHMAC(jsonData, decryptedSek);
//
//            // Create PostBody object and convert to JSON string
//            RefundPostBody refundPostBody = new RefundPostBody(hmac, encryptedData);
//            return objectMapper.writeValueAsString(refundPostBody);
//        } catch (Exception e) {
//            log.error("Error during post body generation: ", e);
//            throw new CustomException("POST_BODY_GENERATION_ERROR", "Error occurred generating post body");
//        }
//    }

//    private void updatePaymentStatus(AuthSek authSek, TransactionDetails transactionDetails, RequestInfo requestInfo, String fileStoreId) {
//        log.info("Updating payment status for billId: {}", authSek.getBillId());
//        PaymentDetail paymentDetail = PaymentDetail.builder()
//            .billId(authSek.getBillId())
//            .totalDue(BigDecimal.valueOf(authSek.getTotalDue()))
//            .totalAmountPaid(new BigDecimal(transactionDetails.getAmount()))
//            .businessService(authSek.getBusinessService()).build();
//        Payment payment = Payment.builder()
//            .tenantId(config.getEgovStateTenantId())
//            .paymentDetails(Collections.singletonList(paymentDetail))
//            .payerName(transactionDetails.getPartyName())
//            .paidBy(authSek.getPaidBy())
//            .mobileNumber(authSek.getMobileNumber())
//            .transactionNumber(transactionDetails.getGrn())
//            .transactionDate(convertTimestampToMillis(transactionDetails.getChallanTimestamp()))
//            .instrumentNumber(transactionDetails.getBankRefNo())
//            .instrumentDate(convertTimestampToMillis(transactionDetails.getBankTimestamp()))
//            .totalAmountPaid(new BigDecimal(transactionDetails.getAmount()))
//            .paymentMode("ONLINE")
//            .fileStoreId(fileStoreId)
//            .build();
//        String paymentStatus = transactionDetails.getStatus();
//        if (paymentStatus.equals("Y")) {
//            payment.setPaymentStatus("DEPOSITED");
//        }
//        PaymentRequest paymentRequest = new PaymentRequest(requestInfo, payment);
//        collectionsUtil.callService(paymentRequest, config.getCollectionServiceHost(), config.getCollectionsPaymentCreatePath());
//        log.info("Payment request sent to collections service: {}", paymentRequest);
//    }

}
