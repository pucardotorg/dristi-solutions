package org.pucar.dristi.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.web.models.Calculation;
import org.pucar.dristi.web.models.DemandCreateRequest;
import org.pucar.dristi.web.models.TaskRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

import static org.pucar.dristi.config.ServiceConstants.ERROR_WHILE_CREATING_DEMAND_FOR_GENERIC_TASK;


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

	public void createDemand(TaskRequest body, String consumerCode, Calculation calculation) {
		StringBuilder uri = new StringBuilder();
		uri.append(configs.getEtreasuryHost()).append(configs.getEtreasuryDemandCreateEndPoint());

		DemandCreateRequest demandRequest = DemandCreateRequest.builder()
				.consumerCode(consumerCode)
				.calculation(List.of(calculation))
				.filingNumber(body.getTask().getFilingNumber())
				.entityType(configs.getTaskGenericBusinessServiceName())
				.tenantId(body.getTask().getTenantId())
				.requestInfo(body.getRequestInfo())
				.build();

		log.info("demand request :: {}",demandRequest);
		Object response;
		try {
			response = restTemplate.postForObject(uri.toString(), demandRequest, Map.class);
			log.info("Demand response :: {}", response);
		} catch (Exception e) {
			log.error(ERROR_WHILE_CREATING_DEMAND_FOR_GENERIC_TASK, e);
			throw new CustomException(ERROR_WHILE_CREATING_DEMAND_FOR_GENERIC_TASK, e.getMessage());
		}
	}

	public JsonNode getPaymentReceipt(@Valid RequestInfo requestInfo, String id) {
		StringBuilder uri = new StringBuilder();
		uri.append(configs.getEtreasuryHost()).append(configs.getEtreasuryPaymentReceiptEndPoint())
				.append("?billId=").append(id);

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