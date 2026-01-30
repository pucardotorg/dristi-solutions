package digit.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import digit.config.Configuration;
import digit.repository.ServiceRequestRepository;
import digit.util.DemandUtil;
import digit.util.ETreasuryUtil;
import digit.util.OfflinePaymentUtil;
import digit.web.models.*;
import digit.web.models.PaymentCalculator.BreakDown;
import digit.web.models.PaymentCalculator.Calculation;
import digit.web.models.PaymentCalculator.CalculationResponse;
import digit.web.models.PaymentCalculator.TaskPaymentCriteria;
import digit.web.models.PaymentCalculator.TaskPaymentRequest;
import digit.web.models.demand.*;
import digit.web.models.enums.StatusEnum;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.RequestInfoWrapper;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.util.*;

import static digit.config.ServiceConstants.*;

@Service
@Slf4j
public class DemandService {

    private final DemandUtil demandUtil;

    private final Configuration configuration;

    private final ServiceRequestRepository repository;

    private final ObjectMapper mapper;

    private final ETreasuryUtil etreasuryUtil;

    private final OfflinePaymentUtil offlinePaymentUtil;

    @Autowired
    public DemandService(DemandUtil demandUtil, Configuration configuration, ServiceRequestRepository repository, ObjectMapper mapper, ETreasuryUtil etreasuryUtil, OfflinePaymentUtil offlinePaymentUtil) {
        this.demandUtil = demandUtil;
        this.configuration = configuration;
        this.repository = repository;
        this.mapper = mapper;
        this.etreasuryUtil = etreasuryUtil;
        this.offlinePaymentUtil = offlinePaymentUtil;
    }


    public void createDemand(TaskManagementRequest request) {

        log.info("Creating demand for task management : {} ", request.getTaskManagement().getTaskManagementNumber());

        List<Calculation> calculationList = generatePaymentDetails(request);

        if (calculationList == null || calculationList.isEmpty()) {
            throw new CustomException(PAYMENT_CALCULATOR_ERROR, "Getting empty or null data from payment-calculator");
        }

        Calculation aggregatedCalculation = aggregateCalculations(calculationList, request.getTaskManagement());

        log.info("Aggregated calculation - Total Amount: {}, Breakdown count: {}", aggregatedCalculation.getTotalAmount(), aggregatedCalculation.getBreakDown() != null ? aggregatedCalculation.getBreakDown().size() : 0);

        createDemandForTaskManagementPayment(request, aggregatedCalculation);

        log.info("Demand created for task management : {} ", request.getTaskManagement().getTaskManagementNumber());

    }

    public void updateDemand(TaskManagementRequest request) {

        log.info("Updating demand for task management : {} ", request.getTaskManagement().getTaskManagementNumber());

        // fetch the demands and cancel them
        cancelTaskManagementDemands(request);

        // create the demands

        createDemand(request);

        log.info("Demand updated for task management : {} ", request.getTaskManagement().getTaskManagementNumber());

    }

