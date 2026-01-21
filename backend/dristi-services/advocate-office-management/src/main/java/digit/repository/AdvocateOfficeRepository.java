package digit.repository;

import digit.repository.querybuilder.AdvocateOfficeQueryBuilder;
import digit.repository.rowmapper.AdvocateOfficeRowMapper;
import digit.web.models.AddMember;
import digit.web.models.MemberSearchCriteria;
import digit.web.models.Pagination;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Repository
public class AdvocateOfficeRepository {

    private final AdvocateOfficeQueryBuilder queryBuilder;
    private final JdbcTemplate jdbcTemplate;
    private final AdvocateOfficeRowMapper rowMapper;

    @Autowired
    public AdvocateOfficeRepository(AdvocateOfficeQueryBuilder queryBuilder, JdbcTemplate jdbcTemplate, AdvocateOfficeRowMapper rowMapper) {
        this.queryBuilder = queryBuilder;
        this.jdbcTemplate = jdbcTemplate;
        this.rowMapper = rowMapper;
    }

    public List<AddMember> getMembers(MemberSearchCriteria criteria, Pagination pagination) {
        try {
            List<AddMember> memberList = new ArrayList<>();
            List<Object> preparedStmtList = new ArrayList<>();
            List<Integer> preparedStmtArgList = new ArrayList<>();

            String memberQuery = queryBuilder.getMemberSearchQuery(criteria, preparedStmtList, preparedStmtArgList);

            if (preparedStmtList.size() != preparedStmtArgList.size()) {
                log.info("Arg size :: {}, and ArgType size :: {}", preparedStmtList.size(), preparedStmtArgList.size());
                throw new CustomException("SEARCH_MEMBER_ERR", "Args and ArgTypes size mismatch");
            }

            memberQuery = queryBuilder.addOrderByQuery(memberQuery, pagination);
            log.info("Final member query :: {}", memberQuery);

            if (pagination != null) {
                Integer totalRecords = getTotalCount(memberQuery, preparedStmtList);
                log.info("Total count without pagination :: {}", totalRecords);
                pagination.setTotalCount(Double.valueOf(totalRecords));
                memberQuery = queryBuilder.addPaginationQuery(memberQuery, pagination, preparedStmtList, preparedStmtArgList);
            }

            List<AddMember> list = jdbcTemplate.query(memberQuery, preparedStmtList.toArray(), preparedStmtArgList.stream().mapToInt(Integer::intValue).toArray(), rowMapper);
            log.info("DB member list :: {}", list);
            if (list != null) {
                memberList.addAll(list);
            }

            return memberList;

        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error while fetching member list :: {}", e.toString());
            throw new CustomException("SEARCH_MEMBER_ERR", "Exception while fetching member list: " + e.getMessage());
        }
    }

    public Integer getTotalCount(String baseQuery, List<Object> preparedStmtList) {
        String countQuery = queryBuilder.getTotalCountQuery(baseQuery);
        log.info("Final count query :: {}", countQuery);
        return jdbcTemplate.queryForObject(countQuery, Integer.class, preparedStmtList.toArray());
    }
}
