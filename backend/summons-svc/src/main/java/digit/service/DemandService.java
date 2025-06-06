package digit.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import digit.config.Configuration;
import digit.repository.ServiceRequestRepository;
import digit.util.CaseUtil;
import digit.util.MdmsUtil;
import digit.util.TaskUtil;
import digit.web.models.*;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import org.egov.common.contract.models.RequestInfoWrapper;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.Role;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.jayway.jsonpath.JsonPath;

import java.math.BigDecimal;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static digit.config.ServiceConstants.*;

@Service
@Slf4j
public class DemandService {

    private final Configuration config;

    private final ObjectMapper mapper;

    private final ServiceRequestRepository repository;

    private final MdmsUtil mdmsUtil;

    private final TaskUtil taskUtil;

    private final CaseUtil caseUtil;

    @Autowired
    public DemandService(Configuration config, ObjectMapper mapper, ServiceRequestRepository repository, MdmsUtil mdmsUtil, TaskUtil taskUtil, CaseUtil caseUtil) {
        this.config = config;
        this.mapper = mapper;
        this.repository = repository;
        this.mdmsUtil = mdmsUtil;
        this.taskUtil = taskUtil;
        this.caseUtil = caseUtil;
    }
     Map<String, String> masterCodePayemntTypeMap= new HashMap<String,String>();

    public BillResponse fetchPaymentDetailsAndGenerateDemandAndBill(TaskRequest taskRequest) {
        Task task = taskRequest.getTask();
        String businessService = getBusinessService(task.getTaskType());
        List<Calculation> calculationList = generatePaymentDetails(taskRequest.getRequestInfo(), task);
        if(calculationList == null || calculationList.isEmpty()){
            throw new CustomException(PAYMENT_CALCULATOR_ERROR, "Getting empty or null data from payment-calculator");
        }
        Set<String> consumerCodeList = generateDemands(taskRequest.getRequestInfo(), calculationList, task, businessService);
        return getBillWithMultipleConsumerCode(taskRequest.getRequestInfo(), consumerCodeList, task, businessService);

    }

    public List<Calculation> generatePaymentDetails(RequestInfo requestInfo, Task task) {
        TaskPaymentCriteria criteria = TaskPaymentCriteria.builder()
                .channelId(ChannelName.fromString(task.getTaskDetails().getDeliveryChannel().getChannelName()).toString())
                .receiverPincode(task.getTaskDetails().getRespondentDetails().getAddress().getPinCode())
                .tenantId(task.getTenantId())
                .taskType(task.getTaskType())
                .id(task.getTaskNumber()).build();

        StringBuilder url = new StringBuilder().append(config.getPaymentCalculatorHost())
                .append(config.getPaymentCalculatorCalculateEndpoint());

        log.info("Requesting Payment Calculator : {}", criteria.toString());

        TaskPaymentRequest calculationRequest = TaskPaymentRequest.builder()
                .requestInfo(requestInfo).calculationCriteria(Collections.singletonList(criteria)).build();

        Object response = repository.fetchResult(url, calculationRequest);

        CalculationResponse calculationResponse = mapper.convertValue(response, CalculationResponse.class);
        return calculationResponse.getCalculation();
    }

    public Set<String> generateDemands(RequestInfo requestInfo, List<Calculation> calculations, Task task, String businessService) {
        List<Demand> demands = new ArrayList<>();
        Map<String, Map<String, JSONArray>> mdmsData = mdmsUtil.fetchMdmsData(requestInfo,
                config.getEgovStateTenantId(), config.getPaymentBusinessServiceName(), createMasterDetails()
        );
        for (Calculation calculation : calculations) {
            List<DemandDetail> demandDetailList = createDemandDetails(calculation, task, mdmsData, businessService);
            demands.addAll(createDemandList(requestInfo,
                    task, demandDetailList, calculation.getTenantId(), mdmsData, businessService));
        }

        Set<String> consumerCodes = new HashSet<>();
        Iterator<Demand> iterator = demands.iterator();
        while (iterator.hasNext()) {
            Demand demand = iterator.next();
            String paymentTypeString = getPaymentTypeString(demand.getConsumerCode());
            JSONArray paymentModeMaster = mdmsData.get("payment").get(PAYMENTMODE);
            String gatewayType = getPaymentGateway(paymentModeMaster, paymentTypeString);

            if (gatewayType.equalsIgnoreCase("eTreasury")) {
                String consumerCode = generateDemandForTreasury(demand, task, calculations, requestInfo);
                consumerCodes.add(consumerCode);
                iterator.remove();
            }
        }
        if(!demands.isEmpty()){
            consumerCodes.addAll(callBillServiceAndCreateDemand(requestInfo, demands, task));
        }
        return consumerCodes;
    }

