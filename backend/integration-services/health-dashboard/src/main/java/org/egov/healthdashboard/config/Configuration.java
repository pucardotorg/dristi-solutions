package org.egov.healthdashboard.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Getter
@Component
public class Configuration {

    @Value("${app.timezone}")
    private String timeZone;

    @Value("${health.check.timeout.ms}")
    private int healthCheckTimeoutMs;

    @Value("${health.check.cron}")
    private String healthCheckCron;

    // ESIGN (CDAC) - TCP
    @Value("${esign.tcp.host}")
    private String esignTcpHost;

    @Value("${esign.tcp.port}")
    private int esignTcpPort;

    // SMS (CDAC) - HTTP
    @Value("${sms.http.url}")
    private String smsHttpUrl;

    // TREASURY - HTTP
    @Value("${treasury.http.url}")
    private String treasuryHttpUrl;

    // ICOPS - TCP
    @Value("${icops.tcp.host}")
    private String icopsTcpHost;

    @Value("${icops.tcp.port}")
    private int icopsTcpPort;
}