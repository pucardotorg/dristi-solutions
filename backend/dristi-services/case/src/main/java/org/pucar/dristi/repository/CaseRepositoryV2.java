package org.pucar.dristi.repository;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.repository.querybuilder.CaseQueryBuilder;
import org.pucar.dristi.repository.rowmapper.*;
import org.pucar.dristi.repository.rowmapper.v2.*;
import org.pucar.dristi.web.models.*;
import org.pucar.dristi.web.models.v2.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.*;

import static org.pucar.dristi.config.ServiceConstants.*;


@Slf4j
@Repository
public class CaseRepositoryV2 {

    private final CaseQueryBuilder queryBuilder;
    private final JdbcTemplate jdbcTemplate;
    private final CaseRowMapper rowMapper;
    private final CaseListSummaryRowMapper caseListSummaryRowMapper;
    private final CaseSummarySearchRowMapper caseSummarySearchRowMapper;
    private final DocumentRowMapper caseDocumentRowMapper;
    private final LinkedCaseDocumentRowMapper linkedCaseDocumentRowMapper;
    private final LitigantDocumentRowMapper litigantDocumentRowMapper;
    private final RepresentiveDocumentRowMapper representativeDocumentRowMapper;
    private final RepresentingDocumentRowMapper representingDocumentRowMapper;
    private final LinkedCaseRowMapper linkedCaseRowMapper;
    private final LitigantRowMapper litigantRowMapper;
    private final StatuteSectionRowMapper statuteSectionRowMapper;
    private final RepresentativeRowMapper representativeRowMapper;
    private final RepresentingRowMapper representingRowMapper;
    private final PoaDocumentRowMapper poaDocumentRowMapper;
    private final PoaRowMapper poaRowMapper;
    private final RepresentativeRowMapperV2 representativeRowMapperV2;
    private final RepresentingRowMapperV2 representingRowMapperV2;
    private final LitigantRowMapperV2 litigantRowMapperV2;
    private final StatuteSectionRowMapperV2 statuteSectionRowMapperV2;
    private final PoaRowMapperV2 poaRowMapperV2;
    private final ObjectMapper objectMapper;


    @Autowired
    public CaseRepositoryV2(CaseQueryBuilder queryBuilder, JdbcTemplate jdbcTemplate, CaseRowMapper rowMapper, CaseListSummaryRowMapper caseListSummaryRowMapper, CaseSummarySearchRowMapper caseSummarySearchRowMapper, DocumentRowMapper caseDocumentRowMapper, LinkedCaseDocumentRowMapper linkedCaseDocumentRowMapper, LitigantDocumentRowMapper litigantDocumentRowMapper, RepresentiveDocumentRowMapper representativeDocumentRowMapper, RepresentingDocumentRowMapper representingDocumentRowMapper, LinkedCaseRowMapper linkedCaseRowMapper, LitigantRowMapper litigantRowMapper, StatuteSectionRowMapper statuteSectionRowMapper, RepresentativeRowMapper representativeRowMapper, RepresentingRowMapper representingRowMapper, PoaDocumentRowMapper poaDocumentRowMapper, PoaRowMapper poaRowMapper, RepresentativeRowMapperV2 representativeRowMapperV2, RepresentingRowMapperV2 representingRowMapperV2, LitigantRowMapperV2 litigantRowMapperV2, StatuteSectionRowMapperV2 statuteSectionRowMapperV2, PoaRowMapperV2 poaRowMapperV2, ObjectMapper objectMapper) {
        this.queryBuilder = queryBuilder;
        this.jdbcTemplate = jdbcTemplate;
        this.rowMapper = rowMapper;
        this.caseListSummaryRowMapper = caseListSummaryRowMapper;
        this.caseSummarySearchRowMapper = caseSummarySearchRowMapper;
        this.caseDocumentRowMapper = caseDocumentRowMapper;
        this.linkedCaseDocumentRowMapper = linkedCaseDocumentRowMapper;
        this.litigantDocumentRowMapper = litigantDocumentRowMapper;
        this.representativeDocumentRowMapper = representativeDocumentRowMapper;
        this.representingDocumentRowMapper = representingDocumentRowMapper;
        this.linkedCaseRowMapper = linkedCaseRowMapper;
        this.litigantRowMapper = litigantRowMapper;
        this.statuteSectionRowMapper = statuteSectionRowMapper;
        this.representativeRowMapper = representativeRowMapper;
        this.representingRowMapper = representingRowMapper;
        this.poaDocumentRowMapper = poaDocumentRowMapper;
        this.poaRowMapper = poaRowMapper;
        this.representativeRowMapperV2 = representativeRowMapperV2;
        this.representingRowMapperV2 = representingRowMapperV2;
        this.litigantRowMapperV2 = litigantRowMapperV2;
        this.statuteSectionRowMapperV2 = statuteSectionRowMapperV2;
        this.poaRowMapperV2 = poaRowMapperV2;
        this.objectMapper = objectMapper;
    }

