package org.pucar.dristi.web.models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.pucar.dristi.web.models.enums.Status;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CollectedReceipt {

	private String businessService;

	private String consumerCode;

	private String receiptNumber;

	private Double receiptAmount;

	private Long receiptDate;

	private Status status;

	private AuditDetail auditDetail;

	private String tenantId;
}
