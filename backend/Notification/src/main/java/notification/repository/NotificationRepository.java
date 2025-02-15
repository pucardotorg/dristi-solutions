package notification.repository;

import lombok.extern.slf4j.Slf4j;
import notification.repository.querybuilder.NotificationQueryBuilder;
import notification.repository.rowmapper.NotificationExistsRowMapper;
import notification.repository.rowmapper.NotificationRowMapper;
import notification.web.models.Notification;
import notification.web.models.NotificationCriteria;
import notification.web.models.NotificationExists;
import notification.web.models.Pagination;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Repository
@Slf4j
public class NotificationRepository {

    private final NotificationQueryBuilder queryBuilder;
    private final NotificationRowMapper rowMapper;
    private final JdbcTemplate jdbcTemplate;
    private  final NotificationExistsRowMapper notificationExistsRowMapper;

    @Autowired
    public NotificationRepository(NotificationQueryBuilder queryBuilder, NotificationRowMapper rowMapper, JdbcTemplate jdbcTemplate, NotificationExistsRowMapper notificationExistsRowMapper) {
        this.queryBuilder = queryBuilder;
        this.rowMapper = rowMapper;
        this.jdbcTemplate = jdbcTemplate;
        this.notificationExistsRowMapper = notificationExistsRowMapper;
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

    public List<NotificationExists> checkIfNotificationExists(List<NotificationExists> notificationExists){
        List<Object> preparedStmtList = new ArrayList<>();
        List<Integer> preparedStmtArgList = new ArrayList<>();
        String query = queryBuilder.getBaseNotificationExistenceQuery(notificationExists, preparedStmtList, preparedStmtArgList);

        if (preparedStmtList.size() != preparedStmtArgList.size()) {
            log.info("Arg size :: {}, and ArgType size :: {}", preparedStmtList.size(), preparedStmtArgList.size());
            throw new CustomException("", "Arg and ArgType size mismatch ");
        }

        return jdbcTemplate.query(
                query,
                preparedStmtList.toArray(),
                preparedStmtArgList.stream().mapToInt(Integer::intValue).toArray(),
                notificationExistsRowMapper
        );

    }
}