    public List<CaseSummarySearch> getCaseSummary(CaseSummarySearchRequest caseSummarySearchRequest) {

        try {
            CaseSummarySearchCriteria searchCriteria = caseSummarySearchRequest.getCriteria();

            List<Object> preparedStmtList = new ArrayList<>();
            List<Integer> preparedStmtArgList = new ArrayList<>();

            String casesQuery = "";
            casesQuery = queryBuilder.getCaseSummarySearchQuery(searchCriteria, preparedStmtList, preparedStmtArgList);
            casesQuery = queryBuilder.addOrderByQuery(casesQuery, searchCriteria.getPagination());
            if (searchCriteria.getPagination() != null) {
                Integer totalRecords = getTotalCount(casesQuery, preparedStmtList);
                searchCriteria.getPagination().setTotalCount(Double.valueOf(totalRecords));
                casesQuery = queryBuilder.addPaginationQuery(casesQuery, preparedStmtList, searchCriteria.getPagination(), preparedStmtArgList);
            }
            if (preparedStmtList.size() != preparedStmtArgList.size()) {
                log.info("Arg size :: {}, and ArgType size :: {}", preparedStmtList.size(), preparedStmtArgList.size());
                throw new CustomException(CASE_SEARCH_QUERY_EXCEPTION, "Arg and ArgType size mismatch ");
            }
            log.info("Final case summary query :: {}", casesQuery);

            List<CaseSummarySearch> caseSummarySearchList = jdbcTemplate.query(casesQuery, preparedStmtList.toArray(), preparedStmtArgList.stream().mapToInt(Integer::intValue).toArray(), caseSummarySearchRowMapper);
            if (caseSummarySearchList != null && !caseSummarySearchList.isEmpty()) {
                log.info("Case list size :: {}", caseSummarySearchList.size());
            } else {
                return new ArrayList<>();
            }

            for (CaseSummarySearch caseSummarySearch : caseSummarySearchList) {
                enrichCaseSummary(caseSummarySearch);
            }

            return caseSummarySearchList;

        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error while fetching case application list :: {}", e.toString());
            throw new CustomException(SEARCH_CASE_ERR, "Exception while fetching case application list: " + e.getMessage());
        }
    }

    public List<CaseSummaryList> getCaseList(CaseSummaryListRequest caseListRequest) {

        try {
            RequestInfo requestInfo = caseListRequest.getRequestInfo();
            CaseSummaryListCriteria searchCriteria = caseListRequest.getCriteria();

            List<Object> preparedStmtList = new ArrayList<>();
            List<Integer> preparedStmtArgList = new ArrayList<>();

            String casesQuery = "";
            casesQuery = queryBuilder.getCasesListSearchQuery(searchCriteria, preparedStmtList, preparedStmtArgList, requestInfo);
            casesQuery = queryBuilder.addOrderByQuery(casesQuery, searchCriteria.getPagination());
            if (searchCriteria.getPagination() != null) {
                Integer totalRecords = getTotalCount(casesQuery, preparedStmtList);
                searchCriteria.getPagination().setTotalCount(Double.valueOf(totalRecords));
                casesQuery = queryBuilder.addPaginationQuery(casesQuery, preparedStmtList, searchCriteria.getPagination(), preparedStmtArgList);
            }
            if (preparedStmtList.size() != preparedStmtArgList.size()) {
                log.info("Arg size :: {}, and ArgType size :: {}", preparedStmtList.size(), preparedStmtArgList.size());
                throw new CustomException(CASE_SEARCH_QUERY_EXCEPTION, "Arg and ArgType size mismatch ");
            }
            log.info("Final case query :: {}", casesQuery);

            List<CaseSummaryList> list = jdbcTemplate.query(casesQuery, preparedStmtList.toArray(), preparedStmtArgList.stream().mapToInt(Integer::intValue).toArray(), caseListSummaryRowMapper);
            if (list != null && !list.isEmpty()) {
                log.info("Case list size :: {}", list.size());
                return list;
            } else {
                return new ArrayList<>();
            }

        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error while fetching case application list :: {}", e.toString());
            throw new CustomException(SEARCH_CASE_ERR, "Exception while fetching case application list: " + e.getMessage());
        }
    }

