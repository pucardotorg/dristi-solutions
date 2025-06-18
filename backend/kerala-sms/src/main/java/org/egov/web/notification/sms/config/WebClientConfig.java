package org.egov.web.notification.sms.config;

import io.netty.handler.ssl.SslContext;
import io.netty.handler.ssl.SslContextBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import javax.net.ssl.SSLException;

@Configuration
public class WebClientConfig {
    @Bean
    public WebClient webClient() throws SSLException {
        SslContext nettySslContext = SslContextBuilder.forClient()
                .protocols("TLSv1.2")
                .build();
// Create Reactor Netty HttpClient with custom SSL context
        HttpClient httpClient = HttpClient.create()
                .secure(sslSpec -> sslSpec.sslContext( nettySslContext));
        return WebClient.builder()
                             .clientConnector(new ReactorClientHttpConnector(httpClient))
                               .build();
    }
}
