package org.pucar.dristi.service;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.Role;
import org.egov.common.contract.request.User;
import org.egov.common.utils.MultiStateInstanceUtil;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

import static org.pucar.dristi.config.ServiceConstants.*;

@Slf4j
@Service
public class UserService {

    private final Configuration configuration;
    private final ServiceRequestRepository requestRepository;
    private final MultiStateInstanceUtil multiStateInstanceUtil;


    public String internalMicroserviceRoleUuid = null;
    public List<Role> internalMicroserviceRoles = null;

    public static final String TENANT_ID_MDC_STRING = "TENANTID";

    @Autowired
    public UserService(Configuration configuration, ServiceRequestRepository requestRepository, MultiStateInstanceUtil multiStateInstanceUtil) {
        this.configuration = configuration;
        this.requestRepository = requestRepository;
        this.multiStateInstanceUtil = multiStateInstanceUtil;
    }


    @PostConstruct
    void initializeSystemUser() {
        RequestInfo requestInfo = new RequestInfo();
        StringBuilder uri = new StringBuilder();
        uri.append(configuration.getUserHost()).append(configuration.getUserContextPath()).append(configuration.getUserSearchEndpoint()); // URL for user search call
        Map<String, Object> userSearchRequest = new HashMap<>();
        userSearchRequest.put("RequestInfo", requestInfo);
        userSearchRequest.put("tenantId", configuration.getEgovStateTenantId());
        userSearchRequest.put("roleCodes", Collections.singletonList(INTERNALMICROSERVICEROLE_CODE));
        if (multiStateInstanceUtil.getIsEnvironmentCentralInstance()) {
            MDC.put(TENANT_ID_MDC_STRING, configuration.getEgovStateTenantId());
        }
        try {
            LinkedHashMap<String, Object> responseMap = (LinkedHashMap<String, Object>) requestRepository.fetchResult(uri, userSearchRequest);
            List<LinkedHashMap<String, Object>> users = (List<LinkedHashMap<String, Object>>) responseMap.get("user");
            if (users.isEmpty()) {
                createInternalMicroserviceUser(requestInfo);
            } else {
                internalMicroserviceRoleUuid = (String) users.get(0).get("uuid");
                internalMicroserviceRoles = (List<Role>) users.get(0).get("roles");
            }
        } catch (Exception e) {
            throw new CustomException("EG_USER_SEARCH_ERROR", "Service returned null while fetching user");
        }

    }

    private void createInternalMicroserviceUser(RequestInfo requestInfo) {
        Map<String, Object> userCreateRequest = new HashMap<>();
        //Creating role with INTERNAL_MICROSERVICE_ROLE
        Role role = Role.builder()
                .name(INTERNALMICROSERVICEROLE_NAME).code(INTERNALMICROSERVICEROLE_CODE)
                .tenantId(configuration.getEgovStateTenantId()).build();
        User user = User.builder().userName(INTERNALMICROSERVICEUSER_USERNAME)
                .name(INTERNALMICROSERVICEUSER_NAME).mobileNumber(INTERNALMICROSERVICEUSER_MOBILENO)
                .type(INTERNALMICROSERVICEUSER_TYPE).tenantId(configuration.getEgovStateTenantId())
                .roles(Collections.singletonList(role)).id(0L).build();

        userCreateRequest.put("RequestInfo", requestInfo);
        userCreateRequest.put("user", user);

        StringBuilder uri = new StringBuilder();
        uri.append(configuration.getUserHost()).append(configuration.getUserContextPath()).append(configuration.getUserCreateEndpoint()); // URL for user create call

        try {
            LinkedHashMap<String, Object> responseMap = (LinkedHashMap<String, Object>) requestRepository.fetchResult(uri, userCreateRequest);
            List<LinkedHashMap<String, Object>> users = (List<LinkedHashMap<String, Object>>) responseMap.get("user");
            internalMicroserviceRoleUuid = (String) users.get(0).get("uuid");
            internalMicroserviceRoles = (List<Role>) users.get(0).get("roles");
        } catch (Exception e) {
            throw new CustomException("EG_USER_CREATE_ERROR", "Service threw error while creating user");
        }
    }
}
