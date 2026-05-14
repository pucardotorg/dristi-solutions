package org.pucar.dristi.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.RequestInfoWrapper;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.config.MdmsDataConfig;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.web.models.AssigneeToOfficeMembersType;
import org.pucar.dristi.web.models.workflow.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;

@Slf4j
@Component
public class WorkflowUtil {

    private final Configuration config;
    private final ServiceRequestRepository requestRepository;
    private final ObjectMapper mapper;
    private final MdmsDataConfig mdmsDataConfig;

    @Autowired
    public WorkflowUtil(Configuration config, ServiceRequestRepository requestRepository, ObjectMapper mapper, MdmsDataConfig mdmsDataConfig) {
        this.config = config;
        this.requestRepository = requestRepository;
        this.mapper = mapper;
        this.mdmsDataConfig = mdmsDataConfig;
    }

    public List<ProcessInstance> searchWorkflowByAssignee(RequestInfo requestInfo, String assigneeUuid, String tenantId) {
        try {
            RequestInfoWrapper requestInfoWrapper = RequestInfoWrapper.builder().requestInfo(requestInfo).build();

            StringBuilder url = new StringBuilder();
            url.append(config.getWorkflowHost())
                    .append(config.getWorkflowProcessSearchEndpoint())
                    .append("?tenantId=").append(tenantId)
                    .append("&assignee=").append(assigneeUuid)
                    .append("&history=false");

            log.info("Searching workflow by assignee: {} with URL: {}", assigneeUuid, url);

            Object response = requestRepository.fetchResult(url, requestInfoWrapper);
            ProcessInstanceResponse processInstanceResponse = mapper.convertValue(response, ProcessInstanceResponse.class);

            if (processInstanceResponse != null && processInstanceResponse.getProcessInstances() != null) {
                log.info("Found {} process instances for assignee: {}", processInstanceResponse.getProcessInstances().size(), assigneeUuid);
                return processInstanceResponse.getProcessInstances();
            }

            return Collections.emptyList();
        } catch (Exception e) {
            log.error("Error searching workflow by assignee: {}", assigneeUuid, e);
            return Collections.emptyList();
        }
    }

    public List<String> searchWorkflowByAssigneeWithFilters(RequestInfo requestInfo, String assigneeUuid, String businessService, List<String> stateNames, String tenantId) {
        try {
            AssigneeSearchCriteria criteria = AssigneeSearchCriteria.builder()
                    .tenantId(tenantId)
                    .uuid(assigneeUuid)
                    .businessService(businessService)
                    .states(stateNames)
                    .build();

            AssigneeSearchRequest searchRequest = AssigneeSearchRequest.builder()
                    .requestInfo(requestInfo)
                    .criteria(criteria)
                    .build();

            StringBuilder url = new StringBuilder();
            url.append(config.getWorkflowHost()).append(config.getWorkflowAssigneeSearchEndpoint());

            log.info("Searching workflow by assignee: {} with businessService: {} and states: {} using assignee/_search API", 
                    assigneeUuid, businessService, stateNames);

            Object response = requestRepository.fetchResult(url, searchRequest);
            ProcessInstanceIdResponse processInstanceIdResponse = mapper.convertValue(response, ProcessInstanceIdResponse.class);

            if (processInstanceIdResponse != null && processInstanceIdResponse.getProcessInstanceIds() != null) {
                log.info("Found {} process instance IDs for assignee: {} with filters applied at query level", 
                        processInstanceIdResponse.getProcessInstanceIds().size(), assigneeUuid);
                return processInstanceIdResponse.getProcessInstanceIds();
            }

            return Collections.emptyList();
        } catch (Exception e) {
            log.error("Error searching workflow by assignee: {} with filters", assigneeUuid, e);
            return Collections.emptyList();
        }
    }

