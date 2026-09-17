package org.egov.healthdashboard.service;

import lombok.extern.slf4j.Slf4j;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.client.config.RequestConfig;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpHead;
import org.egov.healthdashboard.web.models.ServiceHealthStatus;
import org.springframework.stereotype.Service;

import java.net.InetSocketAddress;
import java.net.Socket;

@Service
@Slf4j
public class HealthCheckService {

    private final CloseableHttpClient httpClient = HttpClients.createDefault();

    /**
     * Checks HTTP/HTTPS endpoint availability.
     * Any HTTP response (including 4xx/5xx) = UP — only connection failure = DOWN.
     */
    public ServiceHealthStatus checkHttp(String serviceName, String url, int timeoutMs) {
        long start = System.currentTimeMillis();
        try {
            RequestConfig requestConfig = RequestConfig.custom()
                    .setConnectTimeout(timeoutMs)
                    .setSocketTimeout(timeoutMs)
                    .setConnectionRequestTimeout(timeoutMs)
                    .build();

            HttpHead request = new HttpHead(url);
            request.setConfig(requestConfig);
            try (CloseableHttpResponse response = httpClient.execute(request)) {
                int statusCode = response.getStatusLine().getStatusCode();
                long elapsed = System.currentTimeMillis() - start;
                String status = statusCode >= 500 ? "DOWN" : "UP";
                log.info("HTTP check [{}] {} → HTTP {}, {}ms", serviceName, url, statusCode, elapsed);
                return build(serviceName, url, status, elapsed, "HTTP " + statusCode);
            }
        } catch (Exception e) {
            long elapsed = System.currentTimeMillis() - start;
            log.warn("HTTP check [{}] {} → DOWN: {}", serviceName, url, e.getMessage());
            return build(serviceName, url, "DOWN", elapsed, truncate(e.getMessage()));
        }
    }

    /**
     * Checks TCP port reachability using a plain socket connect.
     * A successful TCP handshake = UP regardless of application protocol.
     */
    public ServiceHealthStatus checkTcp(String serviceName, String host, int port, int timeoutMs) {
        long start = System.currentTimeMillis();
        String endpoint = "tcp://" + host + ":" + port;
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress(host, port), timeoutMs);
            long elapsed = System.currentTimeMillis() - start;
            log.info("TCP check [{}] {}:{} → UP, {}ms", serviceName, host, port, elapsed);
            return build(serviceName, endpoint, "UP", elapsed, "TCP connection successful");
        } catch (Exception e) {
            long elapsed = System.currentTimeMillis() - start;
            log.warn("TCP check [{}] {}:{} → DOWN: {}", serviceName, host, port, e.getMessage());
            return build(serviceName, endpoint, "DOWN", elapsed, truncate(e.getMessage()));
        }
    }

    private ServiceHealthStatus build(String name, String url, String status, long elapsed, String message) {
        return ServiceHealthStatus.builder()
                .serviceName(name)
                .serviceUrl(url)
                .lastStatus(status)
                .lastUpdatedTime(System.currentTimeMillis())
                .responseTimeMs(elapsed)
                .message(message)
                .build();
    }

    private String truncate(String msg) {
        if (msg == null) return null;
        return msg.length() > 500 ? msg.substring(0, 500) : msg;
    }
}