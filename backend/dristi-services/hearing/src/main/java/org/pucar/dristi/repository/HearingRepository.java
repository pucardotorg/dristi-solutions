package org.pucar.dristi.repository;

import lombok.extern.slf4j.Slf4j;

import org.egov.tracer.model.CustomException;
import org.pucar.dristi.repository.querybuilder.HearingQueryBuilder;
import org.pucar.dristi.repository.rowmapper.HearingDocumentRowMapper;
import org.pucar.dristi.repository.rowmapper.HearingRowMapper;
import org.pucar.dristi.web.models.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.*;

import static org.pucar.dristi.config.ServiceConstants.*;


@Slf4j
@Repository
public class HearingRepository {

    private final HearingQueryBuilder queryBuilder;

    private final HearingRowMapper rowMapper;

    private final HearingDocumentRowMapper hearingDocumentRowMapper;

    private final JdbcTemplate writerJdbcTemplate;

    private final JdbcTemplate readerJdbcTemplate;

    @Autowired
    public HearingRepository(HearingQueryBuilder queryBuilder, HearingRowMapper rowMapper, HearingDocumentRowMapper hearingDocumentRowMapper, @Qualifier("writerJdbcTemplate") JdbcTemplate writerJdbcTemplate, @Qualifier("readerJdbcTemplate") JdbcTemplate readerJdbcTemplate) {
        this.queryBuilder = queryBuilder;
        this.rowMapper = rowMapper;
        this.hearingDocumentRowMapper = hearingDocumentRowMapper;
        this.writerJdbcTemplate = writerJdbcTemplate;
        this.readerJdbcTemplate = readerJdbcTemplate;
    }


    public List<Hearing> getHearings(HearingSearchRequest hearingSearchRequest) {

        try {
            List<Hearing> hearingList = new ArrayList<>();
            List<Object> preparedStmtList = new ArrayList<>();
            List<Integer> preparedStmtArgList = new ArrayList<>();

            List<Object> preparedStmtListDoc = new ArrayList<>();
            List<Integer> preparedStmtListArgDoc = new ArrayList<>();
            String hearingQuery;
            hearingQuery = queryBuilder.getHearingSearchQuery(preparedStmtList, hearingSearchRequest.getCriteria(),preparedStmtArgList);
            hearingQuery = queryBuilder.addOrderByQuery(hearingQuery, hearingSearchRequest.getPagination());
            log.info("Hearing list query: {}", hearingQuery);

            if(hearingSearchRequest.getPagination() !=  null) {
                Integer totalRecords = getTotalCountHearing(hearingQuery, preparedStmtList);
                log.info("Total count without pagination :: {}", totalRecords);
                hearingSearchRequest.getPagination().setTotalCount(Double.valueOf(totalRecords));
                hearingQuery = queryBuilder.addPaginationQuery(hearingQuery, hearingSearchRequest.getPagination(), preparedStmtList,preparedStmtArgList);
                log.info("Post Pagination Query :: {}", hearingQuery);
            }
            if(preparedStmtList.size()!=preparedStmtArgList.size()){
                log.info("Arg size :: {}, and ArgType size :: {}", preparedStmtList.size(),preparedStmtArgList.size());
                throw new CustomException(HEARING_SEARCH_EXCEPTION, "Arg and ArgType size mismatch");
            }
            List<Hearing> list = readerJdbcTemplate.query(hearingQuery, preparedStmtList.toArray(),preparedStmtArgList.stream().mapToInt(Integer::intValue).toArray(), rowMapper);
            if (list != null) {
                hearingList.addAll(list);
            }

            List<String> ids = new ArrayList<>();
            for (Hearing hearing : hearingList) {
                ids.add(hearing.getId().toString());
            }
            if (ids.isEmpty()) {
                return hearingList;
            }

            String hearingDocumentQuery;
            hearingDocumentQuery = queryBuilder.getDocumentSearchQuery(ids, preparedStmtListDoc,preparedStmtListArgDoc);
            log.info("Final document query: {}", hearingDocumentQuery);
            if(preparedStmtListDoc.size()!=preparedStmtListArgDoc.size()){
                log.info("Doc Arg size :: {}, and ArgType size :: {}", preparedStmtListDoc.size(),preparedStmtListArgDoc.size());
                throw new CustomException(HEARING_SEARCH_EXCEPTION, "Arg and ArgType size mismatch for document search");
            }
            Map<UUID, List<Document>> hearingDocumentMap = readerJdbcTemplate.query(hearingDocumentQuery, preparedStmtListDoc.toArray(),preparedStmtListArgDoc.stream().mapToInt(Integer::intValue).toArray(), hearingDocumentRowMapper);
            if (hearingDocumentMap != null) {
                hearingList.forEach(hearing -> hearing.setDocuments(hearingDocumentMap.get(hearing.getId())));
            }

            return hearingList;
        }
        catch (CustomException e){
            throw e;
        }
        catch (Exception e){
            log.error("Error while fetching hearing application list");
            throw new CustomException(HEARING_SEARCH_EXCEPTION,"Error while fetching hearing application list: "+e.getMessage());
        }
    }

    public Integer getTotalCountHearing(String baseQuery, List<Object> preparedStmtList) {
        String countQuery = queryBuilder.getTotalCountQuery(baseQuery);
        log.info("Final count query :: {}", countQuery);
        return readerJdbcTemplate.queryForObject(countQuery,Integer.class, preparedStmtList.toArray());
    }

    public List<Hearing> checkHearingsExist(Hearing hearing) {
        HearingCriteria criteria = HearingCriteria.builder().hearingId(hearing.getHearingId()).tenantId(hearing.getTenantId()).build();
        Pagination pagination = Pagination.builder().limit(1.0).offSet((double) 0).build();
        HearingSearchRequest hearingSearchRequest = HearingSearchRequest.builder().criteria(criteria).pagination(pagination).build();
        return getHearings(hearingSearchRequest);
    }

    public void updateTranscriptAdditionalAttendees(Hearing hearing) {
        List<Object> preparedStmtList = new ArrayList<>();
        String hearingUpdateQuery = queryBuilder.buildUpdateTranscriptAdditionalAttendeesQuery(preparedStmtList, hearing);
        log.info("Final update query: {}", hearingUpdateQuery);
        int check = writerJdbcTemplate.update(hearingUpdateQuery, preparedStmtList.toArray());
        if(check==0) throw new CustomException(HEARING_UPDATE_EXCEPTION,"Error while updating hearing");
    }

    public List<Hearing> getHearingsWithMultipleHearings() {
        String sql = "SELECT * FROM dristi_hearing WHERE filingNumber->>0 IN (SELECT filingNumber->>0 FROM dristi_hearing GROUP BY filingNumber->>0 HAVING COUNT(*) > 1) ORDER BY filingNumber->>0, createdTime;";
        return readerJdbcTemplate.query(sql, rowMapper);
    }
}
