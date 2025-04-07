package org.pucar.dristi.util;

import static org.pucar.dristi.config.ServiceConstants.ERROR_WHILE_CREATING_DEMAND_FOR_CASE;

import java.util.List;
import java.util.Map;

import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.web.models.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class EtreasuryUtil {

	private RestTemplate restTemplate;

	private Configuration configs;

	@Autowired
	public EtreasuryUtil(RestTemplate restTemplate, Configuration configs) {
		this.restTemplate = restTemplate;
		this.configs = configs;
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
}