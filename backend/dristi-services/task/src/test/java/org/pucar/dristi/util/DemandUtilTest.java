package org.pucar.dristi.util;

import org.egov.common.contract.models.RequestInfoWrapper;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.pucar.dristi.config.Configuration;

import org.pucar.dristi.web.models.Demand;
import org.pucar.dristi.web.models.DemandCriteria;
import org.pucar.dristi.web.models.DemandRequest;
import org.pucar.dristi.web.models.DemandResponse;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.when;

public class DemandUtilTest {


    @Mock
    private RestTemplate restTemplate;

    @Mock
    private Configuration configs;

    @InjectMocks
    private DemandUtil demandUtil;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
    }
    @Test
    public void searchDemand_ReturnsDemandResponse_WhenDemandsExist() {
        DemandCriteria demandCriteria = new DemandCriteria();
        demandCriteria.setTenantId("tenantId");
        demandCriteria.setConsumerCode(Set.of("consumerCode"));

        RequestInfoWrapper requestInfoWrapper = new RequestInfoWrapper();

        DemandResponse demandResponse = new DemandResponse();
        Demand demand = createMockDemand();
        demandResponse.setDemands(Collections.singletonList(demand));

        when(configs.getBillingServiceHost()).thenReturn("host");
        when(configs.getSearchDemandEndpoint()).thenReturn("searchDemand");
        doReturn(demandResponse).when(restTemplate).postForObject(any(String.class), any(RequestInfoWrapper.class), eq(DemandResponse.class));

        DemandResponse result = demandUtil.searchDemand(demandCriteria, requestInfoWrapper);

        assertNotNull(result);
        assertNotNull(result.getDemands());
        assertFalse(result.getDemands().isEmpty());
    }

    @Test
    public void searchDemand_ThrowsCustomException_WhenNoDemandsExist() {
        DemandCriteria demandCriteria = new DemandCriteria();
        demandCriteria.setTenantId("tenantId");

        RequestInfoWrapper requestInfoWrapper = new RequestInfoWrapper();

        DemandResponse demandResponse = new DemandResponse();
        demandResponse.setDemands(Collections.emptyList());

        when(configs.getBillingServiceHost()).thenReturn("host");
        when(configs.getSearchDemandEndpoint()).thenReturn("searchDemand");
        doReturn(demandResponse).when(restTemplate).postForObject(any(String.class), any(RequestInfoWrapper.class), eq(DemandResponse.class));

        CustomException exception = assertThrows(CustomException.class, () -> {
            demandUtil.searchDemand(demandCriteria, requestInfoWrapper);
        });

        assertNotNull(exception);
    }

    @Test
    public void updateDemand_ReturnsDemandResponse_WhenDemandsUpdated() {
        DemandRequest demandRequest = new DemandRequest();

        DemandResponse demandResponse = new DemandResponse();
        Demand demand = createMockDemand();
        demandResponse.setDemands(Collections.singletonList(demand));

        when(configs.getBillingServiceHost()).thenReturn("host");
        when(configs.getUpdateDemandEndpoint()).thenReturn("updateDemand");
        doReturn(demandResponse).when(restTemplate).postForObject(any(String.class), any(DemandRequest.class), eq(DemandResponse.class));

        DemandResponse result = demandUtil.updateDemand(demandRequest);

        assertNotNull(result);
        assertNotNull(result.getDemands());
        assertFalse(result.getDemands().isEmpty());
    }

    @Test
    public void updateDemand_ThrowsCustomException_WhenNoDemandsUpdated() {
        DemandRequest demandRequest = new DemandRequest();

        DemandResponse demandResponse = new DemandResponse();
        demandResponse.setDemands(Collections.emptyList());

        when(configs.getBillingServiceHost()).thenReturn("host");
        when(configs.getUpdateDemandEndpoint()).thenReturn("updateDemand");
        doReturn(demandResponse).when(restTemplate).postForObject(any(String.class), any(DemandRequest.class), eq(DemandResponse.class));

        CustomException exception = assertThrows(CustomException.class, () -> {
            demandUtil.updateDemand(demandRequest);
        });

        assertNotNull(exception);
    }

    private Demand createMockDemand() {
        Demand demand = new Demand();
        demand.setId("demandId");
        demand.setTenantId("tenantId");
        demand.setConsumerCode("consumerCode");
        return demand;
    }
}
