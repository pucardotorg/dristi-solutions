package digit.util;

import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.response.ResponseInfo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import static digit.config.ServiceConstants.*;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class ResponseInfoFactoryTest {

    @InjectMocks
    private ResponseInfoFactory responseInfoFactory;

    private RequestInfo requestInfo;

    @BeforeEach
    void setUp() {
        requestInfo = RequestInfo.builder()
                .apiId("test-api-id")
                .ver("1.0")
                .ts(1234567890L)
                .msgId("test-msg-id")
                .build();
    }

    @Test
    void testCreateResponseInfoFromRequestInfo_Success() {
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(requestInfo, true);

        assertNotNull(responseInfo);
        assertEquals("test-api-id", responseInfo.getApiId());
        assertEquals("1.0", responseInfo.getVer());
        assertEquals(1234567890L, responseInfo.getTs());
        assertEquals("test-msg-id", responseInfo.getMsgId());
        assertEquals(RES_MSG_ID, responseInfo.getResMsgId());
        assertEquals(SUCCESSFUL, responseInfo.getStatus());
    }

    @Test
    void testCreateResponseInfoFromRequestInfo_Failure() {
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(requestInfo, false);

        assertNotNull(responseInfo);
        assertEquals(FAILED, responseInfo.getStatus());
    }

    @Test
    void testCreateResponseInfoFromRequestInfo_NullRequestInfo() {
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(null, true);

        assertNotNull(responseInfo);
        assertEquals("", responseInfo.getApiId());
        assertEquals("", responseInfo.getVer());
        assertNull(responseInfo.getTs());
        assertEquals("", responseInfo.getMsgId());
        assertEquals(RES_MSG_ID, responseInfo.getResMsgId());
        assertEquals(SUCCESSFUL, responseInfo.getStatus());
    }

    @Test
    void testCreateResponseInfoFromRequestInfo_NullFields() {
        RequestInfo nullFieldsRequestInfo = RequestInfo.builder().build();

        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(nullFieldsRequestInfo, true);

        assertNotNull(responseInfo);
        assertNull(responseInfo.getApiId());
        assertNull(responseInfo.getVer());
        assertNull(responseInfo.getTs());
        assertNull(responseInfo.getMsgId());
        assertEquals(SUCCESSFUL, responseInfo.getStatus());
    }

    @Test
    void testCreateResponseInfoFromRequestInfo_SuccessAndFailureToggle() {
        ResponseInfo successResponse = responseInfoFactory.createResponseInfoFromRequestInfo(requestInfo, true);
        ResponseInfo failureResponse = responseInfoFactory.createResponseInfoFromRequestInfo(requestInfo, false);

        assertEquals(SUCCESSFUL, successResponse.getStatus());
        assertEquals(FAILED, failureResponse.getStatus());
    }

    @Test
    void testCreateResponseInfoFromRequestInfo_ResMsgIdIsAlwaysSet() {
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(requestInfo, true);

        assertNotNull(responseInfo.getResMsgId());
        assertEquals(RES_MSG_ID, responseInfo.getResMsgId());
    }
}
