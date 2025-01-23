package digit.repository;

import digit.repository.querybuilder.DiaryQueryBuilder;
import digit.repository.rowmapper.DiaryRowMapper;
import digit.web.models.CaseDiaryListItem;
import digit.web.models.CaseDiarySearchRequest;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

import static digit.config.ServiceConstants.*;

@Repository
@Slf4j
public class DiaryRepository {

    private final DiaryQueryBuilder queryBuilder;

    private final JdbcTemplate jdbcTemplate;

    private final DiaryRowMapper diaryRowMapper;

    public DiaryRepository(DiaryQueryBuilder queryBuilder, JdbcTemplate jdbcTemplate, DiaryRowMapper diaryRowMapper) {
        this.queryBuilder = queryBuilder;
        this.jdbcTemplate = jdbcTemplate;
        this.diaryRowMapper = diaryRowMapper;
    }

    public List<CaseDiaryListItem> getCaseDiaries(CaseDiarySearchRequest searchRequest) {

        try {

            List<Object> preparedStmtList = new ArrayList<>();
            List<Integer> preparedStmtArgList = new ArrayList<>();

            String caseDiaryQuery = queryBuilder.getCaseDiaryQuery(searchRequest.getCriteria(), preparedStmtList, preparedStmtArgList);
            caseDiaryQuery = queryBuilder.addOrderByQuery(caseDiaryQuery, searchRequest.getPagination());
            log.info("Case Diary query : {} ", caseDiaryQuery);

            if (searchRequest.getPagination() != null) {

                Integer totalRecords = getTotalCount(caseDiaryQuery, preparedStmtList);
                log.info("Total count without pagination :: {}", totalRecords);
                searchRequest.getPagination().setTotalCount(Double.valueOf(totalRecords));
                caseDiaryQuery = queryBuilder.addPaginationQuery(caseDiaryQuery, preparedStmtList, searchRequest.getPagination(), preparedStmtArgList);
                log.info("Post Pagination Query :: {}", caseDiaryQuery);

            }

            if (preparedStmtList.size() != preparedStmtArgList.size()) {
                log.info("Arg size :: {}, and ArgType size :: {}", preparedStmtList.size(), preparedStmtArgList.size());
                throw new CustomException(DIARY_QUERY_EXCEPTION, "Arg and ArgType size mismatch ");
            }

            return jdbcTemplate.query(caseDiaryQuery, preparedStmtList.toArray(), preparedStmtArgList.stream().mapToInt(Integer::intValue).toArray(), diaryRowMapper);

        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error while fetching diary entries");
            throw new CustomException(DIARY_SEARCH_EXCEPTION, "Error occurred while retrieving data from the database");
        }
    }

    public Integer getTotalCount(String baseQuery, List<Object> preparedStmtList) {
        String countQuery = queryBuilder.getTotalCountQuery(baseQuery);
        log.info("Final count query :: {}", countQuery);
        return jdbcTemplate.queryForObject(countQuery, Integer.class, preparedStmtList.toArray());
    }
}
