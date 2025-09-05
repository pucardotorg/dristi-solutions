package org.pucar.dristi.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.models.individual.Individual;
import org.egov.tracer.model.CustomException;
import org.json.JSONObject;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.util.AdvocateUtil;
import org.pucar.dristi.util.CaseUtil;
import org.pucar.dristi.util.IndexerUtils;
import org.pucar.dristi.util.PendingTaskUtil;
import org.pucar.dristi.web.models.PendingTask;
import org.pucar.dristi.web.models.PendingTaskRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

import static org.pucar.dristi.config.ServiceConstants.*;

@Service
@Slf4j
public class PendingTaskService {

    private final Configuration config;
    private final IndexerUtils indexerUtils;
    private final PendingTaskUtil pendingTaskUtil;
    private final IndividualService individualService;
    private final AdvocateUtil advocateUtil;
    private final CaseUtil caseUtil;
    private final ObjectMapper objectMapper;

    @Autowired
    public PendingTaskService(Configuration config, IndexerUtils indexerUtils, PendingTaskUtil pendingTaskUtil, IndividualService individualService, AdvocateUtil advocateUtil, CaseUtil caseUtil, ObjectMapper objectMapper) {
        this.config = config;
        this.indexerUtils = indexerUtils;
        this.pendingTaskUtil = pendingTaskUtil;
        this.individualService = individualService;
        this.advocateUtil = advocateUtil;
        this.caseUtil = caseUtil;
        this.objectMapper = objectMapper;
    }

    public PendingTask createPendingTask(PendingTaskRequest pendingTaskRequest) {
        try {
            log.info("Inside Pending Task service:: PendingTaskRequest: {}", pendingTaskRequest);
            String bulkRequest = indexerUtils.buildPayload(pendingTaskRequest.getPendingTask());
            if (!bulkRequest.isEmpty()) {
                String uri = config.getEsHostUrl() + config.getBulkPath();
                indexerUtils.esPostManual(uri, bulkRequest);
            }
            return pendingTaskRequest.getPendingTask();
        } catch (CustomException e) {
            log.error("Custom Exception occurred while creating hearing");
            throw e;
        } catch (Exception e) {
            log.error("Error occurred while creating hearing");
            throw new CustomException(Pending_Task_Exception, e.getMessage());
        }
    }

    public void updatePendingTask(String topic, Map<String, Object> joinCaseJson) {
        try {
            log.info("operation=updatePendingTask, result=IN_PROGRESS, topic={}", topic);
            String filingNumber = joinCaseJson.get("filingNumber").toString();
            JsonNode pendingTaskNode = pendingTaskUtil.callPendingTask(filingNumber);

            switch (topic) {
                case LITIGANT_JOIN_CASE_TOPIC -> {
                    if (joinCaseJson.get("litigant") != null) {
                        updatePendingTaskForLitigant(joinCaseJson, pendingTaskNode);
                    }
                }
                case REPRESENTATIVE_JOIN_CASE_TOPIC, REPRESENTATIVE_REPLACE_JOIN_CASE ->
                        updatePendingTaskForAdvocateOrPOA(joinCaseJson, pendingTaskNode, true);
                case POA_JOIN_CASE_TOPIC -> {
                    if (joinCaseJson.get("poaHolders") != null) {
                        updatePendingTaskForAdvocateOrPOA(joinCaseJson, pendingTaskNode, false);
                    }
                }
            }

            log.info("operation=updatePendingTask, result=SUCCESS, topic={}, filingNumber={}", topic, filingNumber);
        } catch (Exception e) {
            log.error(ERROR_UPDATING_PENDING_TASK, e);
            throw new CustomException(ERROR_UPDATING_PENDING_TASK, e.getMessage());
        }
    }

