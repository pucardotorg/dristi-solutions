package pucar.repository;


import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.ServiceCallException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Repository;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

import static pucar.config.ServiceConstants.EXTERNAL_SERVICE_EXCEPTION;
import static pucar.config.ServiceConstants.SEARCHER_SERVICE_EXCEPTION;

@Repository
@Slf4j
public class ServiceRequestRepository {

    private final ObjectMapper mapper;
    private final RestTemplate restTemplate;


    @Autowired
    public ServiceRequestRepository(ObjectMapper mapper, RestTemplate restTemplate) {
        this.mapper = mapper;
        this.restTemplate = restTemplate;
    }


    public Object fetchResult(StringBuilder uri, Object request) {
        mapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        Object response = null;
        try {
            response = restTemplate.postForObject(uri.toString(), request, Map.class);
        } catch (HttpClientErrorException e) {
            log.error(EXTERNAL_SERVICE_EXCEPTION, e);
            throw new ServiceCallException(e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error(SEARCHER_SERVICE_EXCEPTION, e);
        }

        return response;
    }

    public ResponseEntity<Resource> fetchResultGetForEntity(StringBuilder uri) {
        mapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS,false);
        ResponseEntity<Resource> response = null;
        try {
            String uriString = uri.toString();
            response = restTemplate.getForEntity(uriString,Resource.class);
        } catch (HttpClientErrorException e) {
            log.error(EXTERNAL_SERVICE_EXCEPTION, e);
            throw new ServiceCallException(e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error(SEARCHER_SERVICE_EXCEPTION, e);
        }
        return response;
    }

    public ResponseEntity<Object> fetchResultPostForEntity(String uri,
                                                             HttpEntity<MultiValueMap<String, Object>> responseEntity
                                                             ) {
        mapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS,false);
        ResponseEntity<Object> response = null;
        try {
            response = restTemplate.postForEntity(uri,responseEntity,Object.class);
        } catch (HttpClientErrorException e) {
            log.error(EXTERNAL_SERVICE_EXCEPTION, e);
            throw new ServiceCallException(e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error(SEARCHER_SERVICE_EXCEPTION, e);
        }
        return response;
    }

    public Resource fetchResultGetForResource(StringBuilder uri) {
        mapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        Resource response = null;
        try {
            response = restTemplate.getForObject(uri.toString(), Resource.class);
        } catch (HttpClientErrorException e) {
            log.error(EXTERNAL_SERVICE_EXCEPTION, e);
            throw new ServiceCallException(e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error(SEARCHER_SERVICE_EXCEPTION, e);
        }

        return response;
    }
}