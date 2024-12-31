package org.egov.id.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Service
@Slf4j
public class SequenceResetService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private Configuration configuration;

    private static final String TIME_ZONE = "Asia/Kolkata";

    private static final String CRON_EXPRESSION = "#{@scheduleCronExpression}";

    // This runs at midnight on December 31st. One second before transitioning to january 1st every year
    //59 59 23 31 12 *

    @Scheduled(cron = CRON_EXPRESSION, zone = TIME_ZONE)
    public void resetSequence() {
        try {
            configuration.getSequenceList().forEach(this::runQuery);
        } catch (Exception ex) {
            log.error("Error restarting sequence", ex);
        }
    }

    public void runQuery(String sequence) {
        try {
            String curValueSql = "SELECT last_value FROM " + sequence + ";";
            log.error("Executing current value query :: {}", curValueSql);

            Integer currentValue = jdbcTemplate.queryForObject(curValueSql, Integer.class);
            log.error("Current value for Sequence:: {}, is {}", sequence, currentValue);

            String alterSeqSql = "ALTER SEQUENCE " + sequence + " RESTART WITH 1;";
            log.error("Executing alter sequence query :: {}", alterSeqSql);
            jdbcTemplate.execute(alterSeqSql);
            log.error("Execution Successful for alter sequence query :: {}", alterSeqSql);

        } catch (Exception ex) {
            log.error("Error restarting sequence :: {}", sequence, ex);
        }
    }
}
