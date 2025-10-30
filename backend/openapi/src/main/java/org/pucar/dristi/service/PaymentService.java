package org.pucar.dristi.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.web.models.payment.BillResponseV2;
import org.pucar.dristi.web.models.payment.CalculationRes;
import org.pucar.dristi.web.models.payment.ChallanRequest;
import org.pucar.dristi.web.models.payment.FetchBillRequest;
import org.pucar.dristi.web.models.payment.GenerateBillCriteria;
import org.pucar.dristi.web.models.payment.HtmlResponse;
import org.pucar.dristi.web.models.payment.TaskPaymentRequest;
import org.pucar.dristi.web.models.payment.TreasuryMappingResponse;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Set;

@Service
@Slf4j
public class PaymentService {

    private final Configuration config;
    private final ServiceRequestRepository serviceRequestRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public PaymentService(Configuration config, ServiceRequestRepository serviceRequestRepository, RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.config = config;
        this.serviceRequestRepository = serviceRequestRepository;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    public BillResponseV2 fetchBill(FetchBillRequest request) {
        GenerateBillCriteria billCriteria = request.getBillCriteria();
        String uri = getUriForFetchingBill(billCriteria);


        log.info("method=fetchBill, status=IN_PROGRESS, criteria={}", billCriteria);
        BillResponseV2 response;

        try {
            response = restTemplate.postForEntity(uri, request.getRequestInfo(), BillResponseV2.class)
                    .getBody();
            log.info("method=fetchBill, status=SUCCESS");
            return response;
        } catch (Exception e) {
            log.error("Error calling bill search API", e);
            throw new CustomException("BILL_SEARCH_API_ERROR", "Error calling bill search API");
        }
    }

    private String getUriForFetchingBill(GenerateBillCriteria billCriteria) {
        UriComponentsBuilder builder = UriComponentsBuilder
                .fromHttpUrl(config.getBillingHost() + config.getBillingSearchEndpoint())
                .queryParam("businessService", billCriteria.getBusinessService())
                .queryParam("tenantId", billCriteria.getTenantId());


        String demandId = billCriteria.getDemandId();
        Set<String> consumerCodes = billCriteria.getConsumerCode();
        String email = billCriteria.getEmail();
        String mobileNumber = billCriteria.getMobileNumber();

        if (demandId != null && !demandId.isEmpty()) {
            builder.queryParam("demandId", demandId);
        }

        if (consumerCodes != null && !consumerCodes.isEmpty()) {
            for (String code : consumerCodes) {
                builder.queryParam("consumerCode", code);
            }
        }

        if (email != null && !email.isEmpty()) {
            builder.queryParam("email", email);
        }

        if (mobileNumber != null && !mobileNumber.isEmpty()) {
            builder.queryParam("mobileNumber", mobileNumber);
        }

        return builder.toUriString();
    }

    public TreasuryMappingResponse getHeadBreakDown(String consumerCode, RequestInfo requestInfo) {
        StringBuilder uri = new StringBuilder();
        uri.append(config.getEtreasuryHost()).append(config.getEtreasuryGetBreakdownEndpoint())
                .append("?consumerCode=").append(consumerCode);
        log.info("method=getHeadBreakDown, status=IN_PROGRESS, consumerCode={}", consumerCode);

        Object response = serviceRequestRepository.fetchResult(uri, requestInfo);
        log.info("method=getHeadBreakDown, status=SUCCESS");
        return objectMapper.convertValue(response, TreasuryMappingResponse.class);

    }

    public HtmlResponse processChallan(ChallanRequest request) {
        StringBuilder uri = new StringBuilder();
        uri.append(config.getEtreasuryHost())
                .append(config.getEtreasuryProcessChallanEndpoint());
        log.info("method=processChallan, status=IN_PROGRESS, request={}", request);

        Object response = serviceRequestRepository.fetchResult(uri, request);
        log.info("method=processChallan, status=SUCCESS");
        return objectMapper.convertValue(response, HtmlResponse.class);
    }

    public CalculationRes calculatePayment(TaskPaymentRequest request) {
        StringBuilder uri = new StringBuilder();
        uri.append(config.getPaymentCalculatorHost()).append(config.getPaymentCalculatorCalculateEndpoint());
        log.info("method=calculatePayment, status=IN_PROGRESS, request={}", request);

        Object response = serviceRequestRepository.fetchResult(uri, request);
        log.info("method=calculatePayment, status=SUCCESS");
        return objectMapper.convertValue(response, CalculationRes.class);
    }

}
