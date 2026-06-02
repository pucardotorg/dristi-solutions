package org.pucar.dristi.validator;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.Role;
import org.egov.common.contract.request.User;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.ApplicationRepository;
import org.pucar.dristi.service.IndividualService;
import org.pucar.dristi.util.AdvocateUtil;
import org.pucar.dristi.util.CaseUtil;
import org.pucar.dristi.util.FileStoreUtil;
import org.pucar.dristi.util.OrderUtil;
import org.pucar.dristi.web.models.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.util.ObjectUtils;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.Collection;
import java.util.stream.Stream;

import static org.pucar.dristi.config.ServiceConstants.*;

@Slf4j
@Component
public class ApplicationValidator {
    private final ApplicationRepository repository;
    private final CaseUtil caseUtil;
    private final OrderUtil orderUtil;
    private final FileStoreUtil fileStoreUtil;
    private final Configuration config;
    private final ObjectMapper objectMapper;
    private final IndividualService individualService;
    private final AdvocateUtil advocateUtil;

    @Autowired
    public ApplicationValidator(ApplicationRepository repository, CaseUtil caseUtil, OrderUtil orderUtil,
                                FileStoreUtil fileStoreUtil, Configuration config, ObjectMapper objectMapper,
                                IndividualService individualService, AdvocateUtil advocateUtil) {
        this.repository = repository;
        this.caseUtil = caseUtil;
        this.orderUtil = orderUtil;
        this.fileStoreUtil = fileStoreUtil;
        this.config = config;
        this.objectMapper = objectMapper;
        this.individualService = individualService;
        this.advocateUtil = advocateUtil;
    }

    public void validateApplication(ApplicationRequest applicationRequest) throws CustomException {
        RequestInfo requestInfo = applicationRequest.getRequestInfo();
        Application application = applicationRequest.getApplication();
        //validate documents
        validateDocuments(application);

        if(ObjectUtils.isEmpty(application.getCaseId())) {
            throw new CustomException(VALIDATION_ERR, "caseId is mandatory for creating application");
        }

        CaseExistsRequest caseExistsRequest = createCaseExistsRequest(requestInfo, application);

        if(!caseUtil.fetchCaseDetails(caseExistsRequest)){
            throw new CustomException(VALIDATION_ERR, "case does not exist");
            }
    }

    public Boolean validateApplicationExistence(RequestInfo requestInfo ,Application application) {
        //validate documents
        validateDocuments(application);

        if(ObjectUtils.isEmpty(application.getCaseId())) {
            throw new CustomException(VALIDATION_ERR, "caseId is mandatory for updating application");
        }

        CaseExistsRequest caseExistsRequest = createCaseExistsRequest(requestInfo, application);
        if(!caseUtil.fetchCaseDetails(caseExistsRequest)){
            throw new CustomException(VALIDATION_ERR, "case does not exist");
        }
        if(ObjectUtils.isEmpty(application.getId())){
            throw new CustomException(VALIDATION_ERR, "id is mandatory for updating application");
        }

        ApplicationExists applicationExists = new ApplicationExists();
        applicationExists.setFilingNumber(application.getFilingNumber());
        applicationExists.setCnrNumber(application.getCnrNumber());
        applicationExists.setApplicationNumber(application.getApplicationNumber());
        List<ApplicationExists> criteriaList = new ArrayList<>();
        criteriaList.add(applicationExists);
        List<ApplicationExists> applicationExistsList = repository.checkApplicationExists(criteriaList);

        return applicationExistsList.get(0).getExists();
    }