    private String generateDemandForTreasury(Demand demand, Task task, List<Calculation> calculations, RequestInfo requestInfo) {
        try {
            log.info("Creating treasury demand for consumer code: {}", demand.getConsumerCode());
            DemandCreateRequest request = DemandCreateRequest.builder()
                    .requestInfo(requestInfo)
                    .consumerCode(demand.getConsumerCode())
                    .calculation(getCalculations(calculations))
                    .entityType(demand.getBusinessService())
                    .tenantId(demand.getTenantId())
                    .filingNumber(task.getFilingNumber())
                    .deliveryChannel(ChannelName.fromString(task.getTaskDetails().getDeliveryChannel().getChannelName()).name())
                    .build();
            StringBuilder uri = new StringBuilder();
            uri.append(config.getTreasuryDemandHost()).append(config.getTreasuryDemandCreateEndpoint());
            Object response = repository.fetchResult(uri, request);
            DemandResponse demandResponse = mapper.convertValue(response, DemandResponse.class);
            return demandResponse.getDemands().get(0).getConsumerCode();
        } catch (CustomException e) {
            log.error("Error creating treasury demand: ", e);
            throw new CustomException("Error creating treasury demand: ", e.getMessage());
        }
    }

    private static List<Calculation> getCalculations(List<Calculation> calculations) {
        calculations.forEach(calculation -> {
            calculation.setBreakDown(calculation.getBreakDown().stream().filter(breakDown -> breakDown.getCode().equals("COURT_FEE")).toList());
            calculation.setTotalAmount(calculation.getBreakDown().stream().mapToDouble(BreakDown::getAmount).sum());
        });
        return calculations;
    }

    private String getPaymentGateway(JSONArray paymentModeMaster, String paymentTypeString) {
        for(Object paymentMode : paymentModeMaster) {
            Map<String, String> paymentModeMap = (Map<String, String>) paymentMode;
            if(paymentModeMap.get("suffix").equalsIgnoreCase(paymentTypeString)) {
                return paymentModeMap.get("gateway");
            }
        }
        return null;
    }

    private String getPaymentTypeString(String consumerCode) {
        Pattern pattern = Pattern.compile("_([\\w]+)$");
        Matcher matcher = pattern.matcher(consumerCode);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return null;
    }

    private List<DemandDetail> createDemandDetails(Calculation calculation, Task task, Map<String,
            Map<String, JSONArray>> mdmsData, String businessService) {
        List<DemandDetail> demandDetailList = new ArrayList<>();
        String deliveryChannel = ChannelName.fromString(task.getTaskDetails().getDeliveryChannel().getChannelName()).name();
        Map<String, String> masterCodes = getTaxHeadMasterCodes(mdmsData, businessService, deliveryChannel);

        //if (config.isTest()) {
        //    demandDetailList.addAll(createTestDemandDetails(calculation.getTenantId(), task, businessService));
        //} else {
            for (BreakDown breakDown : calculation.getBreakDown()) {
                demandDetailList.add(createDemandDetail(calculation.getTenantId(), breakDown, masterCodes));
            }
        //}
        return demandDetailList;
    }

