package org.pucar.dristi.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.web.models.RequestInfoWrapper;
import org.pucar.dristi.web.models.payment.BillResponseV2;
import org.pucar.dristi.web.models.payment.BillSearchCriteria;
import org.pucar.dristi.web.models.payment.CalculationRes;
import org.pucar.dristi.web.models.payment.ChallanRequest;
import org.pucar.dristi.web.models.payment.FetchBillRequest;
import org.pucar.dristi.web.models.payment.GenerateBillCriteria;
import org.pucar.dristi.web.models.payment.HtmlResponse;
import org.pucar.dristi.web.models.payment.PrintResponse;
import org.pucar.dristi.web.models.payment.SearchBillRequest;
import org.pucar.dristi.web.models.payment.TaskPaymentRequest;
import org.pucar.dristi.web.models.payment.TreasuryMappingResponse;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

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
        StringBuilder uri = new StringBuilder(getUriForFetchingBill(billCriteria));


        log.info("method=fetchBill, status=IN_PROGRESS, criteria={}", billCriteria);
        RequestInfoWrapper requestInfoWrapper = new RequestInfoWrapper();
        requestInfoWrapper.setRequestInfo(request.getRequestInfo());

        Object response = serviceRequestRepository.fetchResult(uri, requestInfoWrapper);
        log.info("method=fetchBill, status=SUCCESS");
        return  objectMapper.convertValue(response, BillResponseV2.class);
    }

    private String getUriForFetchingBill(GenerateBillCriteria billCriteria) {
        UriComponentsBuilder builder = UriComponentsBuilder
                .fromHttpUrl(config.getBillingHost() + config.getBillingFetchBillEndpoint())
                .queryParam("tenantId", billCriteria.getTenantId());

        if (billCriteria.getDemandId() != null && !billCriteria.getDemandId().isEmpty())
            builder.queryParam("demandId", billCriteria.getDemandId());

        if (billCriteria.getConsumerCode() != null && !billCriteria.getConsumerCode().isEmpty())
            builder.queryParam("consumerCode", String.join(",", billCriteria.getConsumerCode()));

        if (billCriteria.getBusinessService() != null && !billCriteria.getBusinessService().isEmpty())
            builder.queryParam("businessService", billCriteria.getBusinessService());

        if (billCriteria.getEmail() != null && !billCriteria.getEmail().isEmpty())
            builder.queryParam("email", billCriteria.getEmail());

        if (billCriteria.getMobileNumber() != null && !billCriteria.getMobileNumber().isEmpty())
            builder.queryParam("mobileNumber", billCriteria.getMobileNumber());

        return builder.toUriString();
    }


    public BillResponseV2 searchBill(SearchBillRequest request) {

        BillSearchCriteria billSearchCriteria = request.getBillSearchCriteria();
        StringBuilder uri = new StringBuilder(getUriForSearchingBill(billSearchCriteria));

        log.info("method=searchBill, status=IN_PROGRESS, criteria={}", billSearchCriteria);
        RequestInfoWrapper requestInfoWrapper = new RequestInfoWrapper();
        requestInfoWrapper.setRequestInfo(request.getRequestInfo());

        Object response = serviceRequestRepository.fetchResult(uri, requestInfoWrapper);
        log.info("method=searchBill, status=SUCCESS");
        return  objectMapper.convertValue(response, BillResponseV2.class);
    }

    private String getUriForSearchingBill(BillSearchCriteria criteria) {
        UriComponentsBuilder builder = UriComponentsBuilder
                .fromHttpUrl(config.getBillingHost() + config.getBillingSearchEndpoint())
                .queryParam("tenantId", criteria.getTenantId());

        if (criteria.getBillId() != null && !criteria.getBillId().isEmpty())
            builder.queryParam("billId", String.join(",", criteria.getBillId()));

        if (criteria.getFromPeriod() != null)
            builder.queryParam("fromPeriod", criteria.getFromPeriod());

        if (criteria.getToPeriod() != null)
            builder.queryParam("toPeriod", criteria.getToPeriod());

        if (criteria.getRetrieveOldest() != null)
            builder.queryParam("retrieveOldest", criteria.getRetrieveOldest());

        if (criteria.getIsActive() != null)
            builder.queryParam("isActive", criteria.getIsActive());

        if (criteria.getIsCancelled() != null)
            builder.queryParam("isCancelled", criteria.getIsCancelled());

        if (criteria.getConsumerCode() != null && !criteria.getConsumerCode().isEmpty())
            builder.queryParam("consumerCode", String.join(",", criteria.getConsumerCode()));

        if (criteria.getBillNumber() != null)
            builder.queryParam("billNumber", criteria.getBillNumber());

        if (criteria.getService() != null)
            builder.queryParam("service", criteria.getService());

        builder.queryParam("isOrderBy", criteria.isOrderBy());

        if (criteria.getSize() != null)
            builder.queryParam("size", criteria.getSize());

        if (criteria.getOffset() != null)
            builder.queryParam("offset", criteria.getOffset());

        if (criteria.getEmail() != null)
            builder.queryParam("email", criteria.getEmail());

        if (criteria.getStatus() != null)
            builder.queryParam("status", criteria.getStatus().name());

        if (criteria.getMobileNumber() != null)
            builder.queryParam("mobileNumber", criteria.getMobileNumber());

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

    public PrintResponse getPaymentReceipt(String billId, RequestInfo requestInfo) {
        StringBuilder uri = new StringBuilder();
        uri.append(config.getEtreasuryHost()).append(config.getEtreasuryGetPaymentReceiptEndpoint());
        uri.append("?billId=").append(billId);
        log.info("method=getPaymentReceipt, status=IN_PROGRESS, billId={}", billId);

        Object response = serviceRequestRepository.fetchResult(uri, requestInfo);
        log.info("method=getPaymentReceipt, status=SUCCESS");
        return objectMapper.convertValue(response, PrintResponse.class);

    }

}
