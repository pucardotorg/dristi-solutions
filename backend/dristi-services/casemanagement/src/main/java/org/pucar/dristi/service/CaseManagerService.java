package org.pucar.dristi.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.web.models.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Assembles the "case file" (case + hearings + witnesses + orders/tasks + applications + evidence)
 * for a filing number.
 *
 * <p>Historically each of these was fetched by querying an Elasticsearch DB-mirror index. Those
 * indexes are eventually consistent and had to be kept alive purely for these exact-key lookups.
 * This service now calls each owning domain service's search API directly, so the data is always
 * consistent with PostgreSQL and the 7 mirror indexes are no longer required by this path.
 */
@Service
@Slf4j
public class CaseManagerService {

	private final Configuration configuration;
	private final ServiceRequestRepository serviceRequestRepository;
	private final ObjectMapper objectMapper;

	@Autowired
	public CaseManagerService(Configuration configuration,
							  ServiceRequestRepository serviceRequestRepository,
							  ObjectMapper objectMapper) {
		this.configuration = configuration;
		this.serviceRequestRepository = serviceRequestRepository;
		this.objectMapper = objectMapper;
	}

	public List<CaseFile> getCaseFiles(CaseRequest caseRequest) {
		List<CaseFile> caseFileList = new ArrayList<>();
		String filingNumber = caseRequest.getFilingNumber();
		RequestInfo requestInfo = caseRequest.getRequestInfo();

		try {
			List<CourtCase> courtCaseList = getCases(requestInfo, filingNumber);
			if (courtCaseList == null || courtCaseList.isEmpty()) {
				log.info("No court cases found for filing number: {}", filingNumber);
				return caseFileList;
			}

			for (CourtCase courtCase : courtCaseList) {
				CaseFile caseFile = new CaseFile();
				caseFile.setCourtCase(courtCase);

				String tenantId = courtCase.getTenantId();
				String caseId = courtCase.getId() != null ? courtCase.getId().toString() : caseRequest.getCaseId();

				caseFile.setHearings(getHearings(requestInfo, filingNumber, tenantId));
				caseFile.setWitnesses(getWitnesses(requestInfo, caseId));
				caseFile.setOrders(getOrderTasks(requestInfo, filingNumber, tenantId));
				caseFile.setApplications(getApplications(requestInfo, filingNumber, tenantId));
				caseFile.setEvidence(getArtifacts(requestInfo, filingNumber, tenantId));

				caseFileList.add(caseFile);
			}
		} catch (CustomException e) {
			throw e;
		} catch (Exception e) {
			log.error("Error building case files using filing number: {}", filingNumber, e);
			throw new CustomException("CASE_FILE_ERROR", "Error building case files using filing number:" + e.getMessage());
		}
		return caseFileList;
	}

	public List<CourtCase> getCases(RequestInfo requestInfo, String filingNumber) {
		try {
			CaseCriteria criteria = new CaseCriteria();
			criteria.setFilingNumber(filingNumber);
			criteria.setDefaultFields(false);

			CaseSearchRequest request = new CaseSearchRequest();
			request.setRequestInfo(requestInfo);
			request.setCriteria(new ArrayList<>(List.of(criteria)));
			if (requestInfo != null && requestInfo.getUserInfo() != null) {
				request.setTenantId(requestInfo.getUserInfo().getTenantId());
			}

			StringBuilder uri = new StringBuilder(configuration.getCaseHost()).append(configuration.getCaseSearchUrl());
			Object response = serviceRequestRepository.fetchResult(uri, request);

			List<CourtCase> courtCases = new ArrayList<>();
			Map<String, Object> responseMap = objectMapper.convertValue(response, new TypeReference<Map<String, Object>>() {});
			Object criteriaListObj = responseMap.get("criteria");
			if (!(criteriaListObj instanceof List) || ((List<?>) criteriaListObj).isEmpty()) {
				return courtCases;
			}
			@SuppressWarnings("unchecked")
			Map<String, Object> firstCriteria = (Map<String, Object>) ((List<?>) criteriaListObj).get(0);
			Object responseList = firstCriteria.get("responseList");
			if (responseList instanceof List) {
				for (Object item : (List<?>) responseList) {
					courtCases.add(objectMapper.convertValue(item, CourtCase.class));
				}
			}
			return courtCases;
		} catch (CustomException e) {
			throw e;
		} catch (Exception e) {
			log.error("Error retrieving cases for filing number: {}", filingNumber, e);
			throw new CustomException("COURT_CASE_ERROR", "Error retrieving cases:" + e.getMessage());
		}
	}

