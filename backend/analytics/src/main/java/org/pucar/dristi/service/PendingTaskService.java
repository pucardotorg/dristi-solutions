package org.pucar.dristi.service;


import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.jayway.jsonpath.JsonPath;
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
            if(Objects.equals(topic, LITIGANT_JOIN_CASE_TOPIC) && joinCaseJson.get("litigant") != null) {
                updatePendingTaskForLitigant(joinCaseJson, pendingTaskNode);
            } else if (Objects.equals(topic, REPRESENTATIVE_JOIN_CASE_TOPIC) || Objects.equals(topic, REPRESENTATIVE_REPLACE_JOIN_CASE)) {
                updatePendingTaskForAdvocate(joinCaseJson, pendingTaskNode);
            }
            log.info("operation=updatePendingTask, result=SUCCESS, topic={}, filingNumber={}", topic, filingNumber);
        } catch (Exception e) {
            log.error(ERROR_UPDATING_PENDING_TASK, e);
            throw new CustomException(ERROR_UPDATING_PENDING_TASK, e.getMessage());
        }
    }

    public void updatePendingTaskForLitigant(Map<String, Object> joinCaseJson, JsonNode pendingTaskNode) {
        try {
            log.info("operation=updatePendingTaskForLitigant, status=IN_PROGRESS");
            JsonNode hitsNode = pendingTaskNode.path("hits").path("hits");
            List<JsonNode> filteredTask = filterPendingTaskLitigant(hitsNode);
            filteredTask = checkComplainantJoinCase(filteredTask, joinCaseJson);

            if(filteredTask != null){
                Map<String, Object> auditDetails = (Map<String, Object>) joinCaseJson.get("auditDetails");
                addAssigneeToPendingTask(filteredTask, auditDetails.get("createdBy").toString());
                pendingTaskUtil.updatePendingTask(filteredTask);
            }
            log.info("operation=updatePendingTaskLitigant, status=SUCCESS");
        } catch (Exception e){
            log.error(ERROR_UPDATING_PENDING_TASK, e);
            throw new CustomException(ERROR_UPDATING_PENDING_TASK, e.getMessage());
        }

    }

    public void updatePendingTaskForAdvocate(Map<String, Object> joinCaseJson, JsonNode pendingTaskNode) {
        try {
            log.info("operation=updatePendingTaskForAdvocate, status=IN_PROGRESS");
            JsonNode representative = objectMapper.convertValue(joinCaseJson.get("representative"), JsonNode.class).get(0);
            JsonNode representing = representative.get("representing");
            String advocateUuid = representative.get("additionalDetails").get("uuid").textValue();
            JsonNode hitsNode = pendingTaskNode.path("hits").path("hits");
            List<JsonNode> updatedTasks;
            if(representative.get("isActive").asBoolean()){
                updatedTasks = updatePendingTasksAdvocate(hitsNode, representing, advocateUuid);
            } else {
                updatedTasks = removeAdvocatePendingTask(hitsNode, representing, advocateUuid);
            }
            pendingTaskUtil.updatePendingTask(updatedTasks);
            log.info("operation=updatePendingTaskAdvocate, status=SUCCESS");
        } catch (Exception e){
            log.error(ERROR_UPDATING_PENDING_TASK, e);
            throw new CustomException(ERROR_UPDATING_PENDING_TASK, e.getMessage());
        }
    }

    private List<JsonNode> updatePendingTasksAdvocate(JsonNode hitsNode, JsonNode parties, String advocateUuid) {
        log.info("Joining pending task for advocate with id :: {}", advocateUuid);
        List<JsonNode> filteredTasks = new ArrayList<>();
        for(JsonNode litigant: parties) {
            List<JsonNode> tasks = filterPendingTaskAdvocate(hitsNode, Collections.singletonList(litigant.get("individualId").toString()));
            if(litigant.get("isActive").asBoolean()){
                addAssigneeToPendingTask(tasks, advocateUuid);
            } else {
                removeAssignedToPendingTask(tasks, advocateUuid);
            }
            filteredTasks.addAll(tasks);
        }
        return filteredTasks;
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
    private List<JsonNode> removeAdvocatePendingTask(JsonNode hitsNode, JsonNode parties,  String advocateUuid) {
        List<JsonNode> tasks = new ArrayList<>();
        for (JsonNode hit : hitsNode) {
            JsonNode dataNode = hit.path("_source").path("Data");
            ArrayNode assignedToArray = (ArrayNode) dataNode.withArray("assignedTo");
            boolean isRemoved = false;
            for (int i = assignedToArray.size() - 1; i >= 0; i--) {
                JsonNode node = assignedToArray.get(i);
                if (node.has("uuid") && node.get("uuid").asText().equals(advocateUuid)) {
                    assignedToArray.remove(i);
                    isRemoved=true;
                }
            }
            if(isRemoved) {
                tasks.add(hit);
            }
        }
        return tasks;
    }

    private void replaceAssigneeToPendingTask(List<JsonNode> filteredTasks, String uuid, RequestInfo requestInfo) {
        for(JsonNode task : filteredTasks) {
            JsonNode dataNode = task.path("_source").path("Data");
            ArrayNode assignedToArray = (ArrayNode) dataNode.withArray("assignedTo");
            List<JsonNode> litigantNode = new ArrayList<>();
            for(JsonNode uuidNode : assignedToArray) {
                if(uuidNode.has("uuid") && !isAdvocateUuid(uuidNode.get("uuid").asText(), requestInfo)){
                    litigantNode.add(uuidNode);
                }
            }
            assignedToArray.removeAll();

            for(JsonNode node : litigantNode) {
                assignedToArray.add(node);
            }
            ObjectNode newAssignee = assignedToArray.addObject();
            newAssignee.put("uuid", uuid);
        }
    }

    private boolean isAdvocateUuid(String uuid, RequestInfo requestInfo) {
        List<Individual> individuals = individualService.getIndividuals(requestInfo, Collections.singletonList(uuid));
        String individualId = individuals.get(0).getIndividualId();
        if(advocateUtil.isAdvocateExists(requestInfo, List.of(individualId))) {
            return true;
        }
        return false;
    }

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

    private List<String> getLitigantUuids(List<Map<String, Object>> parties, RequestInfo requestInfo) {
        List<String> userUuids = new ArrayList<>();
        for (Map<String, Object> party : parties) {
            List<Individual> individual = individualService.getIndividualsByIndividualId(requestInfo, party.get("individualId").toString());
            userUuids.add(individual.get(0).getUserUuid());
        }
        return userUuids;
    }

    private List<JsonNode> filterPendingTaskAdvocate(JsonNode hitsNode, List<String> individualIds) {
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

    private List<JsonNode> filterPendingTaskLitigant(JsonNode hitsNode) {
        List<JsonNode> filteredTasks = new ArrayList<>();
        for(JsonNode hit: hitsNode) {
            JsonNode dataNode = hit.path("_source").path("Data");
            if(dataNode.get("entityType").toString().equals("application-order-submission-feedback") && dataNode.get("status").toString().equals("PENDINGRESPONSE")) {
                filteredTasks.add(dataNode);
            }
        }
        return filteredTasks;
    }

    private List<JsonNode> checkComplainantJoinCase(List<JsonNode> tasks, Map<String, Object> joinCase) {
        Object caseObject = caseUtil.getCase((JSONObject) joinCase.get("RequestInfo"), "kl", null, joinCase.get("caseFilingNumber").toString(), null);
        List<Map<String, Object>> litigantList = JsonPath.read(caseObject, "litigants");

        litigantList = litigantList.stream()
                .filter(litigant -> {
                    Object partyType = litigant.get("partyType");
                    return partyType != null && partyType.toString().matches("complainant\\\\..*");
                })
                .collect(Collectors.toList());

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