    public CaseExistsRequest createCaseExistsRequest(RequestInfo requestInfo, Application application){
        CaseExistsRequest caseExistsRequest = new CaseExistsRequest();
        CaseExists caseExists = new CaseExists();
        caseExists.setCaseId(application.getCaseId());
        caseExists.setFilingNumber(application.getFilingNumber());
        caseExists.setCnrNumber(application.getCnrNumber());
        List<CaseExists> criteriaList = new ArrayList<>();
        criteriaList.add(caseExists);
        caseExistsRequest.setRequestInfo(requestInfo);
        caseExistsRequest.setCriteria(criteriaList);
        return caseExistsRequest;
    }
    public OrderExistsRequest createOrderExistRequest(RequestInfo requestInfo, Application application){
        OrderExistsRequest orderExistsRequest = new OrderExistsRequest();
        orderExistsRequest.setRequestInfo(requestInfo);
        List<OrderExists> criteriaList = new ArrayList<>();
        OrderExists orderExists = new OrderExists();
        orderExists.setOrderId(application.getReferenceId());
        criteriaList.add(orderExists);
        orderExistsRequest.setOrder(criteriaList);
        return orderExistsRequest;
    }
    public void validateOrderDetails(ApplicationRequest applicationRequest) {
        if (applicationRequest.getApplication().getReferenceId() != null) {
            OrderExistsRequest orderExistsRequest = createOrderExistRequest(applicationRequest.getRequestInfo(), applicationRequest.getApplication());
            if (!orderUtil.fetchOrderDetails(orderExistsRequest)) {
                throw new CustomException(ORDER_EXCEPTION, "Order does not exist");
            }
        }
    }

    private void validateDocuments(Application application){
        if (application.getDocuments() != null && !application.getDocuments().isEmpty()) {
            application.getDocuments().forEach(document -> {
                if (document.getFileStore() != null) {
                    if (!fileStoreUtil.doesFileExist(application.getTenantId(), document.getFileStore()))
                        throw new CustomException(INVALID_FILESTORE_ID, INVALID_DOCUMENT_DETAILS);
                } else
                    throw new CustomException(INVALID_FILESTORE_ID, INVALID_DOCUMENT_DETAILS);

            });
        }
    }

    public void validateApplicationSearchRequest(ApplicationSearchRequest request) {
        String asUser = request.getCriteria().getAsUser();
        RequestInfo requestInfo = request.getRequestInfo();
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

        String filingNumber = request.getCriteria().getFilingNumber();
        List<UUID> onBehalfOf = request.getCriteria().getOnBehalfOf();
        if ((isAdvocate || isClerk) && onBehalfOf != null && !onBehalfOf.isEmpty() && asUser != null && filingNumber != null) {
            CourtCase courtCase = fetchCourtCase(filingNumber, requestInfo);
            if (!asUser.equals(userUuid)) {
                validateOfficeAdvocateMapping(asUser, userUuid, courtCase);
            }
            validateAdvocateLitigantMapping(onBehalfOf, asUser, courtCase, requestInfo, config.getStateLevelTenantId());
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

    private void validateOfficeAdvocateMapping(String officeAdvocateUserUuid, String memberUserUuid, CourtCase courtCase) {
        boolean isOfficeMappingValid = Optional.ofNullable(courtCase.getAdvocateOffices())
                .orElse(Collections.emptyList())
                .stream()
                .filter(office -> officeAdvocateUserUuid.equals(office.getOfficeAdvocateUserUuid()))
                .anyMatch(office -> {
                    Stream<AdvocateOfficeMember> membersStream = Stream.concat(
                            Optional.ofNullable(office.getAdvocates()).orElse(Collections.emptyList()).stream(),
                            Optional.ofNullable(office.getClerks()).orElse(Collections.emptyList()).stream()
                    );
                    return membersStream.anyMatch(member -> memberUserUuid.equals(member.getMemberUserUuid()));
                });

        if (!isOfficeMappingValid) {
            throw new CustomException(VALIDATION_ERR,
                    String.format("%s is not a member of %s's office in case %s",
                            memberUserUuid, officeAdvocateUserUuid, courtCase.getFilingNumber()));
        }
    }

    private void validateAdvocateLitigantMapping(List<UUID> onBehalfOf, String asUser, CourtCase courtCase,
                                                  RequestInfo requestInfo, String tenantId) {
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
}