    public Integer getTotalCount(String baseQuery, List<Object> preparedStmtList) {
        String countQuery = queryBuilder.getTotalCountQuery(baseQuery);
        log.info("Final count query :: {}", countQuery);
        return jdbcTemplate.queryForObject(countQuery, preparedStmtList.toArray(), Integer.class);
    }

    public CourtCase getCases(CaseSearchCriteriaV2 caseCriteria, RequestInfo requestInfo) {

        try {
            CourtCase courtCase;
            List<Object> preparedStmtList = new ArrayList<>();
            List<Object> preparedStmtListDoc = new ArrayList<>();

            List<Integer> preparedStmtArgList = new ArrayList<>();

            String casesQuery = queryBuilder.getCasesSearchDetailsQuery(caseCriteria, preparedStmtList, preparedStmtArgList, requestInfo);

            List<CourtCase> list = jdbcTemplate.query(casesQuery, preparedStmtList.toArray(), preparedStmtArgList.stream().mapToInt(Integer::intValue).toArray(), rowMapper);

            if (list != null && !list.isEmpty()) {
                courtCase = list.get(0);
                log.info("Case list size :: {}", list.size());
            } else {
                return null;
            }

            enrichCaseCriteria(courtCase, Collections.singletonList(String.valueOf(courtCase.getId())), preparedStmtListDoc);
            return courtCase;

        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error while fetching case application list :: {}", e.toString());
            throw new CustomException(SEARCH_CASE_ERR, "Exception while fetching case application list: " + e.getMessage());
        }
    }

    private void enrichCaseSummary(CaseSummarySearch caseSummarySearch) {
        List<String> ids = Collections.singletonList(String.valueOf(caseSummarySearch.getId()));
        List<String> idsLitigant = new ArrayList<>();

        List<String> idsRepresentative = new ArrayList<>();

        setPoaHolders(caseSummarySearch, ids);

        setLitigants(caseSummarySearch, ids);

        setRepresentatives(caseSummarySearch, ids);

        extractRepresentativeIds(caseSummarySearch, idsRepresentative);

        if (!idsRepresentative.isEmpty())
            setRepresenting(caseSummarySearch, idsRepresentative);

        setStatuteAndSections(caseSummarySearch, ids);

        extractLitigantIds(caseSummarySearch, idsLitigant);

        if (!idsLitigant.isEmpty())
            updateLitigantsUsingDocuments(caseSummarySearch, idsLitigant);
    }

    private void setRepresenting(CaseSummarySearch caseSummarySearch, List<String> idsRepresentative) {
        String representingQuery = "";
        List<Object> preparedStmtList = new ArrayList<>();

        List<Integer> preparedStmtArgList = new ArrayList<>();

        representingQuery = queryBuilder.getRepresentingSummarySearchQuery(idsRepresentative, preparedStmtList, preparedStmtArgList);
        log.info("Final representing query :: {}", representingQuery);
        Map<UUID, List<RepresentingV2>> representingMap = jdbcTemplate.query(representingQuery, preparedStmtList.toArray(), preparedStmtArgList.stream().mapToInt(Integer::intValue).toArray(), representingRowMapperV2);
        if (representingMap != null) {
                if (caseSummarySearch.getRepresentatives() != null) {
                    caseSummarySearch.getRepresentatives().forEach(representative -> representative.setRepresenting(representingMap.get(UUID.fromString(representative.getId()))));
                }
        }
    }

    private void setRepresentatives(CaseSummarySearch caseSummarySearch, List<String> ids) {
        List<Object> preparedStmtList;
        String representativeQuery = "";
        preparedStmtList = new ArrayList<>();
        List<Integer> preparedStmtArgList = new ArrayList<>();

        representativeQuery = queryBuilder.getRepresentativesSummarySearchQuery(ids, preparedStmtList, preparedStmtArgList);
        log.info("Final representative query :: {}", representativeQuery);
        Map<UUID, List<RepresentativeV2>> representativeMap = jdbcTemplate.query(representativeQuery, preparedStmtList.toArray(), preparedStmtArgList.stream().mapToInt(Integer::intValue).toArray(), representativeRowMapperV2);
        if (representativeMap != null) {
            caseSummarySearch.setRepresentatives(representativeMap.get(caseSummarySearch.getId()));
        }
    }

