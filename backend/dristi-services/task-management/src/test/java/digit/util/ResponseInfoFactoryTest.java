package digit.util;

import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.response.ResponseInfo;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class ResponseInfoFactoryTest {

    @InjectMocks
    private ResponseInfoFactory responseInfoFactory;

    @Test
    void createResponseInfoFromRequestInfo_Success_ReturnsSuccessfulStatus() {
        RequestInfo requestInfo = RequestInfo.builder()
                .apiId("api-id-123")
                .ver("1.0")
                .ts(System.currentTimeMillis())
                .msgId("msg-id-456")
                .build();

        ResponseInfo result = responseInfoFactory.createResponseInfoFromRequestInfo(requestInfo, true);

        assertNotNull(result);
        assertEquals("api-id-123", result.getApiId());
        assertEquals("1.0", result.getVer());
        assertEquals("msg-id-456", result.getMsgId());
        assertEquals("successful", result.getStatus());
    }

    @Test
    void createResponseInfoFromRequestInfo_Failure_ReturnsFailedStatus() {
        RequestInfo requestInfo = RequestInfo.builder()
                .apiId("api-id-123")
                .ver("1.0")
                .msgId("msg-id-456")
                .build();

        ResponseInfo result = responseInfoFactory.createResponseInfoFromRequestInfo(requestInfo, false);

        assertNotNull(result);
        assertEquals("failed", result.getStatus());
    }

    @Test
    void createResponseInfoFromRequestInfo_NullRequestInfo_ReturnsEmptyValues() {
        ResponseInfo result = responseInfoFactory.createResponseInfoFromRequestInfo(null, true);

        assertNotNull(result);
        assertEquals("", result.getApiId());
        assertEquals("", result.getVer());
        assertEquals("", result.getMsgId());
        assertNull(result.getTs());
        assertEquals("successful", result.getStatus());
    }

    @Test
    void createResponseInfoFromRequestInfo_WithTimestamp_PreservesTimestamp() {
        Long timestamp = 1704067200000L;
        RequestInfo requestInfo = RequestInfo.builder()
                .apiId("api-id")
                .ts(timestamp)
                .build();

        ResponseInfo result = responseInfoFactory.createResponseInfoFromRequestInfo(requestInfo, true);

        assertEquals(timestamp, result.getTs());
    }

    @Test
    void createResponseInfoFromRequestInfo_ResMsgIdIsSet() {
        RequestInfo requestInfo = RequestInfo.builder().build();

        ResponseInfo result = responseInfoFactory.createResponseInfoFromRequestInfo(requestInfo, true);

        assertNotNull(result.getResMsgId());
    }

    @Test
    void createResponseInfoFromRequestInfo_AllFieldsNull_HandlesGracefully() {
        RequestInfo requestInfo = RequestInfo.builder().build();

        ResponseInfo result = responseInfoFactory.createResponseInfoFromRequestInfo(requestInfo, true);

        assertNotNull(result);
        assertEquals("successful", result.getStatus());
    }
}
