package org.pucar.dristi.util;

import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.response.ResponseInfo;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class ResponseInfoFactoryTest {

    private final ResponseInfoFactory responseInfoFactory = new ResponseInfoFactory();

    @Test
    public void shouldPopulateResponseInfoFromRequest() {
        RequestInfo requestInfo = RequestInfo.builder()
                .apiId("api")
                .ver("1.0")
                .msgId("123")
                .ts(123L)
                .build();

        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(requestInfo, true);

        assertEquals("api", responseInfo.getApiId());
        assertEquals("1.0", responseInfo.getVer());
        assertEquals("123", responseInfo.getMsgId());
        assertEquals("successful", responseInfo.getStatus());
    }

    @Test
    public void shouldHandleNullRequestInfo() {
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(null, false);

        assertEquals("", responseInfo.getApiId());
        assertEquals("", responseInfo.getVer());
        assertEquals("failed", responseInfo.getStatus());
    }
}
