package digit.util;

import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.response.ResponseInfo;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ResponseInfoFactoryTest {

    @Test
    void createResponseInfoFromRequestInfo_SuccessAndFailure() {
        ResponseInfoFactory factory = new ResponseInfoFactory();
        RequestInfo req = RequestInfo.builder().apiId("api").ver("v1").ts(1L).msgId("m1").build();

        ResponseInfo ok = factory.createResponseInfoFromRequestInfo(req, true);
        assertEquals("api", ok.getApiId());
        assertEquals("v1", ok.getVer());
        assertEquals("successful", ok.getStatus());

        ResponseInfo fail = factory.createResponseInfoFromRequestInfo(req, false);
        assertEquals("failed", fail.getStatus());
    }
}
