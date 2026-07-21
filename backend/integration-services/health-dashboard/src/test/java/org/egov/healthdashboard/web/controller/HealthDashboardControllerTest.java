package org.egov.healthdashboard.web.controller;

import org.egov.healthdashboard.repository.ServiceHealthRepository;
import org.egov.healthdashboard.web.models.ServiceHealthStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Collections;
import java.util.List;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class HealthDashboardControllerTest {

    @Mock
    private ServiceHealthRepository serviceHealthRepository;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        HealthDashboardController controller = new HealthDashboardController(serviceHealthRepository);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    void getAllStatuses_returnsAllStatusesFromRepository() throws Exception {
        List<ServiceHealthStatus> statuses = Collections.singletonList(
                ServiceHealthStatus.builder()
                        .serviceName("SMS")
                        .lastStatus("UP")
                        .build());
        when(serviceHealthRepository.findAll()).thenReturn(statuses);

        mockMvc.perform(get("/v1/services/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].serviceName").value("SMS"))
                .andExpect(jsonPath("$[0].lastStatus").value("UP"));
    }

    @Test
    void getStatusByService_returnsStatus_whenFound() throws Exception {
        ServiceHealthStatus status = ServiceHealthStatus.builder()
                .serviceName("ESIGN")
                .lastStatus("UP")
                .build();
        when(serviceHealthRepository.findByServiceName("ESIGN")).thenReturn(status);

        mockMvc.perform(get("/v1/services/status/esign"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.serviceName").value("ESIGN"))
                .andExpect(jsonPath("$.lastStatus").value("UP"));

        verify(serviceHealthRepository).findByServiceName("ESIGN");
    }

    @Test
    void getStatusByService_returnsNotFound_whenServiceIsUnknown() throws Exception {
        when(serviceHealthRepository.findByServiceName("UNKNOWN")).thenReturn(null);

        mockMvc.perform(get("/v1/services/status/unknown"))
                .andExpect(status().isNotFound())
                .andExpect(content().string(""));
    }
}
