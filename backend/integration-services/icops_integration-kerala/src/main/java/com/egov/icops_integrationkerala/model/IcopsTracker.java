package com.egov.icops_integrationkerala.model;

import lombok.*;
import org.springframework.stereotype.Component;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Component
public class IcopsTracker {
    private String processNumber;
    private String tenantId;
    private String taskNumber;
    private String taskType;
    private String fileStoreId;
    private Object taskDetails;
    private DeliveryStatus deliveryStatus;
    private String remarks;
    private AdditionalFields additionalDetails;
    private Integer rowVersion;
    private String bookingDate;
    private String receivedDate;
    private String acknowledgementId;
    private Object requestBlob;
    private Object responseBlob;
    private String failureReason;
}
