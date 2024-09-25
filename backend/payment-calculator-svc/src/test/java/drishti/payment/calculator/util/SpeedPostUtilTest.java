package drishti.payment.calculator.util;

import com.fasterxml.jackson.databind.ObjectMapper;
<<<<<<<< HEAD:backend/payment-calculator-svc/src/test/java/drishti/payment/calculator/util/EPostUtilTest.java
import drishti.payment.calculator.web.models.EPostConfigParams;
========
import drishti.payment.calculator.web.models.SpeedPostConfigParams;
>>>>>>>> dpg-qa-deployment:backend/payment-calculator-svc/src/test/java/drishti/payment/calculator/util/SpeedPostUtilTest.java
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import static drishti.payment.calculator.config.ServiceConstants.I_POST_MASTER;
import static drishti.payment.calculator.config.ServiceConstants.SUMMON_MODULE;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
<<<<<<<< HEAD:backend/payment-calculator-svc/src/test/java/drishti/payment/calculator/util/EPostUtilTest.java
public class EPostUtilTest {
========
public class SpeedPostUtilTest {
>>>>>>>> dpg-qa-deployment:backend/payment-calculator-svc/src/test/java/drishti/payment/calculator/util/SpeedPostUtilTest.java

    @Mock
    private MdmsUtil mdmsUtil;

    @Mock
    private ObjectMapper objectMapper;

<<<<<<<< HEAD:backend/payment-calculator-svc/src/test/java/drishti/payment/calculator/util/EPostUtilTest.java
    private SummonUtil ePostUtil;

    @BeforeEach
    void setUp() {
        ePostUtil = new SummonUtil(mdmsUtil, objectMapper);
========
    private TaskUtil taskUtil;

    @BeforeEach
    void setUp() {
        taskUtil = new TaskUtil(mdmsUtil, objectMapper);
>>>>>>>> dpg-qa-deployment:backend/payment-calculator-svc/src/test/java/drishti/payment/calculator/util/SpeedPostUtilTest.java
    }

    @Test
    void testGetIPostFeesDefaultData() {
        RequestInfo requestInfo = new RequestInfo();
        requestInfo.setUserInfo(User.builder().uuid("some-uuid").build());
        String tenantId = "tenant-id";

        JSONArray jsonArray = new JSONArray();
        JSONObject jsonObject = new JSONObject();
        jsonArray.add(jsonObject);

        Map<String, Map<String, JSONArray>> response = new HashMap<>();
        Map<String, JSONArray> summonModuleMap = new HashMap<>();
        summonModuleMap.put(I_POST_MASTER, jsonArray);
        response.put(SUMMON_MODULE, summonModuleMap);

        when(mdmsUtil.fetchMdmsData(requestInfo, tenantId, SUMMON_MODULE, Collections.singletonList(I_POST_MASTER))).thenReturn(response);

<<<<<<<< HEAD:backend/payment-calculator-svc/src/test/java/drishti/payment/calculator/util/EPostUtilTest.java
        EPostConfigParams ePostConfigParams = new EPostConfigParams();
        when(objectMapper.convertValue(jsonObject, EPostConfigParams.class)).thenReturn(ePostConfigParams);

        EPostConfigParams result = ePostUtil.getIPostFeesDefaultData(requestInfo, tenantId);
========
        SpeedPostConfigParams ePostConfigParams = new SpeedPostConfigParams();
        when(objectMapper.convertValue(jsonObject, SpeedPostConfigParams.class)).thenReturn(ePostConfigParams);

        SpeedPostConfigParams result = taskUtil.getIPostFeesDefaultData(requestInfo, tenantId);
>>>>>>>> dpg-qa-deployment:backend/payment-calculator-svc/src/test/java/drishti/payment/calculator/util/SpeedPostUtilTest.java

        assertNotNull(result);
        assertEquals(ePostConfigParams, result);

        verify(mdmsUtil, times(1)).fetchMdmsData(requestInfo, tenantId, SUMMON_MODULE, Collections.singletonList(I_POST_MASTER));
<<<<<<<< HEAD:backend/payment-calculator-svc/src/test/java/drishti/payment/calculator/util/EPostUtilTest.java
        verify(objectMapper, times(1)).convertValue(jsonObject, EPostConfigParams.class);
========
        verify(objectMapper, times(1)).convertValue(jsonObject, SpeedPostConfigParams.class);
>>>>>>>> dpg-qa-deployment:backend/payment-calculator-svc/src/test/java/drishti/payment/calculator/util/SpeedPostUtilTest.java
    }
}
