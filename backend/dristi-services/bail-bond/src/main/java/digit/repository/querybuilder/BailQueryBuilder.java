package digit.repository.querybuilder;

import digit.web.models.BailSearchCriteria;
import digit.web.models.Pagination;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.sql.Types;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Component
public class BailQueryBuilder {

    private static final String BASE_BAIL_QUERY =
            "SELECT " +
                    "bail.id as id,bail.bail_id as bailId, bail.tenant_id as bailTenantId, bail.case_id as caseId, bail.bail_type as bailType, " +
                    "bail.bail_amount as bailAmount, bail.bail_status as bailStatus, bail.court_id as courtId, " +
                    "bail.case_title as caseTitle, bail.case_number as caseNumber, bail.cnr_number as cnrNumber, " +
                    "bail.filing_number as filingNumber, bail.case_type as caseType, bail.litigant_id as litigantId, " +
                    "bail.litigant_name as litigantName, bail.litigant_father_name as litigantFatherName, " +
                    "bail.litigant_signed as litigantSigned, bail.litigant_mobile_number as litigantMobileNumber, " +
                    "bail.shortened_url as shortenedUrl, " +
                    "bail.additional_details as bailAdditionalDetails, bail.is_active as bailIsActive, " +
                    "bail.created_by as bailCreatedBy, bail.last_modified_by as bailLastModifiedBy, " +
                    "bail.created_time as bailCreatedTime, bail.last_modified_time as bailLastModifiedTime, " +
                    "bail.as_user as as_user, " +

                    "bail_doc.id as bailDocId, bail_doc.tenant_id as bailDocTenantId, bail_doc.bail_id as bailDocBailId, " +
                    "bail_doc.filestore_id as bailDocFilestoreId, bail_doc.document_uid as bailDocUid, " +
                    "bail_doc.document_name as bailDocName, bail_doc.document_type as bailDocType, " +
                    "bail_doc.additional_details as bailDocAdditionalDetails, bail_doc.is_active as bailDocIsActive, " +
                    "bail_doc.created_by as bailDocCreatedBy, bail_doc.last_modified_by as bailDocLastModifiedBy, " +
                    "bail_doc.created_time as bailDocCreatedTime, bail_doc.last_modified_time as bailDocLastModifiedTime, " +

                    "srt.id as suretyId, srt.tenant_id as suretyTenantId, srt.bail_id as suretyBailId, srt.case_id as suretyCaseId, " +
                    "srt.index as index, " +
                    "srt.surety_name as suretyName, srt.surety_father_name as suretyFatherName, srt.surety_signed as suretySigned, " +
                    "srt.surety_mobile_number as suretyMobile, srt.surety_email as suretyEmail, srt.surety_approved as suretyApproved, " +
                    "srt.surety_address as suretyAddress, srt.additional_details as suretyAdditionalDetails, srt.is_active as suretyIsActive, " +
                    "srt.created_by as suretyCreatedBy, srt.last_modified_by as suretyLastModifiedBy, " +
                    "srt.created_time as suretyCreatedTime, srt.last_modified_time as suretyLastModifiedTime, " +

                    "surety_doc.id as suretyDocId, surety_doc.tenant_id as suretyDocTenantId, surety_doc.surety_id as suretyDocSuretyId, " +
                    "surety_doc.filestore_id as suretyDocFilestoreId, surety_doc.document_uid as suretyDocUid, " +
                    "surety_doc.document_name as suretyDocName, surety_doc.document_type as suretyDocType, " +
                    "surety_doc.additional_details as suretyDocAdditionalDetails, surety_doc.is_active as suretyDocIsActive, " +
                    "surety_doc.created_by as suretyDocCreatedBy, surety_doc.last_modified_by as suretyDocLastModifiedBy, " +
                    "surety_doc.created_time as suretyDocCreatedTime, surety_doc.last_modified_time as suretyDocLastModifiedTime ";

