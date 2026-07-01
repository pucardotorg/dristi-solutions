package digit.consumer;

import digit.service.PaymentUpdateService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashMap;
import java.util.Map;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentBackUpdateConsumerTest {

    @Mock
    private PaymentUpdateService paymentUpdateService;

    @InjectMocks
    private PaymentBackUpdateConsumer consumer;

    @Test
    void listenPayments_CallsPaymentUpdateService() {
        Map<String, Object> data = new HashMap<>();
        data.put("Payment", new HashMap<>());
        String topic = "egov.collection.payment-create";

        consumer.listenPayments(data, topic);

        verify(paymentUpdateService, times(1)).process(data);
    }

    @Test
    void listenPayments_ExceptionDoesNotPropagate() {
        Map<String, Object> data = new HashMap<>();
        String topic = "egov.collection.payment-create";
        
        doThrow(new RuntimeException("Processing failed"))
                .when(paymentUpdateService).process(any());

        // Should not throw exception
        consumer.listenPayments(data, topic);

        verify(paymentUpdateService, times(1)).process(data);
    }

    @Test
    void listenPayments_WithEmptyData() {
        Map<String, Object> data = new HashMap<>();
        String topic = "test-topic";

        consumer.listenPayments(data, topic);

        verify(paymentUpdateService, times(1)).process(data);
    }

    @Test
    void listenPayments_WithComplexPaymentData() {
        Map<String, Object> paymentDetails = new HashMap<>();
        paymentDetails.put("id", "payment-123");
        paymentDetails.put("totalAmount", 1000.00);
        
        Map<String, Object> data = new HashMap<>();
        data.put("Payment", paymentDetails);
        data.put("RequestInfo", new HashMap<>());
        
        String topic = "egov.collection.payment-create";

        consumer.listenPayments(data, topic);

        verify(paymentUpdateService, times(1)).process(data);
    }
}