    private void setPoaHolders(CaseSummarySearch caseSummarySearch, List<String> ids) {
        List<Object> preparedStmtList;
        String poaHolderQuery = "";
        preparedStmtList = new ArrayList<>();
        List<Integer> preparedStmtArgList = new ArrayList<>();

        poaHolderQuery = queryBuilder.getPoaHoldersSummarySearchQuery(ids, preparedStmtList, preparedStmtArgList);
        log.info("Final POA holder query :: {}", poaHolderQuery);
        Map<UUID, List<POAHolderV2>> poaMap = jdbcTemplate.query(poaHolderQuery, preparedStmtList.toArray(), preparedStmtArgList.stream().mapToInt(Integer::intValue).toArray(), poaRowMapperV2);
        if (poaMap != null) {
           caseSummarySearch.setPoaHolders(poaMap.get(caseSummarySearch.getId()));
        }
    }

    private void setStatuteAndSections(CaseSummarySearch caseSummarySearch, List<String> ids) {
        List<Object> preparedStmtListDoc;
        String statueAndSectionQuery = "";
        preparedStmtListDoc = new ArrayList<>();
        List<Integer> preparedStmtArgList = new ArrayList<>();

        statueAndSectionQuery = queryBuilder.getStatuteSectionSummarySearchQuery(ids, preparedStmtListDoc, preparedStmtArgList);
        log.info("Final statute and sections query :: {}", statueAndSectionQuery);
        Map<UUID, StatuteSectionV2> statuteSectionsMap = jdbcTemplate.query(statueAndSectionQuery, preparedStmtListDoc.toArray(), preparedStmtArgList.stream().mapToInt(Integer::intValue).toArray(), statuteSectionRowMapperV2);
        if (statuteSectionsMap != null) {
            caseSummarySearch.setStatutesAndSection(statuteSectionsMap.get(caseSummarySearch.getId()));
        }
    }

    private void setLitigants(CaseSummarySearch caseSummarySearch, List<String> ids) {
        List<Object> preparedStmtListDoc;
        String litigantQuery = "";
        preparedStmtListDoc = new ArrayList<>();
        List<Integer> preparedStmtArgList = new ArrayList<>();

        litigantQuery = queryBuilder.getLitigantSummarySearchQuery(ids, preparedStmtListDoc, preparedStmtArgList);
        log.info("Final litigant query :: {}", litigantQuery);
        Map<UUID, List<LitigantV2>> litigantMap = jdbcTemplate.query(litigantQuery, preparedStmtListDoc.toArray(), preparedStmtArgList.stream().mapToInt(Integer::intValue).toArray(), litigantRowMapperV2);
        if (litigantMap != null) {
            caseSummarySearch.setLitigants(litigantMap.get(caseSummarySearch.getId()));
        }
    }

    private void updateLitigantsUsingDocuments(CaseSummarySearch caseSummarySearch, List<String> idsLitigant) {
        String litigantDocumentQuery;
        List<Object> preparedStmtListDoc = new ArrayList<>();
        List<Integer> preparedStmtArgList = new ArrayList<>();

        litigantDocumentQuery = queryBuilder.getLitigantDocumentSearchQuery(idsLitigant, preparedStmtListDoc, preparedStmtArgList);
        log.info("Final litigant document query :: {}", litigantDocumentQuery);
        Map<UUID, List<Document>> caseLitigantDocumentMap = jdbcTemplate.query(litigantDocumentQuery, preparedStmtListDoc.toArray(), preparedStmtArgList.stream().mapToInt(Integer::intValue).toArray(), litigantDocumentRowMapper);
        if (caseLitigantDocumentMap != null) {
                if (caseSummarySearch.getLitigants() != null) {
                    caseSummarySearch.getLitigants().forEach(litigant -> {

                        if (litigant.getPartyType().contains("complainant")) {
                             litigant.setPartyInPerson(isSelfRepresentedComplainant(litigant, caseSummarySearch.getRepresentatives()));
                        }else{
                            if(caseLitigantDocumentMap.containsKey(litigant.getId())){
                                List<Document> litigantDocuments = caseLitigantDocumentMap.get(litigant.getId());
                                if (litigantDocuments != null && !litigantDocuments.isEmpty()) {
                                    litigant.setPartyInPerson(hasPipAffidavit(litigantDocuments));
                                }
                            }else {
                                litigant.setPartyInPerson(false);
                            }
                        }

                        if(caseLitigantDocumentMap.containsKey(litigant.getId())){
                            List<Document> litigantDocuments = caseLitigantDocumentMap.get(litigant.getId());
                            if (litigantDocuments != null && !litigantDocuments.isEmpty()) {
                                litigant.setResponseSubmitted(isResponseSubmitted(litigantDocuments));
                            }
                        }else {
                            litigant.setResponseSubmitted(false);
                        }

                    });
                }
        }
    }