	public List<Hearing> getHearings(RequestInfo requestInfo, String filingNumber, String tenantId) {
		try {
			Map<String, Object> criteria = new LinkedHashMap<>();
			criteria.put("filingNumber", filingNumber);
			if (tenantId != null) criteria.put("tenantId", tenantId);

			StringBuilder uri = new StringBuilder(configuration.getHearingHost()).append(configuration.getHearingSearchUrl());
			Object response = serviceRequestRepository.fetchResult(uri, buildCriteriaRequest(requestInfo, criteria));
			return extractList(response, "HearingList", Hearing.class);
		} catch (CustomException e) {
			throw e;
		} catch (Exception e) {
			log.error("Error retrieving hearings for filing number: {}", filingNumber, e);
			throw new CustomException("HEARING_ERROR", "Error retrieving hearings:" + e.getMessage());
		}
	}

	public List<Witness> getWitnesses(RequestInfo requestInfo, String caseId) {
		try {
			if (caseId == null) {
				return new ArrayList<>();
			}
			Map<String, Object> searchCriteria = new LinkedHashMap<>();
			searchCriteria.put("caseId", caseId);

			Map<String, Object> body = new LinkedHashMap<>();
			body.put("RequestInfo", requestInfo);
			body.put("searchCriteria", new ArrayList<>(List.of(searchCriteria)));

			StringBuilder uri = new StringBuilder(configuration.getCaseHost()).append(configuration.getWitnessSearchUrl());
			Object response = serviceRequestRepository.fetchResult(uri, body);
			return extractList(response, "witnesses", Witness.class);
		} catch (CustomException e) {
			throw e;
		} catch (Exception e) {
			log.error("Error retrieving witnesses for case id: {}", caseId, e);
			throw new CustomException("WITNESS_ERROR", "Error retrieving witnesses:" + e.getMessage());
		}
	}

	public List<OrderTasks> getOrderTasks(RequestInfo requestInfo, String filingNumber, String tenantId) {
		List<OrderTasks> orderTasksList = new ArrayList<>();
		List<Order> orderList = getOrders(requestInfo, filingNumber, tenantId);

		for (Order order : orderList) {
			String orderId = order.getId() != null ? order.getId().toString() : null;
			List<Task> taskList = getTasks(requestInfo, orderId, tenantId);
			OrderTasks orderTasks = OrderTasks.builder().order(order).tasks(taskList).build();
			orderTasksList.add(orderTasks);
		}
		log.info("Retrieved {} order tasks for filing number: {}", orderTasksList.size(), filingNumber);
		return orderTasksList;
	}

	public List<Order> getOrders(RequestInfo requestInfo, String filingNumber, String tenantId) {
		try {
			Map<String, Object> criteria = new LinkedHashMap<>();
			criteria.put("filingNumber", filingNumber);
			if (tenantId != null) criteria.put("tenantId", tenantId);

			StringBuilder uri = new StringBuilder(configuration.getOrderSearchHost()).append(configuration.getOrderSearchPath());
			Object response = serviceRequestRepository.fetchResult(uri, buildCriteriaRequest(requestInfo, criteria));
			return extractList(response, "list", Order.class);
		} catch (CustomException e) {
			throw e;
		} catch (Exception e) {
			log.error("Error retrieving orders for filing number: {}", filingNumber, e);
			throw new CustomException("ORDER_ERROR", "Error retrieving orders:" + e.getMessage());
		}
	}

	public List<Task> getTasks(RequestInfo requestInfo, String orderId, String tenantId) {
		try {
			if (orderId == null) {
				return new ArrayList<>();
			}
			Map<String, Object> criteria = new LinkedHashMap<>();
			criteria.put("orderId", orderId);
			if (tenantId != null) criteria.put("tenantId", tenantId);

			StringBuilder uri = new StringBuilder(configuration.getTaskSearchHost()).append(configuration.getTaskSearchPath());
			Object response = serviceRequestRepository.fetchResult(uri, buildCriteriaRequest(requestInfo, criteria));
			return extractList(response, "list", Task.class);
		} catch (CustomException e) {
			throw e;
		} catch (Exception e) {
			log.error("Error retrieving tasks for order id: {}", orderId, e);
			throw new CustomException("TASK_ERROR", "Error retrieving tasks:" + e.getMessage());
		}
	}

