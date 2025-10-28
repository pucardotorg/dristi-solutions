package digit.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import digit.config.Configuration;
import digit.repository.ServiceRequestRepository;
import digit.util.DemandUtil;
import digit.web.models.Payment_Calculator.Calculation;
import digit.web.models.Payment_Calculator.CalculationResponse;
import digit.web.models.Payment_Calculator.TaskPaymentCriteria;
import digit.web.models.Payment_Calculator.TaskPaymentRequest;
import digit.web.models.TaskManagement;
import digit.web.models.TaskManagementRequest;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static digit.config.ServiceConstants.PAYMENT_CALCULATOR_ERROR;

@Service
@Slf4j
public class DemandService {

    private final DemandUtil demandUtil;

    private final Configuration configuration;

    private final ServiceRequestRepository repository;

    private final ObjectMapper mapper;

    @Autowired
    public DemandService(DemandUtil demandUtil, Configuration configuration, ServiceRequestRepository repository, ObjectMapper mapper) {
        this.demandUtil = demandUtil;
        this.configuration = configuration;
        this.repository = repository;
        this.mapper = mapper;
    }

    public void createDemand(TaskManagementRequest request) {

        log.info("Creating demand for task management : {} ", request.getTaskManagement().getTaskManagementNumber());

        List<Calculation> calculationList = generatePaymentDetails(request);

        if (calculationList == null || calculationList.isEmpty()) {
            throw new CustomException(PAYMENT_CALCULATOR_ERROR, "Getting empty or null data from payment-calculator");
        }

    }

    public void updateDemand(TaskManagementRequest request) {

        log.info("Updating demand for task management : {} ", request.getTaskManagement().getTaskManagementNumber());

        log.info("Demand updated for task management : {} ", request.getTaskManagement().getTaskManagementNumber());

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
                                        .channelId(deliveryChannel.getChannelName())
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

}