    private List<DemandDetail> createTestDemandDetails(String tenantId, Task task, String businessService) {
        List<DemandDetail> demandDetailList = new ArrayList<>();
        String channelName = ChannelName.fromString(task.getTaskDetails().getDeliveryChannel().getChannelName()).name();

        if (channelName.equals("EPOST")) {
            DemandDetail courtDetail = DemandDetail.builder()
                    .tenantId(tenantId)
                    .taxAmount(BigDecimal.valueOf(4))
                    .taxHeadMasterCode(getTestCourtTaxHeadMasterCode(businessService))
                    .build();

            DemandDetail ePostDetail = DemandDetail.builder()
                    .tenantId(tenantId)
                    .taxAmount(BigDecimal.valueOf(4))
                    .taxHeadMasterCode(getTestPostTaxHeadMasterCode(businessService))
                    .build();

            demandDetailList.add(courtDetail);
            demandDetailList.add(ePostDetail);
        }
        else if(channelName.equals("POLICE")){
            DemandDetail basicDetail = DemandDetail.builder()
                    .tenantId(tenantId)
                    .taxAmount(BigDecimal.valueOf(4))
                    .taxHeadMasterCode(getTestPoliceTaxHeadMasterCode(businessService))
                    .build();

            demandDetailList.add(basicDetail);
        }
        else if(channelName.equals("EMAIL")){
            DemandDetail basicDetail = DemandDetail.builder()
                    .tenantId(tenantId)
                    .taxAmount(BigDecimal.valueOf(4))
                    .taxHeadMasterCode(getTestTaxEmailHeadMasterCode(businessService))
                    .build();

            demandDetailList.add(basicDetail);
        }
        else if(channelName.equals("SMS")){
            DemandDetail basicDetail = DemandDetail.builder()
                    .tenantId(tenantId)
                    .taxAmount(BigDecimal.valueOf(4))
                    .taxHeadMasterCode(getTestTaxSmsHeadMasterCode(businessService))
                    .build();

            demandDetailList.add(basicDetail);
        }
        else if(channelName.equals("RPAD")){
            DemandDetail basicDetail = DemandDetail.builder()
                    .tenantId(tenantId)
                    .taxAmount(BigDecimal.valueOf(4))
                    .taxHeadMasterCode(getTestRpadTaxHeadMasterCode(businessService))
                    .build();

            demandDetailList.add(basicDetail);
        }

        return demandDetailList;
    }

    private DemandDetail createDemandDetail(String tenantId, BreakDown breakDown, Map<String, String> masterCodes) {
        return DemandDetail.builder()
                .tenantId(tenantId)
                .taxAmount(BigDecimal.valueOf(breakDown.getAmount()))
                .taxHeadMasterCode(masterCodes.getOrDefault(breakDown.getType(), ""))
                .build();
    }

    private Set<String> callBillServiceAndCreateDemand(RequestInfo requestInfo, List<Demand> demands, Task task) {
        StringBuilder url = new StringBuilder().append(config.getBillingServiceHost())
                .append(config.getDemandCreateEndpoint());
        DemandRequest demandRequest = DemandRequest.builder().requestInfo(requestInfo).demands(demands).build();
        repository.fetchResult(url, demandRequest);
        Set<String> consumerCode = new HashSet<>();
        for(Demand demand : demands){
            consumerCode.add(demand.getConsumerCode());
        }
        return consumerCode;
    }

    private List<Demand> createDemandList(RequestInfo requestInfo, Task task, List<DemandDetail> demandDetailList, String tenantId, Map<String,
            Map<String, JSONArray>> mdmsData, String businessService) {
        List<Demand> demandList = new ArrayList<>();
        String channelName = ChannelName.fromString(task.getTaskDetails().getDeliveryChannel().getChannelName()).name();
        String taskNumber = task.getTaskNumber();
        Map<String, String> paymentTypeData = getPaymentType(mdmsData, channelName, businessService);
        CaseSearchRequest caseSearchRequest = createCaseSearchRequest(requestInfo, task);
        JsonNode caseDetails = caseUtil.searchCaseDetails(caseSearchRequest);
        String fillingNumber = caseDetails.path("filingNumber").asText();
        String cnrNumber = caseDetails.path("cnrNumber").asText();
        String payerName = caseDetails.path("litigants").get(0).path("additionalDetails").path("fullName").asText();
        String payerMobileNo = caseDetails.path("additionalDetails").path("payerMobileNo").asText();
        DemandAdditionalDetails additionalDetails = DemandAdditionalDetails.builder()
                .filingNumber(fillingNumber)
                .cnrNumber(cnrNumber)
                .payer(payerName)
                .payerMobileNo(payerMobileNo).build();
        for (DemandDetail detail : demandDetailList) {
            String taxHeadMasterCode = detail.getTaxHeadMasterCode();
            String paymentType = masterCodePayemntTypeMap.get(taxHeadMasterCode);
            String paymentTypeSuffix = paymentTypeData.get(paymentType);
            String consumerCode = taskNumber + "_" + paymentTypeSuffix;
            demandList.add(createDemandObject(Collections.singletonList(detail), tenantId, consumerCode, businessService, additionalDetails));
        }

        return demandList;
    }

