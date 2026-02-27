package org.pucar.dristi.repository.rowmapper;

import org.pucar.dristi.web.models.CtcApplication;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;

@Component
public class CtcSelectedDocumentRowMapper implements RowMapper<CtcApplication.SelectedDocument> {

    @Override
    public CtcApplication.SelectedDocument mapRow(ResultSet rs, int rowNum) throws SQLException, DataAccessException {
        return CtcApplication.SelectedDocument.builder()
                .documentId(rs.getString("document_id"))
                .documentName(rs.getString("document_name"))
                .documentCategory(rs.getString("document_category"))
                .numberOfCopies(rs.getInt("number_of_copies"))
                .pages(rs.getInt("pages"))
                .build();
    }
}
