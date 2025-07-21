package digit.util;

import com.jayway.jsonpath.JsonPath;
import digit.config.Configuration;
import digit.web.models.OpenHearing;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Base64;
import java.util.List;
import java.util.stream.Collectors;

import static digit.config.ServiceConstants.*;

@Component
@Slf4j
public class EsUtil {


    private final RestTemplate restTemplate;
    private final Configuration config;

    @Autowired
    public EsUtil(RestTemplate restTemplate, Configuration config) {
        this.restTemplate = restTemplate;
        this.config = config;
    }


    public String buildPayload(OpenHearing openHearing) {
        String hearingUuid = openHearing.getHearingUuid();
        Integer serialNumber = openHearing.getSerialNumber();

        return String.format(
                ES_UPDATE_HEADER_FORMAT + ES_UPDATE_DOCUMENT_FORMAT, config.getIndex(), hearingUuid,serialNumber
        );
    }

    public void updateOpenHearingSerialNumber(List<OpenHearing> openHearings) {
        try {

            if (openHearings != null && !openHearings.isEmpty()) {
                try {
                    String bulkRequestPayload = openHearings.stream()
                            .map(this::buildPayload)
                            .filter(s -> !s.isEmpty())
                            .collect(Collectors.joining(""));
                    String uri = config.getEsHostUrl() + config.getBulkPath();
                    manualIndex(uri, bulkRequestPayload);
                } catch (Exception e) {
                    log.error("Error occurred while updating open hearing serialNumber in es");
                    log.error("ERROR_FROM_ES: {}", e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Something went wrong while updating serialNumber of open hearing");
            log.error("ERROR: {}", e.getMessage());
        }


    }


    public void manualIndex(String uri, String request) throws Exception {
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
            log.error("Exception while trying to index the ES documents", e);
            throw e;
        }
    }

    public String getESEncodedCredentials() {
        String credentials = config.getEsUsername() + ":" + config.getEsPassword();
        byte[] credentialsBytes = credentials.getBytes();
        byte[] base64CredentialsBytes = Base64.getEncoder().encode(credentialsBytes);
        return "Basic " + new String(base64CredentialsBytes);
    }
}
