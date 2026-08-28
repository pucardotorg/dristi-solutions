package org.pucar.dristi.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.egov.common.contract.request.RequestInfo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.web.models.Hearing;
import org.pucar.dristi.web.models.Order;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

/**
 * Verifies that {@link CaseManagerService} reads each service's search response using the correct
 * wrapper key and preserves the ascending-by-createdTime ordering the old Elasticsearch queries had.
 */
@ExtendWith(MockitoExtension.class)
class CaseManagerServiceTest {

	@Mock
	private Configuration configuration;

	@Mock
	private ServiceRequestRepository serviceRequestRepository;

	private CaseManagerService caseManagerService;

	private final RequestInfo requestInfo = new RequestInfo();

	@BeforeEach
	void setUp() {
		caseManagerService = new CaseManagerService(configuration, serviceRequestRepository, new ObjectMapper());
		lenient().when(configuration.getHearingHost()).thenReturn("http://hearing");
		lenient().when(configuration.getHearingSearchUrl()).thenReturn("/hearing/v1/search");
		lenient().when(configuration.getOrderSearchHost()).thenReturn("http://order");
		lenient().when(configuration.getOrderSearchPath()).thenReturn("/order/v1/search");
	}

	private Map<String, Object> item(String idKey, String idValue, long createdTime) {
		Map<String, Object> audit = new LinkedHashMap<>();
		audit.put("createdTime", createdTime);
		Map<String, Object> item = new LinkedHashMap<>();
		item.put(idKey, idValue);
		item.put("auditDetails", audit);
		return item;
	}

	@Test
	void getHearings_readsHearingListKey_andSortsByCreatedTimeAscending() {
		String earlier = "11111111-1111-1111-1111-111111111111";
		String later = "22222222-2222-2222-2222-222222222222";
		List<Map<String, Object>> hearingList = new ArrayList<>();
		// deliberately out of order: later first, earlier second
		hearingList.add(item("id", later, 2000L));
		hearingList.add(item("id", earlier, 1000L));

		Map<String, Object> response = new LinkedHashMap<>();
		response.put("HearingList", hearingList);
		when(serviceRequestRepository.fetchResult(any(), any())).thenReturn(response);

		List<Hearing> result = caseManagerService.getHearings(requestInfo, "KL-000123", "kl");

		assertEquals(2, result.size());
		assertEquals(earlier, result.get(0).getId().toString());
		assertEquals(later, result.get(1).getId().toString());
	}

	@Test
	void getOrders_readsListKey() {
		List<Map<String, Object>> orders = new ArrayList<>();
		orders.add(item("id", "33333333-3333-3333-3333-333333333333", 500L));

		Map<String, Object> response = new LinkedHashMap<>();
		response.put("list", orders);
		when(serviceRequestRepository.fetchResult(any(), any())).thenReturn(response);

		List<Order> result = caseManagerService.getOrders(requestInfo, "KL-000123", "kl");

		assertEquals(1, result.size());
	}

	@Test
	void getOrders_missingWrapperKey_returnsEmptyList() {
		when(serviceRequestRepository.fetchResult(any(), any())).thenReturn(new LinkedHashMap<>());

		List<Order> result = caseManagerService.getOrders(requestInfo, "KL-000123", "kl");

		assertTrue(result.isEmpty());
	}

	@Test
	void getTasks_nullOrderId_returnsEmptyListWithoutCallingService() {
		List<?> result = caseManagerService.getTasks(requestInfo, null, "kl");
		assertTrue(result.isEmpty());
	}
}
