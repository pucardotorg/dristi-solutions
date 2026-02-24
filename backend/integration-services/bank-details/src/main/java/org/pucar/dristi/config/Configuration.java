package org.pucar.dristi.config;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Configuration {

    // Razorpay IFSC
    @Value("${razorpay.ifsc.api}")
    private String razorpayIfscApi;
}
