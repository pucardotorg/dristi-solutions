package org.pucar.dristi.kafka.consumer;
import static org.mockito.Mockito.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.service.HearingService;
import org.pucar.dristi.util.CaseUtil;
import org.pucar.dristi.util.DateUtil;
import org.pucar.dristi.util.OrderUtil;
import org.pucar.dristi.util.PendingTaskUtil;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.MessageHeaders;
import org.slf4j.Logger;

import java.util.HashMap;
import java.util.Map;

@ExtendWith(MockitoExtension.class)
class HearingUpdateConsumerTest {

    @InjectMocks
    private HearingUpdateConsumer hearingUpdateConsumer;

    @Mock
    private HearingService hearingService;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private OrderUtil orderUtil;

    @Mock
    private PendingTaskUtil pendingTaskUtil;

    @Mock
    private Configuration configuration;

    @Mock
    private DateUtil dateUtil;

    @Mock
    private CaseUtil caseUtil;

    @Mock
    private Logger log;

    @BeforeEach
    void setup() {
        hearingUpdateConsumer = new HearingUpdateConsumer(hearingService, objectMapper, orderUtil, pendingTaskUtil, configuration, dateUtil, caseUtil);
    }

    @Test
    void testUpdateCaseReferenceConsumer_Success() {
        Map<String, Object> payloadData = new HashMap<>();
        payloadData.put("filingNumber", "FN123");
        ConsumerRecord<String, Object> consumerRecord = mock(ConsumerRecord.class);

        when(consumerRecord.value()).thenReturn(payloadData);
        when(objectMapper.convertValue(payloadData, Map.class)).thenReturn(payloadData);

        hearingUpdateConsumer.updateCaseReferenceConsumer(consumerRecord, "hearing.case.reference.number.update");

        verify(hearingService, times(1)).updateCaseReferenceHearing(payloadData);
    }

    @Test
    void testUpdateCaseReferenceConsumer_IllegalArgumentException() {
        ConsumerRecord<String, Object> consumerRecord = mock(ConsumerRecord.class);
        when(consumerRecord.value()).thenThrow(new IllegalArgumentException("Invalid payload"));

        hearingUpdateConsumer.updateCaseReferenceConsumer(consumerRecord, "hearing.case.reference.number.update");

    }
}

