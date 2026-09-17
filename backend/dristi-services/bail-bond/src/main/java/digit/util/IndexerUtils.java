package digit.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import digit.config.Configuration;
import digit.web.models.Bail;
import digit.web.models.Document;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONArray;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Clock;
import java.util.*;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import static digit.config.ServiceConstants.*;

@Service
@Slf4j
public class IndexerUtils {

    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);

    private final RestTemplate restTemplate;

    private final Configuration config;

    private final ObjectMapper mapper;



    @Autowired
    public IndexerUtils(RestTemplate restTemplate, Configuration config, ObjectMapper mapper) {
        this.restTemplate = restTemplate;
        this.config = config;
        this.mapper = mapper;
    }


    public void esPostManual(String uri, String request) throws Exception {
        try {
            log.debug("Record being indexed manually: {}", request);

            final HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON_UTF8);
            headers.add("Authorization", getESEncodedCredentials());
            final HttpEntity<String> entity = new HttpEntity<>(request, headers);

            String response = restTemplate.postForObject(uri, entity, String.class);
            if (uri.contains("_bulk") && JsonPath.read(response, ERRORS_PATH).equals(true)) {
                log.info("Manual Indexing FAILED!!!!");
                log.info("Response from ES for manual push: {}", response);
                throw new Exception("Error while updating index");
            }
        } catch (Exception e) {
            log.error("Exception while trying to index the ES documents. Note: ES is not Down.", e);
            throw e;
        }
    }

    public String getESEncodedCredentials() {
        String credentials = config.getEsUsername() + ":" + config.getEsPassword();
        byte[] credentialsBytes = credentials.getBytes();
        byte[] base64CredentialsBytes = Base64.getEncoder().encode(credentialsBytes);
        return "Basic " + new String(base64CredentialsBytes);
    }

    public String buildPayload(Bail bail) {
        String tenantId = bail.getTenantId();
        Boolean isActive = bail.getIsActive();
        String litigantName = bail.getLitigantName();
        String status = bail.getStatus();
        String courtId = bail.getCourtId();
        String caseTitle = bail.getCaseTitle();
        String filingNumber = bail.getFilingNumber();
        String caseNumber = bail.getCaseNumber();
        String bailId = bail.getBailId();
        String id = bail.getId();
        String indexName = config.getBailBondIndex();

        // Prepare simplified documents list
        List<Map<String, Object>> simpleDocuments = new ArrayList<>();
        if (bail.getDocuments() != null) {
            for (Document doc : bail.getDocuments()) {
                Map<String, Object> map = new HashMap<>();
                map.put("id", doc.getId());
                map.put("documentUid", doc.getDocumentUid());
                map.put("documentType", doc.getDocumentType());
                map.put("fileStore", doc.getFileStore());
                map.put("documentName", doc.getDocumentName());
                simpleDocuments.add(map);
            }
        }

        // Serialize documents list to JSON string
        String documentsJson = "[]";
        try {
            documentsJson = mapper.writeValueAsString(simpleDocuments);
        } catch (Exception e) {
            log.warn("Documents JSON serialization FAILED!!!!");
            documentsJson = "[]";
        }

        // Prepare searchableFields JSON array string
        List<String> searchableFieldsList = new ArrayList<>();
        if (caseTitle != null) searchableFieldsList.add(caseTitle);
        if (caseNumber != null) searchableFieldsList.add(caseNumber);
        if(filingNumber != null) searchableFieldsList.add(filingNumber);
        if (litigantName != null) searchableFieldsList.add(litigantName);
        String searchableFieldsJson = new JSONArray(searchableFieldsList).toString();

        return String.format(
                ES_INDEX_HEADER_FORMAT + ES_INDEX_BAIL_BOND_FORMAT,
                indexName, id, tenantId, status, courtId, caseTitle, filingNumber, caseNumber, bailId, isActive, litigantName, documentsJson, searchableFieldsJson
        );
    }





}


