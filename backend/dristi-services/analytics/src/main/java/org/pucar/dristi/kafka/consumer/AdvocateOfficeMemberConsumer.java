package org.pucar.dristi.kafka.consumer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.egov.common.contract.request.RequestInfo;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.util.CaseUtil;
import org.pucar.dristi.util.PendingTaskUtil;
import org.pucar.dristi.util.WorkflowUtil;
import org.pucar.dristi.web.models.CaseCriteria;
import org.pucar.dristi.web.models.CaseSearchRequest;
import org.pucar.dristi.web.models.advocateofficemember.AdvocateOfficeCaseMember;
import org.pucar.dristi.web.models.advocateofficemember.AdvocateOfficeCaseMemberRequest;
import org.pucar.dristi.web.models.advocateofficemember.LeaveOfficeRequest;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.*;

@Slf4j
@Component
public class AdvocateOfficeMemberConsumer {

    private final PendingTaskUtil pendingTaskUtil;
    private final ObjectMapper objectMapper;
    private final CaseUtil caseUtil;
    private final WorkflowUtil workflowUtil;

    private final Configuration configuration;

    public AdvocateOfficeMemberConsumer(PendingTaskUtil pendingTaskUtil, ObjectMapper objectMapper, CaseUtil caseUtil, WorkflowUtil workflowUtil, Configuration configuration) {
        this.pendingTaskUtil = pendingTaskUtil;
        this.objectMapper = objectMapper;
        this.caseUtil = caseUtil;
        this.workflowUtil = workflowUtil;
        this.configuration = configuration;
    }

    @KafkaListener(topics = "${kafka.topics.advocate.office.member.analytics}")
    public void listenAddMemberAnalytics(ConsumerRecord<String, Map<String, Object>> consumerRecord) {
        try {
            log.info("Received add member analytics trigger from topic: {}", consumerRecord.topic());
            Map<String, Object> jsonMap = consumerRecord.value();
            AdvocateOfficeCaseMemberRequest request = objectMapper.convertValue(jsonMap, AdvocateOfficeCaseMemberRequest.class);

            if (request.getMembers() == null || request.getMembers().isEmpty()) {
                log.info("No members found in request, skipping");
                return;
            }

            // Get unique office advocate user UUIDs to update their pending tasks
            Map<String, String> officeAdvocateMap = new HashMap<>();
            for (AdvocateOfficeCaseMember member : request.getMembers()) {
                if (member.getOfficeAdvocateUserUuid() != null && member.getOfficeAdvocateId() != null) {
                    officeAdvocateMap.put(member.getOfficeAdvocateUserUuid(), member.getOfficeAdvocateId().toString());
                }
            }

            // For each office advocate, fetch their pending tasks and re-index them
            for (Map.Entry<String, String> entry : officeAdvocateMap.entrySet()) {
                updatePendingTasksForAdvocate(entry.getKey(), request.getRequestInfo(), entry.getValue());
            }

            // Group members by office advocate UUID to avoid duplicate workflow searches
            Map<String, List<AdvocateOfficeCaseMember>> membersByOfficeAdvocate = new HashMap<>();
            for (AdvocateOfficeCaseMember member : request.getMembers()) {
                if (member.getOfficeAdvocateUserUuid() != null && member.getMemberUserUuid() != null) {
                    membersByOfficeAdvocate
                            .computeIfAbsent(member.getOfficeAdvocateUserUuid(), k -> new ArrayList<>())
                            .add(member);
                }
            }

            // Search workflow once per office advocate and upsert all their members
            for (Map.Entry<String, List<AdvocateOfficeCaseMember>> entry : membersByOfficeAdvocate.entrySet()) {
                String officeAdvocateUuid = entry.getKey();
                List<AdvocateOfficeCaseMember> members = entry.getValue();

                try {
                    String tenantId = members.get(0).getTenantId();

                    // Search workflow by office advocate with query-level filtering based on MDMS configuration
                    // This filters by businessService and states at the API level instead of validating after fetching
                    List<String> processInstanceIds = workflowUtil.searchWorkflowByAssigneeForAllConfigurations(
                            request.getRequestInfo(),
                            officeAdvocateUuid,
                            tenantId
                    );

                    if (processInstanceIds != null && !processInstanceIds.isEmpty()) {
                        log.info("Found {} process instance IDs for office advocate: {} matching MDMS configuration", processInstanceIds.size(), officeAdvocateUuid);

                        // Collect all member UUIDs for this office advocate
                        Set<String> memberUuidSet = new HashSet<>();
                        for (AdvocateOfficeCaseMember member : members) {
                            memberUuidSet.add(member.getMemberUserUuid());
                        }

                        // For each process instance ID, upsert all members at once
                        for (String processInstanceId : processInstanceIds) {
                            try {
                                workflowUtil.upsertAssignees(
                                        request.getRequestInfo(),
                                        memberUuidSet,
                                        processInstanceId,
                                        tenantId
                                );
                                log.info("Successfully upserted {} assignees to process instance {}", memberUuidSet.size(), processInstanceId);
                            } catch (Exception e) {
                                log.error("Error upserting assignees for process instance: {}", processInstanceId, e);
                            }
                        }
                    } else {
                        log.info("No process instance IDs found for office advocate: {} matching MDMS configuration", officeAdvocateUuid);
                    }
                } catch (Exception e) {
                    log.error("Error processing workflow search for office advocate: {}", officeAdvocateUuid, e);
                }
            }

            log.info("Successfully processed add member event for {} office advocates", officeAdvocateMap.size());
        } catch (Exception e) {
            log.error("Error processing add member event", e);
        }
    }

