package org.pucar.dristi.util;


import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.pucar.dristi.config.Configuration;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import java.util.Base64;
import java.util.Map;

@Component
@Slf4j
public class ElasticSearchUtil {

    private final RestTemplate restTemplate;

    private final Configuration configs;



    @Autowired
    public ElasticSearchUtil(RestTemplate restTemplate,
                      ObjectMapper mapper,
                      Configuration configs) {
        this.restTemplate = restTemplate;
        this.configs = configs;
    }

    public Object searchIndexWithId( String id) {
        String url = configs.getEsHostUrl() + "/" + configs.getCaseBundleIndex() + "/_doc/" + id;
        Object response = null;
        try {
            final HttpHeaders headers = new HttpHeaders();
            headers.add("Authorization", getESEncodedCredentials());
            final HttpEntity entity = new HttpEntity(headers);
            response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
        } catch (Exception e) {
            log.error("GET: Exception while fetching from es: " + e);
            throw new CustomException("ELASTICSEARCH_ERROR", "Unable to get data from es");
        }

        return response;
    }

    public Object searchAllDocsInIndex() {
        String url = configs.getEsHostUrl() + "/" + configs.getCaseBundleIndex() + "/_search";
        Object response = null;
        try {
            final HttpHeaders headers = new HttpHeaders();
            headers.add("Authorization", getESEncodedCredentials());

            // Create an HTTP entity with headers
            final HttpEntity<String> entity = new HttpEntity<>(headers);

            // Send a GET request to Elasticsearch with a match_all query
            response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
        } catch (Exception e) {
            log.error("GET: Exception while fetching all documents from es: " + e);
            throw new CustomException("ELASTICSEARCH_ERROR", "Unable to retrieve documents from es");
        }

        return response;
    }

    private String getESEncodedCredentials() {
        String credentials = configs.getEsUsername() + ":" + configs.getEsPassword();
        byte[] credentialsBytes = credentials.getBytes();
        byte[] base64CredentialsBytes = Base64.getEncoder().encode(credentialsBytes);
        return "Basic " + new String(base64CredentialsBytes);
    }

}
