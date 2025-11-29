package digit.util;

import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.response.ResponseInfo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static digit.config.ServiceConstants.FAILED;
import static digit.config.ServiceConstants.RES_MSG_ID;
import static digit.config.ServiceConstants.SUCCESSFUL;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

public class ResponseInfoFactoryTest {

    private ResponseInfoFactory responseInfoFactory;

    @BeforeEach
    public void setUp() {
        responseInfoFactory = new ResponseInfoFactory();
    }

    @Test
    public void testCreateResponseInfoFromRequestInfo_withValidRequestInfo_successTrue() {
        RequestInfo requestInfo = RequestInfo.builder()
                .apiId("api123")
                .ver("1.0")
                .ts(123456789L)
                .msgId("msg123")
                .build();

        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(requestInfo, true);

        assertNotNull(responseInfo);
        assertEquals("api123", responseInfo.getApiId());
        assertEquals("1.0", responseInfo.getVer());
        assertEquals(123456789L, responseInfo.getTs());
        assertEquals("msg123", responseInfo.getMsgId());
        assertEquals(RES_MSG_ID, responseInfo.getResMsgId());
        assertEquals(SUCCESSFUL, responseInfo.getStatus());
    }

    @Test
    public void testCreateResponseInfoFromRequestInfo_withValidRequestInfo_successFalse() {
        RequestInfo requestInfo = RequestInfo.builder()
                .apiId("api123")
                .ver("1.0")
                .ts(123456789L)
                .msgId("msg123")
                .build();

        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(requestInfo, false);

        assertNotNull(responseInfo);
        assertEquals(FAILED, responseInfo.getStatus());
    }

    @Test
    public void testCreateResponseInfoFromRequestInfo_withNullRequestInfo() {
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(null, true);

        assertNotNull(responseInfo);
        assertEquals("", responseInfo.getApiId());
        assertEquals("", responseInfo.getVer());
        assertNull(responseInfo.getTs());
        assertEquals("", responseInfo.getMsgId());
        assertEquals(RES_MSG_ID, responseInfo.getResMsgId());
        assertEquals(SUCCESSFUL, responseInfo.getStatus());
    }
}

