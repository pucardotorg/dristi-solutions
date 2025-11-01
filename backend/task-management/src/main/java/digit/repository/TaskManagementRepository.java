package digit.repository;

import digit.repository.querybuilder.TaskManagementQueryBuilder;
import digit.repository.rowmapper.TaskManagementRowMapper;
import digit.web.models.Pagination;
import digit.web.models.TaskManagement;
import digit.web.models.TaskSearchCriteria;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Repository
public class TaskManagementRepository {

    private final TaskManagementQueryBuilder queryBuilder;
    private final JdbcTemplate jdbcTemplate;
    private final TaskManagementRowMapper rowMapper;

    @Autowired
    public TaskManagementRepository(TaskManagementQueryBuilder queryBuilder, JdbcTemplate jdbcTemplate, TaskManagementRowMapper rowMapper){
        this.queryBuilder = queryBuilder;
        this.jdbcTemplate = jdbcTemplate;
        this.rowMapper = rowMapper;
    }

    public List<TaskManagement> getTaskManagement(TaskSearchCriteria criteria, Pagination pagination) {
        try {
            List<TaskManagement> taskList = new ArrayList<>();
            List<Object> preparedStmtList = new ArrayList<>();
            List<Integer> preparedStmtArgList = new ArrayList<>();

            String taskQuery = "";
            taskQuery = queryBuilder.getTaskSearchQuery(criteria, preparedStmtList, preparedStmtArgList);
            if (preparedStmtList.size() != preparedStmtArgList.size()) {
                log.info("Arg size :: {}, and ArgType size :: {}", preparedStmtList.size(), preparedStmtArgList.size());
                throw new CustomException("SEARCH_TASK_ERR", "Args and ArgTypes size mismatch");
            }
            taskQuery = queryBuilder.addOrderByQuery(taskQuery, pagination);
            log.info("Final Task query :: {}", taskQuery);

            if (pagination != null) {
                Integer totalRecords = getTotalCount(taskQuery, preparedStmtList);
                log.info("Total count without pagination :: {}", totalRecords);
                pagination.setTotalCount(Double.valueOf(totalRecords));
                taskQuery = queryBuilder.addPaginationQuery(taskQuery, pagination, preparedStmtList, preparedStmtArgList);
            }

            List<TaskManagement> list = jdbcTemplate.query(taskQuery, preparedStmtList.toArray(), preparedStmtArgList.stream().mapToInt(Integer::intValue).toArray(), rowMapper);
            log.info("DB task list :: {}", list);
            if (list != null) {
                taskList.addAll(list);
            }

            return taskList;

        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error while fetching task application list :: {}", e.toString());
            throw new CustomException("SEARCH_TASK_ERR", "Exception while fetching task application list: " + e.getMessage());
        }
    }

    public Integer getTotalCount(String baseQuery, List<Object> preparedStmtList) {
        String countQuery = queryBuilder.getTotalCountQuery(baseQuery);
        log.info("Final count query :: {}", countQuery);
        return jdbcTemplate.queryForObject(countQuery, Integer.class, preparedStmtList.toArray());
    }

}