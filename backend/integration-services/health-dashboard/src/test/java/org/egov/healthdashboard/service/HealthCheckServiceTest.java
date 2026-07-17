package org.egov.healthdashboard.service;

import com.sun.net.httpserver.HttpServer;
import org.egov.healthdashboard.service.HealthCheckService;
import org.egov.healthdashboard.web.models.ServiceHealthStatus;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;
import java.net.InetSocketAddress;
import java.net.ServerSocket;

import static org.assertj.core.api.Assertions.assertThat;

class HealthCheckServiceTest {

    private final HealthCheckService healthCheckService = new HealthCheckService();

    private HttpServer httpServer;

    @AfterEach
    void tearDown() {
        if (httpServer != null) {
            httpServer.stop(0);
        }
    }

    private HttpServer startServer(int statusCode) throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress("localhost", 0), 0);
        server.createContext("/", exchange -> {
            exchange.sendResponseHeaders(statusCode, -1);
            exchange.close();
        });
        server.start();
        return server;
    }

    @Test
    void checkHttp_returnsUp_whenServerRespondsWith200() throws Exception {
        httpServer = startServer(200);
        String url = "http://localhost:" + httpServer.getAddress().getPort() + "/";

        ServiceHealthStatus status = healthCheckService.checkHttp("SMS", url, 5000);

        assertThat(status.getServiceName()).isEqualTo("SMS");
        assertThat(status.getServiceUrl()).isEqualTo(url);
        assertThat(status.getLastStatus()).isEqualTo("UP");
        assertThat(status.getMessage()).isEqualTo("HTTP 200");
        assertThat(status.getResponseTimeMs()).isGreaterThanOrEqualTo(0);
        assertThat(status.getLastUpdatedTime()).isNotNull();
    }

    @Test
    void checkHttp_returnsUp_whenServerRespondsWith4xx() throws Exception {
        httpServer = startServer(404);
        String url = "http://localhost:" + httpServer.getAddress().getPort() + "/";

        ServiceHealthStatus status = healthCheckService.checkHttp("SMS", url, 5000);

        assertThat(status.getLastStatus()).isEqualTo("UP");
        assertThat(status.getMessage()).isEqualTo("HTTP 404");
    }

    @Test
    void checkHttp_returnsDown_whenServerRespondsWith5xx() throws Exception {
        httpServer = startServer(503);
        String url = "http://localhost:" + httpServer.getAddress().getPort() + "/";

        ServiceHealthStatus status = healthCheckService.checkHttp("SMS", url, 5000);

        assertThat(status.getLastStatus()).isEqualTo("DOWN");
        assertThat(status.getMessage()).isEqualTo("HTTP 503");
    }

    @Test
    void checkHttp_returnsDown_whenConnectionFails() {
        String url = "http://localhost:1/unreachable";

        ServiceHealthStatus status = healthCheckService.checkHttp("SMS", url, 1000);

        assertThat(status.getServiceName()).isEqualTo("SMS");
        assertThat(status.getServiceUrl()).isEqualTo(url);
        assertThat(status.getLastStatus()).isEqualTo("DOWN");
        assertThat(status.getMessage()).isNotNull();
    }

    @Test
    void checkTcp_returnsUp_whenPortIsReachable() throws Exception {
        try (ServerSocket serverSocket = new ServerSocket(0)) {
            int port = serverSocket.getLocalPort();

            ServiceHealthStatus status = healthCheckService.checkTcp("ESIGN", "localhost", port, 2000);

            assertThat(status.getServiceName()).isEqualTo("ESIGN");
            assertThat(status.getServiceUrl()).isEqualTo("tcp://localhost:" + port);
            assertThat(status.getLastStatus()).isEqualTo("UP");
            assertThat(status.getMessage()).isEqualTo("TCP connection successful");
        }
    }

    @Test
    void checkTcp_returnsDown_whenPortIsNotReachable() throws Exception {
        int freePort;
        try (ServerSocket serverSocket = new ServerSocket(0)) {
            freePort = serverSocket.getLocalPort();
        }

        ServiceHealthStatus status = healthCheckService.checkTcp("ICOPS", "localhost", freePort, 1000);

        assertThat(status.getServiceName()).isEqualTo("ICOPS");
        assertThat(status.getServiceUrl()).isEqualTo("tcp://localhost:" + freePort);
        assertThat(status.getLastStatus()).isEqualTo("DOWN");
        assertThat(status.getMessage()).isNotNull();
    }

    @Test
    void truncate_shortensMessagesLongerThan500Characters() throws Exception {
        Method truncate = HealthCheckService.class.getDeclaredMethod("truncate", String.class);
        truncate.setAccessible(true);

        String longMessage = "x".repeat(600);
        String result = (String) truncate.invoke(healthCheckService, longMessage);

        assertThat(result).hasSize(500);
    }

    @Test
    void truncate_returnsMessageUnchanged_whenShorterThan500Characters() throws Exception {
        Method truncate = HealthCheckService.class.getDeclaredMethod("truncate", String.class);
        truncate.setAccessible(true);

        String result = (String) truncate.invoke(healthCheckService, "short message");

        assertThat(result).isEqualTo("short message");
    }

    @Test
    void truncate_returnsNull_whenMessageIsNull() throws Exception {
        Method truncate = HealthCheckService.class.getDeclaredMethod("truncate", String.class);
        truncate.setAccessible(true);

        String result = (String) truncate.invoke(healthCheckService, new Object[]{null});

        assertThat(result).isNull();
    }
}