    public AssigneeResponse upsertAssignees(RequestInfo requestInfo, Set<String> assigneeUuids, String processInstanceId, String tenantId) {
        if (assigneeUuids == null || assigneeUuids.isEmpty()) {
            log.error("No assignee UUIDs provided for workflow upsert");
            return null;
        }

        if (processInstanceId == null || processInstanceId.isEmpty()) {
            log.error("No processInstanceId provided for workflow upsert");
            return null;
        }

        try {
            List<Assignee> assignees = new ArrayList<>();
            for (String uuid : assigneeUuids) {
                Assignee assignee = Assignee.builder()
                        .processInstanceId(processInstanceId)
                        .tenantId(tenantId)
                        .assignee(uuid)
                        .isActive(true)
                        .build();
                assignees.add(assignee);
            }

            AssigneeRequest assigneeRequest = AssigneeRequest.builder()
                    .requestInfo(requestInfo)
                    .assignees(assignees)
                    .build();

            StringBuilder uri = new StringBuilder();
            uri.append(config.getWorkflowHost()).append(config.getWorkflowAssigneeUpsertEndpoint());

            log.info("Calling workflow assignee upsert API for processInstanceId: {} with {} assignees", processInstanceId, assigneeUuids.size());

            Object response = requestRepository.fetchResult(uri, assigneeRequest);
            AssigneeResponse assigneeResponse = mapper.convertValue(response, AssigneeResponse.class);

            log.info("Successfully upserted {} assignees to workflow service", assigneeResponse.getAssignees().size());
            return assigneeResponse;

        } catch (Exception e) {
            log.error("Error while calling workflow assignee upsert API for processInstanceId: {}", processInstanceId, e);
            throw new CustomException("WORKFLOW_ASSIGNEE_UPSERT_ERROR", "Failed to upsert assignees to workflow service: " + e.getMessage());
        }
    }

    public AssigneeResponse deactivateAssignee(RequestInfo requestInfo, String assigneeUuid, String processInstanceId, String tenantId) {
        if (assigneeUuid == null || assigneeUuid.isEmpty()) {
            log.error("No assignee UUID provided for workflow deactivation");
            return null;
        }

        if (processInstanceId == null || processInstanceId.isEmpty()) {
            log.error("No processInstanceId provided for workflow deactivation");
            return null;
        }

        try {
            Assignee assignee = Assignee.builder()
                    .processInstanceId(processInstanceId)
                    .tenantId(tenantId)
                    .assignee(assigneeUuid)
                    .isActive(false)
                    .build();

            List<Assignee> assignees = new ArrayList<>();
            assignees.add(assignee);

            AssigneeRequest assigneeRequest = AssigneeRequest.builder()
                    .requestInfo(requestInfo)
                    .assignees(assignees)
                    .build();

            StringBuilder uri = new StringBuilder();
            uri.append(config.getWorkflowHost()).append(config.getWorkflowAssigneeUpsertEndpoint());

            log.info("Calling workflow assignee deactivate API for processInstanceId: {} assignee: {}", processInstanceId, assigneeUuid);

            Object response = requestRepository.fetchResult(uri, assigneeRequest);
            AssigneeResponse assigneeResponse = mapper.convertValue(response, AssigneeResponse.class);

            log.info("Successfully deactivated assignee {} from process instance {}", assigneeUuid, processInstanceId);
            return assigneeResponse;

        } catch (Exception e) {
            log.error("Error while deactivating assignee {} for processInstanceId: {}", assigneeUuid, processInstanceId, e);
            throw new CustomException("WORKFLOW_ASSIGNEE_DEACTIVATE_ERROR", "Failed to deactivate assignee: " + e.getMessage());
        }
    }

