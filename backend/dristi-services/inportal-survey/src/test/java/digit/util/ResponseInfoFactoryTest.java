package digit.util;

import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.response.ResponseInfo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
public class ResponseInfoFactoryTest {

    @InjectMocks
    private ResponseInfoFactory responseInfoFactory;

    private RequestInfo requestInfo;

    @BeforeEach
    public void setUp() {
        requestInfo = RequestInfo.builder()
                .apiId("test-api-id")
                .ver("1.0")
                .ts(1634567890000L)
                .msgId("test-msg-id")
                .build();
    }

    @Test
    public void testCreateResponseInfoFromRequestInfo_Success_True() {
        // Act
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(requestInfo, true);

        // Assert
        assertNotNull(responseInfo);
        assertEquals("test-api-id", responseInfo.getApiId());
        assertEquals("1.0", responseInfo.getVer());
        assertEquals(1634567890000L, responseInfo.getTs());
        assertEquals("test-msg-id", responseInfo.getMsgId());
        assertEquals("uief87324", responseInfo.getResMsgId());
        assertEquals("successful", responseInfo.getStatus());
    }

    @Test
    public void testCreateResponseInfoFromRequestInfo_Success_False() {
        // Act
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(requestInfo, false);

        // Assert
        assertNotNull(responseInfo);
        assertEquals("test-api-id", responseInfo.getApiId());
        assertEquals("1.0", responseInfo.getVer());
        assertEquals(1634567890000L, responseInfo.getTs());
        assertEquals("test-msg-id", responseInfo.getMsgId());
        assertEquals("uief87324", responseInfo.getResMsgId());
        assertEquals("failed", responseInfo.getStatus());
    }

    @Test
    public void testCreateResponseInfoFromRequestInfo_NullRequestInfo() {
        // Act
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(null, true);

        // Assert
        assertNotNull(responseInfo);
        assertEquals("", responseInfo.getApiId());
        assertEquals("", responseInfo.getVer());
        assertNull(responseInfo.getTs());
        assertEquals("", responseInfo.getMsgId());
        assertEquals("uief87324", responseInfo.getResMsgId());
        assertEquals("successful", responseInfo.getStatus());
    }

    @Test
    public void testCreateResponseInfoFromRequestInfo_NullRequestInfo_Failed() {
        // Act
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(null, false);

        // Assert
        assertNotNull(responseInfo);
        assertEquals("", responseInfo.getApiId());
        assertEquals("", responseInfo.getVer());
        assertNull(responseInfo.getTs());
        assertEquals("", responseInfo.getMsgId());
        assertEquals("uief87324", responseInfo.getResMsgId());
        assertEquals("failed", responseInfo.getStatus());
    }

    @Test
    public void testCreateResponseInfoFromRequestInfo_PartialRequestInfo() {
        // Arrange
        RequestInfo partialRequestInfo = RequestInfo.builder()
                .apiId("partial-api-id")
                .build();

        // Act
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(partialRequestInfo, true);

        // Assert
        assertNotNull(responseInfo);
        assertEquals("partial-api-id", responseInfo.getApiId());
        assertEquals(null, responseInfo.getVer());
        assertNull(responseInfo.getTs());
        assertEquals("uief87324", responseInfo.getResMsgId());
        assertEquals("successful", responseInfo.getStatus());
    }

    @Test
    public void testCreateResponseInfoFromRequestInfo_EmptyStrings() {
        // Arrange
        RequestInfo emptyRequestInfo = RequestInfo.builder()
                .apiId("")
                .ver("")
                .msgId("")
                .build();

        // Act
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(emptyRequestInfo, true);

        // Assert
        assertNotNull(responseInfo);
        assertEquals("", responseInfo.getApiId());
        assertEquals("", responseInfo.getVer());
        assertNull(responseInfo.getTs());
        assertEquals("", responseInfo.getMsgId());
        assertEquals("uief87324", responseInfo.getResMsgId());
        assertEquals("successful", responseInfo.getStatus());
    }

    @Test
    public void testCreateResponseInfoFromRequestInfo_ZeroTimestamp() {
        // Arrange
        RequestInfo zeroTsRequestInfo = RequestInfo.builder()
                .apiId("test-api")
                .ts(0L)
                .build();

        // Act
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(zeroTsRequestInfo, true);

        // Assert
        assertNotNull(responseInfo);
        assertEquals(0L, responseInfo.getTs());
    }

    @Test
    public void testCreateResponseInfoFromRequestInfo_LargeTimestamp() {
        // Arrange
        RequestInfo largeTsRequestInfo = RequestInfo.builder()
                .apiId("test-api")
                .ts(Long.MAX_VALUE)
                .build();

        // Act
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(largeTsRequestInfo, true);

        // Assert
        assertNotNull(responseInfo);
        assertEquals(Long.MAX_VALUE, responseInfo.getTs());
    }

    @Test
    public void testCreateResponseInfoFromRequestInfo_ResMsgIdIsConstant() {
        // Test that resMsgId is always the constant value
        ResponseInfo responseInfo1 = responseInfoFactory.createResponseInfoFromRequestInfo(requestInfo, true);
        ResponseInfo responseInfo2 = responseInfoFactory.createResponseInfoFromRequestInfo(requestInfo, false);
        ResponseInfo responseInfo3 = responseInfoFactory.createResponseInfoFromRequestInfo(null, true);

        assertEquals("uief87324", responseInfo1.getResMsgId());
        assertEquals("uief87324", responseInfo2.getResMsgId());
        assertEquals("uief87324", responseInfo3.getResMsgId());
    }

    @Test
    public void testCreateResponseInfoFromRequestInfo_MultipleInvocations() {
        // Test that multiple invocations with same input produce consistent results
        ResponseInfo responseInfo1 = responseInfoFactory.createResponseInfoFromRequestInfo(requestInfo, true);
        ResponseInfo responseInfo2 = responseInfoFactory.createResponseInfoFromRequestInfo(requestInfo, true);

        assertEquals(responseInfo1.getApiId(), responseInfo2.getApiId());
        assertEquals(responseInfo1.getVer(), responseInfo2.getVer());
        assertEquals(responseInfo1.getTs(), responseInfo2.getTs());
        assertEquals(responseInfo1.getMsgId(), responseInfo2.getMsgId());
        assertEquals(responseInfo1.getResMsgId(), responseInfo2.getResMsgId());
        assertEquals(responseInfo1.getStatus(), responseInfo2.getStatus());
    }
}
