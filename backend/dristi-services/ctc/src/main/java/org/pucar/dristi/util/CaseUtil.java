package org.pucar.dristi.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.web.models.courtcase.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.*;

import static org.pucar.dristi.config.ServiceConstants.*;

@Slf4j
@Component
public class CaseUtil {

	private final RestTemplate restTemplate;

	private final ObjectMapper mapper;

	private final Configuration configs;

	private final ServiceRequestRepository repository;

	@Autowired
	public CaseUtil(RestTemplate restTemplate, Configuration configs, ObjectMapper mapper, ServiceRequestRepository repository) {
		this.restTemplate = restTemplate;
		this.configs = configs;
		this.mapper = mapper;
        this.repository = repository;
    }

	public List<CaseSummaryList> fetchCaseList(RequestInfo requestInfo, String caseNumber, String courtId) {
		StringBuilder uri = new StringBuilder();
		uri.append(configs.getCaseHost()).append(configs.getCaseListSearchPath());

		CaseSummaryListRequest request = new CaseSummaryListRequest();
		request.setRequestInfo(requestInfo);
		CaseSummaryListCriteria caseCriteria = new CaseSummaryListCriteria();
		caseCriteria.setSearchByCnrAndCaseNumber(caseNumber);
		caseCriteria.setCourtId(courtId);
		request.setCriteria(caseCriteria);

		Object response = new HashMap<>();
		CaseSummaryListResponse caseResponse = new CaseSummaryListResponse();
		try {
			response = restTemplate.postForObject(uri.toString(), request, Map.class);
			caseResponse = mapper.convertValue(response, CaseSummaryListResponse.class);
		} catch (Exception e) {
			log.error("ERROR_WHILE_FETCHING_FROM_CASE :: {}", e.toString());
		}

		if(caseResponse.getCaseList().isEmpty())
			return  new ArrayList<>();
		return caseResponse.getCaseList();
	}

	public JsonNode searchCaseDetails(CaseSearchRequest caseSearchRequest) {
		StringBuilder uri = new StringBuilder();
		uri.append(configs.getCaseHost()).append(configs.getCaseSearchPath());

		Object response = new HashMap<>();
		JsonNode caseList = null;
		try {
			response = restTemplate.postForObject(uri.toString(), caseSearchRequest, Map.class);
			JsonNode jsonNode = mapper.readTree(mapper.writeValueAsString(response));
			JsonNode criteria = jsonNode.get("criteria");
			if (criteria == null || criteria.isEmpty() || !criteria.get(0).has("responseList")) {
				throw new CustomException(ERROR_WHILE_FETCHING_FROM_CASE, "Invalid response structure");
			}
			caseList = criteria.get(0).get("responseList");
			if (caseList.isEmpty()) {
				return null;
			}
			return caseList.get(0);
		} catch (Exception e) {
			log.error(ERROR_WHILE_FETCHING_FROM_CASE, e);
			throw new CustomException(ERROR_WHILE_FETCHING_FROM_CASE, e.getMessage());
		}
	}

	public CourtCase getCase(String filingNumber, String courtId) {
		StringBuilder uri = new StringBuilder();
		uri.append(configs.getCaseHost()).append(configs.getCaseSearchPath());
		CaseSearchRequest request = CaseSearchRequest.builder()
				.requestInfo(RequestInfo.builder().build())
				.criteria(Collections.singletonList(CaseCriteria.builder()
						.filingNumber(filingNumber)
						.courtId(courtId)
						.defaultFields(false)
						.build()))
				.flow("flow_jac")
				.build();
		try {
			Object response = repository.fetchResult(uri, request);
			return mapper.convertValue(JsonPath.read(response, "COURT_CASE_JSON_PATH"), CourtCase.class);
		} catch (Exception e) {
			log.error("Error executing case search query", e);
			throw new CustomException("Error fetching case: ", "ERROR_CASE_SEARCH");
		}
	}


}
