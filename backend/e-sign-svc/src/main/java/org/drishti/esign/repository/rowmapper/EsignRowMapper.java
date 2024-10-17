package org.drishti.esign.repository.rowmapper;

import org.drishti.esign.web.models.ESignParameter;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;

@Component
public class EsignRowMapper implements RowMapper<ESignParameter> {

    @Override
    public ESignParameter mapRow(ResultSet rs, int rowNum) throws SQLException {
        return ESignParameter.builder()
                .uidToken(rs.getString("uid_token"))
                .consent(rs.getString("consent"))
                .authType(rs.getString("auth_type"))
                .fileStoreId(rs.getString("file_store_id"))
                .tenantId(rs.getString("tenant_id"))
                .pageModule(rs.getString("page_module"))
                .signPlaceHolder(rs.getString("sign_place_holder"))
                .build();
    }
}