    public void cancelTaskManagementDemands(TaskManagementRequest request) {

        RequestInfo requestInfo = request.getRequestInfo();

        String tenantId = request.getTaskManagement().getTenantId();

        String consumerCode = request.getTaskManagement().getTaskManagementNumber() + "_" + configuration.getTaskManagementSuffix();

        Set<String> consumerCodes = new HashSet<>();
        consumerCodes.add(consumerCode);

        log.info("Fetching demands for consumer codes: {}", consumerCodes);

        DemandCriteria criteria = new DemandCriteria();
        criteria.setConsumerCode(consumerCodes);
        criteria.setTenantId(tenantId);
        criteria.setStatus(Demand.StatusEnum.ACTIVE.toString());

        RequestInfoWrapper wrapper = new RequestInfoWrapper();
        wrapper.setRequestInfo(requestInfo);

        if (consumerCodes.isEmpty()) {
            log.info("No consumer codes found for tasks");
            return;
        }

        DemandResponse demandResponse = demandUtil.searchDemand(criteria, wrapper);
        if (CollectionUtils.isEmpty(demandResponse.getDemands())) {
            log.info("No demands found for consumer codes: {}", consumerCodes);
            return;
        }

//        closeOfflinePaymentTask(requestInfo, consumerCode, request.getTaskManagement().getFilingNumber(), tenantId);

        demandResponse.getDemands().forEach(d -> d.setStatus(Demand.StatusEnum.CANCELLED));
        log.info("Marking {} demands as CANCELLED", demandResponse.getDemands().size());

        DemandRequest demandRequest = new DemandRequest();
        demandRequest.setRequestInfo(requestInfo);
        demandRequest.setDemands(demandResponse.getDemands());

        DemandResponse updatedDemandResponse = demandUtil.updateDemand(demandRequest);
        log.info("Updated demand status to CANCELLED for consumer codes: {}, updated demands: {}", consumerCodes, updatedDemandResponse.getDemands());
    }

    private void closeOfflinePaymentTask(RequestInfo requestInfo, String consumerCode, String filingNumber, String tenantId) {
        try {
            log.info("Closing offline payment task for consumer code: {}", consumerCode);

            // Build the offline payment task request
            OfflinePaymentTask offlinePaymentTask = OfflinePaymentTask.builder()
                    .consumerCode(consumerCode)
                    .filingNumber(filingNumber)
                    .tenantId(tenantId)
                    .status(StatusEnum.CANCELLED)
                    .build();

            OfflinePaymentTaskRequest offlinePaymentTaskRequest = OfflinePaymentTaskRequest.builder()
                    .requestInfo(requestInfo)
                    .offlinePaymentTask(offlinePaymentTask)
                    .build();

            // Call the offline payment API
//            offlinePaymentUtil.callOfflinePaymentAPI(offlinePaymentTaskRequest);

            log.info("Successfully closed offline payment task for consumer code: {}", consumerCode);
        } catch (Exception e) {
            log.error("Error while closing offline payment task for consumer code: {}", consumerCode, e);
            throw new CustomException("ERROR_CLOSING_OFFLINE_PAYMENT", "Error while closing offline payment task: " + e.getMessage());
        }
    }

    /**
     * Aggregates a list of calculations into a single calculation by:
     * - Summing all totalAmount values
     * - Combining breakdowns by code (summing amounts for same code)
     *
     * @param calculationList List of calculations to aggregate
     * @param taskManagement  Task management object for metadata
     * @return Single aggregated calculation
     */
    private Calculation aggregateCalculations(List<Calculation> calculationList, TaskManagement taskManagement) {
        if (calculationList == null || calculationList.isEmpty()) {
            return null;
        }

        // Sum all total amounts
        double totalAmount = calculationList.stream()
                .mapToDouble(calc -> calc.getTotalAmount() != null ? calc.getTotalAmount() : 0.0)
                .sum();

        // Aggregate breakdowns by code
        Map<String, BreakDown> breakdownMap = new HashMap<>();

        for (Calculation calculation : calculationList) {
            if (calculation.getBreakDown() != null) {
                for (BreakDown breakDown : calculation.getBreakDown()) {
                    String code = breakDown.getCode();

                    if (breakdownMap.containsKey(code)) {
                        // Sum the amount for existing code
                        BreakDown existing = breakdownMap.get(code);
                        double newAmount = (existing.getAmount() != null ? existing.getAmount() : 0.0)
                                + (breakDown.getAmount() != null ? breakDown.getAmount() : 0.0);
                        existing.setAmount(newAmount);
                    } else {
                        // Add new breakdown entry
                        breakdownMap.put(code, BreakDown.builder()
                                .type(breakDown.getType())
                                .code(breakDown.getCode())
                                .amount(breakDown.getAmount() != null ? breakDown.getAmount() : 0.0)
                                .additionalParams(breakDown.getAdditionalParams() != null ?
                                        new HashMap<>(breakDown.getAdditionalParams()) : new HashMap<>())
                                .build());
                    }
                }
            }
        }

        List<BreakDown> aggregatedBreakdowns = new ArrayList<>(breakdownMap.values());

        // Build aggregated calculation
        return Calculation.builder()
                .applicationId(taskManagement.getTaskManagementNumber())
                .tenantId(taskManagement.getTenantId())
                .totalAmount(totalAmount)
                .breakDown(aggregatedBreakdowns)
                .build();
    }

