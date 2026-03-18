package org.pucar.dristi.util;

import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.response.ResponseInfo;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ResponseInfoFactoryTest {

    private final ResponseInfoFactory factory = new ResponseInfoFactory();

    @Test
    void createResponseInfoFromRequestInfo_shouldMapFieldsOnSuccess() {
        RequestInfo requestInfo = RequestInfo.builder()
                .apiId("api-1").ver("1.0").ts(1000L).msgId("msg-1").build();

        ResponseInfo result = factory.createResponseInfoFromRequestInfo(requestInfo, true);

        assertEquals("api-1", result.getApiId());
        assertEquals("1.0", result.getVer());
        assertEquals(1000L, result.getTs());
        assertEquals("msg-1", result.getMsgId());
        assertEquals("successful", result.getStatus());
    }

    @Test
    void createResponseInfoFromRequestInfo_shouldSetFailedStatus() {
        RequestInfo requestInfo = RequestInfo.builder().apiId("api-1").build();

        ResponseInfo result = factory.createResponseInfoFromRequestInfo(requestInfo, false);

        assertEquals("failed", result.getStatus());
    }

    @Test
    void createResponseInfoFromRequestInfo_shouldHandleNullRequestInfo() {
        ResponseInfo result = factory.createResponseInfoFromRequestInfo(null, true);

        assertEquals("", result.getApiId());
        assertEquals("", result.getVer());
        assertNull(result.getTs());
        assertEquals("", result.getMsgId());
        assertEquals("successful", result.getStatus());
    }
}
