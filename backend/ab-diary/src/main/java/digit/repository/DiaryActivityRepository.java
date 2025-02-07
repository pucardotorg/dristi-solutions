package digit.repository;

import digit.repository.querybuilder.DiaryActivityQueryBuilder;
import digit.repository.rowmapper.DiaryActivityRowMapper;
import digit.web.models.CaseDiaryActivityListItem;
import digit.web.models.CaseDiaryActivitySearchRequest;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

import static digit.config.ServiceConstants.DIARY_ENTRY_QUERY_EXCEPTION;
import static digit.config.ServiceConstants.DIARY_ENTRY_SEARCH_EXCEPTION;

@Repository
@Slf4j
public class DiaryActivityRepository {

    private final DiaryActivityQueryBuilder queryBuilder;

    private final JdbcTemplate jdbcTemplate;

    private final DiaryActivityRowMapper diaryActivityRowMapper;

    public DiaryActivityRepository(DiaryActivityQueryBuilder queryBuilder, JdbcTemplate jdbcTemplate, DiaryActivityRowMapper diaryActivityRowMapper) {
        this.queryBuilder = queryBuilder;
        this.jdbcTemplate = jdbcTemplate;
        this.diaryActivityRowMapper = diaryActivityRowMapper;
    }

    public List<CaseDiaryActivityListItem> getCaseDiaryActivities(CaseDiaryActivitySearchRequest searchRequest) {
        try {

            List<Object> preparedStmtList = new ArrayList<>();
            List<Integer> preparedStmtArgList = new ArrayList<>();

            String diaryActivityQuery = queryBuilder.getDiaryActivityQuery(searchRequest.getCriteria(), preparedStmtList, preparedStmtArgList);
            diaryActivityQuery = queryBuilder.addOrderByQuery(diaryActivityQuery, searchRequest.getPagination());
            log.info("Diary Entry query : {} ", diaryActivityQuery);

            if (searchRequest.getPagination() != null) {

                Integer totalRecords = getTotalCount(diaryActivityQuery, preparedStmtList);
                log.info("Total count without pagination :: {}", totalRecords);
                searchRequest.getPagination().setTotalCount(Double.valueOf(totalRecords));
                diaryActivityQuery = queryBuilder.addPaginationQuery(diaryActivityQuery, preparedStmtList, searchRequest.getPagination(), preparedStmtArgList);
                log.info("Post Pagination Query :: {}", diaryActivityQuery);

            }

            if (preparedStmtList.size() != preparedStmtArgList.size()) {
                log.info("Arg size :: {}, and ArgType size :: {}", preparedStmtList.size(), preparedStmtArgList.size());
                throw new CustomException(DIARY_ENTRY_QUERY_EXCEPTION, "Arg and ArgType size mismatch ");
            }

            return jdbcTemplate.query(diaryActivityQuery, preparedStmtList.toArray(), preparedStmtArgList.stream().mapToInt(Integer::intValue).toArray(), diaryActivityRowMapper);

        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error while fetching diary entries");
            throw new CustomException(DIARY_ENTRY_SEARCH_EXCEPTION, "Error occurred while retrieving data from the database");
        }
    }

    public Integer getTotalCount(String baseQuery, List<Object> preparedStmtList) {
        String countQuery = queryBuilder.getTotalCountQuery(baseQuery);
        log.info("Final count query :: {}", countQuery);
        return jdbcTemplate.queryForObject(countQuery, Integer.class, preparedStmtList.toArray());
    }
}
