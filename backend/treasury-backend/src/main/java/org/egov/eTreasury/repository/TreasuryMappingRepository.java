package org.egov.eTreasury.repository;


import lombok.extern.slf4j.Slf4j;
import org.egov.eTreasury.model.TreasuryMapping;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.sql.Types;
import java.util.List;

@Component
@Slf4j
public class TreasuryMappingRepository {

    private final JdbcTemplate jdbcTemplate;
    private final TreasuryMappingRowMapper rowMapper;
    private static final String BASE_QUERY = "SELECT * FROM treasury_head_breakup_data WHERE consumer_code = ? ";

    public TreasuryMappingRepository(JdbcTemplate jdbcTemplate, TreasuryMappingRowMapper rowMapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.rowMapper = rowMapper;
    }

    public TreasuryMapping getTreasuryMapping(String consumerCode) {
        String query = BASE_QUERY;
        List<Object> preparedStmtList = List.of(consumerCode);
        List<Integer> prperedStmtArgsList = List.of(Types.VARCHAR);

        log.info("Final query: {}", query);
        List<TreasuryMapping> treasuryMappings = jdbcTemplate.query(query, preparedStmtList.toArray(), prperedStmtArgsList.stream().mapToInt(Integer::intValue).toArray(), rowMapper);
        return treasuryMappings.isEmpty() ? null : treasuryMappings.get(0);
    }
}
