package pucar.util;

import com.jayway.jsonpath.JsonPath;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.RequestInfoWrapper;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import pucar.config.Configuration;
import pucar.repository.ServiceRequestRepository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static pucar.config.ServiceConstants.*;

@Service
@Slf4j
public class LocalizationUtil {

    private final Configuration config;
    private final ServiceRequestRepository repository;

    @Autowired
    public LocalizationUtil(Configuration config, ServiceRequestRepository repository) {
        this.config = config;
        this.repository = repository;
    }


    public String callLocalization(RequestInfo requestInfo, String tenantId, String msgCode) {
        Map<String, Map<String, String>> localizedMessageMap = getLocalisedMessages(requestInfo, tenantId,
                ENG_LOCALE_CODE, MODULE_CODE);
        if (localizedMessageMap.isEmpty()) {
            return null;
        }
        return localizedMessageMap.get(ENG_LOCALE_CODE + "|" + tenantId).get(msgCode);
    }

    public Map<String, Map<String, String>> getLocalisedMessages(RequestInfo requestInfo, String rootTenantId, String locale, String module) {
        Map<String, Map<String, String>> localizedMessageMap = new HashMap<>();
        Map<String, String> mapOfCodesAndMessages = new HashMap<>();
        StringBuilder uri = new StringBuilder();
        RequestInfoWrapper requestInfoWrapper = new RequestInfoWrapper();
        requestInfoWrapper.setRequestInfo(requestInfo);
        uri.append(config.getLocalizationHost()).append(config.getLocalizationSearchEndpoint())
                .append("?tenantId=" + rootTenantId).append("&module=" + module).append("&locale=" + locale);
        List<String> codes = null;
        List<String> messages = null;
        Object result = null;
        try {
            result = repository.fetchResult(uri, requestInfoWrapper);
            codes = JsonPath.read(result, LOCALIZATION_CODES_JSONPATH);
            messages = JsonPath.read(result, LOCALIZATION_MSGS_JSONPATH);
        } catch (Exception e) {
            log.error("Exception while fetching from localization: " + e);
        }
        if (null != result) {
            for (int i = 0; i < codes.size(); i++) {
                mapOfCodesAndMessages.put(codes.get(i), messages.get(i));
            }
            localizedMessageMap.put(locale + "|" + rootTenantId, mapOfCodesAndMessages);
        }

        return localizedMessageMap;
    }
}
