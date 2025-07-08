package digit.repository.queryBuilder;

import digit.web.models.SuretySearchCriteria;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.stereotype.Component;

import java.sql.Types;
import java.util.List;
import java.util.stream.Collectors;

import static digit.config.ServiceConstants.*;

@Component
@Slf4j
public class SuretyQueryBuilder {

    private static final String BASE_SURETY_QUERY =
            " SELECT surety.id as id, surety.tenantid as tenantid, surety.caseid as caseid, surety.bailid as bailid, surety.mobilenumber as mobilenumber, " +
                    " surety.additionaldetails as additionaldetails, surety.address as address, surety.name as name, surety.fathername as fathername, surety.hassigned as hassigned, surety.isactive as isactive, surety.email as email," +
                    " surety.createdby as createdby, surety.lastmodifiedby as lastmodifiedby, surety.createdtime as createdtime, surety.lastmodifiedtime as lastmodifiedtime ";

    private static final String DOCUMENT_SELECT_QUERY = "SELECT doc.id as id, doc.documenttype as documenttype, doc.filestore as filestore," +
            "doc.documentuid as documentuid, doc.additionaldetails as additionaldetails, doc.surety_id as surety_id, doc.isactive as isactive";

    private static final String FROM_DOCUMENTS_TABLE = " FROM dristi_surety_document doc";

    private static final String FROM_SURETY_TABLE = " FROM dristi_surety surety";


    public String getSuretySearchQuery(SuretySearchCriteria suretyCriteria, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {
        try {
            StringBuilder query = new StringBuilder(BASE_SURETY_QUERY);
            query.append(FROM_SURETY_TABLE);

            boolean firstCriteria = true; // To check if it's the first criteria
            firstCriteria = addCriteria(suretyCriteria.getTenantId(), query, firstCriteria, "surety.tenantId = ? ", preparedStmtList, preparedStmtArgList);
            addIdCriteria(suretyCriteria.getIds(), query, firstCriteria, "surety.id IN ", preparedStmtList, preparedStmtArgList);
            return query.toString();
        } catch (Exception e) {
            log.error("Error while building surety search query {}", e.getMessage());
            throw new CustomException(SURETY_SEARCH_QUERY_EXCEPTION, "Error occurred while building the surety search query: " + e.getMessage());
        }
    }

    boolean addCriteria(String criteria, StringBuilder query, boolean firstCriteria, String str, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {
        if (criteria != null && !criteria.isEmpty()) {
            addClauseIfRequired(query, firstCriteria);
            query.append(str);
            preparedStmtList.add(criteria);
            preparedStmtArgList.add(Types.VARCHAR);
            firstCriteria = false;
        }
        return firstCriteria;
    }

    void addIdCriteria(List<String> ids, StringBuilder query, boolean firstCriteria, String str, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {
        if (ids != null && !ids.isEmpty()) {
            addClauseIfRequired(query, firstCriteria);
            query.append(str);
            query.append(" (")
                    .append(ids.stream().map(id -> "?").collect(Collectors.joining(",")))
                    .append(")");
            preparedStmtList.addAll(ids);
            ids.forEach(i -> preparedStmtArgList.add(Types.VARCHAR));
            firstCriteria = false;
        }
    }

    private void addClauseIfRequired(StringBuilder query, boolean isFirstCriteria) {
        if (isFirstCriteria) {
            query.append(" WHERE ");
        } else {
            query.append(" AND ");
        }
    }

    public String getDocumentSearchQuery(List<String> ids, List<Object> preparedStmtList, List<Integer> preparedStmtArgListDoc) {
        try {
            StringBuilder query = new StringBuilder(DOCUMENT_SELECT_QUERY);
            query.append(FROM_DOCUMENTS_TABLE);
            if (!ids.isEmpty()) {
                query.append(" WHERE doc.isactive = true AND doc.surety_id IN (")
                        .append(ids.stream().map(id -> "?").collect(Collectors.joining(",")))
                        .append(")");
                preparedStmtList.addAll(ids);
                ids.forEach(i -> preparedStmtArgListDoc.add(Types.VARCHAR));
            }

            return query.toString();
        } catch (Exception e) {
            log.error("Error while building document search query {}", e.getMessage());
            throw new CustomException(DOCUMENT_SEARCH_QUERY_EXCEPTION, "Error occurred while building the query: " + e.getMessage());
        }
    }

}


