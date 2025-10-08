package pucar.strategy.ordertype;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.springframework.stereotype.Component;
import pucar.strategy.OrderUpdateStrategy;
import pucar.util.ApplicationUtil;
import pucar.util.CaseUtil;
import pucar.util.JsonUtil;
import pucar.util.OrderUtil;
import pucar.web.models.Order;
import pucar.web.models.OrderRequest;
import pucar.web.models.adiary.CaseDiaryEntry;
import pucar.web.models.application.Application;
import pucar.web.models.application.ApplicationCriteria;
import pucar.web.models.application.ApplicationSearchRequest;
import pucar.web.models.courtCase.*;

import java.util.ArrayList;
import java.util.List;

import static pucar.config.ServiceConstants.*;

@Component
@Slf4j
public class PublishOrderForVoluntarySubmissionWitness implements OrderUpdateStrategy {

    private final ApplicationUtil applicationUtil;
    private final CaseUtil caseUtil;
    private final JsonUtil jsonUtil;
    private final ObjectMapper mapper;
    private final OrderUtil orderUtil;

    public PublishOrderForVoluntarySubmissionWitness(ApplicationUtil applicationUtil, CaseUtil caseUtil, JsonUtil jsonUtil, ObjectMapper mapper, OrderUtil orderUtil) {
        this.applicationUtil = applicationUtil;
        this.caseUtil = caseUtil;
        this.jsonUtil = jsonUtil;
        this.mapper = mapper;
        this.orderUtil = orderUtil;
    }

    @Override
    public boolean supportsPreProcessing(OrderRequest orderRequest) {
        return false;
    }

    @Override
    public boolean supportsPostProcessing(OrderRequest orderRequest) {
        Order order = orderRequest.getOrder();
        return order.getOrderType() != null && E_SIGN.equalsIgnoreCase(order.getWorkflow().getAction()) && APPROVE_VOLUNTARY_SUBMISSIONS.equalsIgnoreCase(order.getOrderType());
    }

    @Override
    public OrderRequest preProcess(OrderRequest orderRequest) {
        return null;
    }

    @Override
    public OrderRequest postProcess(OrderRequest orderRequest) {
        log.info("operation=postProcess, result= IN_PROGRESS, orderType:{}, orderNumber:{}", orderRequest.getOrder().getOrderType(), orderRequest.getOrder().getOrderNumber());
        Order order = orderRequest.getOrder();
        String referenceId = orderUtil.getReferenceId(order);
        List<Application> applications = applicationUtil.searchApplications(ApplicationSearchRequest.builder()
                .requestInfo(orderRequest.getRequestInfo())
                .criteria(ApplicationCriteria.builder().applicationNumber(referenceId).tenantId(order.getTenantId()).build())
                .build());
        for(Application application : applications) {
            if(ADDING_WITNESSES.equalsIgnoreCase(application.getApplicationType())) {
                addWitnessToCase(application, orderRequest.getRequestInfo());
            }
        }
        log.info("operation=postProcess, result= COMPLETED, orderType:{}, orderNumber:{}", orderRequest.getOrder().getOrderType(), orderRequest.getOrder().getOrderNumber());
        return null;
    }

    private void addWitnessToCase(Application application, @Valid RequestInfo requestInfo) {
        Object additionalDetails = application.getAdditionalDetails();
        
        if (additionalDetails == null) {
            log.warn("No additional details found in application: {}", application.getApplicationNumber());
            return;
        }
        Object witnessDetails = jsonUtil.getNestedValue(additionalDetails, List.of("witnessDetails"), Object.class);
        if (witnessDetails == null) {
            log.warn("No witnessDetails found in application additionalDetails for application: {}", application.getApplicationNumber());
            return;
        }
        
        log.info("Processing witness details for application: {}", application.getApplicationNumber());
        
        try {
            WitnessDetailsRequest witnessDetailsRequest = WitnessDetailsRequest.builder()
                    .requestInfo(requestInfo)
                    .caseFilingNumber(application.getFilingNumber())
                    .tenantId(application.getTenantId())
                    .witnessDetails(createWitnessDetails(witnessDetails))
                    .build();
            caseUtil.addWitnessToCase(witnessDetailsRequest);
        } catch (Exception e) {
            log.error("Error adding witness to case for application: {}", application.getApplicationNumber(), e);
            throw new CustomException(ERROR_ADDING_WITNESS, e.getMessage());
        }
    }

    public List<WitnessDetails> createWitnessDetails(Object witnessDetails) {
        List<WitnessDetails> witnessDetailsList = new ArrayList<>();
        JsonNode witnessDetailsNode = mapper.convertValue(witnessDetails, JsonNode.class);
        for(JsonNode witnessDetail : witnessDetailsNode) {
            WitnessDetails witness = mapper.convertValue(witnessDetail.get("data"), WitnessDetails.class);
            witness.setUniqueId(witnessDetail.get("uniqueId").textValue());
            witnessDetailsList.add(witness);
        }
        return witnessDetailsList;
    }

    @Override
    public boolean supportsCommon(OrderRequest request) {
        return false;
    }

    @Override
    public CaseDiaryEntry execute(OrderRequest request) {
        return null;
    }
}
