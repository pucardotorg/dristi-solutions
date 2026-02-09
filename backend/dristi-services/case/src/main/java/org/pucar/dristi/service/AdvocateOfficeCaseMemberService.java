package org.pucar.dristi.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.AuditDetails;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.kafka.Producer;
import org.pucar.dristi.repository.AdvocateOfficeCaseMemberRepository;
import org.pucar.dristi.web.models.AdvocateOffice;
import org.pucar.dristi.web.models.AdvocateOfficeMember;
import org.pucar.dristi.web.models.CourtCase;
import org.pucar.dristi.web.models.advocateofficemember.AddMemberRequest;
import org.pucar.dristi.web.models.advocateofficemember.AdvocateOfficeCaseMember;
import org.pucar.dristi.web.models.advocateofficemember.AdvocateOfficeCaseMemberRequest;
import org.pucar.dristi.web.models.advocateofficemember.LeaveOfficeRequest;
import org.pucar.dristi.web.models.advocateofficemember.MemberAdvocatesRequest;
import org.pucar.dristi.web.models.enums.MemberType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class AdvocateOfficeCaseMemberService {

    private final AdvocateOfficeCaseMemberRepository repository;
    private final Producer producer;
    private final Configuration configuration;
    private final CacheService cacheService;
    private final ObjectMapper objectMapper;

    @Autowired
    public AdvocateOfficeCaseMemberService(AdvocateOfficeCaseMemberRepository repository,
                                           Producer producer,
                                           Configuration configuration, CacheService cacheService, ObjectMapper objectMapper) {
        this.repository = repository;
        this.producer = producer;
        this.configuration = configuration;
        this.cacheService = cacheService;
        this.objectMapper = objectMapper;
    }

    public void processAddMember(AddMemberRequest request) {
        try {
            log.info("Processing add member request for officeAdvocateId: {}, memberId: {}",
                    request.getAddMember().getOfficeAdvocateId(),
                    request.getAddMember().getMemberId());

            String advocateId = request.getAddMember().getOfficeAdvocateId().toString();

            List<String> caseIds = repository.getCaseIdsByAdvocateId(advocateId);

            if (caseIds.isEmpty()) {
                log.info("No cases found for advocateId: {}. Skipping member addition.", advocateId);
                return;
            }

            log.info("Found {} cases for advocateId: {}", caseIds.size(), advocateId);

            // Process cases in batches to optimize memory usage and enable streaming
            int batchSize = configuration.getBatchSize();
            int totalCases = caseIds.size();
            int batchCount = (int) Math.ceil((double) totalCases / batchSize);
            
            log.info("Processing {} cases in {} batches of max size {}", totalCases, batchCount, batchSize);

            List<AdvocateOfficeCaseMember> currentBatch = new ArrayList<>();
            int processedCount = 0;

            for (int i = 0; i < totalCases; i++) {
                String caseId = caseIds.get(i);
                
                // Create member for this case
                AdvocateOfficeCaseMember member = AdvocateOfficeCaseMember.builder()
                        .id(UUID.randomUUID())
                        .tenantId(request.getAddMember().getTenantId())
                        .officeAdvocateId(request.getAddMember().getOfficeAdvocateId())
                        .officeAdvocateName(request.getAddMember().getOfficeAdvocateName())
                        .officeAdvocateUserUuid(request.getAddMember().getOfficeAdvocateUserUuid().toString())
                        .caseId(UUID.fromString(caseId))
                        .memberId(request.getAddMember().getMemberId())
                        .memberUserUuid(request.getAddMember().getMemberUserUuid().toString())
                        .memberType(request.getAddMember().getMemberType())
                        .memberName(request.getAddMember().getMemberName())
                        .isActive(request.getAddMember().getIsActive() != null ? request.getAddMember().getIsActive() : true)
                        .auditDetails(createAuditDetails(request))
                        .build();

                currentBatch.add(member);

                // Process batch when it reaches the configured size OR it's the last case
                boolean isBatchFull = currentBatch.size() >= batchSize;
                boolean isLastCase = i == totalCases - 1;

                if (isBatchFull || isLastCase) {
                    processedCount++;
                    
                    AdvocateOfficeCaseMemberRequest batchRequest = AdvocateOfficeCaseMemberRequest.builder()
                            .requestInfo(request.getRequestInfo())
                            .members(new ArrayList<>(currentBatch))
                            .build();

                    // Update Redis cache for this batch
                    updateRedisCacheForAddMember(batchRequest);

                    // Push to save topic for persistence
                    producer.push(configuration.getAdvocateOfficeCaseMemberSaveTopic(), batchRequest);
                    log.info("Successfully published batch {}/{} with {} members to save topic", 
                             processedCount, batchCount, currentBatch.size());

                    // Push to analytics topic only for the LAST batch to trigger processing
                    // This avoids: 1) RecordTooLargeException (message size limit)
                    //              2) Repetitive processing (analytics fetches ALL cases anyway)
                    if (isLastCase) {
                        producer.push(configuration.getAdvocateOfficeCaseMemberAnalyticsTopic(), batchRequest);
                        log.info("Successfully published last batch to analytics topic to trigger processing for advocate");
                    }

                    // Clear batch for next iteration
                    currentBatch.clear();
                }
            }

        } catch (Exception e) {
            log.error("Error processing add member request", e);
            throw e;
        }
    }

    public void processLeaveOffice(LeaveOfficeRequest request) {
        try {
            log.info("Processing leave office request for officeAdvocateId: {}, memberId: {}",
                    request.getLeaveOffice().getOfficeAdvocateUserUuid(),
                    request.getLeaveOffice().getMemberUserUuid());

            request.getLeaveOffice().setIsActive(false);
            request.getLeaveOffice().setAuditDetails(createAuditDetailsForLeave(request));

            // Update Redis cache for leave office
            updateRedisCacheForLeaveOffice(request);

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

    private void updateRedisCacheForAddMember(AdvocateOfficeCaseMemberRequest memberRequest) {
        List<AdvocateOfficeCaseMember> members = memberRequest.getMembers();
        if (members == null || members.isEmpty()) {
            return;
        }

        // Group members by caseId
        members.stream()
                .filter(m -> m.getCaseId() != null)
                .forEach(member -> {
                    try {
                        String caseId = member.getCaseId().toString();
                        String tenantId = member.getTenantId();
                        String redisKey = tenantId + ":" + caseId;

                        Object cachedValue = cacheService.findById(redisKey);
                        if (cachedValue != null) {
                            CourtCase courtCase = objectMapper.convertValue(cachedValue, CourtCase.class);

                            // Transform AdvocateOfficeCaseMember to AdvocateOfficeMember
                            AdvocateOfficeMember officeMember = AdvocateOfficeMember.builder()
                                    .id(member.getId().toString())
                                    .tenantId(member.getTenantId())
                                    .caseId(caseId)
                                    .memberId(member.getMemberId().toString())
                                    .memberUserUuid(member.getMemberUserUuid())
                                    .memberName(member.getMemberName())
                                    .memberType(member.getMemberType())
                                    .isActive(member.getIsActive())
                                    .auditDetails(member.getAuditDetails())
                                    .build();

                            // Get or initialize advocate offices list
                            List<AdvocateOffice> advocateOffices = courtCase.getAdvocateOffices();
                            if (advocateOffices == null) {
                                advocateOffices = new ArrayList<>();
                            }

                            String officeAdvocateId = member.getOfficeAdvocateId().toString();

                            // Find or create the advocate office
                            AdvocateOffice targetOffice = advocateOffices.stream()
                                    .filter(office -> officeAdvocateId.equals(office.getOfficeAdvocateId()))
                                    .findFirst()
                                    .orElse(null);

                            if (targetOffice == null) {
                                targetOffice = AdvocateOffice.builder()
                                        .officeAdvocateId(officeAdvocateId)
                                        .officeAdvocateUserUuid(member.getOfficeAdvocateUserUuid())
                                        .officeAdvocateName(member.getOfficeAdvocateName())
                                        .officeAdvocateUserUuid(member.getOfficeAdvocateUserUuid())
                                        .advocates(new ArrayList<>())
                                        .clerks(new ArrayList<>())
                                        .build();
                                advocateOffices.add(targetOffice);
                            }

                            // Add member to appropriate list based on memberType (only if not already present)
                            if (MemberType.ADVOCATE.equals(member.getMemberType())) {
                                AdvocateOfficeMember existingMember = targetOffice.getAdvocates().stream()
                                        .filter(m -> member.getMemberUserUuid().equals(m.getMemberUserUuid()))
                                        .findFirst()
                                        .orElse(null);
                                
                                if (existingMember != null && Boolean.FALSE.equals(existingMember.getIsActive())) {
                                    existingMember.setIsActive(true);
                                } else if (existingMember == null) {
                                    targetOffice.getAdvocates().add(officeMember);
                                }
                            } else {
                                AdvocateOfficeMember existingMember = targetOffice.getClerks().stream()
                                        .filter(m -> member.getMemberUserUuid().equals(m.getMemberUserUuid()))
                                        .findFirst()
                                        .orElse(null);
                                
                                if (existingMember != null && Boolean.FALSE.equals(existingMember.getIsActive())) {
                                    existingMember.setIsActive(true);
                                } else if (existingMember == null) {
                                    targetOffice.getClerks().add(officeMember);
                                }
                            }

                            courtCase.setAdvocateOffices(advocateOffices);
                            cacheService.save(redisKey, courtCase);
                            log.info("Updated Redis cache for add member, caseId: {}", caseId);
                        }
                    } catch (Exception e) {
                        log.warn("Failed to update Redis cache for member: {}", member.getId(), e);
                    }
                });
    }

    private void updateRedisCacheForLeaveOffice(LeaveOfficeRequest request) {
        String tenantId = request.getLeaveOffice().getTenantId();
        String officeAdvocateId = request.getLeaveOffice().getOfficeAdvocateId().toString();
        String memberUserUuid = request.getLeaveOffice().getMemberUserUuid().toString();

        // Get all case IDs for this advocate
        List<String> caseIds = repository.getCaseIdsByAdvocateId(officeAdvocateId);

        for (String caseId : caseIds) {
            try {
                String redisKey = tenantId + ":" + caseId;
                Object cachedValue = cacheService.findById(redisKey);

                if (cachedValue != null) {
                    CourtCase courtCase = objectMapper.convertValue(cachedValue, CourtCase.class);
                    List<AdvocateOffice> advocateOffices = courtCase.getAdvocateOffices();

                    if (advocateOffices != null) {
                        Iterator<AdvocateOffice> iterator = advocateOffices.iterator();
                        while (iterator.hasNext()) {
                            AdvocateOffice office = iterator.next();
                            if (!officeAdvocateId.equals(office.getOfficeAdvocateId())) {
                                continue;
                            }
                            // Remove member from advocates list
                            if (office.getAdvocates() != null) {
                                office.getAdvocates().removeIf(m -> memberUserUuid.equals(m.getMemberUserUuid()));
                            }
                            // Remove member from clerks list
                            if (office.getClerks() != null) {
                                office.getClerks().removeIf(m -> memberUserUuid.equals(m.getMemberUserUuid()));
                            }

                            if (office.getAdvocates() != null && office.getClerks() != null && office.getAdvocates().isEmpty() && office.getClerks().isEmpty()) {
                                iterator.remove();
                            }
                        }
                        courtCase.setAdvocateOffices(advocateOffices);
                        cacheService.save(redisKey, courtCase);
                        log.info("Updated Redis cache for leave office, caseId: {}", caseId);
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to update Redis cache for caseId: {}", caseId, e);
            }
        }
    }

    public List<String> getAdvocatesForMember(MemberAdvocatesRequest request) {
        try {
            log.info("Fetching advocates for memberUserUuid: {} and caseId: {}", 
                    request.getMemberUserUuid(), request.getCaseId());
            
            List<String> advocateUuids = repository.getAdvocateUuidsByMemberAndCase(
                    request.getMemberUserUuid(), 
                    request.getCaseId()
            );
            
            log.info("Found {} advocates for memberUserUuid: {} and caseId: {}", 
                    advocateUuids.size(), request.getMemberUserUuid(), request.getCaseId());
            
            return advocateUuids;
        } catch (Exception e) {
            log.error("Error fetching advocates for memberUserUuid: {} and caseId: {}", 
                    request.getMemberUserUuid(), request.getCaseId(), e);
            throw e;
        }
    }

}
