package notification.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import notification.config.Configuration;
import notification.repository.ServiceRequestRepository;
import notification.web.models.IdGenerationRequest;
import notification.web.models.IdGenerationResponse;
import notification.web.models.IdRequest;
import notification.web.models.IdResponse;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;

import java.util.ArrayList;
import java.util.List;

import static notification.config.ServiceConstants.IDGEN_ERROR;
import static notification.config.ServiceConstants.NO_IDS_FOUND_ERROR;

@Component
public class IdgenUtil {

    private ObjectMapper mapper;

    private ServiceRequestRepository restRepo;

    private Configuration configs;

    public IdgenUtil(ObjectMapper mapper, ServiceRequestRepository restRepo, Configuration configs) {
        this.mapper = mapper;
        this.restRepo = restRepo;
        this.configs = configs;
    }


    public List<String> getIdList(RequestInfo requestInfo, String tenantId, String idName, String idformat, Integer count, Boolean isSequencePadded) {
        List<IdRequest> reqList = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            reqList.add(IdRequest.builder().idName(idName).format(idformat).tenantId(tenantId).isSequencePadded(isSequencePadded).build());
        }

        IdGenerationRequest request = IdGenerationRequest.builder().idRequests(reqList).requestInfo(requestInfo).build();
        StringBuilder uri = new StringBuilder(configs.getIdGenHost()).append(configs.getIdGenPath());
        IdGenerationResponse response = mapper.convertValue(restRepo.fetchResult(uri, request), IdGenerationResponse.class);

        List<IdResponse> idResponses = response.getIdResponses();

        if (CollectionUtils.isEmpty(idResponses))
            throw new CustomException(IDGEN_ERROR, NO_IDS_FOUND_ERROR);

        return idResponses.stream().map(IdResponse::getId).toList();
    }

}