    public boolean shouldUpsertAssignee(String businessService, String state) {
        if (businessService == null || state == null) {
            log.error("businessService or state is null, skipping assignee upsert validation");
            return false;
        }

        AssigneeToOfficeMembersType assigneeConfig = mdmsDataConfig.getAssigneeToOfficeMembersTypeMap().get(businessService);

        if (assigneeConfig == null) {
            log.info("No assignee to office members configuration found for businessService: {}, skipping assignee upsert", businessService);
            return false;
        }

        if (assigneeConfig.getStates() == null || assigneeConfig.getStates().isEmpty()) {
            log.info("No states configured for businessService: {}, skipping assignee upsert", businessService);
            return false;
        }

        boolean shouldUpsert = assigneeConfig.getStates().contains(state);

        if (shouldUpsert) {
            log.info("businessService: {} and state: {} match MDMS configuration, proceeding with assignee upsert", businessService, state);
        } else {
            log.info("businessService: {} and state: {} do not match MDMS configuration, skipping assignee upsert", businessService, state);
        }

        return shouldUpsert;
    }

    public List<String> searchWorkflowByAssigneeForAllConfigurations(RequestInfo requestInfo, String assigneeUuid, String tenantId) {
        List<String> allProcessInstanceIds = new ArrayList<>();

        if (mdmsDataConfig.getAssigneeToOfficeMembersTypeMap() == null || mdmsDataConfig.getAssigneeToOfficeMembersTypeMap().isEmpty()) {
            log.info("No assignee to office members configuration found in MDMS, falling back to unfiltered search");
            List<ProcessInstance> processInstances = searchWorkflowByAssignee(requestInfo, assigneeUuid, tenantId);
            for (ProcessInstance pi : processInstances) {
                if (pi.getId() != null) {
                    allProcessInstanceIds.add(pi.getId());
                }
            }
            return allProcessInstanceIds;
        }

        for (AssigneeToOfficeMembersType config : mdmsDataConfig.getAssigneeToOfficeMembersTypeMap().values()) {
            if (config.getWorkflowModule() != null && config.getStates() != null && !config.getStates().isEmpty()) {
                List<String> processInstanceIds = searchWorkflowByAssigneeWithFilters(
                        requestInfo, 
                        assigneeUuid, 
                        config.getWorkflowModule(),
                        config.getStates(), 
                        tenantId
                );
                allProcessInstanceIds.addAll(processInstanceIds);
            }
        }

        log.info("Found total {} process instance IDs for assignee: {} across all configured businessServices and states", 
                allProcessInstanceIds.size(), assigneeUuid);
        return allProcessInstanceIds;
    }

    public List<String> searchProcessInstanceIdsWithExclude(RequestInfo requestInfo, String memberUserUuid, List<String> excludeAdvocateUuids, String businessId, String tenantId) {
        try {
            AssigneeSearchCriteria criteria = AssigneeSearchCriteria.builder()
                    .tenantId(tenantId)
                    .uuid(memberUserUuid)
                    .excludeUuids(excludeAdvocateUuids)
                    .businessId(businessId)
                    .build();

            AssigneeSearchRequest searchRequest = AssigneeSearchRequest.builder()
                    .requestInfo(requestInfo)
                    .criteria(criteria)
                    .build();

            StringBuilder url = new StringBuilder();
            url.append(config.getWorkflowHost()).append(config.getWorkflowAssigneeSearchEndpoint());

            log.info("Searching workflow process instances with uuids: {}, businessId: {}, and excludeUuids: {}", memberUserUuid, businessId, excludeAdvocateUuids);

            Object response = requestRepository.fetchResult(url, searchRequest);
            ProcessInstanceIdResponse processInstanceIdResponse = mapper.convertValue(response, ProcessInstanceIdResponse.class);

            if (processInstanceIdResponse != null && processInstanceIdResponse.getProcessInstanceIds() != null) {
                log.info("Found {} process instances for member UUID: {} with exclusions for businessId: {}", 
                        processInstanceIdResponse.getProcessInstanceIds().size(), memberUserUuid, businessId);
                return processInstanceIdResponse.getProcessInstanceIds();
            }

            return Collections.emptyList();
        } catch (Exception e) {
            log.error("Error searching workflow process instances with exclusions for member UUID: {} and businessId: {}", memberUserUuid, businessId, e);
            return Collections.emptyList();
        }
    }