    private Demand createDemandObject(List<DemandDetail> demandDetailList, String tenantId, String consumerCode, String businessService, Object additionalDetails) {
        Demand demand = Demand.builder()
                .tenantId(tenantId)
                .consumerCode(consumerCode)
                .consumerType(config.getTaxConsumerType())
                .businessService(businessService)
                .taxPeriodFrom(config.getTaxPeriodFrom()).taxPeriodTo(config.getTaxPeriodTo())
                .demandDetails(demandDetailList)
                .billExpiryTime(TWO_YEARS_IN_MILLISECOND)
                .additionalDetails(additionalDetails)
                .build();
        return demand;
    }

    private Map<String, String> getTaxHeadMasterCodes(Map<String, Map<String, JSONArray>> mdmsData, String taskBusinessService, String deliveryChannel) {
        if (mdmsData != null && mdmsData.containsKey("payment") && mdmsData.get(config.getPaymentBusinessServiceName()).containsKey(PAYMENTMASTERCODE)) {
            JSONArray masterCode = mdmsData.get(config.getPaymentBusinessServiceName()).get(PAYMENTMASTERCODE);
            Map<String, String> result = new HashMap<>();
            for (Object masterCodeObj : masterCode) {
                Map<String, String> subType = (Map<String, String>) masterCodeObj;
                if (taskBusinessService.equals(subType.get("businessService")) && deliveryChannel.equalsIgnoreCase(subType.get("deliveryChannel"))) {
                    result.put(subType.get("type"), subType.get("masterCode"));
                    masterCodePayemntTypeMap.put(subType.get("masterCode"), subType.get("paymentType"));
                }
            }
            return result;
        }
        return Collections.emptyMap();
    }

    private Map<String, String> getPaymentType(Map<String, Map<String, JSONArray>> mdmsData, String channelName, String businessService) {
        if (mdmsData != null && mdmsData.containsKey("payment") && mdmsData.get(config.getPaymentBusinessServiceName()).containsKey(PAYMENTTYPE)) {
            JSONArray masterCode = mdmsData.get(config.getPaymentBusinessServiceName()).get(PAYMENTTYPE);

            String filterStringDeliveryChannel = String.format(
                    FILTER_PAYMENT_TYPE_DELIVERY_CHANNEL, channelName
            );

            JSONArray paymentTypeData = JsonPath.read(masterCode, filterStringDeliveryChannel);
            Map<String, String> result = new HashMap<>();
            for (Object masterCodeObj : paymentTypeData) {
                Map<String, Object> subType = (Map<String, Object>) masterCodeObj;

                if (isMatchingBusinessService(subType, businessService, channelName)) {
                    String suffix = (String) subType.get("suffix");
                    String paymentType = (String) subType.get("paymentType");
                    result.put(paymentType, suffix);
                }
            }
            return result;
        }
        return null;
    }


    private boolean isMatchingBusinessService(Map<String, Object> subType, String taskBusinessService, String deliveryChannel) {
        List<Map<String, Object>> businessServices = (List<Map<String, Object>>) subType.get("businessService");

        for (Map<String, Object> service : businessServices) {
            if (taskBusinessService.equals(service.get("businessCode"))
                    && deliveryChannel.equalsIgnoreCase((String) subType.get("deliveryChannel"))) {
                return true; // Found a match
            }
        }
        return false; // No match found
    }

    private List<String> createMasterDetails() {
        List<String> masterList = new ArrayList<>();
        masterList.add(PAYMENTMASTERCODE);
        masterList.add(PAYMENTTYPE);
        masterList.add(PAYMENTMODE);
        return masterList;
    }

    public BillResponse getBill(RequestInfo requestInfo, Task task) {
        String businessService = getBusinessService(task.getTaskType());
        String uri = buildFetchBillURI(task.getTenantId(), Collections.singleton(task.getTaskNumber()), businessService);

        RequestInfoWrapper requestInfoWrapper = RequestInfoWrapper.builder().requestInfo(requestInfo).build();
        Object response = repository.fetchResult(new StringBuilder(uri), requestInfoWrapper);

        return mapper.convertValue(response, BillResponse.class);
    }