    // ------------------- Unified update for Advocate & POA -------------------
    private void updatePendingTaskForAdvocateOrPOA(Map<String, Object> joinCaseJson, JsonNode pendingTaskNode, boolean isAdvocate) {
        try {
            log.info("operation=updatePendingTaskFor{}, status=IN_PROGRESS", isAdvocate ? "Advocate" : "POA");

            JsonNode holdersNode = isAdvocate ?
                    objectMapper.convertValue(joinCaseJson.get("representatives"), JsonNode.class).get(0)
                    : null;

            JsonNode poaHolders = !isAdvocate ? objectMapper.convertValue(joinCaseJson.get("poaHolders"), JsonNode.class) : null;
            JsonNode hitsNode = pendingTaskNode.path("hits").path("hits");

            List<JsonNode> updatedTasks = new ArrayList<>();

            if (isAdvocate) {
                JsonNode representing = holdersNode.get("representing");
                String advocateUuid = holdersNode.get("additionalDetails").get("uuid").textValue();

                if (holdersNode.get("isActive").asBoolean()) {
                    updatedTasks.addAll(updatePendingTasks(hitsNode, representing, advocateUuid));
                } else {
                    Set<String> inactiveLitigants = getLitigantsByStatus(representing, false);
                    Set<String> activeLitigants = getLitigantsByStatus(representing, true);
                    updatedTasks.addAll(removeAssigneePendingTask(hitsNode, advocateUuid, inactiveLitigants, activeLitigants));
                }

            } else { // POA
                for (JsonNode poaHolder : poaHolders) {
                    JsonNode additionalDetails = poaHolder.get("additionalDetails");
                    if (additionalDetails == null || additionalDetails.get("uuid") == null) {
                        log.warn("POA holder missing additionalDetails.uuid, skipping");
                        continue;
                    }
                    String poaUuid = additionalDetails.get("uuid").textValue();
                    JsonNode representingLitigants = poaHolder.get("representingLitigants");

                    if (poaHolder.get("isActive").asBoolean()) {
                        updatedTasks.addAll(updatePendingTasks(hitsNode, representingLitigants, poaUuid));
                    } else {
                        Set<String> inactiveLitigants = getLitigantsByStatus(representingLitigants, false);
                        Set<String> activeLitigants = getLitigantsByStatus(representingLitigants, true);
                        updatedTasks.addAll(removeAssigneePendingTask(hitsNode, poaUuid, inactiveLitigants, activeLitigants));
                    }
                }
            }

            if (!updatedTasks.isEmpty()) {
                pendingTaskUtil.updatePendingTask(updatedTasks);
            }

            log.info("operation=updatePendingTaskFor{}, status=SUCCESS", isAdvocate ? "Advocate" : "POA");

        } catch (Exception e) {
            log.error(ERROR_UPDATING_PENDING_TASK, e);
            throw new CustomException(ERROR_UPDATING_PENDING_TASK, e.getMessage());
        }
    }

    // ------------------- Common methods -------------------
    private List<JsonNode> updatePendingTasks(JsonNode hitsNode, JsonNode parties, String assigneeUuid) {
        log.info("Joining pending task for assignee with id :: {}", assigneeUuid);
        List<JsonNode> filteredTasks = new ArrayList<>();
        Set<String> activeLitigants = new HashSet<>();
        for (JsonNode litigant : parties) {
            List<JsonNode> tasks = filterPendingTask(hitsNode, Collections.singletonList(litigant.get("individualId").asText()));
            if (litigant.get("isActive").asBoolean()) {
                addAssigneeToPendingTask(tasks, assigneeUuid);
                activeLitigants.add(litigant.get("individualId").asText());
            } else {
                // Collect inactive litigants for removal if needed
                Set<String> inactiveLitigants = Set.of(litigant.get("individualId").asText());
                tasks = removeAssigneePendingTask(hitsNode, assigneeUuid, inactiveLitigants, activeLitigants);
            }
            filteredTasks.addAll(tasks);
        }
        return filteredTasks;
    }

    private Set<String> getLitigantsByStatus(JsonNode parties, boolean active) {
        Set<String> litigants = new HashSet<>();
        for (JsonNode litigant : parties) {
            if (litigant.get("isActive").asBoolean() == active) {
                litigants.add(litigant.get("individualId").asText());
            }
        }
        return litigants;
    }

    private List<JsonNode> removeAssigneePendingTask(JsonNode hitsNode, String assigneeUuid, Set<String> inactiveLitigants, Set<String> activeLitigants) {
        List<JsonNode> tasks = new ArrayList<>();
        for (JsonNode hit : hitsNode) {
            JsonNode dataNode = hit.path("_source").path("Data");
            ArrayNode assignedToArray = (ArrayNode) dataNode.withArray("assignedTo");
            ArrayNode litigantsArray = (ArrayNode) dataNode.get("additionalDetails").withArray("litigants");

            Set<String> taskLitigants = new HashSet<>();
            litigantsArray.forEach(l -> taskLitigants.add(l.asText()));

            boolean shouldRemove = taskLitigants.stream().anyMatch(inactiveLitigants::contains) &&
                    taskLitigants.stream().noneMatch(activeLitigants::contains);

            if (shouldRemove) {
                boolean isRemoved = false;
                for (int i = assignedToArray.size() - 1; i >= 0; i--) {
                    JsonNode node = assignedToArray.get(i);
                    if (node.has("uuid") && node.get("uuid").asText().equals(assigneeUuid)) {
                        assignedToArray.remove(i);
                        isRemoved = true;
                    }
                }
                if (isRemoved) {
                    tasks.add(hit);
                }
            }
        }
        return tasks;
    }

    //Common methods
    private void addAssigneeToPendingTask(List<JsonNode> filteredTasks, String uuid) {
        log.info("Joining assignee to pending task with uuid :: {}", uuid);
        for (JsonNode task : filteredTasks) {
            JsonNode dataNode = task.path("_source").path("Data");
            ArrayNode assignedToArray = (ArrayNode) dataNode.withArray("assignedTo");
            boolean uuidExists = false;
            for (JsonNode node : assignedToArray) {
                if (node.has("uuid") && node.get("uuid").asText().equals(uuid)) {
                    uuidExists = true;
                    break;
                }
            }
            if (!uuidExists) {
                ObjectNode uuidNode = assignedToArray.addObject();
                uuidNode.put("uuid", uuid);
            }
        }
    }

