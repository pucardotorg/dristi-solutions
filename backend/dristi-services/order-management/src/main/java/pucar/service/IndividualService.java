package pucar.service;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import pucar.config.Configuration;
import pucar.util.IndividualUtil;
import pucar.web.models.individual.Individual;
import pucar.web.models.individual.IndividualSearch;
import pucar.web.models.individual.IndividualSearchRequest;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@Slf4j
public class IndividualService {

    private IndividualUtil individualUtils;

    private Configuration config;

    @Autowired
    public IndividualService(IndividualUtil individualUtils, Configuration config) {
        this.individualUtils = individualUtils;
        this.config = config;
    }

    public List<Individual> getIndividuals(RequestInfo requestInfo, List<String> uuids) throws CustomException {
        try {
            IndividualSearchRequest individualSearchRequest = new IndividualSearchRequest();
            individualSearchRequest.setRequestInfo(requestInfo);
            IndividualSearch individualSearch = new IndividualSearch();
            individualSearch.setUserUuid(uuids);
            individualSearchRequest.setIndividual(individualSearch);
            StringBuilder uri = buildIndividualSearchUri(requestInfo, uuids);
            List<Individual> individual = individualUtils.getIndividualByIndividualId(individualSearchRequest, uri);
            if (individual != null) {

                return individual;
            } else {
                log.error("No individuals found");
                return Collections.emptyList();
            }
        } catch (Exception e) {
            log.error("Error in search individual service: ", e);
            return Collections.emptyList();
        }
    }

    private StringBuilder buildIndividualSearchUri(RequestInfo requestInfo, List<String> individualId) {
        return new StringBuilder(config.getIndividualHost())
                .append(config.getIndividualSearchEndPoint())
                .append("?limit=").append(individualId.size())
                .append("&offset=0")
                .append("&tenantId=").append(requestInfo.getUserInfo().getTenantId());
    }

    public Set<String> getPhoneNumbers(RequestInfo requestInfo, Set<String> ids) {

        Set<String> mobileNumber = new HashSet<>();

        List<Individual> individuals = getIndividuals(requestInfo, new ArrayList<>(ids));
        for(Individual individual : individuals) {
            if (individual.getMobileNumber() != null) {
                mobileNumber.add(individual.getMobileNumber());
            }
        }
        return mobileNumber;
    }

}

