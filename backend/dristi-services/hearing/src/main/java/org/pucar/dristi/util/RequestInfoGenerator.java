package org.pucar.dristi.util;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.pucar.dristi.config.Configuration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;

import static org.pucar.dristi.config.ServiceConstants.SYSTEM;
import static org.pucar.dristi.config.ServiceConstants.msgId;

@Component
@Slf4j
public class RequestInfoGenerator {


    private final Configuration configuration;

    @Autowired
    public RequestInfoGenerator(Configuration configuration) {
        this.configuration = configuration;
    }

    public RequestInfo createInternalRequestInfo() {
        User userInfo = new User();
        userInfo.setUuid(null);
        userInfo.setRoles(Collections.emptyList());
        userInfo.setTenantId(configuration.getTenantId());
        userInfo.setType(SYSTEM);
        return RequestInfo.builder().userInfo(userInfo).msgId(msgId).build();
    }
}