    private boolean isResponseSubmitted(List<Document> documents) {
            if (documents != null && !documents.isEmpty()) {
                for (Document document : documents) {
                    Object additionalDetails = document.getAdditionalDetails();
                    ObjectNode additionalDetailsNode = objectMapper.convertValue(additionalDetails, ObjectNode.class);
                    String fileType = additionalDetailsNode.has("fileType")
                            ? additionalDetailsNode.get("fileType").asText()
                            : "";
                    if (RESPONDENT_RESPONSE.equals(fileType)) {
                        return true;
                    }
                }
            }
            return false;
    }

    private boolean isSelfRepresentedComplainant(LitigantV2 litigant, List<RepresentativeV2> representativeV2) {
        if (representativeV2 != null && !representativeV2.isEmpty()) {
            for (RepresentativeV2 representative : representativeV2) {
                if(representative.getRepresenting()!=null){
                    RepresentingV2 litigantParty = representative.getRepresenting().stream()
                            .filter(party -> party.getIndividualId().equalsIgnoreCase(litigant.getIndividualId()))
                            .findFirst()
                            .orElse(null);
                    // If litigant is actively represented by an advocate, they're not self-represented
                    if (litigantParty != null) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    private boolean hasPipAffidavit(List<Document> documents) {
        if (documents != null && !documents.isEmpty()) {
            for (Document document : documents) {
                Object additionalDetails = document.getAdditionalDetails();
                ObjectNode additionalDetailsNode = objectMapper.convertValue(additionalDetails, ObjectNode.class);
                String documentName = additionalDetailsNode.has("documentName")
                        ? additionalDetailsNode.get("documentName").asText()
                        : "";
                if (UPLOAD_PIP_AFFIDAVIT.equals(documentName)) {
                    return true;
                }
            }
        }
        return false;
    }

    private static void extractRepresentativeIds(CaseSummarySearch caseSummarySearch, List<String> idsRepresentative) {
            if (caseSummarySearch.getRepresentatives() != null) {
                caseSummarySearch.getRepresentatives().forEach(rep -> idsRepresentative.add(rep.getId()));
            }
    }

    private static void extractLitigantIds(CaseSummarySearch caseSummarySearch, List<String> idsLitigant) {
            if (caseSummarySearch.getLitigants() != null) {
                caseSummarySearch.getLitigants().forEach(litigant -> idsLitigant.add(String.valueOf(litigant.getId())));
            }
    }


    private void enrichCaseCriteria(CourtCase courtCase, List<String> ids, List<Object> preparedStmtListDoc) {
        List<String> idsLinkedCases = new ArrayList<>();
        List<String> idsLitigant = new ArrayList<>();
        List<String> idsRepresentative = new ArrayList<>();
        List<String> individualIdsPoaHolder = new ArrayList<>();
        List<String> idsRepresenting = new ArrayList<>();

        setLinkedCases(courtCase, ids);

        extractLinkedCasesIds(courtCase, idsLinkedCases);

        setPoaHolders(courtCase, ids);

        extractPoaIndividualIds(courtCase, individualIdsPoaHolder);

        setLitigants(courtCase, ids);

        extractLitigantIds(courtCase, idsLitigant);

        setRepresentatives(courtCase, ids);

        extractRepresentativeIds(courtCase, idsRepresentative);

        if (!idsRepresentative.isEmpty())
            setRepresenting(courtCase, idsRepresentative, preparedStmtListDoc);

        extractRepresentingIds(courtCase, idsRepresenting);

        setStatuteAndSections(courtCase, ids);

        setCaseDocuments(courtCase, ids);

        if (!idsLitigant.isEmpty())
            setLitigantDocuments(courtCase, idsLitigant);

        if (!individualIdsPoaHolder.isEmpty())
            setPoaDocuments(courtCase, individualIdsPoaHolder);

        if (!idsLinkedCases.isEmpty())
            setLinkedCaseDocuments(courtCase, idsLinkedCases);

        if (!idsRepresentative.isEmpty())
            setRepresentativeDocuments(courtCase, idsRepresentative);

        if (!idsRepresenting.isEmpty())
            setRepresentingDocuments(courtCase, idsRepresenting);
    }

    private void setPoaDocuments(CourtCase courtCase, List<String> individualIdsPoaHolder) {
        String poaDocumentQuery;
        List<Object> preparedStmtListDoc;
        List<Integer> preparedStmtArgList = new ArrayList<>();

        preparedStmtListDoc = new ArrayList<>();
        poaDocumentQuery = queryBuilder.getPoaDocumentSearchQuery(individualIdsPoaHolder, preparedStmtListDoc, preparedStmtArgList);
        log.info("Final POA document query :: {}", poaDocumentQuery);
        Map<UUID, List<Document>> poaDocumentMap = jdbcTemplate.query(poaDocumentQuery, preparedStmtListDoc.toArray(), preparedStmtArgList.stream().mapToInt(Integer::intValue).toArray(), poaDocumentRowMapper);
        if (poaDocumentMap != null) {
            if (courtCase.getPoaHolders() != null) {
                courtCase.getPoaHolders().forEach(poaHolder -> {
                    if (poaHolder != null) {
                        poaHolder.setDocuments(poaDocumentMap.get(UUID.fromString(poaHolder.getId())));
                    }
                });
            }
        }
    }

    private void setRepresentingDocuments(CourtCase courtCase, List<String> idsRepresenting) {
        String representingDocumentQuery;
        List<Object> preparedStmtListDoc;
        List<Integer> preparedStmtArgList = new ArrayList<>();

        preparedStmtListDoc = new ArrayList<>();
        representingDocumentQuery = queryBuilder.getRepresentingDocumentSearchQuery(idsRepresenting, preparedStmtListDoc, preparedStmtArgList);
        log.info("Final representing document query :: {}", representingDocumentQuery);
        Map<UUID, List<Document>> caseRepresentingDocumentMap = jdbcTemplate.query(representingDocumentQuery, preparedStmtListDoc.toArray(), preparedStmtArgList.stream().mapToInt(Integer::intValue).toArray(), representingDocumentRowMapper);

        if (caseRepresentingDocumentMap != null) {
            setRepresentingDoc(courtCase, caseRepresentingDocumentMap);
        }
    }

    private void setRepresentingDoc(CourtCase courtCase, Map<UUID, List<Document>> caseRepresentingDocumentMap) {
        if (courtCase.getRepresentatives() != null) {
            courtCase.getRepresentatives().forEach(rep -> {
                if (rep.getRepresenting() != null) {
                    rep.getRepresenting().forEach(representing -> {
                        if (representing != null) {
                            representing.setDocuments(caseRepresentingDocumentMap.get(representing.getId()));
                        }
                    });
                }
            });
        }
    }

    private void setRepresentativeDocuments(CourtCase courtCase, List<String> idsRepresentative) {
        String representativeDocumentQuery;
        List<Object> preparedStmtListDoc;
        List<Integer> preparedStmtArgList = new ArrayList<>();

        preparedStmtListDoc = new ArrayList<>();
        representativeDocumentQuery = queryBuilder.getRepresentativeDocumentSearchQuery(idsRepresentative, preparedStmtListDoc, preparedStmtArgList);
        log.info("Final representative document query :: {}", representativeDocumentQuery);
        Map<UUID, List<Document>> caseRepresentiveDocumentMap = jdbcTemplate.query(representativeDocumentQuery, preparedStmtListDoc.toArray(), preparedStmtArgList.stream().mapToInt(Integer::intValue).toArray(), representativeDocumentRowMapper);
        if (caseRepresentiveDocumentMap != null) {
            if (courtCase.getRepresentatives() != null) {
                courtCase.getRepresentatives().forEach(rep -> {
                    if (rep != null) {
                        rep.setDocuments(caseRepresentiveDocumentMap.get(UUID.fromString(rep.getId())));
                    }
                });
            }
        }
    }

    private void setLinkedCaseDocuments(CourtCase courtCase, List<String> idsLinkedCases) {
        String linkedCaseDocumentQuery;
        List<Object> preparedStmtListDoc;
        List<Integer> preparedStmtArgList = new ArrayList<>();

        preparedStmtListDoc = new ArrayList<>();
        linkedCaseDocumentQuery = queryBuilder.getLinkedCaseDocumentSearchQuery(idsLinkedCases, preparedStmtListDoc, preparedStmtArgList);
        log.info("Final linked case document query :: {}", linkedCaseDocumentQuery);
        Map<UUID, List<Document>> caseLinkedCaseDocumentMap = jdbcTemplate.query(linkedCaseDocumentQuery, preparedStmtListDoc.toArray(), preparedStmtArgList.stream().mapToInt(Integer::intValue).toArray(), linkedCaseDocumentRowMapper);
        if (caseLinkedCaseDocumentMap != null) {
            if (courtCase.getLinkedCases() != null) {
                courtCase.getLinkedCases().forEach(linkedCase -> {
                    if (linkedCase != null) {
                        linkedCase.setDocuments(caseLinkedCaseDocumentMap.get(linkedCase.getId()));
                    }
                });
            }
        }
    }

    private void setLitigantDocuments(CourtCase courtCase, List<String> idsLitigant) {
        String litigantDocumentQuery;
        List<Object> preparedStmtListDoc;
        preparedStmtListDoc = new ArrayList<>();
        List<Integer> preparedStmtArgList = new ArrayList<>();

        litigantDocumentQuery = queryBuilder.getLitigantDocumentSearchQuery(idsLitigant, preparedStmtListDoc, preparedStmtArgList);
        log.info("Final litigant document query :: {}", litigantDocumentQuery);
        Map<UUID, List<Document>> caseLitigantDocumentMap = jdbcTemplate.query(litigantDocumentQuery, preparedStmtListDoc.toArray(), preparedStmtArgList.stream().mapToInt(Integer::intValue).toArray(), litigantDocumentRowMapper);
        if (caseLitigantDocumentMap != null) {
            if (courtCase.getLitigants() != null) {
                courtCase.getLitigants().forEach(litigant -> {
                    if (litigant != null) {
                        litigant.setDocuments(caseLitigantDocumentMap.get(litigant.getId()));
                    }
                });
            }
        }
    }

    private void setCaseDocuments(CourtCase courtCase, List<String> ids) {
        List<Object> preparedStmtListDoc;
        String casesDocumentQuery = "";
        preparedStmtListDoc = new ArrayList<>();
        List<Integer> preparedStmtArgList = new ArrayList<>();

        casesDocumentQuery = queryBuilder.getDocumentSearchQuery(ids, preparedStmtListDoc, preparedStmtArgList);
        log.info("Final case document query :: {}", casesDocumentQuery);
        Map<UUID, List<Document>> caseDocumentMap = jdbcTemplate.query(casesDocumentQuery, preparedStmtListDoc.toArray(), preparedStmtArgList.stream().mapToInt(Integer::intValue).toArray(), caseDocumentRowMapper);
        if (caseDocumentMap != null) {
            if (courtCase != null) {
                courtCase.setDocuments(caseDocumentMap.get(courtCase.getId()));
            }
        }
    }

    private void setRepresenting(CourtCase courtCase, List<String> idsRepresentative, List<Object> preparedStmtListDoc) {
        String representingQuery = "";
        List<Integer> preparedStmtArgList = new ArrayList<>();

        representingQuery = queryBuilder.getRepresentingSearchQuery(idsRepresentative, preparedStmtListDoc, preparedStmtArgList);
        log.info("Final representing query :: {}", representingQuery);
        Map<UUID, List<Party>> representingMap = jdbcTemplate.query(representingQuery, preparedStmtListDoc.toArray(), preparedStmtArgList.stream().mapToInt(Integer::intValue).toArray(), representingRowMapper);
        if (representingMap != null) {
            if (courtCase.getRepresentatives() != null) {
                courtCase.getRepresentatives().forEach(representative -> representative.setRepresenting(representingMap.get(UUID.fromString(representative.getId()))));
            }
        }
    }

    private void setRepresentatives(CourtCase courtCase, List<String> ids) {
        List<Object> preparedStmtListDoc;
        String representativeQuery = "";
        preparedStmtListDoc = new ArrayList<>();
        List<Integer> preparedStmtArgList = new ArrayList<>();

        representativeQuery = queryBuilder.getRepresentativesSearchQuery(ids, preparedStmtListDoc, preparedStmtArgList);
        log.info("Final representative query :: {}", representativeQuery);
        Map<UUID, List<AdvocateMapping>> representativeMap = jdbcTemplate.query(representativeQuery, preparedStmtListDoc.toArray(), preparedStmtArgList.stream().mapToInt(Integer::intValue).toArray(), representativeRowMapper);
        if (representativeMap != null) {
            courtCase.setRepresentatives(representativeMap.get(courtCase.getId()));
        }
    }

    private void setPoaHolders(CourtCase courtCase, List<String> ids) {
        List<Object> preparedStmtList;
        String poaHolderQuery = "";
        preparedStmtList = new ArrayList<>();
        List<Integer> preparedStmtArgList = new ArrayList<>();

        poaHolderQuery = queryBuilder.getPoaHoldersSearchQuery(ids, preparedStmtList, preparedStmtArgList);
        log.info("Final POA holder query :: {}", poaHolderQuery);
        Map<UUID, List<POAHolder>> poaMap = jdbcTemplate.query(poaHolderQuery, preparedStmtList.toArray(), preparedStmtArgList.stream().mapToInt(Integer::intValue).toArray(), poaRowMapper);
        if (poaMap != null) {
            courtCase.setPoaHolders(poaMap.get(courtCase.getId()));
        }
    }

    private void setStatuteAndSections(CourtCase courtCase, List<String> ids) {
        List<Object> preparedStmtListDoc;
        String statueAndSectionQuery = "";
        preparedStmtListDoc = new ArrayList<>();
        List<Integer> preparedStmtArgList = new ArrayList<>();

        statueAndSectionQuery = queryBuilder.getStatuteSectionSearchQuery(ids, preparedStmtListDoc, preparedStmtArgList);
        log.info("Final statute and sections query :: {}", statueAndSectionQuery);
        Map<UUID, List<StatuteSection>> statuteSectionsMap = jdbcTemplate.query(statueAndSectionQuery, preparedStmtListDoc.toArray(), preparedStmtArgList.stream().mapToInt(Integer::intValue).toArray(), statuteSectionRowMapper);
        if (statuteSectionsMap != null) {
            courtCase.setStatutesAndSections(statuteSectionsMap.get(courtCase.getId()));
        }
    }

    private void setLitigants(CourtCase courtCase, List<String> ids) {
        List<Object> preparedStmtListDoc;
        String litigantQuery = "";
        preparedStmtListDoc = new ArrayList<>();
        List<Integer> preparedStmtArgList = new ArrayList<>();

        litigantQuery = queryBuilder.getLitigantSearchQuery(ids, preparedStmtListDoc, preparedStmtArgList);
        litigantQuery = queryBuilder.addOrderByQueryForLitigants(litigantQuery);
        log.info("Final litigant query :: {}", litigantQuery);
        Map<UUID, List<Party>> litigantMap = jdbcTemplate.query(litigantQuery, preparedStmtListDoc.toArray(), preparedStmtArgList.stream().mapToInt(Integer::intValue).toArray(), litigantRowMapper);
        if (litigantMap != null) {
            courtCase.setLitigants(litigantMap.get(courtCase.getId()));
        }
    }

    private void setLinkedCases(CourtCase courtCase, List<String> ids) {
        List<Object> preparedStmtListDoc;
        String linkedCaseQuery = "";
        preparedStmtListDoc = new ArrayList<>();
        List<Integer> preparedStmtArgList = new ArrayList<>();

        linkedCaseQuery = queryBuilder.getLinkedCaseSearchQuery(ids, preparedStmtListDoc, preparedStmtArgList);
        log.info("Final linked case query :: {}", linkedCaseQuery);
        Map<UUID, List<LinkedCase>> linkedCasesMap = jdbcTemplate.query(linkedCaseQuery, preparedStmtListDoc.toArray(), preparedStmtArgList.stream().mapToInt(Integer::intValue).toArray(), linkedCaseRowMapper);
        if (linkedCasesMap != null) {
            courtCase.setLinkedCases(linkedCasesMap.get(courtCase.getId()));
        }
    }

    private static void extractRepresentingIds(CourtCase courtCase, List<String> idsRepresenting) {
        if (courtCase.getRepresentatives() != null) {
            courtCase.getRepresentatives().forEach(rep -> {
                if (rep.getRepresenting() != null) {
                    rep.getRepresenting().forEach(representing -> idsRepresenting.add(representing.getId().toString()));
                }
            });
        }
    }

    private static void extractRepresentativeIds(CourtCase courtCase, List<String> idsRepresentative) {
        if (courtCase.getRepresentatives() != null) {
            courtCase.getRepresentatives().forEach(rep -> idsRepresentative.add(rep.getId()));
        }
    }

    private static void extractLitigantIds(CourtCase courtCase, List<String> idsLitigant) {
        if (courtCase.getLitigants() != null) {
            courtCase.getLitigants().forEach(litigant -> idsLitigant.add(litigant.getId().toString()));
        }
    }

    private static void extractPoaIndividualIds(CourtCase courtCase, List<String> individualIdsPoaHolders) {
        if (courtCase.getPoaHolders() != null) {
            courtCase.getPoaHolders().forEach(poaHolder -> individualIdsPoaHolders.add(poaHolder.getId()));
        }
    }

    private static void extractLinkedCasesIds(CourtCase courtCase, List<String> idsLinkedCases) {
        if (courtCase.getLinkedCases() != null) {
            courtCase.getLinkedCases().forEach(linkedCase -> idsLinkedCases.add(linkedCase.getId().toString()));
        }
    }

    public boolean validateAdvocateOfficeCaseMember(String officeAdvocateId, String memberId) {
        try {
            String query = "SELECT COUNT(*) FROM dristi_advocate_office_case_member " +
                    "WHERE office_advocate_id = ? AND member_id = ?";
            
            Integer count = jdbcTemplate.queryForObject(query, Integer.class, officeAdvocateId, memberId);
            
            return count > 0;
        } catch (Exception e) {
            log.error("Error validating advocate office case member for officeAdvocateId: {}, memberId: {}", 
                officeAdvocateId, memberId, e);
            return false;
        }
    }
}
