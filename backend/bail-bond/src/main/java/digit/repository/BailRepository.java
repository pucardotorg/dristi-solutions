package digit.repository;

import digit.repository.querybuilder.BailQueryBuilder;
import digit.repository.rowmapper.BailDocumentRowMapper;
import digit.repository.rowmapper.BailRowMapper;
import digit.repository.rowmapper.SuretyRowMapper;
import digit.util.SuretyUtil;
import digit.web.models.*;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import static digit.config.ServiceConstants.BAIL_SEARCH_EXCEPTION;

import java.util.*;
import java.util.stream.Collectors;

@Repository
@Slf4j
public class BailRepository {

    private final BailQueryBuilder queryBuilder;
    private final BailRowMapper rowMapper;
    private final BailDocumentRowMapper bailDocumentRowMapper;
    private final SuretyRowMapper suretyRowMapper;
    private final JdbcTemplate readerJdbcTemplate;
    private final SuretyUtil suretyUtil;

    @Autowired
    public BailRepository(
            BailQueryBuilder queryBuilder,
            BailRowMapper rowMapper,
            BailDocumentRowMapper bailDocumentRowMapper,
            SuretyRowMapper suretyRowMapper,
            JdbcTemplate readerJdbcTemplate,
            SuretyUtil suretyUtil
    ) {
        this.queryBuilder = queryBuilder;
        this.rowMapper = rowMapper;
        this.bailDocumentRowMapper = bailDocumentRowMapper;
        this.suretyRowMapper = suretyRowMapper;
        this.readerJdbcTemplate = readerJdbcTemplate;
        this.suretyUtil = suretyUtil;
    }

    public List<Bail> getBails(BailSearchRequest bailSearchRequest) {
        try {
            List<Bail> bailList = new ArrayList<>();
            List<Object> preparedStmtList = new ArrayList<>();
            List<Integer> preparedStmtArgList = new ArrayList<>();

            List<Object> preparedStmtListDoc = new ArrayList<>();
            List<Integer> preparedStmtListArgDoc = new ArrayList<>();
            String tenantId = bailSearchRequest.getCriteria().get(0).getTenantId();;

            // Build the main bail query
            String bailQuery = queryBuilder.getBailSearchQuery(preparedStmtList, bailSearchRequest.getCriteria(), preparedStmtArgList);

            bailQuery = queryBuilder.addOrderByQuery(bailQuery, bailSearchRequest.getPagination());
            log.info("Bail list query: {}", bailQuery);

            // Handle pagination and total count
            if (bailSearchRequest.getPagination() != null) {
                Integer totalRecords = getTotalCountBail(bailQuery, preparedStmtList);
                log.info("Total count without pagination :: {}", totalRecords);
                bailSearchRequest.getPagination().setTotalCount(Double.valueOf(totalRecords));
                bailQuery = queryBuilder.addPaginationQuery(bailQuery, bailSearchRequest.getPagination(), preparedStmtList, preparedStmtArgList);
                log.info("Post Pagination Query :: {}", bailQuery);
            }

            // Argument size check
            if (preparedStmtList.size() != preparedStmtArgList.size()) {
                log.info("Arg size :: {}, and ArgType size :: {}", preparedStmtList.size(), preparedStmtArgList.size());
                throw new CustomException(BAIL_SEARCH_EXCEPTION, "Arg and ArgType size mismatch");
            }

            // Fetch bails
            List<Bail> list = readerJdbcTemplate.query(
                    bailQuery,
                    preparedStmtList.toArray(),
                    preparedStmtArgList.stream().mapToInt(Integer::intValue).toArray(),
                    rowMapper
            );
            if (list != null) {
                bailList.addAll(list);
            }

            // Collect bail IDs
            List<String> ids = bailList.stream().map(Bail::getId).collect(Collectors.toList());
            if (ids.isEmpty()) {
                return bailList;
            }

            // Build and execute document query
            String bailDocumentQuery = queryBuilder.getDocumentSearchQuery(ids, preparedStmtListDoc, preparedStmtListArgDoc);
            log.info("Final document query: {}", bailDocumentQuery);
            if (preparedStmtListDoc.size() != preparedStmtListArgDoc.size()) {
                log.info("Doc Arg size :: {}, and ArgType size :: {}", preparedStmtListDoc.size(), preparedStmtListArgDoc.size());
                throw new CustomException(BAIL_SEARCH_EXCEPTION, "Arg and ArgType size mismatch for document search");
            }

            Map<String, List<Document>> bailDocumentMap = readerJdbcTemplate.query(
                    bailDocumentQuery,
                    preparedStmtListDoc.toArray(),
                    preparedStmtListArgDoc.stream().mapToInt(Integer::intValue).toArray(),
                    bailDocumentRowMapper
            );
            if (bailDocumentMap != null) {
                bailList.forEach(bail -> bail.setDocuments(bailDocumentMap.get(bail.getId())));
            }

            // --- Fetch sureties for all bails and set ---
            if (!ids.isEmpty()) {
                // Use suretyUtil to fetch sureties by bailIds
                SuretySearchCriteria suretySearchCriteria = new SuretySearchCriteria();
                suretySearchCriteria.setTenantId(tenantId);
                suretySearchCriteria.setBailIds(ids);

                List<Surety> sureties = suretyUtil.searchSuretiesByCriteria(suretySearchCriteria, bailSearchRequest.getRequestInfo());
                Map<String, List<Surety>> suretyMap = sureties.stream()
                        .collect(Collectors.groupingBy(Surety::getBailId));
                bailList.forEach(bail -> bail.setSureties(suretyMap.getOrDefault(bail.getId(), new ArrayList<>())));
            }

            return bailList;
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error while fetching bail application list");
            throw new CustomException(BAIL_SEARCH_EXCEPTION, "Error while fetching bail application list: " + e.getMessage());
        }
    }

    public Integer getTotalCountBail(String baseQuery, List<Object> preparedStmtList) {
        String countQuery = queryBuilder.getTotalCountQuery(baseQuery);
        log.info("Final count query :: {}", countQuery);
        return readerJdbcTemplate.queryForObject(countQuery, Integer.class, preparedStmtList.toArray());
    }

    public List<Bail> checkBailExist(Bail bail) {
        BailCriteria criteria = BailCriteria.builder()
                .id(bail.getId())
                .tenantId(bail.getTenantId())
                .build();

        Pagination pagination = Pagination.builder()
                .limit(1.0)
                .offSet(0.0)
                .build();

        BailSearchRequest bailSearchRequest = BailSearchRequest.builder()
                .criteria(List.of(criteria))
                .pagination(pagination)
                .build();

        return getBails(bailSearchRequest);
    }
}
