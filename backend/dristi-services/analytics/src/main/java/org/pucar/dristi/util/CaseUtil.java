package org.pucar.dristi.util;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.json.JSONArray;
import org.json.JSONObject;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.util.Util;
import org.pucar.dristi.web.models.casemodels.CaseAdvocateOffice;
import org.pucar.dristi.web.models.CaseSearchRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.*;

import static org.pucar.dristi.config.ServiceConstants.*;

@Slf4j
@Component
public class CaseUtil {

	private final Configuration config;
	private final ServiceRequestRepository repository;
	private final Util util;

	private final RestTemplate restTemplate;

	private final ObjectMapper mapper;

	@Autowired
	public CaseUtil(Configuration config, ServiceRequestRepository repository, Util util, RestTemplate restTemplate, ObjectMapper mapper) {
		this.config = config;
		this.repository = repository;
		this.util = util;
		this.restTemplate = restTemplate;
		this.mapper = mapper;
	}

	public Object getCase(JSONObject request, String tenantId, String cnrNumber, String filingNumber, String caseId) {
		StringBuilder url = getSearchURLWithParams();
		log.info("Inside CaseUtil getCaseInternal :: URL: {}", url);

		request.put("tenantId", tenantId);
		JSONArray criteriaArray = new JSONArray();
		JSONObject criteria = new JSONObject();

		if (cnrNumber != null) {
			criteria.put("cnrNumber", cnrNumber);
		}
		if (filingNumber != null) {
			criteria.put("filingNumber", filingNumber);
		}
		if (caseId != null) {
			criteria.put("caseId", caseId);
		}
		criteriaArray.put(criteria);
		request.put("criteria", criteriaArray);
		request.put("flow",FLOW_JAC);

		log.info("Inside CaseUtil getCaseInternal :: Criteria: {}", criteriaArray);

		try {
			String response = repository.fetchResult(url, request);
			log.info("Inside CaseUtil getCaseInternal :: Response: {}", response);
			JSONArray cases = util.constructArray(response, CASE_PATH);
			return cases.length() > 0 ? cases.get(0) : null;
		} catch (Exception e) {
			log.error("Error while processing case response", e);
			throw new RuntimeException("Error while processing case response", e);
		}
	}

	public JsonNode searchCaseDetails(CaseSearchRequest caseSearchRequest) {
		StringBuilder uri = new StringBuilder();
		uri.append(config.getCaseHost()).append(config.getCaseSearchPath());

		Object response = new HashMap<>();
		JsonNode caseList = null;
		try {
			response = restTemplate.postForObject(uri.toString(), caseSearchRequest, Map.class);
			JsonNode jsonNode = mapper.readTree(mapper.writeValueAsString(response));
			caseList = jsonNode.get("criteria").get(0).get("responseList");

		} catch (Exception e) {
			log.error(ERROR_WHILE_FETCHING_FROM_CASE, e);
			throw new CustomException(ERROR_WHILE_FETCHING_FROM_CASE, e.getMessage());
		}
		return caseList;
	}

	public List<Map<String, String>> getCasesByAdvocateId(String advocateId, RequestInfo requestInfo) {
		try {
			StringBuilder uri = new StringBuilder();
			uri.append(config.getCaseHost()).append(config.getAdvocateCaseSearchPath());

			Map<String, Object> requestBody = new HashMap<>();
			requestBody.put("RequestInfo", requestInfo);
			requestBody.put("advocateId", advocateId);

			log.info("Calling advocate cases API for advocateId: {}", advocateId);
			Object response = restTemplate.postForObject(uri.toString(), requestBody, Map.class);
			
			JsonNode jsonNode = mapper.readTree(mapper.writeValueAsString(response));
			JsonNode casesNode = jsonNode.get("cases");

			if (casesNode != null && casesNode.isArray()) {
				List<Map<String, String>> casesList = new ArrayList<>();
				for (JsonNode caseNode : casesNode) {
					Map<String, String> caseInfo = new HashMap<>();
					caseInfo.put("caseId", caseNode.path("caseId").asText());
					caseInfo.put("filingNumber", caseNode.path("filingNumber").asText());
					casesList.add(caseInfo);
				}
				log.info("Found {} cases for advocateId: {}", casesList.size(), advocateId);
				return casesList;
			}
			return new ArrayList<>();
		} catch (Exception e) {
			log.error("Error while fetching cases for advocateId: {}", advocateId, e);
			return new ArrayList<>();
		}
	}

	public JsonNode getLitigants(JsonNode caseList) {

		log.info("operation = getLitigants, result = IN_PROGRESS");

		if (caseList != null && caseList.isArray() && !caseList.isEmpty()) {
			log.info("operation = getLitigants, result = SUCCESS");
			return caseList.get(0).get("litigants");
		} else {
			log.error("operation = getLitigants, result = FAILURE");
			throw new CustomException("DK_RR_CASE_ERR", "case not found");
		}

	}

	public Set<String> getIndividualIds(JsonNode nodeArray) {
		log.info("operation = getIndividualIds, result = IN_PROGRESS");
		Set<String> response = new HashSet<>();
		if (nodeArray != null && nodeArray.isArray()) {
			for (JsonNode node : nodeArray) {
				JsonNode id = node.get("individualId");
				if (id != null) {
					response.add(String.valueOf(id.asText()));
				}

			}
		}
		log.info("operation = getIndividualIds, result = SUCCESS");
		return response;
	}