    public BillResponse getBillWithMultipleConsumerCode(RequestInfo requestInfo, Set<String> consumerCodes, Task task, String businessService) {
        String uri = buildFetchBillURI(task.getTenantId(), consumerCodes, businessService);

        Role role = Role.builder().code(config.getPaymentCollector()).tenantId(config.getEgovStateTenantId()).build();
        requestInfo.getUserInfo().getRoles().add(role);
        RequestInfoWrapper requestInfoWrapper = RequestInfoWrapper.builder().requestInfo(requestInfo).build();
        Object response = repository.fetchResult(new StringBuilder(uri), requestInfoWrapper);

        return mapper.convertValue(response, BillResponse.class);
    }

    private String buildFetchBillURI(String tenantId, Set<String> applicationNumbers, String businessService) {
        try {
            String encodedTenantId = URLEncoder.encode(tenantId, StandardCharsets.UTF_8);
            String encodedBusinessService = URLEncoder.encode(businessService, StandardCharsets.UTF_8);
            String applicationNumbersParam = applicationNumbers.stream()
                    .map(num -> URLEncoder.encode(num, StandardCharsets.UTF_8))
                    .collect(Collectors.joining(","));

            return URI.create(String.format("%s%s?tenantId=%s&consumerCode=%s&businessService=%s",
                    config.getBillingServiceHost(),
                    config.getFetchBillEndpoint(),
                    encodedTenantId,
                    applicationNumbersParam,
                    encodedBusinessService)).toString();
        } catch (Exception e) {
            log.error("Error occurred when creating bill URI with search params", e);
            throw new CustomException("GENERATE_BILL_ERROR", "Error occurred when generating bill");
        }
    }

    public CaseSearchRequest createCaseSearchRequest(RequestInfo requestInfo, Task task) {
        CaseSearchRequest caseSearchRequest = new CaseSearchRequest();
        caseSearchRequest.setRequestInfo(requestInfo);
        CaseCriteria caseCriteria = CaseCriteria.builder().filingNumber(task.getFilingNumber()).defaultFields(false).build();
        caseSearchRequest.addCriteriaItem(caseCriteria);
        return caseSearchRequest;
    }

    private String getBusinessService(String taskType) {
        return switch (taskType.toUpperCase()) {
            case SUMMON -> config.getTaskSummonBusinessService();
            case WARRANT -> config.getTaskWarrantBusinessService();
            case NOTICE -> config.getTaskNoticeBusinessService();
            default -> throw new IllegalArgumentException("Unsupported task type: " + taskType);
        };
    }

    private String getTestCourtTaxHeadMasterCode(String businessService) {
        if (businessService.equalsIgnoreCase(config.getTaskNoticeBusinessService())) {
            return config.getTaskNoticeTaxHeadCourtMasterCode();
        } else {
            return config.getTaskSummonTaxHeadCourtMasterCode();
        }
    }
    private String getTestRpadTaxHeadMasterCode(String businessService) {
        if (businessService.equalsIgnoreCase(config.getTaskNoticeBusinessService())) {
            return config.getTaskNoticeTaxHeadRpadCourtMasterCode();
        } else {
            return config.getTaskSummonTaxHeadRpadCourtMasterCode();
        }
    }

    private String getTestPostTaxHeadMasterCode(String businessService) {
        if (businessService.equalsIgnoreCase(config.getTaskNoticeBusinessService())) {
            return config.getTaskNoticeTaxHeadEPostMasterCode();
        } else {
            return config.getTaskSummonTaxHeadEPostMasterCode();
        }
    }

    private String getTestPoliceTaxHeadMasterCode(String businessService) {
        if (businessService.equalsIgnoreCase(config.getTaskWarrantBusinessService())) {
            return config.getTaskWarrantPoliceTaxHeadMasterCode();
        } else {
            return config.getTaskSummonPoliceTaxHeadMasterCode();
        }
    }

    private String getTestTaxEmailHeadMasterCode(String businessService) {
        if (businessService.equalsIgnoreCase(config.getTaskNoticeBusinessService())) {
            return config.getTaskNoticeEmailTaxHeadMasterCode();
        } else {
            return config.getTaskSummonEmailTaxHeadMasterCode();
        }
    }
    private String getTestTaxSmsHeadMasterCode(String businessService) {
        if (businessService.equalsIgnoreCase(config.getTaskNoticeBusinessService())) {
            return config.getTaskNoticeSmsTaxHeadMasterCode();
        } else {
            return config.getTaskSummonSmsTaxHeadMasterCode();
        }
    }

}