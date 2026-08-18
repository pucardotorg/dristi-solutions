package org.pucar.dristi.repository;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.AuditDetails;
import org.pucar.dristi.model.AdditionalFields;
import org.pucar.dristi.model.Address;
import org.pucar.dristi.model.DeliveryStatus;
import org.pucar.dristi.model.EPostTracker;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;

@Component
@Slf4j
public class EPostRowMapper implements RowMapper<EPostTracker> {

    private final ObjectMapper objectMapper;

    @Autowired
    public EPostRowMapper(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }


    @Override
    public EPostTracker mapRow(ResultSet rs, int rowNum) throws SQLException {
        String deliveryStatusStr = rs.getString("delivery_status");
        DeliveryStatus deliveryStatus = deliveryStatusStr != null ? DeliveryStatus.valueOf(deliveryStatusStr) : null;

        AdditionalFields additionalFields = new AdditionalFields();

        Address address = new Address();
        try {
            additionalFields = objectMapper.readValue(rs.getString("additional_details"), AdditionalFields.class);
            String addressObjString = rs.getString("address_obj");
            if (addressObjString != null) {
                address = objectMapper.readValue(rs.getString("address_obj"), Address.class);
            }
        } catch (JsonProcessingException e) {
            throw new SQLException(e);
        }

        return EPostTracker.builder()
                .processNumber(rs.getString("process_number"))
                .tenantId(rs.getString("tenant_id"))
                .fileStoreId(rs.getString("file_store_id"))
                .taskNumber(rs.getString("task_number"))
                .trackingNumber(rs.getString("tracking_number"))
                .address(rs.getString("address"))
                .pinCode(rs.getString("pincode"))
                .deliveryStatus(deliveryStatus)
                .remarks(rs.getString("remarks"))
                .additionalDetails(additionalFields)
                .rowVersion(rs.getInt("row_version"))
                .bookingDate(rs.getLong("booking_date") == 0 ? null : rs.getLong("booking_date"))
                .receivedDate(rs.getLong("received_date") == 0 ? null : rs.getLong("received_date"))
                .postalHub(rs.getString("postal_hub"))
                .totalAmount(rs.getString("total_amount"))
                .speedPostId(rs.getString("speed_post_id"))
                .statusUpdateDate(rs.getLong("status_update_date") == 0 ? null : rs.getLong("status_update_date"))
                .taskType(rs.getString("task_type"))
                .respondentName(rs.getString("respondent_name"))
                .phone(rs.getString("phone"))
                .addressObj(address)
                .auditDetails(
                        AuditDetails.builder()
                                .createdBy(rs.getString("createdBy"))
                                .lastModifiedBy(rs.getString("lastModifiedBy"))
                                .createdTime(rs.getLong("createdTime"))
                                .lastModifiedTime(rs.getLong("lastModifiedTime"))
                                .build()
                )
                .build();
    }
}
