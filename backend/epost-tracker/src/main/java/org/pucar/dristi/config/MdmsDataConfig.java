package org.pucar.dristi.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import org.egov.common.contract.request.RequestInfo;
import org.pucar.dristi.model.PostalHub;
import org.pucar.dristi.model.PostalHubUserName;
import org.pucar.dristi.util.MdmsUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class MdmsDataConfig {

    private final MdmsUtil mdmsUtil;
    private final EPostConfiguration configuration;
    private final ObjectMapper objectMapper;

    @Getter
    private Map<String, List<String>> postalHubMap;

    @Getter
    private Map<String,String> postalHubUserNameMap;

    @Autowired
    public MdmsDataConfig(MdmsUtil mdmsUtil, EPostConfiguration configuration, ObjectMapper objectMapper) {
        this.mdmsUtil = mdmsUtil;
        this.configuration = configuration;
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    public void loadConfigData() {
        loadPostalHubNames();
        loadPostalHubAndUserNames();
    }

    private void loadPostalHubNames() {
        RequestInfo requestInfo = RequestInfo.builder().build();
        JSONArray postalHubNamesList = mdmsUtil.fetchMdmsData(requestInfo,configuration.getEgovStateTenantId(),
                configuration.getMdmsEPostModuleName(), List.of(configuration.getMdmsEPostMasterName()))
                .get(configuration.getMdmsEPostModuleName()).get(configuration.getMdmsEPostMasterName());
        postalHubMap = new HashMap<>();


        try {
            for (Object o : postalHubNamesList) {
                PostalHub postalHub = objectMapper.convertValue(o, PostalHub.class);
                postalHubMap.put(postalHub.getPostHubName(),postalHub.getPinCodes());
            }
        } catch (Exception e) {
            log.error("Unable to create postal hub and pin code map :: {}",e.getMessage());
        }

    }

    private void loadPostalHubAndUserNames() {
        RequestInfo requestInfo = RequestInfo.builder().build();
        JSONArray postalHubAndUserNameList = mdmsUtil.fetchMdmsData(requestInfo,configuration.getEgovStateTenantId(),
                configuration.getMdmsEPostAndUserNameModuleName(),List.of(configuration.getMdmsEPostAndUserNameMasterName()))
                .get(configuration.getMdmsEPostAndUserNameModuleName()).get(configuration.getMdmsEPostAndUserNameMasterName());
        postalHubUserNameMap = new HashMap<>();

        try {
            for (Object o : postalHubAndUserNameList) {
                PostalHubUserName postalHubAndUserName = objectMapper.convertValue(o, PostalHubUserName.class);
                postalHubUserNameMap.put(postalHubAndUserName.getUserName(),postalHubAndUserName.getPostHubName());
            }
        } catch (Exception e) {
            log.error("Unable to create postal hub and user name map :: {}",e.getMessage());
        }
    }
}
