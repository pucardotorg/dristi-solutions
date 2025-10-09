package com.dristi.njdg_transformer.service;

import com.dristi.njdg_transformer.config.TransformerProperties;
import com.dristi.njdg_transformer.model.NJDGTransformRecord;
import com.dristi.njdg_transformer.model.hearing.Hearing;
import com.dristi.njdg_transformer.model.hrms.Assignment;
import com.dristi.njdg_transformer.model.hrms.Employee;
import com.dristi.njdg_transformer.model.hrms.EmployeeResponse;
import com.dristi.njdg_transformer.repository.NJDGRepository;
import com.dristi.njdg_transformer.utils.HrmsUtil;
import com.dristi.njdg_transformer.utils.MdmsUtil;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static com.dristi.njdg_transformer.config.ServiceConstants.*;

@Service
@Slf4j
public class HearingService {

    @Autowired
    private final NJDGRepository njdgTransformRepository;

    private final HrmsUtil hrmsUtil;

    private final MdmsUtil mdmsUtil;

    private final TransformerProperties properties;


    public HearingService(NJDGRepository njdgTransformRepository, HrmsUtil hrmsUtil, MdmsUtil mdmsUtil, TransformerProperties properties) {
        this.njdgTransformRepository = njdgTransformRepository;
        this.hrmsUtil = hrmsUtil;
        this.mdmsUtil = mdmsUtil;
        this.properties = properties;
    }

    public void updateDataForHearing(Hearing hearing, RequestInfo requestInfo) {
        try {
            // Find the corresponding NJDGTransformRecord using CNR number
            if (hearing.getCnrNumbers() == null || hearing.getCnrNumbers().isEmpty()) {
                log.warn("CNR number is missing in hearing: {}", hearing.getId());
                return;
            }

            // Use the first CNR number from the list
            String cnrNumber = hearing.getCnrNumbers().get(0);
            if (cnrNumber == null || cnrNumber.trim().isEmpty()) {
                log.warn("First CNR number is empty in hearing: {}", hearing.getId());
                return;
            }

            // Find record by CNR number
            NJDGTransformRecord record = njdgTransformRepository.findByCino(cnrNumber);
            if (record == null) {
                log.warn("No NJDGTransformRecord found for CNR number: {}", cnrNumber);
                return;
            }

            ObjectNode hearingDetails = findOrCreateHearingDetails(record);

            updateHearingDetails(hearingDetails, hearing, requestInfo);
            // Save the updated record
            njdgTransformRepository.updateData(record);

            log.info("Successfully updated hearing history for case reference number: {}", hearing.getCaseReferenceNumber());

        } catch (Exception e) {
            log.error("Error updating hearing data for hearing: " + hearing.getId(), e);
            throw new RuntimeException("Failed to update hearing data", e);
        }
    }

    private void updateHearingDetails(ObjectNode hearingDetails, Hearing hearing, RequestInfo requestInfo) {
        hearingDetails.put("hearing_date", formatDate(hearing.getStartTime()));
        hearingDetails.put("purpose_of_listing", getPurposeOfListing(requestInfo, hearing));
        hearingDetails.put("desg_name", properties.getJudgeDesignation());
        hearingDetails.put("judge_code", properties.getJudgeCode());
    }

    private String getPurposeOfListing(RequestInfo requestInfo, Hearing hearing) {
        Map<String, Map<String, JSONArray>> hearingPurposes = mdmsUtil.fetchMdmsData(requestInfo, hearing.getTenantId(), NJDG_MODULE, List.of(PURPOSE_MASTER));
        JSONArray purposeOfListing = hearingPurposes.get(NJDG_MODULE).get(PURPOSE_MASTER);
        String hearingType = hearing.getHearingType();

        // Find the first purpose where name matches the hearing type
        for (Object purposeObj : purposeOfListing) {
            if (purposeObj instanceof Map) {
                Map<String, String> purpose = (Map<String, String>) purposeObj;
                if (hearingType.equalsIgnoreCase(purpose.get("purposeName"))) {
                    return purpose.get("purposeCode"); // Return the code if name matches
                }
            }
        }

        log.warn("No matching purpose found for hearing type: {}", hearingType);
        return "";
    }

    private void enrichJudgeDetails(ObjectNode hearingDetails, Hearing hearing, RequestInfo requestInfo) {
        String judgeId = hearing.getPresidedBy().getJudgeID().get(0);
        EmployeeResponse employeeResponse = hrmsUtil.getEmployeeDetails(hearing.getTenantId(), judgeId, requestInfo);
        Employee employee = employeeResponse.getEmployees().get(0);
        Assignment assignment = employee.getAssignments().get(0);

        hearingDetails.put("desg_name", assignment.getDesignation());
        hearingDetails.put("desg_code", "");
    }

    private ObjectNode findOrCreateHearingDetails(NJDGTransformRecord record) {
        List<JsonNode> hearingHistory = record.getHistoryOfCaseHearing();
        ObjectMapper mapper = new ObjectMapper();
        
        // First, ensure all existing hearings have serial numbers
        updateHearingSerialNumbers(hearingHistory);

        // Create new hearing details if not found
        ObjectNode newHearing = mapper.createObjectNode();
        
        hearingHistory.add(newHearing);
        
        // Update all serial numbers including the new hearing
        updateHearingSerialNumbers(hearingHistory);
        
        return newHearing;
    }
    
    /**
     * Updates serial numbers for all hearings in the list to maintain sequential numbering
     * Hearings are sorted by hearing_date if available, otherwise by insertion order
     */
    private void updateHearingSerialNumbers(List<JsonNode> hearings) {
        if (hearings == null || hearings.isEmpty()) {
            return;
        }
        
        // Create a list of hearings with their indices for sorting
        List<java.util.Map.Entry<JsonNode, Integer>> hearingsWithIndices = new ArrayList<>();
        for (int i = 0; i < hearings.size(); i++) {
            hearingsWithIndices.add(new java.util.AbstractMap.SimpleEntry<>(hearings.get(i), i));
        }
        
        // Sort by hearing_date if available, otherwise by original order
        hearingsWithIndices.sort((a, b) -> {
            JsonNode nodeA = a.getKey();
            JsonNode nodeB = b.getKey();
            
            // Try to sort by date if both have dates
            if (nodeA.has("hearing_date") && nodeB.has("hearing_date")) {
                try {
                    String dateA = nodeA.get("hearing_date").asText();
                    String dateB = nodeB.get("hearing_date").asText();
                    return dateA.compareTo(dateB);
                } catch (Exception e) {
                    log.warn("Error comparing hearing dates for sorting: {}", e.getMessage());
                }
            }
            
            // Fall back to original order if dates are not available or invalid
            return Integer.compare(a.getValue(), b.getValue());
        });
        
        // Update serial numbers based on sorted order
        int serialNo = 1;
        for (java.util.Map.Entry<JsonNode, Integer> entry : hearingsWithIndices) {
            ObjectNode hearingNode = (ObjectNode) entry.getKey();
            hearingNode.put("sr_no", serialNo++);
        }
    }
    
    /**
     * Formats a timestamp to dd/MM/yyyy string
     */
    private String formatDate(Long timestamp) {
        if (timestamp == null) {
            return null;
        }
        return Instant.ofEpochMilli(timestamp)
                .atZone(ZoneId.systemDefault())
                .toLocalDate()
                .format(DATE_FORMATTER);
    }
}
