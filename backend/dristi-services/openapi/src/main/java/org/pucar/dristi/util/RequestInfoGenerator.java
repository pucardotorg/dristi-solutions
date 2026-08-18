package org.pucar.dristi.util;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.Role;
import org.egov.common.contract.request.User;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;

import static org.pucar.dristi.config.ServiceConstants.INTERNALMICROSERVICEROLE_NAME;
import static org.pucar.dristi.config.ServiceConstants.SYSTEM;
import static org.pucar.dristi.config.ServiceConstants.msgId;

@Component
@Slf4j
public class RequestInfoGenerator {


    private final Configuration configuration;
    private final UserService userService;

    @Autowired
    public RequestInfoGenerator(Configuration configuration, UserService userService) {
        this.configuration = configuration;
        this.userService = userService;
    }

    public RequestInfo createInternalRequestInfo() {
        User userInfo = new User();
        userInfo.setUuid(userService.internalMicroserviceRoleUuid);
        userInfo.setRoles(userService.internalMicroserviceRoles);
        userInfo.setType(SYSTEM);
        userInfo.setTenantId(configuration.getEgovStateTenantId());
        if (userInfo.getRoles() == null || userInfo.getRoles().isEmpty()) {
            userInfo.setRoles(new ArrayList<>());
        }
        userInfo.getRoles().add(Role.builder().code(SYSTEM)
                .name(SYSTEM)
                .tenantId(configuration.getEgovStateTenantId())
                .build());

        return RequestInfo.builder().userInfo(userInfo).msgId(msgId).build();
    }
}
