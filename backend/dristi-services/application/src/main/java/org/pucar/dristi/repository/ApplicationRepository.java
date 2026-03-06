package org.pucar.dristi.repository;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.Role;
import org.egov.common.contract.request.User;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.queryBuilder.ApplicationQueryBuilder;
import org.pucar.dristi.repository.rowMapper.ApplicationRowMapper;
import org.pucar.dristi.repository.rowMapper.DocumentRowMapper;
import org.pucar.dristi.service.IndividualService;
import org.pucar.dristi.util.AdvocateUtil;
import org.pucar.dristi.util.CaseUtil;
import org.pucar.dristi.web.models.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.*;
import java.util.stream.Stream;

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
    private final ObjectMapper objectMapper;
    private final IndividualService individualService;
    private final AdvocateUtil advocateUtil;

    @Autowired
    public ApplicationRepository(
            ApplicationQueryBuilder queryBuilder,
            JdbcTemplate jdbcTemplate,
            ApplicationRowMapper rowMapper,
            DocumentRowMapper documentRowMapper,
            CaseUtil caseUtil,
            Configuration config,
            ObjectMapper mapper, ObjectMapper objectMapper, IndividualService individualService, AdvocateUtil advocateUtil) {
        this.queryBuilder = queryBuilder;
        this.jdbcTemplate = jdbcTemplate;
        this.rowMapper = rowMapper;
        this.documentRowMapper = documentRowMapper;
        this.caseUtil = caseUtil;
        this.config = config;
        this.mapper = mapper;
        this.objectMapper = objectMapper;
        this.individualService = individualService;
        this.advocateUtil = advocateUtil;
    }

    public List<Application> getApplications(ApplicationSearchRequest applicationSearchRequest) {

        try {
            List<Application> applicationList = new ArrayList<>();
            List<Object> preparedStmtList = new ArrayList<>();
            List<Integer> preparedStmtArgList = new ArrayList<>();

            List<Object> preparedStmtListDoc;

            // TODO : remove this, this is temporary fix (#5016)
            String asUser = applicationSearchRequest.getCriteria().getAsUser();

            RequestInfo requestInfo = applicationSearchRequest.getRequestInfo();
            String userUuid = Optional.ofNullable(requestInfo)
                    .map(RequestInfo::getUserInfo)
                    .map(User::getUuid)
                    .orElse(null);

            boolean isAdvocate = Optional.ofNullable(requestInfo)
                    .map(RequestInfo::getUserInfo)
                    .map(User::getRoles).stream().flatMap(Collection::stream)
                    .map(Role::getCode)
                    .filter(Objects::nonNull)
                    .anyMatch(ADVOCATE_ROLE::equalsIgnoreCase);

            boolean isClerk = Optional.ofNullable(requestInfo)
                    .map(RequestInfo::getUserInfo)
                    .map(User::getRoles).stream().flatMap(Collection::stream)
                    .map(Role::getCode)
                    .filter(Objects::nonNull)
                    .anyMatch(ADVOCATE_CLERK_ROLE::equalsIgnoreCase);


            String filingNumber = applicationSearchRequest.getCriteria().getFilingNumber();
            List<UUID> onBehalfOf = applicationSearchRequest.getCriteria().getOnBehalfOf();
            if((isAdvocate || isClerk) && onBehalfOf != null && asUser != null && filingNumber != null) {

                CourtCase courtCase = fetchCourtCase(filingNumber, requestInfo);

                if(!asUser.equals(userUuid)){
                    validateOfficeAdvocateMapping(asUser, userUuid, courtCase);
                }

                validateAdvocateLitigantMapping(
                        onBehalfOf,
                        asUser,
                        courtCase,
                        requestInfo,
                        config.getStateLevelTenantId()
                );
            }

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

    private void validateOfficeAdvocateMapping(String officeAdvocateUserUuid, String memberUserUuid, CourtCase courtCase){

        boolean isOfficeMappingValid = Optional.ofNullable(courtCase.getAdvocateOffices())
                .orElse(Collections.emptyList())
                .stream()
                .filter(office -> officeAdvocateUserUuid.equals(office.getOfficeAdvocateUserUuid()))
                .anyMatch(office -> {
                    Stream<AdvocateOfficeMember> membersStream = Stream.concat(
                            Optional.ofNullable(office.getAdvocates()).orElse(Collections.emptyList()).stream(),
                            Optional.ofNullable(office.getClerks()).orElse(Collections.emptyList()).stream()
                    );
                    return membersStream
                            .anyMatch(member -> memberUserUuid.equals(member.getMemberUserUuid()));
                });

        if (!isOfficeMappingValid) {
            throw new CustomException(VALIDATION_ERR,
                    String.format("%s is not a member of %s's office in case %s",
                            memberUserUuid, officeAdvocateUserUuid, courtCase.getFilingNumber()));
        }
    }

    // todo change implementation to use uuid directly from AdvocateMapping/Party after additional details changes
    private void validateAdvocateLitigantMapping(List<UUID> onBehalfOf, String asUser, CourtCase courtCase, RequestInfo requestInfo, String tenantId){
        String advocateId = getAdvocateIdFromUserUuid(asUser, requestInfo, tenantId);

        List<String> representingUserUuids = Optional.ofNullable(courtCase.getRepresentatives())
                .orElse(Collections.emptyList())
                .stream()
                .filter(rep -> advocateId.equals(rep.getAdvocateId()))
                .map(rep -> getRepresentingUserUuidsForRepresentative(rep, requestInfo))
                .flatMap(List::stream)
                .toList();

        boolean isAdvocateRepresentingLitigants = onBehalfOf.stream()
                .allMatch(uuid -> representingUserUuids.contains(uuid.toString()));

        if (!isAdvocateRepresentingLitigants) {
            throw new CustomException(VALIDATION_ERR,
                    String.format("asUser advocate %s does not represent all the onBehalfOf litigants", asUser));
        }
    }

    private CourtCase fetchCourtCase(String filingNumber, RequestInfo requestInfo) {
        CaseCriteria criteria = CaseCriteria.builder()
                .filingNumber(filingNumber)
                .defaultFields(false)
                .build();

        CaseSearchRequest caseSearchRequest = CaseSearchRequest.builder()
                .requestInfo(requestInfo)
                .criteria(Collections.singletonList(criteria))
                .build();

        JsonNode caseResponse = caseUtil.searchCaseDetails(caseSearchRequest);
        if (caseResponse == null) {
            throw new CustomException(VALIDATION_ERR, "Case details not found for filing number " + filingNumber);
        }

        CourtCase courtCase = objectMapper.convertValue(caseResponse, CourtCase.class);
        List<AdvocateMapping> representatives = Optional.ofNullable(courtCase.getRepresentatives())
                .orElse(Collections.emptyList());

        if (representatives.isEmpty()) {
            throw new CustomException(VALIDATION_ERR, "No representatives found for filing number " + filingNumber);
        }
        return courtCase;
    }

    private String getAdvocateIdFromUserUuid(String asUser, RequestInfo requestInfo, String tenantId) {

        List<Individual> advocateIndividuals = individualService.getIndividualsByUserUuid(requestInfo, Collections.singletonList(asUser));
        if (advocateIndividuals == null || advocateIndividuals.isEmpty()) {
            throw new CustomException(VALIDATION_ERR, "Advocate user not found for asUser " + asUser);
        }

        String individualId = advocateIndividuals.get(0).getIndividualId();
        if (individualId == null) {
            throw new CustomException(VALIDATION_ERR, "Individual id missing for asUser " + asUser);
        }

        JsonNode advocateNode = advocateUtil.searchAdvocateByIndividualId(requestInfo, tenantId, individualId);
        if (advocateNode == null) {
            throw new CustomException(VALIDATION_ERR, "Advocate not found for individual id " + individualId);
        }

        String advocateId = advocateNode.path("id").asText(null);
        if (advocateId == null || advocateId.isEmpty()) {
            throw new CustomException(VALIDATION_ERR, "Advocate id missing for individual id " + individualId);
        }

        return advocateId;
    }

    private List<String> getRepresentingUserUuidsForRepresentative(AdvocateMapping representative, RequestInfo requestInfo) {
        List<Party> representing = Optional.ofNullable(representative.getRepresenting()).orElse(Collections.emptyList());
        if (representing.isEmpty()) {
            return Collections.emptyList();
        }

        List<String> litigantUserUuids = new ArrayList<>();
        for (Party party : representing) {
            String litigantIndividualId = party.getIndividualId();
            if (litigantIndividualId == null) {
                continue;
            }

            List<Individual> litigantIndividuals = individualService.getIndividualsByIndividualId(requestInfo, litigantIndividualId);
            if (litigantIndividuals == null || litigantIndividuals.isEmpty()) {
                continue;
            }

            String litigantUserUuid = litigantIndividuals.get(0).getUserUuid();
            if (litigantUserUuid != null) {
                litigantUserUuids.add(litigantUserUuid);
            }
        }
        return litigantUserUuids;
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
