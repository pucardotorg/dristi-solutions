package org.egov.healthdashboard.scheduler;

import lombok.extern.slf4j.Slf4j;
import org.egov.healthdashboard.config.Configuration;
import org.egov.healthdashboard.repository.ServiceHealthRepository;
import org.egov.healthdashboard.service.HealthCheckService;
import org.egov.healthdashboard.web.models.ServiceHealthStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;

@Component
@Slf4j
public class HealthCheckScheduler {

    private final HealthCheckService healthCheckService;
    private final ServiceHealthRepository serviceHealthRepository;
    private final Configuration config;

    @Autowired
    public HealthCheckScheduler(HealthCheckService healthCheckService,
                                ServiceHealthRepository serviceHealthRepository,
                                Configuration config) {
        this.healthCheckService = healthCheckService;
        this.serviceHealthRepository = serviceHealthRepository;
        this.config = config;
    }

    @PostConstruct
    public void runOnStartup() {
        log.info("Running initial health check on startup");
        executeChecks();
    }

    @Scheduled(cron = "${health.check.cron}", zone = "${app.timezone}")
    public void runScheduled() {
        log.info("Running scheduled health check");
        executeChecks();
    }

    private void executeChecks() {
        int timeout = config.getHealthCheckTimeoutMs();

        checkAndStore(healthCheckService.checkTcp(
                "ESIGN", config.getEsignTcpHost(), config.getEsignTcpPort(), timeout));

        checkAndStore(healthCheckService.checkHttp(
                "SMS", config.getSmsHttpUrl(), timeout));

        checkAndStore(healthCheckService.checkHttp(
                "TREASURY", config.getTreasuryHttpUrl(), timeout));

        checkAndStore(healthCheckService.checkTcp(
                "ICOPS", config.getIcopsTcpHost(), config.getIcopsTcpPort(), timeout));

        log.info("Health check cycle complete");
    }

    private void checkAndStore(ServiceHealthStatus status) {
        try {
            serviceHealthRepository.insert(status);
        } catch (Exception e) {
            log.error("Failed to store health status for [{}]: {}", status.getServiceName(), e.getMessage(), e);
        }
    }
}