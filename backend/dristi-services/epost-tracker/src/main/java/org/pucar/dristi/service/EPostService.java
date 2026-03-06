package org.pucar.dristi.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import lombok.extern.slf4j.Slf4j;
import org.pucar.dristi.config.EPostConfiguration;
import org.pucar.dristi.kafka.Producer;
import org.pucar.dristi.model.*;
import org.pucar.dristi.repository.EPostRepository;
import org.pucar.dristi.util.EpostUtil;
import org.pucar.dristi.validator.EPostUserValidator;
import org.pucar.dristi.validator.EPostValidator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;

@Slf4j
@Service
public class EPostService {

    private final EPostRepository ePostRepository;

    private final EpostUtil epostUtil;

    private final EPostValidator ePostValidator;

    private final Producer producer;

    private final EPostUserValidator ePostUserValidator;

    private final EPostConfiguration configuration;

    @Autowired
    public EPostService(EPostRepository ePostRepository, EpostUtil epostUtil, EPostValidator ePostValidator, Producer producer, EPostUserValidator ePostUserValidator, EPostConfiguration configuration) {
        this.ePostRepository = ePostRepository;
        this.epostUtil = epostUtil;
        this.ePostValidator = ePostValidator;
        this.producer = producer;
        this.ePostUserValidator = ePostUserValidator;
        this.configuration = configuration;
    }

    public ChannelMessage sendEPost(TaskRequest request) throws JsonProcessingException {

        EPostTracker ePostTracker = epostUtil.createPostTrackerBody(request);

        EPostRequest ePostRequest = EPostRequest.builder().requestInfo(request.getRequestInfo()).ePostTracker(ePostTracker).build();
        producer.push("save-epost-tracker", ePostRequest);

        return ChannelMessage.builder().processNumber(ePostTracker.getProcessNumber()).acknowledgementStatus("SUCCESS").build();
    }

    public EPostResponse getEPost(EPostTrackerSearchRequest searchRequest, int limit, int offset) {
        // isGetDataBasedOnUserLoggedIn is used to get data based on the user logged in
        if (configuration.isGetDataBasedOnUserLoggedIn()) {
            enrichSearchRequest(searchRequest);
            EPostTrackerSearchCriteria searchCriteria = searchRequest.getEPostTrackerSearchCriteria();
            if (searchCriteria.getPostalHub() != null) {
                return ePostRepository.getEPostTrackerResponse(searchRequest.getEPostTrackerSearchCriteria(), limit, offset);
            }
            else {
                return EPostResponse.builder()
                        .ePostTrackers(new ArrayList<>())
                        .pagination(Pagination.builder().totalCount(0).build())
                        .build();
            }
        }
        return ePostRepository.getEPostTrackerResponse(searchRequest.getEPostTrackerSearchCriteria(),limit,offset);
    }

    public EPostResponse getAllEPost(EPostTrackerSearchRequest searchRequest, int limit, int offset) {
        return ePostRepository.getEPostTrackerResponse(searchRequest.getEPostTrackerSearchCriteria(), limit, offset);
    }

    public EPostTracker updateEPost(EPostRequest ePostRequest) {

        ePostValidator.validateUpdateRequest(ePostRequest);

        EPostTracker ePostTracker = epostUtil.updateEPostTracker(ePostRequest);

        EPostRequest postRequest = EPostRequest.builder().requestInfo(ePostRequest.getRequestInfo()).ePostTracker(ePostTracker).build();
        producer.push("update-epost-tracker",postRequest);

        return ePostTracker;
    }

    private void enrichSearchRequest(EPostTrackerSearchRequest searchRequest) {

        // enriching the postalHub Name based on the user logged in
        String postalHubName = ePostUserValidator.getPostalHubName(searchRequest);
        EPostTrackerSearchCriteria searchCriteria = searchRequest.getEPostTrackerSearchCriteria();
        searchCriteria.setPostalHub(postalHubName);

    }
}
