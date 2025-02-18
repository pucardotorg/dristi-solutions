package digit.validator;

import digit.util.DateUtil;
import digit.web.models.*;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ReScheduleRequestValidatorTest {

    @InjectMocks
    private ReScheduleRequestValidator validator;

    @Mock
    private DateUtil dateUtil;

    private BulkRescheduleRequest request;
    private BulkReschedule buklRescheduling;
    @BeforeEach
    void setUp() {
        request = new BulkRescheduleRequest();
        buklRescheduling = new BulkReschedule();
        buklRescheduling.setJudgeId("judgeId");

        buklRescheduling.setTenantId("tenantId");
        buklRescheduling.setScheduleAfter(1722501060000L);

        request.setRequestInfo(new RequestInfo());
    }


    @Test
    public void validateBulkRescheduleRequest_Success() {

        when(dateUtil.getLocalDateFromEpoch(buklRescheduling.getScheduleAfter())).thenReturn(LocalDate.now().plusDays(1));

        validator.validateBulkRescheduleRequest(request);
    }

    @Test
    public void validateBulkRescheduleRequest_Exception() {

        CustomException exception = assertThrows(CustomException.class, () -> {
            validator.validateBulkRescheduleRequest(request);
        });

        assertEquals("DK_SH_APP_ERR", exception.getCode());
    }

    @Test
    public void validateBulkRescheduleRequest_Exception2() {

        CustomException exception = assertThrows(CustomException.class, () -> {
            validator.validateBulkRescheduleRequest(request);
        });

        assertEquals("DK_SH_APP_ERR", exception.getCode());
    }

    @Test
    public void validateBulkRescheduleRequest_Exception3() {

        when(dateUtil.getLocalDateFromEpoch(buklRescheduling.getScheduleAfter())).thenReturn(LocalDate.now().minusDays(1));

        CustomException exception = assertThrows(CustomException.class, () -> {
            validator.validateBulkRescheduleRequest(request);
        });

        assertEquals("DK_SH_APP_ERR", exception.getCode());
    }
}
