package org.pucar.dristi.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.postgresql.util.PGobject;
import org.pucar.dristi.repository.PdfResponseRepository;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.web.models.PdfRequest;
import org.pucar.dristi.web.models.PdfSummonsRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Slf4j
public class PdfSummonsOrderRequestService {

    @Autowired
    private RestTemplate restTemplate;

    @Value("${egov.pdf.host}")
    private String generatePdfHost;

    @Autowired
    private ObjectMapper objectMapper;

    @Value("${egov.pdf.create}")
    private String generatePdfUrl;

    @Autowired
    private ServiceRequestRepository serviceRequestRepository;

    @Autowired
    private PdfResponseRepository referenceIdMapperRepository;

    @Autowired
    private StringRedisTemplate stringRedisTemplate;

    @PostConstruct
    public void loadCache() {
        log.info("Loading data into cache from database");
        List<Map<String, Object>> rows = referenceIdMapperRepository.findAll();
        for (Map<String, Object> row : rows) {
            try {
                String referenceId = (String) row.get("referenceId");
                PGobject pgObject = (PGobject) row.get("jsonResponse");
                String jsonResponse = pgObject.getValue();
                stringRedisTemplate.opsForHash().put("referenceid_filestore_mapper", referenceId, jsonResponse);
            } catch (Exception e) {
                log.error("Error loading data into cache for referenceId: {}", row.get("referenceId"), e);
                throw new CustomException("CACHE_LOADING_ERROR","error loading data into cache");
            }
        }
    }

    public Object createPdf(PdfSummonsRequest requestObject, PdfRequest pdfRequestobject) {
        String referenceId=pdfRequestobject.getReferenceId();
        String refCode=pdfRequestobject.getReferenceCode();
        String tenantId= pdfRequestobject.getTenantId();
        // Step 1: Check the cache
        String cachedJsonResponse = (String) stringRedisTemplate.opsForHash().get("referenceid_filestore_mapper", referenceId);
        if (cachedJsonResponse != null) {
            log.info("Cache hit for referenceId: {}", referenceId);
            try{
                return objectMapper.readValue(cachedJsonResponse, Object.class);
            }
            catch (Exception e){
                throw new CustomException("JSON_PARSING_ERR","error while serializing cache data");
            }
        }

        // Step 2: Check the database if cache miss
        Optional<String> dbJsonResponse = referenceIdMapperRepository.findJsonResponseByReferenceId(referenceId);
        if (dbJsonResponse.isPresent()) {
            log.info("Database hit for referenceId: {}", referenceId);
            // Update cache
            stringRedisTemplate.opsForHash().put("referenceid_filestore_mapper", referenceId, dbJsonResponse.get());
            try{
                return objectMapper.readValue(dbJsonResponse.get(), Object.class);
            }
            catch (Exception e){
                throw new CustomException("JSON_PARSING_ERR","error while serializing cache data");
            }
        }

        // Step 3: Create PDF if not found
        log.info("Creating PDF for referenceId: {}", referenceId);
        StringBuilder requestUrl = new StringBuilder();
        requestUrl.append(generatePdfHost).append(generatePdfUrl).append("?key=").append(refCode)
                .append("&tenantId=").append(tenantId);

        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE);
        headers.set(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);

        HttpEntity<PdfSummonsRequest> requestEntity = new HttpEntity<>(requestObject, headers);
        Object pdfResponse = serviceRequestRepository.fetchResult(requestUrl, requestEntity);
        // Convert pdfResponse to JSON
        String jsonResponse=null;
        try{
            jsonResponse = objectMapper.writeValueAsString(pdfResponse);
        }
        catch (Exception e){
            throw new CustomException("JSON_PARSING_ERR","error parsing the json response");
        }

        // Step 4: Store JSON in database and cache on success
        log.info("Storing JSON response in database and updating cache for referenceId: {}", referenceId);
        referenceIdMapperRepository.saveJsonResponse(referenceId, jsonResponse);
        stringRedisTemplate.opsForHash().put("referenceid_filestore_mapper", referenceId, jsonResponse);
        return pdfResponse;
    }
}
