package org.egov.id.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@Slf4j
public class SequenceResetService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Value("${dristi.kollam.court.id}")
    private String KOLLAM_COURT_ID;

    private static final String ADVOCATE_SEQUENCE = "SEQ_REG_ADV";
    private static final String CLERK_SEQUENCE = "SEQ_REG_CLERK";
    private static final String FILING_SEQUENCE = "SEQ_FILING_NUMBER";
    private static final String CNR_SEQUENCE = "SEQ_CNR_";
    private static final String COURT_CASE_SEQUENCE = "SEQ_CCST_";
    private static final String CMP_SEQUENCE = "SEQ_CMP_";

    private static final String TIME_ZONE = "Asia/Kolkata";

    // This runs at midnight on January 1st every year
    //0 0 0 1 1 *

    @Scheduled(cron = "0 0 0 1 1 *", zone = TIME_ZONE)
    public void resetAdvocateSequence() {
        try {
            String sql = "ALTER SEQUENCE " + ADVOCATE_SEQUENCE + " RESTART WITH 1;";
            log.error("Executing Restart query for Advocate sequence");
            jdbcTemplate.execute(sql);
        } catch (Exception ex) {
            log.error("Error restarting Advocate sequence", ex);
        }
    }

    @Scheduled(cron = "0 0 0 1 1 *", zone = TIME_ZONE)
    public void resetClerkSequence() {
        try {
            String sql = "ALTER SEQUENCE " + CLERK_SEQUENCE + " RESTART WITH 1;";
            log.error("Executing Restart query for Clerk sequence");
            jdbcTemplate.execute(sql);
        } catch (Exception ex) {
            log.error("Error restarting Clerk sequence", ex);
        }
    }

    @Scheduled(cron = "0 0 0 1 1 *", zone = TIME_ZONE)
    public void resetFilingSequence() {
        try {
            String sql = "ALTER SEQUENCE " + FILING_SEQUENCE + " RESTART WITH 1;";
            log.error("Executing Restart query for Filing sequence");
            jdbcTemplate.execute(sql);
        } catch (Exception ex) {
            log.error("Error restarting Filing sequence", ex);
        }
    }

    @Scheduled(cron = "0 0 0 1 1 *", zone = TIME_ZONE)
    public void resetCNRSequence() {
        try {
            String sql = "ALTER SEQUENCE " + CNR_SEQUENCE + KOLLAM_COURT_ID + " RESTART WITH 1;";
            log.error("Executing Restart query for CNR sequence");
            jdbcTemplate.execute(sql);
        } catch (Exception ex) {
            log.error("Error restarting CNR sequence", ex);
        }
    }

    @Scheduled(cron = "0 0 0 1 1 *", zone = TIME_ZONE)
    public void resetCourtCaseSequence() {
        try {
            String sql = "ALTER SEQUENCE " + COURT_CASE_SEQUENCE + KOLLAM_COURT_ID + " RESTART WITH 1;";
            log.error("Executing Restart query for Court Case sequence");
            jdbcTemplate.execute(sql);
        } catch (Exception ex) {
            log.error("Error restarting Court Case sequence", ex);
        }
    }

    @Scheduled(cron = "0 0 0 1 1 *", zone = TIME_ZONE)
    public void resetCMPSequence() {
        try {
            String sql = "ALTER SEQUENCE " + CMP_SEQUENCE + KOLLAM_COURT_ID + " RESTART WITH 1;";
            log.error("Executing Restart query for CMP sequence");
            jdbcTemplate.execute(sql);
        } catch (Exception ex) {
            log.error("Error restarting CMP sequence", ex);
        }
    }

}
