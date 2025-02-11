package notification.repository;

import lombok.extern.slf4j.Slf4j;
import notification.repository.querybuilder.NotificationQueryBuilder;
import notification.repository.rowmapper.NotificationRowMapper;
import notification.web.models.Notification;
import notification.web.models.NotificationCriteria;
import notification.web.models.Pagination;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

@Repository
@Slf4j
public class NotificationRepository {

    private final NotificationQueryBuilder queryBuilder;
    private final NotificationRowMapper rowMapper;
    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public NotificationRepository(NotificationQueryBuilder queryBuilder, NotificationRowMapper rowMapper, JdbcTemplate jdbcTemplate) {
        this.queryBuilder = queryBuilder;
        this.rowMapper = rowMapper;
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Notification> getNotifications(NotificationCriteria criteria, Pagination pagination) {

        List<Object> preparedStmtList = new ArrayList<>();
        List<Integer> preparedStmtArgList = new ArrayList<>();
        String query = queryBuilder.getBaseNotificationQuery(criteria, preparedStmtList, preparedStmtArgList);

        if (pagination != null) {
            Integer totalRecords = getTotalCount(query, preparedStmtList);
            pagination.setTotalCount(Double.valueOf(totalRecords));
            query = queryBuilder.getNotificationPaginatedQuery(query, pagination, preparedStmtList, preparedStmtArgList);
        }
        if (preparedStmtList.size() != preparedStmtArgList.size()) {
            log.info("Arg size :: {}, and ArgType size :: {}", preparedStmtList.size(), preparedStmtArgList.size());
            throw new CustomException("", "Arg and ArgType size mismatch ");
        }

        return jdbcTemplate.query(query, preparedStmtList.toArray(), preparedStmtArgList.stream().mapToInt(Integer::intValue).toArray(), rowMapper);

    }


    public Integer getTotalCount(String baseQuery, List<Object> preparedStmtList) {
        String countQuery = queryBuilder.getTotalCountQuery(baseQuery);
        log.info("Final count query :: {}", countQuery);
        return jdbcTemplate.queryForObject(countQuery, preparedStmtList.toArray(), Integer.class);
    }
}