	public JsonNode getRepresentatives(JsonNode caseRes) {

		log.info("operation = getRepresentatives, result = IN_PROGRESS");

		if (caseRes != null && caseRes.isArray() && !caseRes.isEmpty()) {
			log.info("operation = getRepresentatives, result = SUCCESS");
			return caseRes.get(0).get("representatives");
		} else {
			log.error("operation = getRepresentatives, result = FAILURE");
			throw new CustomException("DK_RR_CASE_ERR", "case not found");
		}
	}

	public Set<String> getAdvocateIds(JsonNode nodeArray) {
		log.info("operation = getAdvocateIds, result = IN_PROGRESS");
		Set<String> response = new HashSet<>();
		if (nodeArray != null && nodeArray.isArray()) {
			for (JsonNode node : nodeArray) {
				JsonNode id = node.get("advocateId");
				if (id != null) {
					response.add(String.valueOf(id.asText()));
				}
			}
		}
		log.info("operation = getAdvocateIds, result = SUCCESS");
		return response;
	}

	public Set<String> extractPowerOfAttorneyIds(JsonNode caseDetails, Set<String> individualIds) {
		JsonNode poaHolders = caseDetails.get(0).get("poaHolders");
		if (poaHolders != null && poaHolders.isArray()) {
			for (JsonNode poaHolder : poaHolders) {
				String individualId = poaHolder.path("individualId").textValue();
				if (individualId != null && !individualId.isEmpty()) {
					individualIds.add(individualId);
				}
			}
		}
		return individualIds;
	}

	private StringBuilder getSearchURLWithParams() {
		return new StringBuilder(config.getCaseHost())
				.append(config.getCaseSearchPath());
	}

	public String getCourtCaseNumber(JsonNode caseList) {
		if (caseList != null && caseList.isArray() && !caseList.isEmpty()) {
			JsonNode courtCaseNode = caseList.get(0).get("courtCaseNumber");
			if (courtCaseNode != null && !courtCaseNode.isNull()) {
				return courtCaseNode.textValue();
			}
		}
		log.error("court case number not found");
		return null;
	}

	public String getCmpNumber(JsonNode caseList) {
		if (caseList != null && caseList.isArray() && !caseList.isEmpty()) {
			JsonNode courtCaseNode = caseList.get(0).get("cmpNumber");
			if (courtCaseNode != null && !courtCaseNode.isNull()) {
				return courtCaseNode.textValue();
			}
		}
		log.error("cmp number not found");
		return null;
	}

	public List<CaseAdvocateOffice> getAdvocateOffices(JsonNode caseDetails) {
		log.info("operation = getAdvocateOffices, result = IN_PROGRESS");
		try {
			if (caseDetails != null && caseDetails.isArray() && !caseDetails.isEmpty()) {
				JsonNode advocateOfficesNode = caseDetails.get(0).get("advocateOffices");
				if (advocateOfficesNode != null && advocateOfficesNode.isArray()) {
					List<CaseAdvocateOffice> advocateOffices = mapper.convertValue(
							advocateOfficesNode,
							new TypeReference<List<CaseAdvocateOffice>>() {}
					);
					log.info("operation = getAdvocateOffices, result = SUCCESS, count = {}", advocateOffices.size());
					return advocateOffices;
				}
			}
			log.info("operation = getAdvocateOffices, result = NO_OFFICES_FOUND");
			return Collections.emptyList();
		} catch (Exception e) {
			log.error("Error while converting advocate offices", e);
			return Collections.emptyList();
		}
	}

	public List<String> getAdvocatesForMember(RequestInfo requestInfo, String memberUserUuid, String caseId) {
		try {
			StringBuilder uri = new StringBuilder();
			uri.append(config.getCaseHost()).append(config.getCaseMemberAdvocatesPath());

			Map<String, Object> requestBody = new HashMap<>();
			requestBody.put("RequestInfo", requestInfo);
			requestBody.put("memberUserUuid", memberUserUuid);
			requestBody.put("caseId", caseId);

			log.info("Calling member advocates API for memberUserUuid: {} and caseId: {}", memberUserUuid, caseId);
			Object response = restTemplate.postForObject(uri.toString(), requestBody, Map.class);
			
			JsonNode jsonNode = mapper.readTree(mapper.writeValueAsString(response));
			JsonNode advocateUuidsNode = jsonNode.get("advocateUuids");

			if (advocateUuidsNode != null && advocateUuidsNode.isArray()) {
				List<String> advocateUuids = new ArrayList<>();
				for (JsonNode uuidNode : advocateUuidsNode) {
					advocateUuids.add(uuidNode.asText());
				}
				log.info("Found {} advocates for memberUserUuid: {}", advocateUuids.size(), memberUserUuid);
				return advocateUuids;
			}
			return new ArrayList<>();
		} catch (Exception e) {
			log.error("Error while fetching advocates for memberUserUuid: {}", memberUserUuid, e);
			return new ArrayList<>();
		}
	}
}
