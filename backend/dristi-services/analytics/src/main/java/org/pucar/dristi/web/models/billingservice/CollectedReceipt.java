package org.pucar.dristi.web.models.billingservice;

import org.egov.common.contract.models.AuditDetails;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

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

	private AuditDetails auditDetail;

	private String tenantId;
}