package org.egov.eTreasury.service;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.eTreasury.config.PaymentConfiguration;
import org.egov.eTreasury.model.IndividualSearch;
import org.egov.eTreasury.model.IndividualSearchRequest;
import org.egov.eTreasury.model.Individual;
import org.egov.eTreasury.util.IndividualUtil;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
@Slf4j
public class IndividualService {

    private final IndividualUtil individualUtils;

    private final PaymentConfiguration config;

    @Autowired
    public IndividualService(IndividualUtil individualUtils, PaymentConfiguration config) {
        this.individualUtils = individualUtils;
        this.config = config;
    }

    public List<Individual> getIndividualsBylId(RequestInfo requestInfo, List<String> ids) throws CustomException {
        try {
            IndividualSearchRequest individualSearchRequest = new IndividualSearchRequest();
            individualSearchRequest.setRequestInfo(requestInfo);
            IndividualSearch individualSearch = new IndividualSearch();
            individualSearch.setUserUuid(ids);
            individualSearchRequest.setIndividual(individualSearch);
            StringBuilder uri = buildIndividualSearchUri(requestInfo, ids);
            List<Individual> individual = individualUtils.getIndividualByIndividualId(individualSearchRequest, uri);
            if (individual != null) {
                return individual;
            } else {
                log.error("No individuals found");
                return Collections.emptyList();
            }
        } catch (Exception e) {
            log.error("Error in search individual service: ", e);
            log.error("Individuals not found");
            return Collections.emptyList();
        }
    }

    private StringBuilder buildIndividualSearchUri(RequestInfo requestInfo, List<String> ids) {
        return new StringBuilder(config.getIndividualHost())
                .append(config.getIndividualSearchEndpoint())
                .append("?limit=").append(ids.size())
                .append("&offset=0")
                .append("&tenantId=").append(requestInfo.getUserInfo().getTenantId());
    }

}
