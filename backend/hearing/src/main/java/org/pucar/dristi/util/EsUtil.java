package org.pucar.dristi.util;

import com.jayway.jsonpath.JsonPath;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONArray;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.web.models.Advocate;
import org.pucar.dristi.web.models.OpenHearing;
import org.pucar.dristi.web.models.OrderStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Base64;
import java.util.List;

import static org.pucar.dristi.config.ServiceConstants.*;

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
        String tenantId = openHearing.getTenantId();
        String filingNumber = openHearing.getFilingNumber();
        String caseTitle = openHearing.getCaseTitle();
        String caseUuid = openHearing.getCaseUuid();
        String hearingNumber = openHearing.getHearingNumber();
        String caseNumber = openHearing.getCaseNumber();
        String stage = openHearing.getStage();
        String status = openHearing.getStatus();
        Long fromDate = openHearing.getFromDate();
        Long toDate = openHearing.getToDate();
        String subStage = openHearing.getSubStage();
        String courtId = openHearing.getCourtId();
        Advocate advocate = openHearing.getAdvocate();
        List<String> accused = advocate.getAccused();
        String accusedString = new JSONArray(accused).toString();
        List<String> complainant = advocate.getComplainant();
        String complainantString = new JSONArray(complainant).toString();
        List<String> searchableFields = openHearing.getSearchableFields();
        String searchableFieldsString = new JSONArray(searchableFields).toString();
        String hearingType = openHearing.getHearingType();
        Long caseFilingDate = openHearing.getCaseFilingDate();
        Integer statusOrder = openHearing.getStatusOrder();
        Integer hearingTypeOrder = openHearing.getHearingTypeOrder();
        int serialNumber = openHearing.getSerialNumber();
        String orderStatus = openHearing.getOrderStatus().toString();

        return String.format(
                ES_INDEX_HEADER_FORMAT + ES_INDEX_DOCUMENT_FORMAT,
                config.getIndex(), hearingUuid, hearingUuid, tenantId, filingNumber, caseTitle, caseUuid, hearingNumber, caseNumber, stage, status, fromDate, toDate, subStage, courtId, accusedString, complainantString, searchableFieldsString, hearingType, caseFilingDate, statusOrder, hearingTypeOrder,serialNumber,orderStatus

        );
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
}
