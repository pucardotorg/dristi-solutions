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
import org.pucar.dristi.web.models.Pagination;
import org.pucar.dristi.web.models.advocateofficemember.*;
import org.pucar.dristi.web.models.enums.MemberType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.UUID;

import static org.pucar.dristi.web.models.enums.OfficeManagementStatus.IN_PROGRESS;

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

            cacheService.save(request.getAddMember().getOfficeAdvocateUserUuid() + "-" + request.getAddMember().getMemberUserUuid(), IN_PROGRESS);

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
            int publishedBatchCount = 0;

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
                    publishedBatchCount++;
                    
                    AdvocateOfficeCaseMemberRequest batchRequest = AdvocateOfficeCaseMemberRequest.builder()
                            .requestInfo(request.getRequestInfo())
                            .members(new ArrayList<>(currentBatch))
                            .build();

                    // Update Redis cache for this batch
                    updateRedisCacheForAddMember(batchRequest);

                    // Push to save topic for persistence
                    producer.push(configuration.getAdvocateOfficeCaseMemberSaveTopic(), batchRequest);
                    log.info("Successfully published batch {}/{} with {} members to save topic",
                            publishedBatchCount, batchCount, currentBatch.size());

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

            cacheService.save(request.getLeaveOffice().getOfficeAdvocateUserUuid() + "-" + request.getLeaveOffice().getMemberUserUuid(), IN_PROGRESS);

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

    private AuditDetails createAuditDetailsForProcessCaseMember(ProcessCaseMemberRequest request) {
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

    public CaseMemberSearchResponse searchCaseMembers(CaseMemberSearchRequest request) {
        try {
            CaseMemberSearchCriteria criteria = request.getCriteria();
            Pagination pagination = request.getPagination();

            log.info("Searching case members for officeAdvocateUserUuid: {} and memberUserUuid: {}",
                    criteria.getOfficeAdvocateUserUuid(),
                    criteria.getMemberUserUuid());

            // Get total count
            Integer totalCount = repository.getCaseMembersTotalCount(criteria);

            log.info("Total case members found: {}", totalCount);

            // Set total count in pagination if pagination is provided
            if (pagination != null) {
                pagination.setTotalCount(totalCount.doubleValue());
            }

            // Fetch paginated results
            List<CaseMemberInfo> caseMembers = repository.searchCaseMembers(criteria, pagination);

            log.info("Found {} case members in current page", caseMembers.size());
            
            return CaseMemberSearchResponse.builder()
                    .cases(caseMembers)
                    .totalCount(totalCount)
                    .pagination(pagination)
                    .build();
        } catch (Exception e) {
            log.error("Error searching case members", e);
            throw e;
        }
    }

    public void processCaseMember(ProcessCaseMemberRequest request) {
        try {
            log.info("Processing case member request for advocateUserUuid: {}, memberUserUuid: {}",
                    request.getProcessCaseMember().getOfficeAdvocateUserUuid(),
                    request.getProcessCaseMember().getMemberUserUuid());

            ProcessCaseMember processCaseMember = request.getProcessCaseMember();

            int batchSize = configuration.getBatchSize();
            List<AdvocateOfficeCaseMember> currentBatch = new ArrayList<>();

            int totalCases = 0;

            // Combine both lists logically
            List<String> addCaseIds = processCaseMember.getAddCaseIds();
            List<String> removeCaseIds = processCaseMember.getRemoveCaseIds();

            if (addCaseIds != null) totalCases += addCaseIds.size();
            if (removeCaseIds != null) totalCases += removeCaseIds.size();

            int processed = 0;

            // -------- ADD CASES ----------
            if (addCaseIds != null) {
                for (String caseId : addCaseIds) {
                    currentBatch.add(
                            buildCaseMember(processCaseMember, caseId, true, request)
                    );

                    processed++;
                    pushBatchIfNeeded(currentBatch, batchSize, processed, totalCases, request);
                }
            }

            // -------- REMOVE CASES ----------
            if (removeCaseIds != null) {
                for (String caseId : removeCaseIds) {
                    currentBatch.add(
                            buildCaseMember(processCaseMember, caseId, false, request)
                    );

                    processed++;
                    pushBatchIfNeeded(currentBatch, batchSize, processed, totalCases, request);
                }
            }

            log.info("Completed processing {} cases in batches", totalCases);

        } catch (Exception e) {
            log.error("Error processing case member request", e);
            throw e;
        }
    }

    private AdvocateOfficeCaseMember buildCaseMember(
            ProcessCaseMember processCaseMember,
            String caseId,
            boolean isActive,
            ProcessCaseMemberRequest request) {

        return AdvocateOfficeCaseMember.builder()
                .id(UUID.randomUUID())
                .tenantId(processCaseMember.getTenantId())
                .officeAdvocateId(processCaseMember.getOfficeAdvocateId())
                .officeAdvocateName(processCaseMember.getOfficeAdvocateName())
                .officeAdvocateUserUuid(processCaseMember.getOfficeAdvocateUserUuid().toString())
                .caseId(UUID.fromString(caseId))
                .memberId(processCaseMember.getMemberId())
                .memberUserUuid(processCaseMember.getMemberUserUuid().toString())
                .memberType(processCaseMember.getMemberType())
                .memberName(processCaseMember.getMemberName())
                .isActive(isActive)
                .auditDetails(createAuditDetailsForProcessCaseMember(request))
                .build();
    }

    private void updateRedisCacheForProcessCaseMember(
            AdvocateOfficeCaseMemberRequest memberRequest) {

        List<AdvocateOfficeCaseMember> members = memberRequest.getMembers();

        if (members == null || members.isEmpty()) {
            return;
        }

        members.forEach(member -> {
            try {
                String caseId = member.getCaseId().toString();
                String tenantId = member.getTenantId();
                String redisKey = tenantId + ":" + caseId;

                Object cachedValue = cacheService.findById(redisKey);
                if (cachedValue == null) {
                    return;
                }

                CourtCase courtCase = objectMapper.convertValue(cachedValue, CourtCase.class);
                List<AdvocateOffice> advocateOffices = courtCase.getAdvocateOffices();

                if (advocateOffices == null) {
                    return;
                }

                for (AdvocateOffice office : advocateOffices) {
                    if (!member.getOfficeAdvocateId().toString()
                            .equals(office.getOfficeAdvocateId())) {
                        continue;
                    }

                    // ADD
                    if (Boolean.TRUE.equals(member.getIsActive())) {
                        addMemberToOffice(office, member);
                    }
                    // REMOVE
                    else {
                        removeMemberFromOffice(office, member);
                    }
                }

                cacheService.save(redisKey, courtCase);
                log.info("Updated Redis for caseId: {}", caseId);

            } catch (Exception e) {
                log.warn("Failed updating Redis for caseId: {}", member.getCaseId(), e);
            }
        });
    }

    private void addMemberToOffice(AdvocateOffice office,
                                   AdvocateOfficeCaseMember member) {

        AdvocateOfficeMember officeMember = AdvocateOfficeMember.builder()
                .id(member.getId().toString())
                .tenantId(member.getTenantId())
                .caseId(member.getCaseId().toString())
                .memberId(member.getMemberId().toString())
                .memberUserUuid(member.getMemberUserUuid())
                .memberName(member.getMemberName())
                .memberType(member.getMemberType())
                .isActive(true)
                .auditDetails(member.getAuditDetails())
                .build();

        if (MemberType.ADVOCATE.equals(member.getMemberType())) {
            if (office.getAdvocates() == null) {
                office.setAdvocates(new ArrayList<>());
            }

            boolean exists = office.getAdvocates().stream()
                    .anyMatch(m -> member.getMemberUserUuid()
                            .equals(m.getMemberUserUuid()));

            if (!exists) {
                office.getAdvocates().add(officeMember);
            }

        } else {
            if (office.getClerks() == null) {
                office.setClerks(new ArrayList<>());
            }

            boolean exists = office.getClerks().stream()
                    .anyMatch(m -> member.getMemberUserUuid()
                            .equals(m.getMemberUserUuid()));

            if (!exists) {
                office.getClerks().add(officeMember);
            }
        }
    }

    private void removeMemberFromOffice(AdvocateOffice office,
                                        AdvocateOfficeCaseMember member) {

        if (office.getAdvocates() != null) {
            office.getAdvocates().removeIf(m ->
                    member.getMemberUserUuid().equals(m.getMemberUserUuid()));
        }

        if (office.getClerks() != null) {
            office.getClerks().removeIf(m ->
                    member.getMemberUserUuid().equals(m.getMemberUserUuid()));
        }
    }

    private void pushBatchIfNeeded(
            List<AdvocateOfficeCaseMember> currentBatch,
            int batchSize,
            int processed,
            int totalCases,
            ProcessCaseMemberRequest originalRequest) {

        boolean isBatchFull = currentBatch.size() >= batchSize;
        boolean isLastRecord = processed == totalCases;

        if (isBatchFull || isLastRecord) {

            AdvocateOfficeCaseMemberRequest memberRequest =
                    AdvocateOfficeCaseMemberRequest.builder()
                            .requestInfo(originalRequest.getRequestInfo())
                            .members(new ArrayList<>(currentBatch))
                            .build();

            updateRedisCacheForProcessCaseMember(memberRequest);

            producer.push(configuration.getProcessCaseSpecificAccessTopic(), memberRequest);

            log.info("Published batch of size {}", currentBatch.size());

            currentBatch.clear();
        }
    }

}
