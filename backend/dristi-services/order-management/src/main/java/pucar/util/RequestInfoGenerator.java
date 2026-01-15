package pucar.util;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import pucar.config.Configuration;

import java.util.Collections;

import static pucar.config.ServiceConstants.SYSTEM;
import static pucar.config.ServiceConstants.msgId;

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
        userInfo.setTenantId(configuration.getStateLevelTenantId());
        userInfo.setType(SYSTEM);
        return RequestInfo.builder().userInfo(userInfo).msgId(msgId).build();
    }
}
