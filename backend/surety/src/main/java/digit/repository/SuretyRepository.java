package digit.repository;

import digit.repository.queryBuilder.SuretyQueryBuilder;
import digit.repository.rowMapper.DocumentRowMapper;
import digit.repository.rowMapper.SuretyRowMapper;
import digit.web.models.Document;
import digit.web.models.Surety;
import digit.web.models.SuretySearchRequest;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static digit.config.ServiceConstants.SURETY_SEARCH_ERR;

@Slf4j
@Repository
public class SuretyRepository {

    private final SuretyQueryBuilder queryBuilder;
    private final JdbcTemplate jdbcTemplate;
    private final SuretyRowMapper rowMapper;
    private final DocumentRowMapper documentRowMapper;

    @Autowired
    public SuretyRepository(SuretyQueryBuilder queryBuilder, JdbcTemplate jdbcTemplate, SuretyRowMapper rowMapper, DocumentRowMapper documentRowMapper){
        this.queryBuilder = queryBuilder;
        this.jdbcTemplate = jdbcTemplate;
        this.rowMapper = rowMapper;
        this.documentRowMapper = documentRowMapper;
    }

    public List<Surety> getSureties(SuretySearchRequest suretySearchRequest) {

        try {
            List<Object> preparedStmtList = new ArrayList<>();
            List<Integer> preparedStmtArgList = new ArrayList<>();

            List<Object> preparedStmtListDoc;

            String suretyQuery = queryBuilder.getSuretySearchQuery(suretySearchRequest.getCriteria(), preparedStmtList,preparedStmtArgList);
            if(preparedStmtList.size()!=preparedStmtArgList.size()){
                log.info("Arg size :: {}, and ArgType size :: {}", preparedStmtList.size(),preparedStmtArgList.size());
                throw new CustomException(SURETY_SEARCH_ERR, "Arg and ArgType size mismatch");
            }
            List<Surety> suretyList = jdbcTemplate.query(suretyQuery, preparedStmtList.toArray(),preparedStmtArgList.stream().mapToInt(Integer::intValue).toArray(), rowMapper);
            if(suretyList==null || suretyList.isEmpty()){
                log.info("No surety found in DB");
                return new ArrayList<>();
            }
            log.info("DB surety list size:: {}", suretyList.size());

            List<String> ids = new ArrayList<>();
            for (Surety surety : suretyList) {
                ids.add(surety.getId());
            }
            if (ids.isEmpty()) {
                return suretyList;
            }

            String documentQuery = "";
            preparedStmtListDoc = new ArrayList<>();

            List<Integer> preparedStmtArgListDoc = new ArrayList<>();
            documentQuery = queryBuilder.getDocumentSearchQuery(ids, preparedStmtListDoc,preparedStmtArgListDoc);
            log.info("Final document query: {}", documentQuery);
            if(preparedStmtListDoc.size()!=preparedStmtArgListDoc.size()){
                log.info("Doc Arg size :: {}, and ArgType size :: {}", preparedStmtListDoc.size(),preparedStmtArgListDoc.size());
                throw new CustomException(SURETY_SEARCH_ERR, "Arg and ArgType size mismatch for document search");
            }
            Map<String, List<Document>> documentMap = jdbcTemplate.query(documentQuery, preparedStmtListDoc.toArray(),preparedStmtArgListDoc.stream().mapToInt(Integer::intValue).toArray(), documentRowMapper);
            log.info("DB document map :: {}", documentMap);
            if (documentMap != null) {
                suretyList.forEach(surety -> {
                    surety.setDocuments(documentMap.get(surety.getId()));
                });
            }
            return suretyList;
        }
        catch (CustomException e){
            throw e;
        }
        catch (Exception e){
            log.error("Error while fetching application list {}", e.getMessage());
            throw new CustomException(SURETY_SEARCH_ERR,"Error while fetching application list: "+e.getMessage());
        }
    }
}