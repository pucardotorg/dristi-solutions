package drishti.payment.calculator.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import drishti.payment.calculator.web.models.EPostConfigParams;
import net.minidev.json.JSONArray;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.Map;

import static drishti.payment.calculator.config.ServiceConstants.I_POST_MASTER;
import static drishti.payment.calculator.config.ServiceConstants.SUMMON_MODULE;

@Component
public class SummonUtil {

    private final MdmsUtil mdmsUtil;

    private final ObjectMapper objectMapper;

    @Autowired
    public SummonUtil(MdmsUtil mdmsUtil, ObjectMapper objectMapper) {
        this.mdmsUtil = mdmsUtil;
        this.objectMapper = objectMapper;
    }

    public EPostConfigParams getIPostFeesDefaultData(RequestInfo requestInfo, String tenantId) {

        Map<String, Map<String, JSONArray>> response = mdmsUtil.fetchMdmsData(requestInfo, tenantId, SUMMON_MODULE, Collections.singletonList(I_POST_MASTER));
        JSONArray array = response.get(SUMMON_MODULE).get(I_POST_MASTER);
        Object object = array.get(0);

        return objectMapper.convertValue(object, EPostConfigParams.class);
        //todo :add other methods
    }

    public Double calculateCourtFees(EPostConfigParams ePostFeesDefaultData) {
        return ePostFeesDefaultData.getCourtFee() + ePostFeesDefaultData.getApplicationFee();
    }
}
