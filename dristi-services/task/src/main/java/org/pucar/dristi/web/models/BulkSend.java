package org.pucar.dristi.web.models;

import lombok.Data;

@Data
public class BulkSend {

    private String tenantId;
    private String taskNumber;
    private boolean isSuccess = true;
    private String errorMessage;
}