    private void removeAssignedToPendingTask(List<JsonNode> tasks, String uuid) {
        log.info("Removing assignee from pending task with uuid :: {}", uuid);
        for(JsonNode task: tasks) {
            JsonNode dataNode = task.path("_source").path("Data");
            ArrayNode assignedToArray = (ArrayNode) dataNode.withArray("assignedTo");
            int indexToRemove = -1;

            for (int i = 0; i < assignedToArray.size(); i++) {
                JsonNode node = assignedToArray.get(i);
                if (node.has("uuid") && node.get("uuid").asText().equals(uuid)) {
                    indexToRemove = i;
                    break;
                }
            }
            // Remove elements after iteration to avoid index shifting issues
            if(indexToRemove != -1){
                assignedToArray.remove(indexToRemove);
            }
        }
    }

    private List<JsonNode> filterPendingTask(JsonNode hitsNode, List<String> individualIds) {
        List<JsonNode> filteredTasks = new ArrayList<>();
        for (JsonNode hit : hitsNode) {
            JsonNode dataNode = hit.path("_source").path("Data");
            JsonNode litigantIds = dataNode.path("additionalDetails").path("litigants");

            boolean isAssigned = false;
            for (JsonNode assigned : litigantIds) {
                String individualId = assigned.asText();
                if (individualIds.contains(individualId)) {
                    isAssigned = true;
                    break;
                }
            }
            if (isAssigned) {
                filteredTasks.add(hit);
            }
        }
        return filteredTasks;
    }

    //Litigant
    public void updatePendingTaskForLitigant(Map<String, Object> joinCaseJson, JsonNode pendingTaskNode) {
        try {
            log.info("operation=updatePendingTaskForLitigant, status=IN_PROGRESS");
            JsonNode hitsNode = pendingTaskNode.path("hits").path("hits");
            List<JsonNode> filteredTask = filterPendingTaskLitigant(hitsNode);
            filteredTask = checkComplainantJoinCase(filteredTask, joinCaseJson);

            if(filteredTask != null){
                JsonNode auditDetails = objectMapper.convertValue(joinCaseJson.get("auditDetails"), JsonNode.class);
                addAssigneeToPendingTask(filteredTask, auditDetails.get("createdBy").asText());
                pendingTaskUtil.updatePendingTask(filteredTask);
            }
            log.info("operation=updatePendingTaskLitigant, status=SUCCESS");
        } catch (Exception e){
            log.error(ERROR_UPDATING_PENDING_TASK, e);
            throw new CustomException(ERROR_UPDATING_PENDING_TASK, e.getMessage());
        }

    }
    private List<String> getLitigantUuids(JsonNode parties, RequestInfo requestInfo) {
        List<String> userUuids = new ArrayList<>();
        for (JsonNode party : parties) {
            List<Individual> individual = individualService.getIndividualsByIndividualId(requestInfo, party.get("individualId").asText());
            userUuids.add(individual.get(0).getUserUuid());
        }
        return userUuids;
    }
    private List<JsonNode> filterPendingTaskLitigant(JsonNode hitsNode) {
        List<JsonNode> filteredTasks = new ArrayList<>();
        for(JsonNode hit: hitsNode) {
            JsonNode dataNode = hit.path("_source").path("Data");
            if(dataNode.get("entityType").asText().equals("application-order-submission-feedback") && dataNode.get("status").asText().equals("PENDINGRESPONSE")) {
                filteredTasks.add(dataNode);
            }
        }
        return filteredTasks;
    }

    private List<JsonNode> checkComplainantJoinCase(List<JsonNode> tasks, Map<String, Object> joinCase) {
        JsonNode caseObject = objectMapper.convertValue(caseUtil.getCase((JSONObject) joinCase.get("RequestInfo"), "kl", null, joinCase.get("filingNumber").toString(), null), JsonNode.class);
        JsonNode litigantList = caseObject.get("litigants");

        ArrayNode filteredLitigantList = objectMapper.createArrayNode();

        for (JsonNode litigant : litigantList) {
            JsonNode partyTypeNode = litigant.get("partyType");
            if (partyTypeNode != null && partyTypeNode.asText().matches("complainant\\\\..*")) {
                filteredLitigantList.add(litigant);
            }
        }

        List<String> litigantUuids = getLitigantUuids(litigantList, (RequestInfo) joinCase.get("requestInfo"));

        return tasks.stream()
                .filter(task -> {
                    JsonNode assignedTo = task.at("/_source/Data/assignedTo");
                    if (assignedTo.isArray()) {
                        for (JsonNode userNode : assignedTo) {
                            JsonNode uuidNode = userNode.get("uuid");
                            if (uuidNode != null && litigantUuids.contains(uuidNode.asText())) {
                                return false;
                            }
                        }
                    }
                    return true;
                })
                .collect(Collectors.toList());

    }
}