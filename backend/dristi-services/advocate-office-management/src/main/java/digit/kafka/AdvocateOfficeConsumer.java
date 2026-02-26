package digit.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import digit.service.AdvocateOfficeService;
import digit.util.CaseUtil;
import digit.web.models.*;
import digit.web.models.enums.CaseMappingFilterStatus;
import digit.web.models.enums.MemberType;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

import static digit.web.models.enums.AccessType.ALL_CASES;

@Component
@Slf4j
public class AdvocateOfficeConsumer {

    private final AdvocateOfficeService advocateOfficeService;
    private final CaseUtil caseUtil;
    private final ObjectMapper objectMapper;

    @Autowired
    public AdvocateOfficeConsumer(AdvocateOfficeService advocateOfficeService, CaseUtil caseUtil, ObjectMapper objectMapper) {
        this.advocateOfficeService = advocateOfficeService;
        this.caseUtil = caseUtil;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = {"${update.member.access.kafka.topic}"})
    public void updateCaseSpecificAccess(ConsumerRecord<String, Object> payload,
                                         @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {

        log.info("Received message on topic: {}", topic);

        try {
            UpdateMemberAccessRequest request =
                    objectMapper.convertValue(payload.value(), UpdateMemberAccessRequest.class);

            if (!isValidRequest(request)) {
                log.error("Invalid request received: {}", payload.value());
                return;
            }

            UpdateMemberAccess access = request.getUpdateMemberAccess();

            if (!ALL_CASES.equals(access.getAccessType())) {
                log.info("Access type is not ALL_CASES. Skipping processing.");
                return;
            }

            AddMember officeMapping = fetchOfficeMapping(request);
            if (officeMapping == null) {
                log.error("No office mapping found for request: {}", request);
                return;
            }

            List<String> unassignedCaseIds = fetchUnassignedCaseIds(request, officeMapping);

            if (unassignedCaseIds.isEmpty()) {
                log.info("No unassigned cases found.");
                return;
            }

            log.info("Processing {} unassigned cases", unassignedCaseIds.size());
            processCaseMember(request, unassignedCaseIds, officeMapping);

            log.info("Successfully processed update access request");

        } catch (Exception e) {
            log.error("Error while processing topic: {}", topic, e);
        }
    }

    // ----------------- Private Helpers -----------------

    private boolean isValidRequest(UpdateMemberAccessRequest request) {
        return request != null && request.getUpdateMemberAccess() != null;
    }

    private AddMember fetchOfficeMapping(UpdateMemberAccessRequest request) {

        UpdateMemberAccess access = request.getUpdateMemberAccess();

        MemberSearchCriteria searchCriteria = MemberSearchCriteria.builder()
                .officeAdvocateId(access.getOfficeAdvocateId())
                .memberId(access.getMemberId())
                .tenantId(access.getTenantId())
                .isActive(true)
                .build();

        MemberSearchRequest searchRequest = MemberSearchRequest.builder()
                .requestInfo(request.getRequestInfo())
                .searchCriteria(searchCriteria)
                .build();

        List<AddMember> members = advocateOfficeService.searchMembers(searchRequest);

        return (members == null || members.isEmpty()) ? null : members.get(0);
    }

    private List<String> fetchUnassignedCaseIds(UpdateMemberAccessRequest request,
                                                AddMember officeMapping) {

        UpdateMemberAccess access = request.getUpdateMemberAccess();

        CaseMemberSearchCriteria criteria = CaseMemberSearchCriteria.builder()
                .tenantId(access.getTenantId())
                .officeAdvocateUserUuid(officeMapping.getOfficeAdvocateUserUuid())
                .memberUserUuid(officeMapping.getMemberUserUuid())
                .advocateId(access.getOfficeAdvocateId().toString())
                .caseMappingFilterStatus(CaseMappingFilterStatus.UNASSIGNED_CASES)
                .build();

        CaseMemberSearchRequest searchRequest = CaseMemberSearchRequest.builder()
                .requestInfo(request.getRequestInfo())
                .criteria(criteria)
                .build();

        CaseMemberSearchResponse response = caseUtil.searchCaseMembers(searchRequest);

        if (response == null || response.getCases() == null) {
            return Collections.emptyList();
        }

        return response.getCases()
                .stream()
                .filter(Objects::nonNull)
                .map(caseInfo -> caseInfo.getCaseId().toString())
                .collect(Collectors.toList());
    }

    private void processCaseMember(UpdateMemberAccessRequest request,
                                   List<String> caseIds,
                                   AddMember officeMapping) {

        UpdateMemberAccess access = request.getUpdateMemberAccess();

        ProcessCaseMember processCaseMember = ProcessCaseMember.builder()
                .addCaseIds(caseIds)
                .tenantId(access.getTenantId())
                .memberUserUuid(officeMapping.getMemberUserUuid())
                .officeAdvocateUserUuid(officeMapping.getOfficeAdvocateUserUuid())
                .officeAdvocateId(access.getOfficeAdvocateId())
                .memberId(access.getMemberId())
                .officeAdvocateName(officeMapping.getOfficeAdvocateName())
                .memberType(officeMapping.getMemberType())
                .memberName(officeMapping.getMemberName())
                .build();

        ProcessCaseMemberRequest processRequest = ProcessCaseMemberRequest.builder()
                .requestInfo(request.getRequestInfo())
                .processCaseMember(processCaseMember)
                .build();

        caseUtil.processCaseMember(processRequest);
    }
}