    @KafkaListener(topics = "${kafka.topics.advocate.office.member.update}")
    public void listenLeaveOffice(ConsumerRecord<String, Map<String, Object>> consumerRecord) {
        try {
            log.info("Received leave office event from topic: {}", consumerRecord.topic());
            Map<String, Object> jsonMap = consumerRecord.value();
            LeaveOfficeRequest request = objectMapper.convertValue(jsonMap, LeaveOfficeRequest.class);

            if (request.getLeaveOffice() == null) {
                log.info("No leave office details found in request, skipping");
                return;
            }

            String officeAdvocateUuid = request.getLeaveOffice().getOfficeAdvocateUserUuid() != null
                    ? request.getLeaveOffice().getOfficeAdvocateUserUuid().toString()
                    : null;

            String advocateId = request.getLeaveOffice().getOfficeAdvocateId() != null
                    ? request.getLeaveOffice().getOfficeAdvocateId().toString()
                    : null;

            String memberUserUuid = request.getLeaveOffice().getMemberUserUuid() != null
                    ? request.getLeaveOffice().getMemberUserUuid().toString()
                    : null;

            String tenantId = request.getLeaveOffice().getTenantId();

            if (tenantId == null) {
                tenantId = configuration.getStateLevelTenantId();
            }

            if (officeAdvocateUuid != null) {
                updatePendingTasksForAdvocate(officeAdvocateUuid, request.getRequestInfo(), advocateId);
                log.info("Successfully processed leave office pending tasks for advocate: {}", officeAdvocateUuid);
            }

            if (memberUserUuid != null && officeAdvocateUuid != null && advocateId != null && tenantId != null) {
                processLeaveOfficeWorkflowDeactivation(memberUserUuid, officeAdvocateUuid, advocateId, tenantId, request.getRequestInfo());
            }
        } catch (Exception e) {
            log.error("Error processing leave office event", e);
        }
    }

    private void processLeaveOfficeWorkflowDeactivation(String memberUserUuid, String officeAdvocateUuid, String advocateId, String tenantId, RequestInfo requestInfo) {
        try {
            log.info("Processing workflow assignee deactivation for member: {} leaving office of advocate: {}", memberUserUuid, officeAdvocateUuid);

            // Step 1: Get all cases of the office advocate
            List<Map<String, String>> cases = caseUtil.getCasesByAdvocateId(advocateId, requestInfo);

            if (cases.isEmpty()) {
                log.info("No cases found for office advocate: {}, skipping workflow deactivation", officeAdvocateUuid);
                return;
            }

            log.info("Found {} cases for office advocate: {}", cases.size(), officeAdvocateUuid);

            // Step 2: Process each case individually
            for (Map<String, String> caseInfo : cases) {
                String filingNumber = caseInfo.get("filingNumber");
                String caseId = caseInfo.get("caseId");

                if (filingNumber == null || caseId == null) {
                    log.error("Filing number or caseId not found for case: {}, skipping", caseId);
                    continue;
                }

                try {
                    log.info("Processing case with filingNumber: {} and caseId: {} for member: {}", filingNumber, caseId, memberUserUuid);

                    // Step 3: Get all advocates for this member in this specific case
                    List<String> advocateUuidsForMemberInCase = caseUtil.getAdvocatesForMember(requestInfo, memberUserUuid, caseId);

                    log.info("Found {} advocates for member: {} in case: {}", advocateUuidsForMemberInCase.size(), memberUserUuid, filingNumber);

                    // Step 4: Exclude the office advocate UUID from the list
                    List<String> otherAdvocateUuids = new ArrayList<>(advocateUuidsForMemberInCase);
                    otherAdvocateUuids.remove(officeAdvocateUuid);

                    log.info("After excluding office advocate {}, member {} has {} other advocate(s) in case {}",
                            officeAdvocateUuid, memberUserUuid, otherAdvocateUuids.size(), filingNumber);

                    // Step 5: Search for process instance IDs with memberUserUuid, businessId (filingNumber), and exclude other advocates
                    List<String> processInstanceIds = workflowUtil.searchProcessInstanceIdsWithExclude(
                            requestInfo,
                            memberUserUuid,
                            otherAdvocateUuids,
                            filingNumber,
                            tenantId
                    );

                    if (processInstanceIds != null && !processInstanceIds.isEmpty()) {
                        log.info("Found {} process instances to deactivate assignee for member: {} in case: {}", processInstanceIds.size(), memberUserUuid, filingNumber);

                        // Step 6: Deactivate assignee for each process instance
                        for (String processInstanceId : processInstanceIds) {
                            try {
                                workflowUtil.deactivateAssignee(requestInfo, memberUserUuid, processInstanceId, tenantId);
                                log.info("Successfully deactivated assignee {} for process instance {} in case {}", memberUserUuid, processInstanceId, filingNumber);
                            } catch (Exception e) {
                                log.error("Error deactivating assignee for process instance: {} in case: {}", processInstanceId, filingNumber, e);
                            }
                        }
                    } else {
                        log.info("No process instances found for member: {} in case: {}", memberUserUuid, filingNumber);
                    }
                } catch (Exception e) {
                    log.error("Error processing workflow deactivation for case: {}", filingNumber, e);
                }
            }

            log.info("Completed processing workflow assignee deactivation for member: {}", memberUserUuid);
        } catch (Exception e) {
            log.error("Error processing leave office workflow deactivation for member: {}", memberUserUuid, e);
        }
    }

