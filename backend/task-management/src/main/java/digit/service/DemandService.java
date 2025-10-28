package digit.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import digit.config.Configuration;
import digit.repository.ServiceRequestRepository;
import digit.util.DemandUtil;
import digit.util.ETreasuryUtil;
import digit.util.MdmsUtil;
import digit.web.models.*;
import digit.web.models.PaymentCalculator.BreakDown;
import digit.web.models.PaymentCalculator.Calculation;
import digit.web.models.PaymentCalculator.CalculationResponse;
import digit.web.models.PaymentCalculator.TaskPaymentCriteria;
import digit.web.models.PaymentCalculator.TaskPaymentRequest;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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

    @Autowired
    public DemandService(DemandUtil demandUtil, Configuration configuration, ServiceRequestRepository repository, ObjectMapper mapper, ETreasuryUtil etreasuryUtil) {
        this.demandUtil = demandUtil;
        this.configuration = configuration;
        this.repository = repository;
        this.mapper = mapper;
        this.etreasuryUtil = etreasuryUtil;
    }


    public BillResponse createDemand(TaskManagementRequest request) {

        log.info("Creating demand for task management : {} ", request.getTaskManagement().getTaskManagementNumber());

        List<Calculation> calculationList = generatePaymentDetails(request);

        if (calculationList == null || calculationList.isEmpty()) {
            throw new CustomException(PAYMENT_CALCULATOR_ERROR, "Getting empty or null data from payment-calculator");
        }

        Calculation aggregatedCalculation = aggregateCalculations(calculationList, request.getTaskManagement());

        log.info("Aggregated calculation - Total Amount: {}, Breakdown count: {}", aggregatedCalculation.getTotalAmount(), aggregatedCalculation.getBreakDown() != null ? aggregatedCalculation.getBreakDown().size() : 0);

        createDemandForTaskManagementPayment(request, aggregatedCalculation);

        log.info("Demand created for task management : {} ", request.getTaskManagement().getTaskManagementNumber());

        return null;
    }

    public void updateDemand(TaskManagementRequest request) {

        log.info("Updating demand for task management : {} ", request.getTaskManagement().getTaskManagementNumber());

        log.info("Demand updated for task management : {} ", request.getTaskManagement().getTaskManagementNumber());

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
                                        .receiverPincode(address.getPinCode())
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
