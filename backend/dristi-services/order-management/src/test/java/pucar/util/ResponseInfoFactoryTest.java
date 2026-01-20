package pucar.util;

import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.response.ResponseInfo;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ResponseInfoFactoryTest {

    @Test
    void testCreateResponseInfo_WithRequestInfo_Success() {
        RequestInfo requestInfo = RequestInfo.builder()
                .apiId("api-test")
                .ver("1.0")
                .ts(System.currentTimeMillis())
                .msgId("msg-test")
                .build();

        ResponseInfo responseInfo = ResponseInfoFactory.createResponseInfo(requestInfo, true);

        assertNotNull(responseInfo);
        assertEquals("api-test", responseInfo.getApiId());
        assertEquals("1.0", responseInfo.getVer());
        assertEquals("msg-test", responseInfo.getMsgId());
        assertEquals("successful", responseInfo.getStatus());
    }

    @Test
    void testCreateResponseInfo_WithRequestInfo_Failure() {
        RequestInfo requestInfo = RequestInfo.builder()
                .apiId("api-test")
                .ver("1.0")
                .ts(System.currentTimeMillis())
                .msgId("msg-test")
                .build();

        ResponseInfo responseInfo = ResponseInfoFactory.createResponseInfo(requestInfo, false);

        assertNotNull(responseInfo);
        assertEquals("failed", responseInfo.getStatus());
    }

    @Test
    void testCreateResponseInfo_WithNullRequestInfo() {
        ResponseInfo responseInfo = ResponseInfoFactory.createResponseInfo(null, true);

        assertNotNull(responseInfo);
        assertEquals("", responseInfo.getApiId());
        assertEquals("", responseInfo.getVer());
        assertNull(responseInfo.getTs());
        assertEquals("successful", responseInfo.getStatus());
    }
}
