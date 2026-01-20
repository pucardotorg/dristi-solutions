package digit.service;

import digit.config.Configuration;
import digit.util.IndividualUtil;
import digit.web.models.IndividualSearch;
import digit.web.models.IndividualSearchRequest;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.models.individual.Individual;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import static digit.config.ServiceConstants.INDIVIDUAL_SERVICE_EXCEPTION;

@Service
@Slf4j
public class IndividualService {

    private final IndividualUtil individualUtils;
    private final Configuration config;

    @Autowired
    public IndividualService(IndividualUtil individualUtils, Configuration config) {
        this.individualUtils = individualUtils;
        this.config = config;
    }

    public Boolean searchIndividual(RequestInfo requestInfo , String individualId, Map<String, String> individualUserUUID ){
        try {
            IndividualSearchRequest individualSearchRequest = new IndividualSearchRequest();
            individualSearchRequest.setRequestInfo(requestInfo);
            IndividualSearch individualSearch = new IndividualSearch();
            log.info("Individual Id :: {}", individualId);
            individualSearch.setIndividualId(individualId);
            individualSearchRequest.setIndividual(individualSearch);
            StringBuilder uri = new StringBuilder(config.getIndividualHost()).append(config.getIndividualSearchEndpoint());
            uri.append("?limit=1000").append("&offset=0").append("&tenantId=").append(requestInfo.getUserInfo().getTenantId()).append("&includeDeleted=true");
            return individualUtils.individualCall(individualSearchRequest, uri, individualUserUUID);
        } catch (CustomException e){
            throw e;
        } catch (Exception e){
            log.error("Error in search individual service");
            throw new CustomException(INDIVIDUAL_SERVICE_EXCEPTION,"Error in search individual service"+e.getMessage());
        }
    }

    public List<Individual> getIndividuals(RequestInfo requestInfo, List<String> uuids) {
        try {
            IndividualSearchRequest individualSearchRequest = new IndividualSearchRequest();
            individualSearchRequest.setRequestInfo(requestInfo);
            IndividualSearch individualSearch = new IndividualSearch();
            individualSearch.setUserUuid(uuids);
            individualSearchRequest.setIndividual(individualSearch);
            StringBuilder uri = new StringBuilder(config.getIndividualHost()).append(config.getIndividualSearchEndpoint());
            uri.append("?limit=").append(uuids.size()).append("&offset=0")
                    .append("&tenantId=").append(requestInfo.getUserInfo().getTenantId());
                List<Individual> individual = individualUtils.getIndividualByIndividualId(individualSearchRequest, uri);
            if (individual != null ) {
                return individual;
            } else {
                log.error("No individuals found");
                return Collections.emptyList();
            }
        } catch (Exception e) {
            log.error("Error in search individual service :: {}", e.toString());
            log.error("Individuals not found");
            return Collections.emptyList();
        }
    }

}