	public List<Application> getApplications(RequestInfo requestInfo, String filingNumber, String tenantId) {
		try {
			Map<String, Object> criteria = new LinkedHashMap<>();
			criteria.put("filingNumber", filingNumber);
			if (tenantId != null) criteria.put("tenantId", tenantId);

			StringBuilder uri = new StringBuilder(configuration.getApplicationHost()).append(configuration.getApplicationSearchEndPoint());
			Object response = serviceRequestRepository.fetchResult(uri, buildCriteriaRequest(requestInfo, criteria));
			return extractList(response, "applicationList", Application.class);
		} catch (CustomException e) {
			throw e;
		} catch (Exception e) {
			log.error("Error retrieving applications for filing number: {}", filingNumber, e);
			throw new CustomException("APPLICATION_ERROR", "Error retrieving applications:" + e.getMessage());
		}
	}

	public List<Artifact> getArtifacts(RequestInfo requestInfo, String filingNumber, String tenantId) {
		try {
			Map<String, Object> criteria = new LinkedHashMap<>();
			criteria.put("filingNumber", filingNumber);
			if (tenantId != null) criteria.put("tenantId", tenantId);

			Map<String, Object> body = new LinkedHashMap<>();
			body.put("RequestInfo", requestInfo);
			if (tenantId != null) body.put("tenantId", tenantId);
			body.put("criteria", criteria);

			StringBuilder uri = new StringBuilder(configuration.getEvidenceServiceHost()).append(configuration.getEvidenceServiceSearchEndpoint());
			Object response = serviceRequestRepository.fetchResult(uri, body);
			return extractList(response, "artifacts", Artifact.class);
		} catch (CustomException e) {
			throw e;
		} catch (Exception e) {
			log.error("Error retrieving artifacts for filing number: {}", filingNumber, e);
			throw new CustomException("ARTIFACT_ERROR", "Error retrieving artifacts:" + e.getMessage());
		}
	}

	/**
	 * Builds the common {@code {"RequestInfo": ..., "criteria": {...}}} search body used by the
	 * hearing, order, task and application search APIs.
	 */
	private Map<String, Object> buildCriteriaRequest(RequestInfo requestInfo, Map<String, Object> criteria) {
		Map<String, Object> body = new LinkedHashMap<>();
		body.put("RequestInfo", requestInfo);
		body.put("criteria", criteria);
		return body;
	}

	/**
	 * Extracts the list found under {@code listKey} from a service search response and converts each
	 * element to {@code clazz}. Results are ordered ascending by {@code auditDetails.createdTime} to
	 * preserve the chronological ordering the previous Elasticsearch queries produced.
	 */
	private <T> List<T> extractList(Object response, String listKey, Class<T> clazz) {
		List<T> result = new ArrayList<>();
		if (response == null) {
			return result;
		}
		Map<String, Object> responseMap = objectMapper.convertValue(response, new TypeReference<Map<String, Object>>() {});
		Object listObj = responseMap.get(listKey);
		if (!(listObj instanceof List)) {
			return result;
		}
		@SuppressWarnings("unchecked")
		List<Map<String, Object>> items = new ArrayList<>((List<Map<String, Object>>) listObj);
		items.sort(Comparator.comparingLong(this::extractCreatedTime));
		for (Map<String, Object> item : items) {
			result.add(objectMapper.convertValue(item, clazz));
		}
		return result;
	}

	@SuppressWarnings("unchecked")
	private long extractCreatedTime(Map<String, Object> item) {
		Object auditDetails = item.get("auditDetails");
		if (auditDetails instanceof Map) {
			Object createdTime = ((Map<String, Object>) auditDetails).get("createdTime");
			if (createdTime instanceof Number) {
				return ((Number) createdTime).longValue();
			}
		}
		return 0L;
	}
}
