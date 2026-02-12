package org.pucar.dristi.repository;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.queryBuilder.ApplicationQueryBuilder;
import org.pucar.dristi.repository.rowMapper.ApplicationRowMapper;
import org.pucar.dristi.repository.rowMapper.DocumentRowMapper;
import org.pucar.dristi.util.CaseUtil;
import org.pucar.dristi.web.models.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.*;

import static org.pucar.dristi.config.ServiceConstants.*;

@Slf4j
@Repository
public class ApplicationRepository {
    private final ApplicationQueryBuilder queryBuilder;
    private final JdbcTemplate jdbcTemplate;
    private final ApplicationRowMapper rowMapper;
    private final DocumentRowMapper documentRowMapper;
    private final CaseUtil caseUtil;
    private final Configuration config;
    private final ObjectMapper mapper;

    @Autowired
    public ApplicationRepository(
            ApplicationQueryBuilder queryBuilder,
            JdbcTemplate jdbcTemplate,
            ApplicationRowMapper rowMapper,
            DocumentRowMapper documentRowMapper,
            CaseUtil caseUtil,
            Configuration config,
            ObjectMapper mapper) {
        this.queryBuilder = queryBuilder;
        this.jdbcTemplate = jdbcTemplate;
        this.rowMapper = rowMapper;
        this.documentRowMapper = documentRowMapper;
        this.caseUtil = caseUtil;
        this.config = config;
        this.mapper = mapper;
    }

    public List<Application> getApplications(ApplicationSearchRequest applicationSearchRequest) {

        try {
            List<Application> applicationList = new ArrayList<>();
            List<Object> preparedStmtList = new ArrayList<>();
            List<Integer> preparedStmtArgList = new ArrayList<>();

            List<Object> preparedStmtListDoc;

            // TODO : remove this, this is temporary fix (#5016)
            String asUser = applicationSearchRequest.getCriteria().getAsUser();

            String applicationQuery = queryBuilder.getApplicationSearchQuery(applicationSearchRequest.getCriteria(), preparedStmtList,preparedStmtArgList, asUser, applicationSearchRequest.getRequestInfo());
            applicationQuery = queryBuilder.addOrderByQuery(applicationQuery, applicationSearchRequest.getPagination());
            log.info("Final application search query: {}", applicationQuery);
            if(applicationSearchRequest.getPagination() !=  null) {
                Integer totalRecords = getTotalCountApplication(applicationQuery, preparedStmtList);
                log.info("Total count without pagination :: {}", totalRecords);
                applicationSearchRequest.getPagination().setTotalCount(Double.valueOf(totalRecords));
                applicationQuery = queryBuilder.addPaginationQuery(applicationQuery, applicationSearchRequest.getPagination(), preparedStmtList,preparedStmtArgList);
            }
            if(preparedStmtList.size()!=preparedStmtArgList.size()){
                log.info("Arg size :: {}, and ArgType size :: {}", preparedStmtList.size(),preparedStmtArgList.size());
                throw new CustomException(APPLICATION_SEARCH_ERR, "Arg and ArgType size mismatch");
            }
            List<Application> list = jdbcTemplate.query(applicationQuery, preparedStmtList.toArray(),preparedStmtArgList.stream().mapToInt(Integer::intValue).toArray(), rowMapper);
            log.info("DB application list :: {}", list);
            if (list != null) {
                applicationList.addAll(list);
            }

            List<String> ids = new ArrayList<>();
            for (Application application : applicationList) {
                ids.add(application.getId().toString());
            }
            if (ids.isEmpty()) {
                return applicationList;
            }

            String documentQuery = "";
            preparedStmtListDoc = new ArrayList<>();

            List<Integer> preparedStmtArgListDoc = new ArrayList<>();
            documentQuery = queryBuilder.getDocumentSearchQuery(ids, preparedStmtListDoc,preparedStmtArgListDoc);
            log.info("Final document query: {}", documentQuery);
            if(preparedStmtListDoc.size()!=preparedStmtArgListDoc.size()){
                log.info("Doc Arg size :: {}, and ArgType size :: {}", preparedStmtListDoc.size(),preparedStmtArgListDoc.size());
                throw new CustomException(APPLICATION_SEARCH_ERR, "Arg and ArgType size mismatch for document search");
            }
            Map<UUID, List<Document>> documentMap = jdbcTemplate.query(documentQuery, preparedStmtListDoc.toArray(),preparedStmtArgListDoc.stream().mapToInt(Integer::intValue).toArray(), documentRowMapper);
            log.info("DB document map :: {}", documentMap);
            if (documentMap != null) {
                applicationList.forEach(application -> {
                    application.setDocuments(documentMap.get(application.getId()));
                });
            }
            return applicationList;
        }
        catch (CustomException e){
            throw e;
        }
        catch (Exception e){
            log.error("Error while fetching application list {}", e.getMessage());
            throw new CustomException(APPLICATION_SEARCH_ERR,"Error while fetching application list: "+e.getMessage());
        }
    }

    // TODO : remove this, this is temporary fix (#5016)
    private String getCitizenUserUuid(ApplicationSearchRequest applicationSearchRequest) {
        String userUuid = null;
        if (applicationSearchRequest.getRequestInfo() != null
                && applicationSearchRequest.getRequestInfo().getUserInfo() != null
                && applicationSearchRequest.getRequestInfo().getUserInfo().getUuid() != null) {
            boolean isCitizen = CITIZEN_LOWER.equalsIgnoreCase(applicationSearchRequest.getRequestInfo().getUserInfo().getType());
            if (isCitizen) {
                userUuid = applicationSearchRequest.getRequestInfo().getUserInfo().getUuid();
            }
        }
        return userUuid;
    }

    public Integer getTotalCountApplication(String baseQuery, List<Object> preparedStmtList) {
        String countQuery = queryBuilder.getTotalCountQuery(baseQuery);
        log.info("Final count query :: {}", countQuery);
        return jdbcTemplate.queryForObject(countQuery, Integer.class, preparedStmtList.toArray());
    }

    public List<ApplicationExists> checkApplicationExists(List<ApplicationExists> applicationExistsList) {
        try {
            for (ApplicationExists applicationExist : applicationExistsList) {
                if ((applicationExist.getFilingNumber() == null || applicationExist.getFilingNumber().isEmpty()) &&
                        (applicationExist.getCnrNumber() == null || applicationExist.getCnrNumber().isEmpty()) &&
                        (applicationExist.getApplicationNumber() == null || applicationExist.getApplicationNumber().isEmpty()) )
                {
                    applicationExist.setExists(false);
                } else {
                    List<Object> preparedStmtList = new ArrayList<>();
                    String applicationExistQuery = queryBuilder.checkApplicationExistQuery(applicationExist.getFilingNumber(), applicationExist.getCnrNumber(), applicationExist.getApplicationNumber(), preparedStmtList);
                    log.info("Final application exist query: {}", applicationExistQuery);
                    Integer count = jdbcTemplate.queryForObject(applicationExistQuery, Integer.class, preparedStmtList.toArray());
                    applicationExist.setExists(count != null && count > 0);
                }
            }
            return applicationExistsList;
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error while checking application exist");
            throw new CustomException(APPLICATION_EXIST_EXCEPTION, "Custom exception while checking application exist : " + e.getMessage());
        }
    }
}