    private void updatePendingTasksForAdvocate(String advocateUuid, RequestInfo requestInfo, String advocateId) {
        try {
            log.info("Fetching cases for advocate: {}", advocateUuid);

            // Step 1: Get all cases for this advocate
            List<Map<String, String>> cases = caseUtil.getCasesByAdvocateId(advocateId, requestInfo);

            if (cases.isEmpty()) {
                log.info("No cases found for advocate: {}", advocateUuid);
                return;
            }

            log.info("Found {} cases for advocate: {}", cases.size(), advocateUuid);

            // Step 2: For each case, fetch pending tasks and case details, then update
            Set<String> processedCaseIds = new HashSet<>();

            for (Map<String, String> caseInfo : cases) {
                String filingNumber = caseInfo.get("filingNumber");
                String caseId = caseInfo.get("caseId");

                // Skip if we've already processed this caseId
                if (caseId == null || processedCaseIds.contains(caseId)) {
                    continue;
                }

                processedCaseIds.add(caseId);

                try {
                    log.info("Fetching pending tasks for case with filingNumber: {} assigned to advocate: {}", filingNumber, advocateUuid);
                    JsonNode response = pendingTaskUtil.callPendingTaskByFilingNumberAndAssignedTo(filingNumber, advocateUuid);

                    if (response != null && response.has("hits") && response.get("hits").has("hits")) {
                        JsonNode hits = response.get("hits").get("hits");
                        if (hits.isArray() && !hits.isEmpty()) {
                            List<JsonNode> pendingTasks = new ArrayList<>();
                            for (JsonNode hit : hits) {
                                pendingTasks.add(hit);
                            }
                            log.info("Found {} pending tasks for filingNumber: {} assigned to advocate: {}", pendingTasks.size(), filingNumber, advocateUuid);

                            // Fetch case details once for this filingNumber and caseId
                            CaseCriteria criteria = CaseCriteria.builder()
                                    .filingNumber(filingNumber)
                                    .caseId(caseId)
                                    .defaultFields(false)
                                    .build();
                            CaseSearchRequest caseSearchRequest = CaseSearchRequest.builder()
                                    .requestInfo(requestInfo)
                                    .criteria(Collections.singletonList(criteria))
                                    .build();
                            JsonNode caseDetails = caseUtil.searchCaseDetails(caseSearchRequest);

                            // Update pending tasks with case details
                            pendingTaskUtil.updatePendingTask(pendingTasks, caseDetails);
                            log.info("Successfully updated pending tasks for filingNumber: {}", filingNumber);
                        }
                    }
                } catch (Exception e) {
                    log.error("Error processing pending tasks for filingNumber: {} assigned to advocate: {}", filingNumber, advocateUuid, e);
                    // Continue with next case even if one fails
                }
            }

            log.info("Completed updating pending tasks for advocate: {}", advocateUuid);

        } catch (Exception e) {
            log.error("Error updating pending tasks for advocate: {}", advocateUuid, e);
        }
    }
}