    public List<Calculation> generatePaymentDetails(TaskManagementRequest request) {
        TaskManagement taskManagement = request.getTaskManagement();
        RequestInfo requestInfo = request.getRequestInfo();

        List<TaskPaymentCriteria> criteriaList = new ArrayList<>();

        // Create criteria for each party detail with delivery channels
        if (taskManagement.getPartyDetails() != null && !taskManagement.getPartyDetails().isEmpty()) {
            taskManagement.getPartyDetails().forEach(partyDetail -> {
                if (partyDetail.getDeliveryChannels() != null && !partyDetail.getDeliveryChannels().isEmpty()) {
                    partyDetail.getDeliveryChannels().forEach(deliveryChannel -> {
                        if (partyDetail.getAddresses() != null && !partyDetail.getAddresses().isEmpty()) {
                            partyDetail.getAddresses().forEach(address -> {
                                TaskPaymentCriteria criteria = TaskPaymentCriteria.builder()
                                        .channelId(deliveryChannel.getChannelId())
                                        .receiverPincode(address.getAddressDetails().getPincode())
                                        .tenantId(taskManagement.getTenantId())
                                        .taskType(taskManagement.getTaskType())
                                        .id(taskManagement.getTaskManagementNumber())
                                        .build();
                                criteriaList.add(criteria);
                            });
                        }
                    });
                }
            });
        }

        if (criteriaList.isEmpty()) {
            log.warn("No criteria created for task management: {}", taskManagement.getTaskManagementNumber());
            return Collections.emptyList();
        }

        StringBuilder url = new StringBuilder().append(configuration.getPaymentCalculatorHost())
                .append(configuration.getPaymentCalculatorCalculateEndpoint());

        log.info("Requesting Payment Calculator with {} criteria", criteriaList.size());

        TaskPaymentRequest calculationRequest = TaskPaymentRequest.builder()
                .requestInfo(requestInfo)
                .calculationCriteria(criteriaList)
                .build();

        Object response = repository.fetchResult(url, calculationRequest);

        CalculationResponse calculationResponse = mapper.convertValue(response, CalculationResponse.class);
        return calculationResponse.getCalculation();
    }

    private void createDemandForTaskManagementPayment(TaskManagementRequest request, Calculation aggregatedCalculation) {

        try {

            RequestInfo requestInfo = request.getRequestInfo();

            TaskManagement taskManagement = request.getTaskManagement();

            DemandCreateRequest demandCreateRequest = DemandCreateRequest.builder()
                    .requestInfo(requestInfo)
                    .filingNumber(taskManagement.getFilingNumber())
                    .consumerCode(taskManagement.getTaskManagementNumber() + "_" + configuration.getTaskManagementSuffix())
                    .tenantId(taskManagement.getTenantId())
                    .entityType(configuration.getTaskBusinessServiceName())
                    .calculation(Collections.singletonList(aggregatedCalculation))
                    .build();

            etreasuryUtil.createDemand(demandCreateRequest);
        } catch (Exception e) {
            log.error("Error while creating demand for task management: {}", request.getTaskManagement().getTaskManagementNumber(), e);
            throw new CustomException("ERROR_CREATING_DEMAND", "Error while creating demand for task management: " + request.getTaskManagement().getTaskManagementNumber() + ", error: " + e.getMessage());
        }
    }


}