    public List<String> searchProcessInstanceIdsOnBusinessIdAndAssignee(
            RequestInfo requestInfo,
            String assigneeUuid,
            String businessId,
            String tenantId) {

        List<String> allProcessInstanceIds = new ArrayList<>();

        try {

            // If no MDMS configuration, do direct search with businessId + assignee
            if (mdmsDataConfig.getAssigneeToOfficeMembersTypeMap() == null || mdmsDataConfig.getAssigneeToOfficeMembersTypeMap().isEmpty()) {

                AssigneeSearchCriteria criteria = AssigneeSearchCriteria.builder()
                        .tenantId(tenantId)
                        .uuid(assigneeUuid)
                        .businessId(businessId)
                        .build();

                AssigneeSearchRequest searchRequest = AssigneeSearchRequest.builder()
                        .requestInfo(requestInfo)
                        .criteria(criteria)
                        .build();

                StringBuilder url = new StringBuilder();
                url.append(config.getWorkflowHost()).append(config.getWorkflowAssigneeSearchEndpoint());

                log.info("Searching workflow process instances with assignee: {}, businessId: {} (No MDMS filter)", assigneeUuid, businessId);

                Object response = requestRepository.fetchResult(url, searchRequest);
                ProcessInstanceIdResponse processInstanceIdResponse = mapper.convertValue(response, ProcessInstanceIdResponse.class);

                if (processInstanceIdResponse != null && processInstanceIdResponse.getProcessInstanceIds() != null) {
                    return processInstanceIdResponse.getProcessInstanceIds();
                }

                return Collections.emptyList();
            }

            // If MDMS configuration exists, apply businessService + states + businessId filter
            for (AssigneeToOfficeMembersType mdmsConfig : mdmsDataConfig.getAssigneeToOfficeMembersTypeMap().values()) {

                if (mdmsConfig.getWorkflowModule() != null && mdmsConfig.getStates() != null && !mdmsConfig.getStates().isEmpty()) {

                    AssigneeSearchCriteria criteria = AssigneeSearchCriteria.builder()
                            .tenantId(tenantId)
                            .uuid(assigneeUuid)
                            .businessService(mdmsConfig.getWorkflowModule())
                            .states(mdmsConfig.getStates())
                            .businessId(businessId)
                            .build();

                    AssigneeSearchRequest searchRequest = AssigneeSearchRequest.builder()
                            .requestInfo(requestInfo)
                            .criteria(criteria)
                            .build();

                    StringBuilder url = new StringBuilder();
                    url.append(config.getWorkflowHost()).append(config.getWorkflowAssigneeSearchEndpoint());

                    log.info("Searching workflow with assignee: {}, businessService: {}, states: {}, businessId: {}", assigneeUuid, mdmsConfig.getWorkflowModule(), mdmsConfig.getStates(), businessId);

                    Object response = requestRepository.fetchResult(url, searchRequest);
                    ProcessInstanceIdResponse processInstanceIdResponse = mapper.convertValue(response, ProcessInstanceIdResponse.class);

                    if (processInstanceIdResponse != null && processInstanceIdResponse.getProcessInstanceIds() != null) {

                        allProcessInstanceIds.addAll(processInstanceIdResponse.getProcessInstanceIds());
                    }
                }
            }

            log.info("Found total {} process instance IDs for assignee: {} and businessId: {}",
                    allProcessInstanceIds.size(), assigneeUuid, businessId);

            return allProcessInstanceIds;

        } catch (Exception e) {
            log.error("Error searching workflow process instances with assignee: {} and businessId: {}",
                    assigneeUuid, businessId, e);
            return Collections.emptyList();
        }
    }
}
