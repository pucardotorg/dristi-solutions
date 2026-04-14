package org.egov.eTreasury.repository;

import java.util.List;

import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class AuthSekQueryBuilder {

    private static final String BASE_QUERY = "SELECT auth_token, decrypted_sek, bill_id, business_service, service_number, total_due, mobile_number, paid_by, session_time, department_id, request_blob, payment_status, completion_source, verification_timestamp ";

    private static final String FROM_TABLES = " FROM auth_sek_session_data ";

    private static final String ORDER_BY_SESSION_TIME = "ORDER BY session_time ";

    public String getAuthSekQuery(String authToken, List<String> preparedStmtList) {
        StringBuilder query = new StringBuilder(BASE_QUERY);
        query.append(FROM_TABLES);

        if (StringUtils.hasText(authToken)) {
            addClauseIfRequired(query, preparedStmtList);
            query.append(" auth_token = ? ");
            preparedStmtList.add(authToken);
        }
        query.append(ORDER_BY_SESSION_TIME);
        return query.toString();
    }

    private void addClauseIfRequired(StringBuilder query, List<String> preparedStmtList) {
        if (preparedStmtList.isEmpty()) {
            query.append(" WHERE ");
        } else {
            query.append(" AND ");
        }
    }

    public String getPendingAuthSeksQuery(Long thresholdTime, List<Object> preparedStmtList) {
        StringBuilder query = new StringBuilder(BASE_QUERY);
        query.append(FROM_TABLES);
        query.append(" WHERE (payment_status = 'INITIATED' OR payment_status IS NULL) AND session_time <= ? ");
        preparedStmtList.add(thresholdTime);
        query.append(ORDER_BY_SESSION_TIME);
        return query.toString();
    }
}
