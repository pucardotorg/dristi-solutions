package digit.repository;

import digit.repository.querybuilder.BailQueryBuilder;
import digit.repository.rowmapper.BailRowMapper;
import digit.web.models.Bail;
import digit.web.models.BailSearchCriteria;
import digit.web.models.BailSearchRequest;
import digit.web.models.Pagination;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Repository
@Slf4j
public class BailRepository {

    private final BailQueryBuilder queryBuilder;
    private final JdbcTemplate jdbcTemplate;
    private final BailRowMapper rowMapper;

    @Autowired
    public BailRepository(BailQueryBuilder queryBuilder, JdbcTemplate jdbcTemplate, BailRowMapper rowMapper) {
        this.queryBuilder = queryBuilder;
        this.jdbcTemplate = jdbcTemplate;
        this.rowMapper = rowMapper;
    }

    public List<Bail> checkBailExists(RequestInfo requestInfo, Bail bail) {
        BailSearchCriteria criteria = BailSearchCriteria.builder()
                .bailId(bail.getId())
                .tenantId(bail.getTenantId())
                .build();
        Pagination pagination = Pagination.builder().limit(1.0).offSet(0.0).build();
        BailSearchRequest bailSearchRequest = BailSearchRequest.builder()
                .requestInfo(requestInfo)
                .criteria(criteria)
                .pagination(pagination)
                .build();
        return getBails(bailSearchRequest);
    }

    public List<Bail> getBails(BailSearchRequest bailSearchRequest) {

        try {
            List<Bail> applicationList = new ArrayList<>();
            List<Object> preparedStmtList = new ArrayList<>();
            List<Integer> preparedStmtArgList = new ArrayList<>();

            String bailQuery = queryBuilder.getBailSearchQuery(bailSearchRequest.getCriteria(), preparedStmtList,preparedStmtArgList);
            bailQuery = queryBuilder.addOrderByQuery(bailQuery, bailSearchRequest.getPagination());
            log.info("Bail search query before pagination :: {}", bailQuery);
            if(bailSearchRequest.getPagination() !=  null) {
                Integer totalRecords = getTotalCountBail(bailQuery, preparedStmtList);
                log.info("Total count without pagination :: {}", totalRecords);
                bailSearchRequest.getPagination().setTotalCount(Double.valueOf(totalRecords));
                bailQuery = queryBuilder.addPaginationQuery(bailQuery, bailSearchRequest.getPagination(), preparedStmtList,preparedStmtArgList);
            }
            if(preparedStmtList.size()!=preparedStmtArgList.size()){
                log.info("Arg size :: {}, and ArgType size :: {}", preparedStmtList.size(),preparedStmtArgList.size());
                throw new CustomException("BAIL_SEARCH_ERR", "Arg and ArgType size mismatch");
            }
            List<Bail> list = jdbcTemplate.query(bailQuery, preparedStmtList.toArray(),preparedStmtArgList.stream().mapToInt(Integer::intValue).toArray(), rowMapper);
            log.info("DB bail list :: {}", list);
            if (list != null) {
                applicationList.addAll(list);
            }
            return applicationList;
        }
        catch (CustomException e){
            throw e;
        }
        catch (Exception e){
            log.error("Error while fetching bail list {}", e.getMessage());
            throw new CustomException("BAIL_SEARCH_ERR","Error while fetching bail list: "+e.getMessage());
        }
    }

    public Integer getTotalCountBail(String baseQuery, List<Object> preparedStmtList) {
        String countQuery = queryBuilder.getTotalCountQuery(baseQuery);
        log.info("Final count query :: {}", countQuery);
        return jdbcTemplate.queryForObject(countQuery, Integer.class, preparedStmtList.toArray());
    }
}
