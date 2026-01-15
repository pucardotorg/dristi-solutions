package pucar.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.Role;
import org.egov.common.contract.request.User;
import org.egov.common.contract.user.UserDetailResponse;
import org.egov.common.contract.user.UserSearchRequest;
import org.egov.common.contract.user.enums.UserType;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;
import pucar.config.Configuration;
import pucar.repository.ServiceRequestRepository;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;

@Component
@Slf4j
public class UserUtil {

    @Autowired
    private ObjectMapper mapper;

    @Autowired
    private ServiceRequestRepository serviceRequestRepository;

    @Autowired
    private Configuration configs;


    @Autowired
    public UserUtil(ObjectMapper mapper, ServiceRequestRepository serviceRequestRepository) {
        this.mapper = mapper;
        this.serviceRequestRepository = serviceRequestRepository;
    }

    /**
     * Searches for users based on uuid by calling userCall
     * @param uuids List of uuids for which users need to be fetched
     * @return
     */
    public List<User> getUserListFromUserUuid(List<String> uuids) {
        List<User> users = new ArrayList<>();
        if (!CollectionUtils.isEmpty(uuids)) {
            UserSearchRequest userSearchRequest = new UserSearchRequest();
            userSearchRequest.setUuid(uuids);
            StringBuilder uri = new StringBuilder(configs.getUserHost()).append(configs.getUserSearchEndpoint());
            try{
                Object response = serviceRequestRepository.fetchResult(uri, userSearchRequest);
                UserDetailResponse userDetailResponse = mapper.convertValue(response,UserDetailResponse.class);
                if (userDetailResponse != null && !CollectionUtils.isEmpty(userDetailResponse.getUser())) {
                    users = userDetailResponse.getUser();
                }
            } catch (Exception e){
                log.error("Failed to fetch user list from user uuid", e);
            }
        }
        return users;
    }


}

