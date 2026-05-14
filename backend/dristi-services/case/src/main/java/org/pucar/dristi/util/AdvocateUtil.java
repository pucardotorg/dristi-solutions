package org.pucar.dristi.util;

import static org.pucar.dristi.config.ServiceConstants.ERROR_WHILE_FETCHING_FROM_ADVOCATE;

import java.util.*;
import java.util.stream.Collectors;

import com.fasterxml.jackson.databind.JsonNode;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.web.models.Advocate;
import org.pucar.dristi.web.models.AdvocateListResponse;
import org.pucar.dristi.web.models.AdvocateSearchCriteria;
import org.pucar.dristi.web.models.AdvocateSearchRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class AdvocateUtil {

	private RestTemplate restTemplate;

	private ObjectMapper mapper;

	private Configuration configs;


	@Autowired
	public AdvocateUtil(RestTemplate restTemplate, ObjectMapper mapper, Configuration configs) {
		this.restTemplate = restTemplate;
		this.mapper = mapper;
		this.configs = configs;
	}

	public List<Advocate> fetchAdvocates(RequestInfo requestInfo, AdvocateSearchCriteria advocateSearchCriteria) {
		StringBuilder uri = new StringBuilder();
		uri.append(configs.getAdvocateHost()).append(configs.getAdvocatePath());

		AdvocateSearchRequest advocateSearchRequest = new AdvocateSearchRequest();
		advocateSearchRequest.setRequestInfo(requestInfo);

		List<AdvocateSearchCriteria> criteriaList = new ArrayList<>();
		criteriaList.add(advocateSearchCriteria);
		advocateSearchRequest.setCriteria(criteriaList);

		Object response;
		AdvocateListResponse advocateResponse;
		try {
			response = restTemplate.postForObject(uri.toString(), advocateSearchRequest, Map.class);
			advocateResponse = mapper.convertValue(response, AdvocateListResponse.class);
			log.info("Advocate response :: {}", advocateResponse);
		} catch (Exception e) {
			log.error(ERROR_WHILE_FETCHING_FROM_ADVOCATE, e);
			throw new CustomException(ERROR_WHILE_FETCHING_FROM_ADVOCATE, e.getMessage());
		}

		return advocateResponse.getAdvocates().get(0).getResponseList().stream().filter(Advocate::getIsActive).toList();

	}

	public List<Advocate> fetchAdvocatesById(RequestInfo requestInfo, String advocateId) {

		AdvocateSearchCriteria advocateSearchCriteria = new AdvocateSearchCriteria();
		advocateSearchCriteria.setId(advocateId);

		return fetchAdvocates(requestInfo,advocateSearchCriteria);

	}

	public List<Advocate> fetchAdvocatesByIndividualId(RequestInfo requestInfo, String individualId) {

		AdvocateSearchCriteria advocateSearchCriteria = new AdvocateSearchCriteria();
		advocateSearchCriteria.setIndividualId(individualId);

		return fetchAdvocates(requestInfo,advocateSearchCriteria);

	}

	public Boolean doesAdvocateExist(RequestInfo requestInfo, String advocateId) {

		List<Advocate> list = fetchAdvocatesById(requestInfo,advocateId);

		return !list.isEmpty();
	}

	public Set<String> getAdvocate(RequestInfo requestInfo, List<String> advocateIds) {
		StringBuilder uri = new StringBuilder();
		uri.append(configs.getAdvocateHost()).append(configs.getAdvocatePath());

		AdvocateSearchRequest advocateSearchRequest = new AdvocateSearchRequest();
		advocateSearchRequest.setRequestInfo(requestInfo);
		List<AdvocateSearchCriteria> criteriaList = new ArrayList<>();
		for(String id: advocateIds){
			AdvocateSearchCriteria advocateSearchCriteria = new AdvocateSearchCriteria();
			advocateSearchCriteria.setId(id);
			criteriaList.add(advocateSearchCriteria);
		}
		advocateSearchRequest.setCriteria(criteriaList);
		Object response;
		AdvocateListResponse advocateResponse;
		try {
			response = restTemplate.postForObject(uri.toString(), advocateSearchRequest, Map.class);
			advocateResponse = mapper.convertValue(response, AdvocateListResponse.class);
			log.info("Advocate response :: {}", advocateResponse);
		} catch (Exception e) {
			log.error("ERROR_WHILE_FETCHING_FROM_ADVOCATE", e);
			throw new CustomException("ERROR_WHILE_FETCHING_FROM_ADVOCATE", e.getMessage());
		}
		List<Advocate> list = new ArrayList<>();

		advocateResponse.getAdvocates().forEach(advocate -> {
			List<Advocate> activeAdvocates = advocate.getResponseList().stream()
					.filter(Advocate::getIsActive)
					.toList();
			list.addAll(activeAdvocates);
		});


		return list.stream().map(Advocate::getIndividualId).collect(Collectors.toSet());
	}

	public JsonNode searchClerkByIndividualId(RequestInfo requestInfo, String individualId) {
		try {
            String uri = configs.getAdvocateHost() +
                    configs.getAdvocateClerkPath();

			Map<String, Object> request = new HashMap<>();
			request.put("RequestInfo", requestInfo);

			Map<String, Object> criteria = new HashMap<>();
			criteria.put("individualId", individualId);

			request.put("criteria", List.of(criteria));

			Object responseMap = restTemplate.postForObject(uri, request, Map.class);
			if (responseMap == null) {
				return null;
			}

			JsonNode rootNode = mapper.valueToTree(responseMap);
			JsonNode clerksNode = rootNode.path("clerks");
			if (!clerksNode.isArray() || clerksNode.isEmpty()) {
				return null;
			}

			for (JsonNode group : clerksNode) {
				JsonNode responseList = group.path("responseList");
				if (responseList.isArray() && !responseList.isEmpty()) {
					return responseList.get(0);
				}
			}

			return null;
		} catch (Exception e) {
			log.error("Error while searching clerks with individualId: {}", individualId, e);
			return null;
		}
	}

}
