package org.pucar.dristi.kafka.consumer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.egov.common.contract.request.RequestInfo;
import org.pucar.dristi.util.CaseUtil;
import org.pucar.dristi.util.PendingTaskUtil;
import org.pucar.dristi.util.WorkflowUtil;
import org.pucar.dristi.web.models.CaseCriteria;
import org.pucar.dristi.web.models.CaseSearchRequest;
import org.pucar.dristi.web.models.workflow.Assignee;
import org.pucar.dristi.web.models.workflow.ProcessInstance;
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

    public AdvocateOfficeMemberConsumer(PendingTaskUtil pendingTaskUtil, ObjectMapper objectMapper, CaseUtil caseUtil, WorkflowUtil workflowUtil) {
        this.pendingTaskUtil = pendingTaskUtil;
        this.objectMapper = objectMapper;
        this.caseUtil = caseUtil;
        this.workflowUtil = workflowUtil;
    }

    @KafkaListener(topics = "${kafka.topics.advocate.office.member.save}")
    public void listenAddMember(ConsumerRecord<String, Map<String, Object>> consumerRecord) {
        try {
            log.info("Received add member event from topic: {}", consumerRecord.topic());
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
                    
                    // Search workflow by office advocate to get all their process instances (once per advocate)
                    List<ProcessInstance> processInstances = workflowUtil.searchWorkflowByAssignee(
                            request.getRequestInfo(), 
                            officeAdvocateUuid, 
                            tenantId
                    );

                    if (processInstances != null && !processInstances.isEmpty()) {
                        log.info("Found {} process instances for office advocate: {}", processInstances.size(), officeAdvocateUuid);
                        
                        // Collect all member UUIDs for this office advocate
                        Set<String> memberUuidSet = new HashSet<>();
                        for (AdvocateOfficeCaseMember member : members) {
                            memberUuidSet.add(member.getMemberUserUuid());
                        }
                        
                        // For each process instance, upsert all members at once
                        for (ProcessInstance processInstance : processInstances) {
                            if (processInstance.getId() != null) {
                                try {
                                    // Extract state name from State object
                                    String stateName = processInstance.getState() != null ? processInstance.getState().getState() : null;
                                    // Validate if businessService and state match MDMS configuration
                                    if (workflowUtil.shouldUpsertAssignee(processInstance.getBusinessService(), stateName)) {
                                        workflowUtil.upsertAssignees(
                                                request.getRequestInfo(),
                                                memberUuidSet,
                                                processInstance.getId(),
                                                tenantId
                                        );
                                        log.info("Successfully upserted {} assignees to process instance {}", memberUuidSet.size(), processInstance.getId());
                                    } else {
                                        log.info("Skipping assignee upsert for process instance {} as businessService: {} and state: {} do not match MDMS configuration", 
                                                processInstance.getId(), processInstance.getBusinessService(), stateName);
                                    }
                                } catch (Exception e) {
                                    log.error("Error upserting assignees for process instance: {}", processInstance.getId(), e);
                                }
                            }
                        }
                    } else {
                        log.info("No process instances found for office advocate: {}", officeAdvocateUuid);
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

            // Step 2: For each case, get advocates for the member and check if they should be deactivated
            for (Map<String, String> caseInfo : cases) {
                String caseId = caseInfo.get("caseId");
                
                if (caseId == null) {
                    continue;
                }

                try {
                    // Get all advocates for this member in this case
                    List<String> advocateUuidsForMember = caseUtil.getAdvocatesForMember(requestInfo, memberUserUuid, caseId);
                    
                    // Exclude the office advocate UUID from the list
                    advocateUuidsForMember.remove(officeAdvocateUuid);
                    
                    // If the member is not associated with any other advocate in this case, deactivate assignees
                    if (advocateUuidsForMember.isEmpty()) {
                        log.info("Member {} is not associated with any other advocate in case {}, proceeding with deactivation", memberUserUuid, caseId);
                        
                        // Step 3: Search for assignees by member UUID
                        List<Assignee> assignees = workflowUtil.searchAssigneesByMemberUuid(requestInfo, memberUserUuid, tenantId);
                        
                        if (assignees != null && !assignees.isEmpty()) {
                            log.info("Found {} assignees to deactivate for member: {}", assignees.size(), memberUserUuid);
                            
                            // Step 4: Deactivate each assignee
                            for (Assignee assignee : assignees) {
                                if (assignee.getProcessInstanceId() != null && assignee.getIsActive()) {
                                    try {
                                        workflowUtil.deactivateAssignee(requestInfo, memberUserUuid, assignee.getProcessInstanceId(), tenantId);
                                        log.info("Successfully deactivated assignee {} for process instance {}", memberUserUuid, assignee.getProcessInstanceId());
                                    } catch (Exception e) {
                                        log.error("Error deactivating assignee for process instance: {}", assignee.getProcessInstanceId(), e);
                                    }
                                }
                            }
                        } else {
                            log.info("No active assignees found for member: {} in case: {}", memberUserUuid, caseId);
                        }
                    } else {
                        log.info("Member {} is still associated with {} other advocate(s) in case {}, skipping deactivation", 
                                memberUserUuid, advocateUuidsForMember.size(), caseId);
                    }
                } catch (Exception e) {
                    log.error("Error processing workflow deactivation for case: {}", caseId, e);
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
