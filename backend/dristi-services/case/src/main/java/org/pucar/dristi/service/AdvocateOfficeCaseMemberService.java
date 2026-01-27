package org.pucar.dristi.service;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.AuditDetails;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.kafka.Producer;
import org.pucar.dristi.repository.AdvocateOfficeCaseMemberRepository;
import org.pucar.dristi.util.AdvocateUtil;
import org.pucar.dristi.web.models.Advocate;
import org.pucar.dristi.web.models.Individual;
import org.pucar.dristi.web.models.advocateofficemember.AddMemberRequest;
import org.pucar.dristi.web.models.advocateofficemember.AdvocateOfficeCaseMember;
import org.pucar.dristi.web.models.advocateofficemember.AdvocateOfficeCaseMemberRequest;
import org.pucar.dristi.web.models.advocateofficemember.LeaveOfficeRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class AdvocateOfficeCaseMemberService {

    private final AdvocateOfficeCaseMemberRepository repository;
    private final Producer producer;
    private final Configuration configuration;
    private final IndividualService individualService;
    private final AdvocateUtil advocateUtil;

    @Autowired
    public AdvocateOfficeCaseMemberService(AdvocateOfficeCaseMemberRepository repository,
                                           Producer producer,
                                           Configuration configuration,
                                           IndividualService individualService,
                                           AdvocateUtil advocateUtil) {
        this.repository = repository;
        this.producer = producer;
        this.configuration = configuration;
        this.individualService = individualService;
        this.advocateUtil = advocateUtil;
    }

    public void processAddMember(AddMemberRequest request) {
        try {
            log.info("Processing add member request for officeAdvocateId (userUuid): {}, memberId: {}",
                    request.getAddMember().getOfficeAdvocateId(),
                    request.getAddMember().getMemberId());

            String userUuid = request.getAddMember().getOfficeAdvocateId().toString();

            // Convert userUuid to individualId
            List<Individual> individuals = individualService.getIndividuals(
                    request.getRequestInfo(),
                    Collections.singletonList(userUuid)
            );

            if (individuals.isEmpty()) {
                log.error("No individual found for userUuid: {}. Skipping member addition.", userUuid);
                return;
            }

            String individualId = individuals.get(0).getIndividualId();
            log.info("Found individualId: {} for userUuid: {}", individualId, userUuid);

            // Convert individualId to advocateId
            List<Advocate> advocates = advocateUtil.fetchAdvocatesByIndividualId(
                    request.getRequestInfo(),
                    individualId
            );

            if (advocates.isEmpty()) {
                log.error("No active advocate found for individualId: {}. Skipping member addition.", individualId);
                return;
            }

            String advocateId = advocates.get(0).getId().toString();
            log.info("Found advocateId: {} for individualId: {}", advocateId, individualId);

            List<String> caseIds = repository.getCaseIdsByAdvocateId(advocateId);

            if (caseIds.isEmpty()) {
                log.info("No cases found for advocateId: {}. Skipping member addition.", advocateId);
                return;
            }

            log.info("Found {} cases for advocateId: {}", caseIds.size(), advocateId);

            List<AdvocateOfficeCaseMember> members = new ArrayList<>();

            for (String caseId : caseIds) {
                AdvocateOfficeCaseMember member = AdvocateOfficeCaseMember.builder()
                        .id(UUID.randomUUID())
                        .officeAdvocateId(request.getAddMember().getOfficeAdvocateId())
                        .caseId(UUID.fromString(caseId))
                        .memberId(request.getAddMember().getMemberId())
                        .memberType(request.getAddMember().getMemberType())
                        .isActive(request.getAddMember().getIsActive() != null ? request.getAddMember().getIsActive() : true)
                        .auditDetails(createAuditDetails(request))
                        .build();

                members.add(member);
            }

            if (!members.isEmpty()) {
                AdvocateOfficeCaseMemberRequest memberRequest = AdvocateOfficeCaseMemberRequest.builder()
                        .requestInfo(request.getRequestInfo())
                        .members(members)
                        .build();

                producer.push(configuration.getAdvocateOfficeCaseMemberSaveTopic(), memberRequest);
                log.info("Successfully published {} members to save topic", members.size());
            }

        } catch (Exception e) {
            log.error("Error processing add member request", e);
            throw e;
        }
    }

    public void processLeaveOffice(LeaveOfficeRequest request) {
        try {
            log.info("Processing leave office request for officeAdvocateId: {}, memberId: {}",
                    request.getLeaveOffice().getOfficeAdvocateId(),
                    request.getLeaveOffice().getMemberId());

            request.getLeaveOffice().setIsActive(false);
            request.getLeaveOffice().setAuditDetails(createAuditDetailsForLeave(request));

            producer.push(configuration.getAdvocateOfficeCaseMemberUpdateTopic(), request);
            log.info("Successfully published leave office request to update topic");

        } catch (Exception e) {
            log.error("Error processing leave office request", e);
            throw e;
        }
    }

    private AuditDetails createAuditDetails(AddMemberRequest request) {
        Long currentTime = System.currentTimeMillis();
        String userId = request.getRequestInfo() != null && request.getRequestInfo().getUserInfo() != null ?
                request.getRequestInfo().getUserInfo().getUuid() : "SYSTEM";

        return AuditDetails.builder()
                .createdBy(userId)
                .createdTime(currentTime)
                .lastModifiedBy(userId)
                .lastModifiedTime(currentTime)
                .build();
    }

    private AuditDetails createAuditDetailsForLeave(LeaveOfficeRequest request) {
        Long currentTime = System.currentTimeMillis();
        String userId = request.getRequestInfo() != null && request.getRequestInfo().getUserInfo() != null ?
                request.getRequestInfo().getUserInfo().getUuid() : "SYSTEM";

        AuditDetails auditDetails = request.getLeaveOffice().getAuditDetails();
        auditDetails.setLastModifiedBy(userId);
        auditDetails.setLastModifiedTime(currentTime);

        return auditDetails;

    }
}
