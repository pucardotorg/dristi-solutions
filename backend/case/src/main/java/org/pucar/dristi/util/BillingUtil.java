package org.pucar.dristi.util;

import static org.pucar.dristi.config.ServiceConstants.ERROR_WHILE_CREATING_DEMAND_FOR_CASE;
import static org.pucar.dristi.config.ServiceConstants.TAX_AMOUNT;
import static org.pucar.dristi.config.ServiceConstants.TAX_HEADMASTER_CODE;
import static org.pucar.dristi.config.ServiceConstants.TAX_PERIOD_FROM;
import static org.pucar.dristi.config.ServiceConstants.TAX_PERIOD_TO;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.egov.common.contract.models.AuditDetails;
import org.egov.tracer.model.CustomException;
import org.jetbrains.annotations.NotNull;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.web.models.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class BillingUtil {

	private RestTemplate restTemplate;

	private Configuration configs;

	@Autowired
	public BillingUtil(RestTemplate restTemplate, Configuration configs) {
		this.restTemplate = restTemplate;
		this.configs = configs;
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

	public void createDemand(JoinCaseV2Request joinCaseRequest, String consumerCode,BreakDown breakDown) {
		StringBuilder uri = new StringBuilder();
		uri.append(configs.getBillingHost()).append(configs.getDemandCreateEndPoint());

		DemandRequest demandRequest = new DemandRequest();
		demandRequest.setRequestInfo(joinCaseRequest.getRequestInfo());
		Demand demand = getDemand(joinCaseRequest ,consumerCode,breakDown);

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

	private static Demand getDemand(JoinCaseV2Request joinCaseRequest, String consumerCode, BreakDown breakDown) {
		Demand demand = new Demand();
		demand.setTenantId(joinCaseRequest.getRequestInfo().getUserInfo().getTenantId());
		demand.setConsumerCode(consumerCode);
		demand.setPayer(joinCaseRequest.getRequestInfo().getUserInfo());
		demand.setTaxPeriodFrom(1680287400000l);
		demand.setTaxPeriodTo(1901145600000l);
		demand.setBusinessService("task-payment");
		demand.setConsumerType("task-payment");
		org.egov.common.contract.models.AuditDetails auditDetails = AuditDetails.builder()
				.createdBy(joinCaseRequest.getRequestInfo().getUserInfo().getUuid())
				.createdTime(System.currentTimeMillis())
				.lastModifiedBy(joinCaseRequest.getRequestInfo().getUserInfo().getUuid())
				.lastModifiedTime(System.currentTimeMillis()).build();
		demand.setAuditDetails(auditDetails);

		DemandDetail demandDetail = new DemandDetail();
		demandDetail.setTaxAmount(BigDecimal.valueOf(breakDown.getAmount()));
		demandDetail.setTaxHeadMasterCode("TASK_PAYMENT_JOIN_CASE_ADVANCE_CARRYFORWARD");
		demand.addDemandDetailsItem(demandDetail);
		return demand;
	}
}