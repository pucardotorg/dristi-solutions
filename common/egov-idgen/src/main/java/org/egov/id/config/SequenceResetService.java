package org.egov.id.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Service
@Slf4j
public class SequenceResetService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private Configuration configuration;

    private final Object lock = new Object();

    private static final String TIME_ZONE = "Asia/Kolkata";

    private static final String CRON_EXPRESSION = "#{@scheduleCronExpression}";

    // This runs at midnight on December 31st. One second before transitioning to january 1st every year
    //59 59 23 31 12 *

    @Scheduled(cron = CRON_EXPRESSION, zone = TIME_ZONE)
    public void resetAdvocateSequence() {
        try {
            resetSequence(configuration.getAdvocateSequence());
        } catch (Exception ex) {
            log.error("Error restarting Advocate sequence", ex);
        }
    }

    @Scheduled(cron = CRON_EXPRESSION, zone = TIME_ZONE)
    public void resetClerkSequence() {
        try {
            resetSequence(configuration.getClerkSequence());
        } catch (Exception ex) {
            log.error("Error restarting Clerk sequence", ex);
        }
    }

    @Scheduled(cron = CRON_EXPRESSION, zone = TIME_ZONE)
    public void resetFilingSequence() {
        try {
            resetSequence(configuration.getFilingSequence());
        } catch (Exception ex) {
            log.error("Error restarting Filing sequence", ex);
        }
    }

    @Scheduled(cron = CRON_EXPRESSION, zone = TIME_ZONE)
    public void resetCNRSequence() {
        try {
            resetSequence(configuration.getCnrSequence() + configuration.getKollamCourtId());
        } catch (Exception ex) {
            log.error("Error restarting CNR sequence", ex);
        }
    }

    @Scheduled(cron = CRON_EXPRESSION, zone = TIME_ZONE)
    public void resetCourtCaseSequence() {
        try {
            resetSequence(configuration.getCourtCaseSequence() + configuration.getKollamCourtId());
        } catch (Exception ex) {
            log.error("Error restarting Court Case sequence", ex);
        }
    }

    @Scheduled(cron = CRON_EXPRESSION, zone = TIME_ZONE)
    public void resetCMPSequence() {
        try {
            resetSequence(configuration.getCmpSequence() + configuration.getKollamCourtId());
        } catch (Exception ex) {
            log.error("Error restarting CMP sequence", ex);
        }
    }

    public void resetSequence(String sequence) {
        synchronized (lock) {
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
                log.error("Error restarting sequence", ex);
            }
        }
    }
}
