package org.pucar.dristi.repository;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.ObjectUtils;
import org.pucar.dristi.web.models.Document;
import org.egov.tracer.model.CustomException;
import org.postgresql.util.PGobject;
import org.pucar.dristi.repository.querybuilder.TaskCaseQueryBuilder;
import org.pucar.dristi.repository.querybuilder.TaskQueryBuilder;
import org.pucar.dristi.repository.rowmapper.AmountRowMapper;
import org.pucar.dristi.repository.rowmapper.DocumentRowMapper;
import org.pucar.dristi.repository.rowmapper.TaskCaseRowMapper;
import org.pucar.dristi.repository.rowmapper.TaskRowMapper;
import org.pucar.dristi.web.models.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.pucar.dristi.config.ServiceConstants.*;

@Slf4j
@Repository
public class TaskRepository {

    private final TaskQueryBuilder queryBuilder;
    private final JdbcTemplate jdbcTemplate;
    private final TaskRowMapper rowMapper;
    private final AmountRowMapper amountRowMapper;
    private final DocumentRowMapper documentRowMapper;
    private final TaskCaseQueryBuilder taskCaseQueryBuilder;
    private final TaskCaseRowMapper taskCaseRowMapper;
    private final ObjectMapper objectMapper;


    @Autowired
    public TaskRepository(TaskQueryBuilder queryBuilder,
                          JdbcTemplate jdbcTemplate,
                          TaskRowMapper rowMapper,
                          AmountRowMapper amountRowMapper,
                          DocumentRowMapper documentRowMapper,
                          TaskCaseQueryBuilder taskCaseQueryBuilder,
                          TaskCaseRowMapper taskCaseRowMapper,
                          ObjectMapper objectMapper) {
        this.queryBuilder = queryBuilder;
        this.jdbcTemplate = jdbcTemplate;
        this.rowMapper = rowMapper;
        this.amountRowMapper = amountRowMapper;
        this.documentRowMapper = documentRowMapper;
        this.taskCaseQueryBuilder = taskCaseQueryBuilder;
        this.taskCaseRowMapper = taskCaseRowMapper;
        this.objectMapper = objectMapper;
    }


    public List<Task> getTasks(TaskCriteria criteria, Pagination pagination) {
        try {
            List<Task> taskList = new ArrayList<>();
            List<Object> preparedStmtList = new ArrayList<>();
            List<Integer> preparedStmtArgList = new ArrayList<>();

            List<Object> preparedStmtAm = new ArrayList<>();
            List<Integer> preparedStmtArgAm = new ArrayList<>();

            List<Object> preparedStmtDc = new ArrayList<>();
            List<Integer> preparedStmtArgDc = new ArrayList<>();

            String taskQuery = "";
            taskQuery = queryBuilder.getTaskSearchQuery(criteria, preparedStmtList, preparedStmtArgList);
            if (preparedStmtList.size() != preparedStmtArgList.size()) {
                log.info("Arg size :: {}, and ArgType size :: {}", preparedStmtList.size(), preparedStmtArgList.size());
                throw new CustomException(SEARCH_TASK_ERR, "Args and ArgTypes size mismatch");
            }
            taskQuery = queryBuilder.addOrderByQuery(taskQuery, pagination);
            log.info("Final Task query :: {}", taskQuery);

            if (pagination != null) {
                Integer totalRecords = getTotalCountOrders(taskQuery, preparedStmtList);
                log.info("Total count without pagination :: {}", totalRecords);
                pagination.setTotalCount(Double.valueOf(totalRecords));
                taskQuery = queryBuilder.addPaginationQuery(taskQuery, pagination, preparedStmtList, preparedStmtArgList);
            }

            List<Task> list = jdbcTemplate.query(taskQuery, preparedStmtList.toArray(), preparedStmtArgList.stream().mapToInt(Integer::intValue).toArray(), rowMapper);
            log.info("DB task list :: {}", list);
            if (list != null) {
                taskList.addAll(list);
            }

            List<String> ids = new ArrayList<>();
            for (Task task : taskList)
                ids.add(task.getId().toString());

            if (ids.isEmpty())
                return taskList;

            String amountQuery = "";
            amountQuery = queryBuilder.getAmountSearchQuery(ids, preparedStmtAm, preparedStmtArgAm);
            log.info("Final Amount query :: {}", amountQuery);
            if (preparedStmtAm.size() != preparedStmtArgAm.size()) {
                log.info("Amount Arg size :: {}, and ArgType size :: {}", preparedStmtAm.size(), preparedStmtArgAm.size());
                throw new CustomException(TASK_SEARCH_QUERY_EXCEPTION, "Arg and ArgType size mismatch for amount search");
            }
            Map<UUID, Amount> amountMap = jdbcTemplate.query(amountQuery, preparedStmtAm.toArray(), preparedStmtArgAm.stream().mapToInt(Integer::intValue).toArray(), amountRowMapper);
            log.info("DB Amount map :: {}", amountMap);
            if (amountMap != null) {
                taskList.forEach(order -> order.setAmount(amountMap.get(order.getId())));
            }

            String documentQuery = "";
            documentQuery = queryBuilder.getDocumentSearchQuery(ids, preparedStmtDc, preparedStmtArgDc);
            log.info("Final document query :: {}", documentQuery);
            if (preparedStmtDc.size() != preparedStmtArgDc.size()) {
                log.info("Doc Arg size :: {}, and ArgType size :: {}", preparedStmtDc.size(), preparedStmtArgDc.size());
                throw new CustomException(TASK_SEARCH_QUERY_EXCEPTION, "Arg and ArgType size mismatch for document search");
            }
            Map<UUID, List<Document>> documentMap = jdbcTemplate.query(documentQuery, preparedStmtDc.toArray(), preparedStmtArgDc.stream().mapToInt(Integer::intValue).toArray(), documentRowMapper);
            log.info("DB document map :: {}", documentMap);
            if (documentMap != null) {
                taskList.forEach(order -> order.setDocuments(documentMap.get(order.getId())));
            }
            return taskList;
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error while fetching task application list :: {}", e.toString());
            throw new CustomException(SEARCH_TASK_ERR, "Exception while fetching task application list: " + e.getMessage());
        }
    }

