package org.egov.eTreasury.repository;

import java.util.List;

import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class AuthSekQueryBuilder {

    private static final String BASE_QUERY = "SELECT auth_token, decrypted_sek, bill_id, business_service, service_number, total_due, mobile_number, paid_by, session_time, department_id, request_blob, payment_status, completion_source, verification_timestamp, processed_status ";

    private static final String FROM_TABLES = " FROM auth_sek_session_data ";

    private static final String ORDER_BY_SESSION_TIME = "ORDER BY session_time ";

    public String getAuthSekQuery(String authToken, List<Object> preparedStmtList) {
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

    private void addClauseIfRequired(StringBuilder query, List<Object> preparedStmtList) {
        if (preparedStmtList.isEmpty()) {
            query.append(" WHERE ");
        } else {
            query.append(" AND ");
        }
    }

    public String getPendingAuthSeksQuery(Long thresholdTime, List<Object> preparedStmtList) {
        StringBuilder query = new StringBuilder(BASE_QUERY);
        query.append(FROM_TABLES);
        query.append(" WHERE processed_status = 'PENDING' AND session_time >= ? ");
        preparedStmtList.add(thresholdTime);
        query.append(ORDER_BY_SESSION_TIME);
        return query.toString();
    }

    public String getAgedPendingAuthSeksQuery(Long thresholdTime, List<Object> preparedStmtList) {
        StringBuilder query = new StringBuilder(BASE_QUERY);
        query.append(FROM_TABLES);
        query.append(" WHERE processed_status = 'PENDING' AND session_time <= ? AND department_id IS NOT NULL ");
        preparedStmtList.add(thresholdTime);
        query.append(ORDER_BY_SESSION_TIME);
        return query.toString();
    }

    public String getAuthSekByDepartmentIdQuery(String departmentId, List<Object> preparedStmtList) {
        StringBuilder query = new StringBuilder(BASE_QUERY);
        query.append(FROM_TABLES);
        query.append(" WHERE department_id = ? ");
        preparedStmtList.add(departmentId);
        query.append(ORDER_BY_SESSION_TIME).append(" DESC ");
        return query.toString();
    }

    public String getAuthSekByBillIdQuery(String billId, List<Object> preparedStmtList) {
        StringBuilder query = new StringBuilder(BASE_QUERY);
        query.append(FROM_TABLES);
        query.append(" WHERE bill_id = ? ");
        preparedStmtList.add(billId);
        // Only the most recent attempt is needed: the UI gates each payment on this status,
        // so there is at most one in-flight session per bill at a time.
        query.append(ORDER_BY_SESSION_TIME).append(" DESC LIMIT 1 ");
        return query.toString();
    }

    public String getAuthSekByServiceNumberQuery(String serviceNumber, List<Object> preparedStmtList) {
        StringBuilder query = new StringBuilder(BASE_QUERY);
        query.append(FROM_TABLES);
        query.append(" WHERE service_number = ? ");
        preparedStmtList.add(serviceNumber);
        // service_number carries the consumerCode; same "latest attempt only" rule as the billId lookup.
        query.append(ORDER_BY_SESSION_TIME).append(" DESC LIMIT 1 ");
        return query.toString();
    }
}
