package org.pucar.dristi.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import org.pucar.dristi.kafka.Producer;
import org.pucar.dristi.model.*;
import org.pucar.dristi.repository.EPostRepository;
import org.pucar.dristi.util.EpostUtil;
import org.pucar.dristi.validator.EPostUserValidator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class EPostService {

    private final EPostRepository ePostRepository;

    private final EpostUtil epostUtil;

    private final Producer producer;

    private final EPostUserValidator ePostUserValidator;

    @Autowired
    public EPostService(EPostRepository ePostRepository, EpostUtil epostUtil, Producer producer, EPostUserValidator ePostUserValidator) {
        this.ePostRepository = ePostRepository;
        this.epostUtil = epostUtil;
        this.producer = producer;
        this.ePostUserValidator = ePostUserValidator;
    }

    public ChannelMessage sendEPost(TaskRequest request) throws JsonProcessingException {

        EPostTracker ePostTracker = epostUtil.createPostTrackerBody(request);

        EPostRequest ePostRequest = EPostRequest.builder().requestInfo(request.getRequestInfo()).ePostTracker(ePostTracker).build();
        producer.push("save-epost-tracker", ePostRequest);

        return ChannelMessage.builder().processNumber(ePostTracker.getProcessNumber()).acknowledgementStatus("SUCCESS").build();
    }

    public EPostResponse getEPost(EPostTrackerSearchRequest searchRequest, int limit, int offset) {
        enrichSearchRequest(searchRequest);
        return ePostRepository.getEPostTrackerResponse(searchRequest.getEPostTrackerSearchCriteria(),limit,offset);
    }

    public EPostTracker updateEPost(EPostRequest ePostRequest) {

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