    public TaskExists checkTaskExists(TaskExists taskExists) {
        try {
            List<Object> preparedStmtList = new ArrayList<>();

            //todo change this to annotation validation
            if (taskExists.getCnrNumber() == null && taskExists.getFilingNumber() == null && taskExists.getTaskId() == null && taskExists.getReferenceId()==null) {
                taskExists.setExists(false);
            } else {
                String taskExistQuery = queryBuilder.checkTaskExistQuery(taskExists.getCnrNumber(), taskExists.getFilingNumber(), taskExists.getTaskId(),taskExists.getReferenceId(),taskExists.getState(), preparedStmtList);
                log.info("Final task exist query :: {}", taskExistQuery);
                Integer count = jdbcTemplate.queryForObject(taskExistQuery, Integer.class, preparedStmtList.toArray());
                taskExists.setExists(count != null && count > 0);
            }
            return taskExists;
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error while checking task exist :: {} ", e.toString());
            throw new CustomException(EXIST_TASK_ERR, "Custom exception while checking task exist : " + e.getMessage());
        }
    }

    public Integer getTotalCountOrders(String baseQuery, List<Object> preparedStmtList) {
        String countQuery = queryBuilder.getTotalCountQuery(baseQuery);
        log.info("Final count query :: {}", countQuery);
        return jdbcTemplate.queryForObject(countQuery, Integer.class, preparedStmtList.toArray());
    }

    public Integer getTotalCountTaskCase(String taskQuery, String baseQuery, TaskCaseSearchCriteria criteria, List<Object> preparedStmtList) {
        String countQuery = taskQuery + taskCaseQueryBuilder.getTotalCountQuery(baseQuery);
        log.info("Final count query :: {}", countQuery);
        return jdbcTemplate.queryForObject(countQuery, Integer.class, preparedStmtList.toArray());
    }

