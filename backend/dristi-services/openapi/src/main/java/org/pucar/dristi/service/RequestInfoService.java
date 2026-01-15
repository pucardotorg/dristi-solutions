package org.pucar.dristi.service;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.RequestInfoWrapper;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.pucar.dristi.util.IndividualUtil;
import org.pucar.dristi.web.models.Individual;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class RequestInfoService {

    private final IndividualUtil individualUtil;

    public RequestInfoService(IndividualUtil individualUtil) {
        this.individualUtil = individualUtil;
    }

    public void enrichUserUuidInRequestInfo(RequestInfo requestInfo, String mobileNumber) {
        Individual individual = individualUtil.getIndividualFromMobileNumber(requestInfo, mobileNumber);
        User user = User.builder()
                .uuid(individual.getUserUuid())
                .build();
        requestInfo.setUserInfo(user);
    }
}
