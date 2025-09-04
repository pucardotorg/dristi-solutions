package org.egov.eTreasury.repository;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.egov.eTreasury.model.Calculation;
import org.egov.eTreasury.model.TreasuryMapping;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;

@Component
public class TreasuryMappingRowMapper implements RowMapper<TreasuryMapping> {

    private final ObjectMapper mapper;

    public TreasuryMappingRowMapper(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    @Override
    public TreasuryMapping mapRow(ResultSet rs, int rowNum) throws SQLException {
        try {
            return TreasuryMapping.builder()
                    .consumerCode(rs.getString("consumer_code"))
                    .tenantId(rs.getString("tenant_id"))
                    .headAmountMapping(mapper.readTree(rs.getString("head_mapping")))
                    .calculation(getCalculation(rs.getObject("calculation")))
                    .createdTime(rs.getLong("createdtime"))
                    .lastModifiedTime(rs.getLong("lastmodifiedtime"))
                    .finalCalcPostResubmission(getCalculation(rs.getObject("finalcalcpostresubmission")))
                    .lastSubmissionConsumerCode(rs.getString("lastsubmissionconsumercode"))
                    .build();
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    }

    private Calculation getCalculation(Object calculation) throws JsonProcessingException {
        if (calculation!=null){
            return mapper.convertValue(mapper.readTree(calculation.toString()), Calculation.class);
        }
        return null;
    }
}