    public void updateTask(Task task) {
        try {
            String taskUpsertQuery = "INSERT INTO dristi_task(id, tenantId, orderId, filingNumber, cnrNumber, taskNumber, createdDate, dateCloseBy, dateClosed, taskDescription, taskType, taskDetails, status, assignedTo, isActive, additionalDetails, createdBy, lastModifiedBy, createdTime, lastModifiedTime) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) " +
                    "ON CONFLICT (id) DO UPDATE SET tenantid = EXCLUDED.tenantid, orderid = EXCLUDED.orderid, filingnumber = EXCLUDED.filingnumber, " +
                    "cnrnumber = EXCLUDED.cnrnumber, tasknumber = EXCLUDED.tasknumber, createddate = EXCLUDED.createddate, " +
                    "datecloseby = EXCLUDED.datecloseby, dateclosed = EXCLUDED.dateclosed, taskdescription = EXCLUDED.taskdescription, " +
                    "tasktype = EXCLUDED.tasktype, taskdetails = EXCLUDED.taskdetails, assignedto = EXCLUDED.assignedto, " +
                    "status = EXCLUDED.status, isactive = EXCLUDED.isactive, additionaldetails = EXCLUDED.additionaldetails, " +
                    "createdby = EXCLUDED.createdby, lastmodifiedby = EXCLUDED.lastmodifiedby, " +
                    "createdtime = EXCLUDED.createdtime, lastmodifiedtime = EXCLUDED.lastmodifiedtime";

            jdbcTemplate.update(taskUpsertQuery,
                    task.getId(),
                    task.getTenantId(),
                    task.getOrderId(),
                    task.getFilingNumber(),
                    task.getCnrNumber(),
                    task.getTaskNumber(),
                    task.getCreatedDate(),
                    task.getDateCloseBy(),
                    task.getDateClosed(),
                    task.getTaskDescription(),
                    task.getTaskType(),
                    toPGobject(task.getTaskDetails()),
                    task.getStatus(),
                    toPGobject(task.getAssignedTo()),
                    task.getIsActive(),
                    toPGobject(task.getAdditionalDetails()),
                    task.getAuditDetails().getCreatedBy(),
                    task.getAuditDetails().getLastModifiedBy(),
                    task.getAuditDetails().getCreatedTime(),
                    task.getAuditDetails().getLastModifiedTime()
            );

            if (task.getAmount() != null) {
                Amount amount = task.getAmount();
                String amountUpsertQuery = "INSERT INTO dristi_task_amount(id, amount, type, task_id, paymentRefNumber, status, additionalDetails) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?) " +
                        "ON CONFLICT (id) DO UPDATE SET amount = EXCLUDED.amount, paymentrefnumber = EXCLUDED.paymentrefnumber, " +
                        "type = EXCLUDED.type, task_id = EXCLUDED.task_id, additionaldetails = EXCLUDED.additionaldetails, status = EXCLUDED.status";

                jdbcTemplate.update(amountUpsertQuery,
                        amount.getId(),
                        amount.getAmount(),
                        amount.getType(),
                        task.getId(),
                        amount.getPaymentRefNumber(),
                        amount.getStatus(),
                        toPGobject(amount.getAdditionalDetails())
                );
            }

            if (task.getDocuments() != null && !task.getDocuments().isEmpty()) {
                String documentUpsertQuery = "INSERT INTO dristi_task_document(id, fileStore, documentUid, documentType, task_id, additionalDetails) " +
                        "VALUES (?, ?, ?, ?, ?, ?) " +
                        "ON CONFLICT (id) DO UPDATE SET filestore = EXCLUDED.filestore, documentuid = EXCLUDED.documentuid, " +
                        "documenttype = EXCLUDED.documenttype, task_id = EXCLUDED.task_id, additionaldetails = EXCLUDED.additionaldetails";

                for (Document document : task.getDocuments()) {
                    jdbcTemplate.update(documentUpsertQuery,
                            document.getId(),
                            document.getFileStore(),
                            document.getDocumentUid(),
                            document.getDocumentType(),
                            task.getId(),
                            toPGobject(document.getAdditionalDetails())
                    );
                }
            }

        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error while updating task via JDBC :: {}", e.toString());
            throw new CustomException(UPDATE_TASK_ERR, "Exception while updating task via JDBC: " + e.getMessage());
        }
    }

    private PGobject toPGobject(Object value) {
        try {
            PGobject pgObject = new PGobject();
            pgObject.setType("jsonb");
            pgObject.setValue(value != null ? objectMapper.writeValueAsString(value) : null);
            return pgObject;
        } catch (Exception e) {
            throw new CustomException(UPDATE_TASK_ERR, "Failed to convert value to PGobject: " + e.getMessage());
        }
    }

    public List<TaskCase> getTaskWithCaseDetails(TaskCaseSearchRequest request) {

        List<Object> preparedStmtList = new ArrayList<>();

        List<Integer> preparedStmtArgDc = new ArrayList<>();

        String taskQuery = taskCaseQueryBuilder.getTaskTableSearchQuery(request.getCriteria(), preparedStmtList);
        log.debug("Base query: " + taskQuery);
        taskQuery = taskCaseQueryBuilder.addWithClauseQuery(taskQuery);
        String taskCaseQuery = "";
        taskCaseQuery = taskCaseQueryBuilder.getFinalTaskCaseSearchQuery();
        taskCaseQuery = taskCaseQueryBuilder.addApplicationStatusQuery(request.getCriteria(), taskCaseQuery, preparedStmtList);
        taskCaseQuery = taskCaseQueryBuilder.addOrderByQuery(taskCaseQuery, request.getPagination());
        if (request.getPagination() != null) {
            Integer totalRecords = getTotalCountTaskCase(taskQuery, taskCaseQuery, request.getCriteria(), preparedStmtList);
            log.info("Total count without pagination :: {}", totalRecords);
            request.getPagination().setTotalCount(Double.valueOf(totalRecords));
            taskCaseQuery = taskCaseQueryBuilder.addPaginationQuery(taskCaseQuery, request.getPagination(), preparedStmtList);
        }

        String finalQuery = taskQuery+taskCaseQuery;
        log.info("Final TaskCase query :: {}", finalQuery);
        List<TaskCase> list = jdbcTemplate.query(finalQuery, preparedStmtList.toArray(), taskCaseRowMapper);
        List<Object> preparedStmtDc = new ArrayList<>();

        List<String> ids = new ArrayList<>();
        if (list == null) {
            return new ArrayList<>();
        }
        for (TaskCase task : list)
            ids.add(task.getId().toString());

        String documentQuery = "";
        documentQuery = queryBuilder.getDocumentSearchQuery(ids, preparedStmtDc,preparedStmtArgDc);
        log.info("Final document query in summon table :: {}", documentQuery);
        Map<UUID, List<Document>> documentMap = jdbcTemplate.query(documentQuery, preparedStmtDc.toArray(), documentRowMapper);
        log.info("DB document map in summon table :: {}", documentMap);
        if (documentMap != null) {
            list.forEach(order -> {
                order.setDocuments(documentMap.get(order.getId()));
            });
        }

        return list;

    }
}