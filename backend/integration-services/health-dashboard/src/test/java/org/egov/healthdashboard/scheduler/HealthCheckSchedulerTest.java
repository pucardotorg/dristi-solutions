package org.egov.healthdashboard.scheduler;

import org.egov.healthdashboard.config.Configuration;
import org.egov.healthdashboard.repository.ServiceHealthRepository;
import org.egov.healthdashboard.service.HealthCheckService;
import org.egov.healthdashboard.web.models.ServiceHealthStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class HealthCheckSchedulerTest {

    @Mock
    private HealthCheckService healthCheckService;

    @Mock
    private ServiceHealthRepository serviceHealthRepository;

    @Mock
    private Configuration configuration;

    private HealthCheckScheduler healthCheckScheduler;

    @BeforeEach
    void setUp() {
        healthCheckScheduler = new HealthCheckScheduler(healthCheckService, serviceHealthRepository, configuration);

        when(configuration.getHealthCheckTimeoutMs()).thenReturn(5000);
        when(configuration.getEsignTcpHost()).thenReturn("esignservice.cdac.in");
        when(configuration.getEsignTcpPort()).thenReturn(443);
        when(configuration.getSmsHttpUrl()).thenReturn("https://msdgweb.mgov.gov.in/esms/sendsmsrequestDLT");
        when(configuration.getTreasuryHttpUrl()).thenReturn("https://etreasury.kerala.gov.in/");
        when(configuration.getIcopsTcpHost()).thenReturn("api-icops.keralapolice.gov.in");
        when(configuration.getIcopsTcpPort()).thenReturn(443);

        when(healthCheckService.checkTcp(anyString(), anyString(), anyInt(), anyInt()))
                .thenReturn(ServiceHealthStatus.builder().lastStatus("UP").build());
        when(healthCheckService.checkHttp(anyString(), anyString(), anyInt()))
                .thenReturn(ServiceHealthStatus.builder().lastStatus("UP").build());
    }

    @Test
    void runOnStartup_checksAllFourConfiguredServicesAndPersistsResults() {
        healthCheckScheduler.runOnStartup();

        verify(healthCheckService).checkTcp("ESIGN", "esignservice.cdac.in", 443, 5000);
        verify(healthCheckService).checkTcp("ICOPS", "api-icops.keralapolice.gov.in", 443, 5000);
        verify(healthCheckService).checkHttp("SMS", "https://msdgweb.mgov.gov.in/esms/sendsmsrequestDLT", 5000);
        verify(healthCheckService).checkHttp("TREASURY", "https://etreasury.kerala.gov.in/", 5000);
        verify(serviceHealthRepository, times(4)).insert(any(ServiceHealthStatus.class));
    }

    @Test
    void runScheduled_checksAllFourConfiguredServicesAndPersistsResults() {
        healthCheckScheduler.runScheduled();

        verify(healthCheckService).checkTcp("ESIGN", "esignservice.cdac.in", 443, 5000);
        verify(healthCheckService).checkTcp("ICOPS", "api-icops.keralapolice.gov.in", 443, 5000);
        verify(healthCheckService).checkHttp("SMS", "https://msdgweb.mgov.gov.in/esms/sendsmsrequestDLT", 5000);
        verify(healthCheckService).checkHttp("TREASURY", "https://etreasury.kerala.gov.in/", 5000);
        verify(serviceHealthRepository, times(4)).insert(any(ServiceHealthStatus.class));
    }

    @Test
    void executeChecks_continuesRemainingChecks_whenRepositoryInsertThrows() {
        doThrow(new RuntimeException("db unavailable")).when(serviceHealthRepository).insert(any(ServiceHealthStatus.class));

        assertThatCode(() -> healthCheckScheduler.runOnStartup()).doesNotThrowAnyException();

        verify(serviceHealthRepository, times(4)).insert(any(ServiceHealthStatus.class));
    }
}
