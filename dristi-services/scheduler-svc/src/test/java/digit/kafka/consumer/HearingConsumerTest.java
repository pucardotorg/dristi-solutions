package digit.kafka.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import digit.config.Configuration;
import digit.kafka.cosumer.HearingConsumer;
import digit.service.hearing.HearingProcessor;
import digit.util.HearingUtil;
import digit.web.models.hearing.Hearing;
import digit.web.models.hearing.HearingRequest;
import digit.web.models.hearing.HearingUpdateBulkRequest;
import digit.web.models.hearing.RetryHearingRequest;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.HashMap;
import java.util.List;

import static org.mockito.Mockito.*;

class HearingConsumerTest {

    @Mock
    private ObjectMapper mockMapper;

    @Mock
    private HearingProcessor mockProcessor;

    @Mock
    private HearingUtil mockHearingUtil;

    @Mock
    private Configuration mockConfiguration;

    private HearingConsumer hearingConsumer;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
        when(mockConfiguration.getHearingRetryDelayMs()).thenReturn(5000L);
        hearingConsumer = new HearingConsumer(mockMapper, mockProcessor, mockHearingUtil, mockConfiguration);
    }

    @Test
    void testListenScheduleHearing() {
        // Arrange
        HashMap<String, Object> record = new HashMap<>();
        String topic = "create-hearing-application";
        HearingRequest mockHearingRequest = mock(HearingRequest.class);

        when(mockMapper.convertValue(record, HearingRequest.class)).thenReturn(mockHearingRequest);

        // Act
        hearingConsumer.listenScheduleHearing(record, topic);

        // Assert
        verify(mockMapper).convertValue(record, HearingRequest.class);
        verify(mockProcessor).processCreateHearingRequest(mockHearingRequest, Boolean.TRUE);
    }

    @Test
    void testConstructor() {
        // This test ensures the constructor is covered
        HearingConsumer consumer = new HearingConsumer(mockMapper, mockProcessor, mockHearingUtil, mockConfiguration);
        Assertions.assertNotNull(consumer);
    }

    @Test
    void testRetryCallHearing() {
        // Arrange
        HashMap<String, Object> record = new HashMap<>();
        String topic = "egov-hearing-update-time-retry";

        RetryHearingRequest retryRequest = new RetryHearingRequest();
        HearingUpdateBulkRequest mockBulkRequest = mock(HearingUpdateBulkRequest.class);
        Hearing mockHearing = Hearing.builder().hearingId("HEAR123").build();

        retryRequest.setHearingRequest(mockBulkRequest);
        retryRequest.setIsRetryRequired(Boolean.FALSE);

        when(mockMapper.convertValue(record, RetryHearingRequest.class)).thenReturn(retryRequest);
        when(mockBulkRequest.getHearings()).thenReturn(List.of(mockHearing));

        // Act
        hearingConsumer.retryCallHearing(record, topic);

        // Assert
        verify(mockMapper).convertValue(record, RetryHearingRequest.class);
        verify(mockBulkRequest, times(3)).getHearings();
        verify(mockConfiguration, times(2)).getHearingRetryDelayMs();
        verify(mockHearingUtil).callHearing(mockBulkRequest, false);
    }

}
