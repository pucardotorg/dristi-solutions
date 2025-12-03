package digit.util;

import digit.web.models.CoordinateRequest;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class EsignUtilTest {

    @Test
    void getCoordinateForSign_ReturnsEmptyList() {
        EsignUtil util = new EsignUtil();
        var req = CoordinateRequest.builder().criteria(new java.util.ArrayList<>()).build();
        assertTrue(util.getCoordinateForSign(req).isEmpty());
    }

    @Test
    void getCoordinateForSign_WhenNullRequest_ThrowsCustomException() {
        EsignUtil util = new EsignUtil();
        CustomException ex = assertThrows(CustomException.class, () -> util.getCoordinateForSign(null));
        assertEquals("COORDINATE_FETCH_ERROR", ex.getCode());
    }
}
