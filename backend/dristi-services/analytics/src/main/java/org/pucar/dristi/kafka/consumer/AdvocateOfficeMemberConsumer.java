package org.pucar.dristi.kafka.consumer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.egov.common.contract.request.RequestInfo;
import org.pucar.dristi.util.CaseUtil;
import org.pucar.dristi.util.PendingTaskUtil;
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

    public AdvocateOfficeMemberConsumer(PendingTaskUtil pendingTaskUtil, ObjectMapper objectMapper, CaseUtil caseUtil) {
        this.pendingTaskUtil = pendingTaskUtil;
        this.objectMapper = objectMapper;
        this.caseUtil = caseUtil;
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

            if (officeAdvocateUuid != null) {
                updatePendingTasksForAdvocate(officeAdvocateUuid, request.getRequestInfo(), advocateId);
                log.info("Successfully processed leave office event for advocate: {}", officeAdvocateUuid);
            }
        } catch (Exception e) {
            log.error("Error processing leave office event", e);
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
