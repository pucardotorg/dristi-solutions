package org.pucar.dristi.util;

import static org.pucar.dristi.config.ServiceConstants.ERROR_WHILE_CREATING_DEMAND_FOR_CASE;

import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.web.models.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import lombok.extern.slf4j.Slf4j;
import org.springframework.web.util.UriComponentsBuilder;

@Slf4j
@Component
public class EtreasuryUtil {

	private RestTemplate restTemplate;

	private Configuration configs;

	private final ObjectMapper mapper;

	@Autowired
	public EtreasuryUtil(RestTemplate restTemplate, Configuration configs, ObjectMapper mapper) {
		this.restTemplate = restTemplate;
		this.configs = configs;
        this.mapper = mapper;
    }

	public void createDemand(JoinCaseV2Request joinCaseRequest, String consumerCode,List<Calculation> calculationList) {
		StringBuilder uri = new StringBuilder();
		uri.append(configs.getEtreasuryHost()).append(configs.getEtreasuryDemandCreateEndPoint());

		DemandCreateRequest demandRequest = new DemandCreateRequest();
		demandRequest.setRequestInfo(joinCaseRequest.getRequestInfo());
		demandRequest.setFilingNumber(joinCaseRequest.getJoinCaseData().getFilingNumber());
		demandRequest.setCalculation(calculationList);
		demandRequest.setConsumerCode(consumerCode);
		demandRequest.setTenantId(joinCaseRequest.getJoinCaseData().getTenantId());
		demandRequest.setEntityType("task-payment");

		log.info("demand request :: {}",demandRequest);
		Object response;
		try {
			response = restTemplate.postForObject(uri.toString(), demandRequest, Map.class);
			log.info("Demand response :: {}", response);
		} catch (Exception e) {
			log.error(ERROR_WHILE_CREATING_DEMAND_FOR_CASE, e);
			throw new CustomException(ERROR_WHILE_CREATING_DEMAND_FOR_CASE, e.getMessage());
		}
	}

    public JsonNode getPaymentReceipt(@Valid RequestInfo requestInfo, String id) {
		StringBuilder uri = new StringBuilder();
		uri.append(configs.getEtreasuryHost()).append(configs.getTreasuryPaymentReceiptEndPoint())
				.append("?id=").append(id);

		log.info("Payment Receipt uri :: {}", uri);
		Object response = null;
		try {
			response = restTemplate.postForObject(uri.toString(), requestInfo, Object.class);
			log.info("Payment Receipt response :: {}", response);
			return mapper.convertValue(response, JsonNode.class);
		} catch (Exception e) {
			log.error("Error while fetching payment receipt", e);
			throw new CustomException("Error while fetching payment receipt", e.getMessage());
		}
	}
}