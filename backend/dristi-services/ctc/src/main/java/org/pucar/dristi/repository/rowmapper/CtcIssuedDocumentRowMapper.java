package org.pucar.dristi.repository.rowmapper;

import org.pucar.dristi.web.models.CtcApplication;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;

@Component
public class CtcIssuedDocumentRowMapper implements RowMapper<CtcApplication.IssuedDocument> {

    @Override
    public CtcApplication.IssuedDocument mapRow(ResultSet rs, int rowNum) throws SQLException, DataAccessException {
        return CtcApplication.IssuedDocument.builder()
                .documentId(rs.getString("document_id"))
                .documentName(rs.getString("document_name"))
                .issuedFilestoreId(rs.getString("issued_filestore_id"))
                .issuedDate(rs.getTimestamp("issued_date") != null ? 
                    rs.getTimestamp("issued_date").toLocalDateTime() : null)
                .approvalOrderId(rs.getString("approval_order_id"))
                .build();
    }
}
