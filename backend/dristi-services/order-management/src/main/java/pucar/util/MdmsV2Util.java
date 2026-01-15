package pucar.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import pucar.config.Configuration;
import pucar.web.models.mdms.Mdms;
import pucar.web.models.mdms.MdmsCriteriaReqV2;
import pucar.web.models.mdms.MdmsCriteriaV2;
import pucar.web.models.mdms.MdmsResponseV2;

import java.util.*;

import static pucar.config.ServiceConstants.ERROR_WHILE_FETCHING_FROM_MDMS;

@Component
@Slf4j
public class MdmsV2Util {

    private final RestTemplate restTemplate;

    private final ObjectMapper mapper;

    private final Configuration configs;

    @Autowired
    public MdmsV2Util(RestTemplate restTemplate,
                      ObjectMapper mapper,
                      Configuration configs) {
        this.restTemplate = restTemplate;
        this.mapper = mapper;
        this.configs = configs;
    }


    public List<Mdms> fetchMdmsV2Data(RequestInfo requestInfo, String tenantId, Set<String> ids, Set<String> uniqueIdentifiers, String schemaCode, Boolean isActive, Map<String, String> filters) {
        StringBuilder uri = new StringBuilder();
        uri.append(configs.getMdmsHost()).append(configs.getMdmsV2EndPoint());
        MdmsCriteriaReqV2 mdmsCriteriaReqV2 = getMdmsV2Request(requestInfo, tenantId, ids, uniqueIdentifiers, schemaCode, isActive, filters);
        Object response;
        MdmsResponseV2 mdmsResponseV2 = new MdmsResponseV2();
        try {
            response = restTemplate.postForObject(uri.toString(), mdmsCriteriaReqV2, Map.class);
            mdmsResponseV2 = mapper.convertValue(response, MdmsResponseV2.class);
        } catch (Exception e) {
            log.error(ERROR_WHILE_FETCHING_FROM_MDMS, e);
        }

        return mdmsResponseV2.getMdms();
    }

    public MdmsCriteriaReqV2 getMdmsV2Request(RequestInfo requestInfo, String tenantId, Set<String> ids, Set<String> uniqueIdentifiers, String schemaCode, Boolean isActive, Map<String, String> filters) {
        MdmsCriteriaV2 mdmsCriteriaV2 = new MdmsCriteriaV2();

        if (tenantId != null) mdmsCriteriaV2.setTenantId(tenantId);
        if (ids != null && !ids.isEmpty()) mdmsCriteriaV2.setIds(ids);
        if (uniqueIdentifiers != null && !uniqueIdentifiers.isEmpty())
            mdmsCriteriaV2.setUniqueIdentifiers(uniqueIdentifiers);
        if (schemaCode != null) mdmsCriteriaV2.setSchemaCode(schemaCode);
        if (isActive != null) mdmsCriteriaV2.setIsActive(isActive);
        if (filters != null) mdmsCriteriaV2.setFilterMap(filters);

        return MdmsCriteriaReqV2.builder().requestInfo(requestInfo).mdmsCriteria(mdmsCriteriaV2).build();
    }

    public Map<String, String> fetchCourtDetails(RequestInfo requestInfo, String tenantId, String courtId) {
        Map<String, String> courtDetails = new HashMap<>();
        try {
            Map<String, String> filters = new HashMap<>();
            filters.put("code", courtId);
            
            List<Mdms> mdmsList = fetchMdmsV2Data(
                requestInfo, 
                tenantId, 
                null, 
                null, 
                "common-masters.Court_Rooms", 
                true, 
                filters
            );
            
            if (mdmsList != null && !mdmsList.isEmpty()) {
                Mdms mdms = mdmsList.get(0);
                if (mdms.getData() != null) {
                    if (mdms.getData().has("name")) {
                        courtDetails.put("courtName", mdms.getData().get("name").asText());
                    }
                    if (mdms.getData().has("place")) {
                        courtDetails.put("place", mdms.getData().get("place").asText());
                    }
                    if (mdms.getData().has("state")) {
                        courtDetails.put("state", mdms.getData().get("state").asText());
                    }
                }
                log.info("Successfully fetched court details from MDMS for courtId: {}", courtId);
            } else {
                log.warn("No court details found in MDMS for courtId: {}", courtId);
            }
        } catch (Exception e) {
            log.error("Error fetching court details from MDMS for courtId: {}", courtId, e);
        }
        return courtDetails;
    }

}