    private static final String FROM_QUERY = " FROM dristi_bail bail" +
            " LEFT JOIN dristi_bail_document bail_doc ON bail.id = bail_doc.bail_id AND bail_doc.is_active = true " +
            " LEFT JOIN dristi_surety srt ON bail.id = srt.bail_id AND srt.is_active = true " +
            " LEFT JOIN dristi_surety_document surety_doc ON srt.id = surety_doc.surety_id AND surety_doc.is_active = true ";

    private static final String ORDER_BY_CLAUSE = " ORDER BY {orderBy} {sortingOrder} ";
    private static final String DEFAULT_ORDERBY_CLAUSE = " ORDER BY bail.created_time DESC ";


    public String getPaginatedBailIdsQuery(BailSearchCriteria criteria, Pagination pagination, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {
        StringBuilder query = new StringBuilder("SELECT DISTINCT(bail.id), bail.bail_id as bailId, bail.bail_type as bailType," +
                " bail.bail_status as bailStatus, bail.court_id as courtId, " +
                " bail.case_title as caseTitle, bail.case_number as caseNumber, bail.cnr_number as cnrNumber, " +
                " bail.filing_number as filingNumber, bail.case_type as caseType, bail.litigant_id as litigantId, " +
                " bail.litigant_name as litigantName, bail.litigant_father_name as litigantFatherName," +
                " bail.created_by as bailCreatedBy, bail.last_modified_by as bailLastModifiedBy, " +
                " bail.created_time as bailCreatedTime, bail.last_modified_time as bailLastModifiedTime ");
        query.append(FROM_QUERY);

        getWhereFields(criteria, query, preparedStmtList, preparedStmtArgList);
        query = new StringBuilder(addOrderByQuery(query.toString(), pagination));

        if (pagination != null) {
            query.append(" LIMIT ? OFFSET ?");
                preparedStmtList.add(pagination.getLimit());
                preparedStmtList.add(pagination.getOffSet());

            preparedStmtArgList.add(Types.INTEGER);
            preparedStmtArgList.add(Types.INTEGER);
        }

        return query.toString();
    }

    public String getBailDetailsByIdsQuery(List<String> bailIds, Pagination pagination, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {
        if (bailIds == null || bailIds.isEmpty()) {
            throw new IllegalArgumentException("Bail Ids cannot be null or empty");
        }
        StringBuilder query = new StringBuilder(BASE_BAIL_QUERY);
        query.append(FROM_QUERY);

        query.append(" WHERE bail.id IN (");
        String placeholders = String.join(",", bailIds.stream().map(id -> "?").toList());
        query.append(placeholders).append(")");
        query.append(" AND bail.is_active = true ");
        for (String id : bailIds) {
            preparedStmtList.add(id);
            preparedStmtArgList.add(Types.VARCHAR);
        }
        return addOrderByQuery(query.toString(), pagination);
    }

    public String addOrderByQuery(String query, Pagination pagination) {
        if (isPaginationInvalid(pagination)) {
            return query + DEFAULT_ORDERBY_CLAUSE;
        } else {
            query = query + ORDER_BY_CLAUSE;
            return query.replace("{orderBy}", pagination.getSortBy()).replace("{sortingOrder}", pagination.getOrder().name());
        }
    }

    private static boolean isPaginationInvalid(Pagination pagination) {
        return pagination == null || pagination.getSortBy() == null || pagination.getOrder() == null;
    }

    public String getTotalCountQuery(BailSearchCriteria criteria, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {
        StringBuilder countQuery = new StringBuilder("SELECT COUNT(*) FROM (SELECT DISTINCT(bail.id)" + FROM_QUERY);
        getWhereFields(criteria, countQuery, preparedStmtList, preparedStmtArgList);
        countQuery.append(") as total_count");
        return countQuery.toString();
    }

    private void getWhereFields(BailSearchCriteria criteria, StringBuilder query, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {

        query.append(" WHERE bail.is_active = true");
        addBailCriteria(criteria.getTenantId(), query, "bail.tenant_id = ?", preparedStmtList, preparedStmtArgList);
        addBailCriteria(criteria.getId(), query, "bail.id = ?", preparedStmtList, preparedStmtArgList);
        addBailCriteria(criteria.getLitigantIndividualId(), query, "bail.litigant_id = ?", preparedStmtList, preparedStmtArgList);
        addOwnerCriteria(criteria, query, preparedStmtList, preparedStmtArgList);
        addBailCriteria(criteria.getSuretyMobileNumber(), query, "srt.surety_mobile_number = ?", preparedStmtList, preparedStmtArgList);
        addBailCriteria(criteria.getCourtId(), query, "bail.court_id = ?", preparedStmtList, preparedStmtArgList);
        addBailCriteria(criteria.getFilingNumber(), query, "bail.filing_number = ?", preparedStmtList, preparedStmtArgList);
        addBailCriteria(criteria.getCnrNumber(), query, "bail.cnr_number = ?", preparedStmtList, preparedStmtArgList);
        addListBailCriteria(criteria.getStatus(), query, preparedStmtList, preparedStmtArgList);
        addBailCriteria(criteria.getCaseType() != null ? criteria.getCaseType().name() : null, query, "bail.case_type = ?", preparedStmtList, preparedStmtArgList);
        addBailCriteria(criteria.getBailType() != null ? criteria.getBailType().name() : null, query, "bail.bail_type = ?", preparedStmtList, preparedStmtArgList);
        addBailCriteria(criteria.getCaseNumber(), query, "bail.case_number = ?", preparedStmtList, preparedStmtArgList);

        // Special fuzzy search handling
        if (criteria.getBailId() != null && !criteria.getBailId().isEmpty()) {
            query.append(" AND ");
            if (Boolean.TRUE.equals(criteria.getFuzzySearch())) {
                query.append("bail.bail_id ILIKE ?");
                preparedStmtList.add("%" + criteria.getBailId() + "%");
            } else {
                query.append("bail.bail_id = ?");
                preparedStmtList.add(criteria.getBailId());
            }

            preparedStmtArgList.add(Types.VARCHAR);
        }

        if (criteria.getAsUser() != null && !criteria.getAsUser().isEmpty()) {
            query.append(" AND (bail.bail_status != 'DRAFT_IN_PROGRESS' OR (bail.bail_status = 'DRAFT_IN_PROGRESS' AND bail.as_user = ?)) ");
            preparedStmtList.add(criteria.getAsUser());
            preparedStmtArgList.add(Types.VARCHAR);
        }
    }

    private void addBailCriteria(String criteria, StringBuilder query, String condition, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {
        if (criteria != null && !criteria.isEmpty()) {
            query.append(" AND ");
            query.append(condition);
            preparedStmtList.add(criteria);
            preparedStmtArgList.add(Types.VARCHAR);
        }
    }

    private void addListBailCriteria(List<String> criteria, StringBuilder query, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {
        if (criteria != null && !criteria.isEmpty()) {
            query.append(" AND ");
            query.append(" bail.bail_status IN ")
                    .append(" (")
                    .append(criteria.stream().map(id -> "?").collect(Collectors.joining(",")))
                    .append(") ");
            preparedStmtList.addAll(criteria);
            criteria.forEach(i -> preparedStmtArgList.add(Types.VARCHAR));
        }
    }

    private void addOwnerCriteria(BailSearchCriteria criteria, StringBuilder query, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {
        String asUser = criteria.getAsUser();
        if (asUser != null && !asUser.isEmpty()) {

            query.append(" AND (bail.litigant_id = ? OR bail.as_user = ?)");
            preparedStmtList.add(asUser);
            preparedStmtList.add(asUser);
            preparedStmtArgList.add(Types.VARCHAR);
            preparedStmtArgList.add(Types.VARCHAR);
        }
    }
}
