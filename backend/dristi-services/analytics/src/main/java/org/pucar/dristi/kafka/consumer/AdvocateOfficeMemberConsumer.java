package org.pucar.dristi.kafka.consumer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.pucar.dristi.util.PendingTaskUtil;
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

    public AdvocateOfficeMemberConsumer(PendingTaskUtil pendingTaskUtil, ObjectMapper objectMapper) {
        this.pendingTaskUtil = pendingTaskUtil;
        this.objectMapper = objectMapper;
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
            Set<String> officeAdvocateUuids = new HashSet<>();
            for (AdvocateOfficeCaseMember member : request.getMembers()) {
                if (member.getOfficeAdvocateUserUuid() != null) {
                    officeAdvocateUuids.add(member.getOfficeAdvocateUserUuid());
                }
            }

            // For each office advocate, fetch their pending tasks and re-index them
            for (String advocateUuid : officeAdvocateUuids) {
                updatePendingTasksForAdvocate(advocateUuid);
            }

            log.info("Successfully processed add member event for {} office advocates", officeAdvocateUuids.size());
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

            if (officeAdvocateUuid != null) {
                updatePendingTasksForAdvocate(officeAdvocateUuid);
                log.info("Successfully processed leave office event for advocate: {}", officeAdvocateUuid);
            }
        } catch (Exception e) {
            log.error("Error processing leave office event", e);
        }
    }

    private void updatePendingTasksForAdvocate(String advocateUuid) {
        try {
            log.info("Fetching pending tasks for advocate: {}", advocateUuid);
            JsonNode response = pendingTaskUtil.callPendingTaskByAssignedTo(advocateUuid);

            if (response != null && response.has("hits") && response.get("hits").has("hits")) {
                JsonNode hits = response.get("hits").get("hits");
                if (hits.isArray() && !hits.isEmpty()) {
                    List<JsonNode> pendingTasks = new ArrayList<>();
                    for (JsonNode hit : hits) {
                        pendingTasks.add(hit);
                    }
                    log.info("Found {} pending tasks for advocate: {}", pendingTasks.size(), advocateUuid);
                    pendingTaskUtil.updatePendingTask(pendingTasks);
                } else {
                    log.info("No pending tasks found for advocate: {}", advocateUuid);
                }
            }
        } catch (Exception e) {
            log.error("Error updating pending tasks for advocate: {}", advocateUuid, e);
        }
    }
}
