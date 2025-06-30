package org.pucar.dristi.util;

import static org.pucar.dristi.config.ServiceConstants.ERROR_WHILE_CREATING_DEMAND_FOR_CASE;
import static org.pucar.dristi.config.ServiceConstants.TAX_AMOUNT;
import static org.pucar.dristi.config.ServiceConstants.TAX_HEADMASTER_CODE;
import static org.pucar.dristi.config.ServiceConstants.TAX_PERIOD_FROM;
import static org.pucar.dristi.config.ServiceConstants.TAX_PERIOD_TO;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.databind.JsonNode;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.jetbrains.annotations.NotNull;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.web.models.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class BillingUtil {

	private RestTemplate restTemplate;

	private Configuration configs;

	private final ObjectMapper mapper;

	@Autowired
	public BillingUtil(RestTemplate restTemplate, Configuration configs, ObjectMapper mapper) {
		this.restTemplate = restTemplate;
		this.configs = configs;
        this.mapper = mapper;
    }

	public void createDemand(CaseRequest caseRequest) {
		StringBuilder uri = new StringBuilder();
		uri.append(configs.getBillingHost()).append(configs.getDemandCreateEndPoint());

		DemandRequest demandRequest = new DemandRequest();
		demandRequest.setRequestInfo(caseRequest.getRequestInfo());
		Demand demand = new Demand();
		demand.setTenantId(caseRequest.getCases().getTenantId());
		demand.setConsumerCode(caseRequest.getCases().getFilingNumber());
		demand.setPayer(caseRequest.getRequestInfo().getUserInfo());
		demand.setTaxPeriodFrom(TAX_PERIOD_FROM);
		demand.setTaxPeriodTo(TAX_PERIOD_TO);
		demand.setBusinessService(configs.getCaseBusinessServiceName());
		demand.setConsumerType(configs.getCaseBusinessServiceName());
		demand.setAuditDetails(caseRequest.getCases().getAuditdetails());

		DemandDetail demandDetail = new DemandDetail();
		demandDetail.setTaxAmount(TAX_AMOUNT);
		demandDetail.setTaxHeadMasterCode(TAX_HEADMASTER_CODE);
		demand.addDemandDetailsItem(demandDetail);

		List<Demand> demands = new ArrayList<>();
		demands.add(demand);
		demandRequest.setDemands(demands);

		Object response;
		try {
			response = restTemplate.postForObject(uri.toString(), demandRequest, Map.class);
			log.info("Demand response :: {}", response);
		} catch (Exception e) {
			log.error(ERROR_WHILE_CREATING_DEMAND_FOR_CASE, e);
			throw new CustomException(ERROR_WHILE_CREATING_DEMAND_FOR_CASE, e.getMessage());
		}
	}

	public void createDemand(JoinCaseRequest joinCaseRequest, String consumerCode) {
		StringBuilder uri = new StringBuilder();
		uri.append(configs.getBillingHost()).append(configs.getDemandCreateEndPoint());

		DemandRequest demandRequest = new DemandRequest();
		demandRequest.setRequestInfo(joinCaseRequest.getRequestInfo());
		Demand demand = getDemand(joinCaseRequest, consumerCode);

		List<Demand> demands = new ArrayList<>();
		demands.add(demand);
		demandRequest.setDemands(demands);

		Object response;
		try {
			response = restTemplate.postForObject(uri.toString(), demandRequest, Map.class);
			log.info("Demand response :: {}", response);
		} catch (Exception e) {
			log.error(ERROR_WHILE_CREATING_DEMAND_FOR_CASE, e);
			throw new CustomException(ERROR_WHILE_CREATING_DEMAND_FOR_CASE, e.getMessage());
		}
	}

	private static Demand getDemand(JoinCaseRequest joinCaseRequest, String consumerCode) {
		Demand demand = new Demand();
		demand.setTenantId(joinCaseRequest.getRequestInfo().getUserInfo().getTenantId());
		demand.setConsumerCode(consumerCode);
		demand.setPayer(joinCaseRequest.getRequestInfo().getUserInfo());
		demand.setTaxPeriodFrom(TAX_PERIOD_FROM);
		demand.setTaxPeriodTo(TAX_PERIOD_TO);
		demand.setBusinessService("task-default");
		demand.setConsumerType("task-default");
		demand.setAuditDetails(joinCaseRequest.getAuditDetails());

		DemandDetail demandDetail = new DemandDetail();
		demandDetail.setTaxAmount(TAX_AMOUNT);
		demandDetail.setTaxHeadMasterCode("JOIN_CASE_ADVOCATE_FEES");
		demand.addDemandDetailsItem(demandDetail);
		return demand;
	}

	public JsonNode searchBill(RequestInfo requestInfo, String billId) {
		StringBuilder uri = new StringBuilder();
		uri.append(configs.getBillingHost())
				.append(configs.getSearchBillEndPoint())
				.append("?tenantId=").append(configs.getTenantId())
				.append("&billId=").append(billId);

		try {
			Map<String, Object> requestPayload = new HashMap<>();
			requestPayload.put("RequestInfo", requestInfo);
			HttpHeaders headers = new HttpHeaders();
			headers.setContentType(MediaType.APPLICATION_JSON);

			HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestPayload, headers);
			log.info("Calling Bill Search API :: {} with payload :: {}", uri, mapper.writeValueAsString(requestPayload));
			ResponseEntity<JsonNode> response = restTemplate.exchange(
					uri.toString(),
					HttpMethod.POST,
					entity,
					JsonNode.class
			);

			log.info("Bill response :: {}", response.getBody());
			return response.getBody();
		} catch (Exception e) {
			log.error("Error while fetching bill", e);
			throw new CustomException("BILL_FETCH_ERROR", e.getMessage());
		}
	}

}