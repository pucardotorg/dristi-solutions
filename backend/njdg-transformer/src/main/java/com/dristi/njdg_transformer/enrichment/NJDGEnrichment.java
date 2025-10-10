package com.dristi.njdg_transformer.enrichment;

import com.dristi.njdg_transformer.model.NJDGTransformRecord;
import com.dristi.njdg_transformer.model.advocate.AdvocateSerialNumber;
import com.dristi.njdg_transformer.model.cases.AdvocateMapping;
import com.dristi.njdg_transformer.model.cases.CourtCase;
import com.dristi.njdg_transformer.model.cases.Party;
import com.dristi.njdg_transformer.model.cases.StatuteSection;
import com.dristi.njdg_transformer.repository.AdvocateRepository;
import com.dristi.njdg_transformer.utils.MdmsUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static com.dristi.njdg_transformer.config.ServiceConstants.*;

@Component
@Slf4j
public class NJDGEnrichment {
    

    
    private final ObjectMapper objectMapper;
    private final AdvocateRepository repository;
    private final MdmsUtil mdmsUtil;

    public NJDGEnrichment(ObjectMapper objectMapper, AdvocateRepository repository, MdmsUtil mdmsUtil) {
        this.objectMapper = objectMapper;
        this.repository = repository;
        this.mdmsUtil = mdmsUtil;
    }


    public void enrichPartyDetails(CourtCase courtCase, NJDGTransformRecord record) {
        try {
            JsonNode additionalDetails = objectMapper.convertValue(courtCase.getAdditionalDetails(), JsonNode.class);
            if (additionalDetails == null) {
                log.warn("No additional details found in court case");
                return;
            }

            List<Party> litigants = courtCase.getLitigants();
            if (litigants == null || litigants.isEmpty()) {
                log.warn("No litigants found in court case");
                return;
            }

            JsonNode complainantDetails = additionalDetails.path("complainantDetails");
            if (!complainantDetails.isMissingNode()) {
                JsonNode formData = complainantDetails.path("formdata").path(0).path("data");
                if (!formData.isMissingNode()) {
                    String individualId = formData.path("complainantVerification").path("individualDetails").path("individualId").asText(null);

                    Party complainantLitigant = findLitigantByIndividualId(litigants, individualId);

                    if (complainantLitigant != null) {
                        String firstName = formData.path("firstName").asText("").trim();
                        String lastName = formData.path("lastName").asText("").trim();
                        String petName = (firstName + " " + lastName).trim();

                        String petAge = formData.path("complainantAge").asText(null);
                        JsonNode addressNode = formData.path("addressDetails");
                        String address = extractAddress(addressNode);
                        record.setPetName(petName.isEmpty() ? null : petName);
                        record.setPetAge(petAge);
                        record.setPetAddress(address);
                        log.debug("Matched petitioner with individualId: {}", individualId);
                    } else {
                        log.warn("No matching litigant found for complainant with individualId: {}", individualId);
                    }
                }
            }

            JsonNode respondentDetails = additionalDetails.path("respondentDetails");
            if (!respondentDetails.isMissingNode()) {
                JsonNode formData = respondentDetails.path("formdata").path(0);
                if (!formData.isMissingNode()) {
                    String uniqueId = formData.path("uniqueId").asText(null);

//                    Party respondentLitigant = findLitigantByUniqueId(litigants, uniqueId);
//                    if (respondentLitigant != null) {
                        String firstName = formData.path("respondentFirstName").asText("").trim();
                        String lastName = formData.path("respondentLastName").asText("").trim();
                        String resName = (firstName + " " + lastName).trim();

                        String resAge = formData.path("respondentAge").asText(null);

                        record.setResName(resName.isEmpty() ? null : resName);
                        record.setResAge(resAge);

                        JsonNode addressNode = formData.path("addressDetails").path(0).path("addressDetails");
                        String address = extractAddress(addressNode);
                        record.setResAddress(address);

                        log.debug("Matched respondent with uniqueId: {}", uniqueId);
//                    } else {
//                        log.warn("No matching litigant found for respondent with uniqueId: {}", uniqueId);
//                    }
                }
            }
        } catch (Exception e) {
            log.error("Error while enriching party details for case: " + courtCase.getId(), e);
        }
    }

    /**
     * Helper method to find a litigant by individualId
     */
    private Party findLitigantByIndividualId(List<Party> litigants, String individualId) {
        if (individualId == null || litigants == null) {
            return null;
        }
        return litigants.stream()
                .filter(litigant -> individualId.equals(litigant.getIndividualId()) && COMPLAINANT_PRIMARY.equalsIgnoreCase(litigant.getPartyType()))
                .findFirst()
                .orElse(null);
    }

//    /**
//     * Helper method to find a litigant by uniqueId from additionalDetails
//     */
//    private Party findLitigantByUniqueId(List<Party> litigants, String uniqueId) {
//        if (uniqueId == null || litigants == null) {
//            return null;
//        }
//
//        return litigants.stream()
//                .filter(litigant -> {
//                    try {
//                        if (litigant.getAdditionalDetails() == null) {
//                            return false;
//                        }
//                        String litigantUniqueId = objectMapper.readTree(objectMapper.writeValueAsString(litigant.getAdditionalDetails()))
//                                .path("uuid")
//                                .asText(null);
//                        return uniqueId.equals(litigantUniqueId));
//                    } catch (Exception e) {
//                        log.warn("Error processing litigant additionalDetails", e);
//                        return false;
//                    }
//                })
//                .findFirst()
//                .orElse(null);
//    }

    private String extractAddress(JsonNode addressNode) {
        if (addressNode == null || addressNode.isMissingNode()) {
            return null;
        }

        List<String> addressParts = new ArrayList<>();
        addIfNotEmpty(addressParts, addressNode.path("locality").asText(null));
        addIfNotEmpty(addressParts, addressNode.path("city").asText(null));
        addIfNotEmpty(addressParts, addressNode.path("district").asText(null));
        addIfNotEmpty(addressParts, addressNode.path("state").asText(null));
        addIfNotEmpty(addressParts, addressNode.path("pincode").asText(null));

        return addressParts.isEmpty() ? null : String.join(", ", addressParts);
    }

    private void addIfNotEmpty(List<String> list, String value) {
        if (value != null && !value.trim().isEmpty()) {
            list.add(value);
        }
    }

    public void enrichAdvocateDetails(CourtCase courtCase, NJDGTransformRecord record) {
        try {
            if (courtCase.getRepresentatives() == null || courtCase.getRepresentatives().isEmpty()) {
                log.info("No representatives found in the court case");
                return;
            }

            for (AdvocateMapping advocateMapping : courtCase.getRepresentatives()) {
                if (advocateMapping.getIsActive() == null || !advocateMapping.getIsActive()) {
                    continue;
                }

                String advocateUuid = advocateMapping.getAdvocateId();
                String advocateName = null;
                
                if (advocateMapping.getAdditionalDetails() != null) {
                    JsonNode additionalDetails = objectMapper.valueToTree(advocateMapping.getAdditionalDetails());
                    advocateName = additionalDetails.path("advocateName").asText(null);
                }
                AdvocateSerialNumber advocateInfo = getAdvDetails(advocateUuid);
                if (advocateInfo != null && advocateMapping.getRepresenting() != null && !advocateMapping.getRepresenting().isEmpty()) {
                    for (Party party : advocateMapping.getRepresenting()) {
                        String partyType = party.getPartyType();
                        
                        // Check if this is a complainant or respondent
                        if (partyType != null) {
                            if (COMPLAINANT_PRIMARY.equalsIgnoreCase(partyType)) {
                                record.setPetAdv(advocateName);
                                record.setPetAdvCd(advocateInfo.getSerialNo().toString());
                                record.setPetAdvBarReg(advocateInfo.getBarRegNo());
                            } else if (RESPONDENT_PRIMARY.equalsIgnoreCase(partyType)) {
                                record.setResAdv(advocateName);
                                record.setResAdvCd(advocateInfo.getSerialNo().toString());
                                record.setResAdvBarReg(advocateInfo.getBarRegNo());
                            }
                        }
                    }
                }
            }
            log.debug("Successfully enriched advocate details for case: {}", courtCase.getId());
        } catch (Exception e) {
            log.error("Error while enriching advocate details for case: " + courtCase.getId(), e);
        }
    }
    
    /**
     * Helper method to get bar registration number for an advocate
     */
    private AdvocateSerialNumber getAdvDetails(String advocateUuid) {
        try {
            return repository.findAdvocateSerialNumber(advocateUuid);
        } catch (Exception e) {
            log.error("Error fetching bar registration number for advocate: " + advocateUuid, e);
            return null;
        }
    }


    public void enrichExtraParties(CourtCase courtCase, NJDGTransformRecord record) {
        try {
            JsonNode caseDetails = objectMapper.convertValue(courtCase.getAdditionalDetails(), JsonNode.class);
            if (caseDetails == null) {
                log.warn("No case details found for case: {}", courtCase.getCaseNumber());
                return;
            }

            // Process complainants (pet_extra_party)
            JsonNode complainantDetails = caseDetails.path("complainantDetails");
            if (complainantDetails != null && !complainantDetails.isMissingNode()) {
                List<JsonNode> petExtraParties = processPartyDetails(complainantDetails, "complainant");
                if (petExtraParties != null && !petExtraParties.isEmpty()) {
                    record.setPetExtraParty(petExtraParties);
                }
            }

            // Process respondents (res_extra_party)
            JsonNode respondentDetails = caseDetails.path("respondentDetails");
            if (respondentDetails != null && !respondentDetails.isMissingNode()) {
                List<JsonNode> resExtraParties = processPartyDetails(respondentDetails, "respondent");
                if (resExtraParties != null && !resExtraParties.isEmpty()) {
                    record.setResExtraParty(resExtraParties);
                }
            }
        } catch (Exception e) {
            log.error("Error while enriching extra parties for case: {}", courtCase.getCaseNumber(), e);
        }
    }

    private List<JsonNode> processPartyDetails(JsonNode partyDetails, String partyType) {
        List<JsonNode> extraParties = new ArrayList<>();
        
        try {
            JsonNode formDataArray = partyDetails.path("formdata");
            if (formDataArray.isArray() && formDataArray.size() > 1) {
                // Skip the first party (primary) and process the rest
                for (int i = 1; i < formDataArray.size(); i++) {
                    JsonNode partyNode = formDataArray.get(i);
                    if (partyNode != null && !partyNode.isNull()) {
                        JsonNode dataNode = partyNode.path("data");
                        if (!dataNode.isMissingNode()) {
                            String partyName = "";
                            String partyAddress = "";
                            String partyAge = "";
                            String partyNo = String.valueOf(i); // 1-based index

                            // Extract name based on party type
                            if ("complainant".equals(partyType)) {
                                partyName = dataNode.path("firstName").asText("");
                                String middleName = dataNode.path("middleName").asText("");
                                String lastName = dataNode.path("lastName").asText("");
                                
                                // Construct full name
                                StringBuilder nameBuilder = new StringBuilder(partyName);
                                if (!middleName.isEmpty()) {
                                    nameBuilder.append(" ").append(middleName);
                                }
                                if (!lastName.isEmpty()) {
                                    nameBuilder.append(" ").append(lastName);
                                }
                                partyName = nameBuilder.toString().trim();
                                
                                // Get age for complainant
                                partyAge = dataNode.path("complainantAge").asText("");
                                
                                // Get address for complainant
                                JsonNode addressNode = dataNode.path("addressDetails");
                                partyAddress = extractAddress(addressNode);
                            } else {
                                // For respondents
                                partyName = dataNode.path("respondentFirstName").asText("");
                                
                                // Get address for respondent
                                JsonNode addressArray = dataNode.path("addressDetails");
                                if (addressArray.isArray() && !addressArray.isEmpty()) {
                                    JsonNode addressNode = addressArray.get(0).path("addressDetails");
                                    partyAddress = extractAddress(addressNode);
                                }
                            }

                            // Create party object
                            ObjectNode party = objectMapper.createObjectNode();
                            party.put("party_name", partyName);
                            party.put("party_no", partyNo);
                            party.put("party_address", partyAddress);
                            if (!partyAge.isEmpty()) {
                                party.put("party_age", partyAge);
                            }
                            
                            extraParties.add(party);
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error processing {} details", partyType, e);
        }
        return extraParties.isEmpty() ? null : extraParties;
    }

    public void enrichStatuteSection(RequestInfo requestInfo, CourtCase courtCase, NJDGTransformRecord record) {
        List<StatuteSection> statutesAndSections = courtCase.getStatutesAndSections();
        if (statutesAndSections == null || statutesAndSections.isEmpty()) {
            return;
        }

        // Fetch MDMS data for act master
        Map<String, Map<String, JSONArray>> mdmsData = mdmsUtil.fetchMdmsData(
            requestInfo, 
            courtCase.getTenantId(), 
            NJDG_MODULE, 
            List.of(ACT_MASTER)
        );

        if (mdmsData == null || mdmsData.isEmpty() || !mdmsData.containsKey(NJDG_MODULE)) {
            log.warn("No MDMS data found for module: {}", NJDG_MODULE);
            return;
        }

        JSONArray actMasterData = mdmsData.get(NJDG_MODULE).get(ACT_MASTER);
        if (actMasterData == null || actMasterData.isEmpty()) {
            log.warn("No act master data found in MDMS response");
            return;
        }

        List<JsonNode> actNodes = new ArrayList<>();
        ObjectMapper mapper = new ObjectMapper();
        
        for (StatuteSection statuteSection : statutesAndSections) {
            if (statuteSection.getStatute() == null || 
                statuteSection.getSections() == null || 
                statuteSection.getSections().isEmpty()) {
                continue;
            }

            for (Object actObj : actMasterData) {
                if (actObj instanceof Map) {
                    Map<String, Object> actData = (Map<String, Object>) actObj;
                    String code = (String) actData.get("code");
                    
                    if (statuteSection.getStatute().equals(code)) {
                        ObjectNode actNode = mapper.createObjectNode();
                        actNode.put("act_code", code);
                        actNode.put("act_name", actData.get("name").toString());
                        
                        // Get the first section from the list
                        String section = statuteSection.getSections().get(0);
                        actNode.put("act_section", section);
                        
                        actNodes.add(actNode);
                        break; // Found matching act, move to next statute section
                    }
                }
            }
        }
        
        // Set the act nodes in the record if any were found
        if (!actNodes.isEmpty()) {
            record.setAct(actNodes);
        }
    }

    /**
     * Enriches the record with police station details by matching the police station code from case details
     * with the MDMS police station master data.
     * 
     * @param requestInfo The request info containing user and auth details
     * @param courtCase The court case containing additional details
     * @param record The NJDG record to be enriched with police station details
     */
    public void enrichPoliceStationDetails(RequestInfo requestInfo, CourtCase courtCase, NJDGTransformRecord record) {
        try {
            // Get police station details from case additional details
            JsonNode caseDetails = objectMapper.convertValue(courtCase.getCaseDetails(), JsonNode.class);
            if (caseDetails == null || caseDetails.path("chequeDetails").isMissingNode()) {
                log.debug("No cheque details found in case additional details");
                return;
            }

            JsonNode chequeDetails = caseDetails.path("chequeDetails");
            if (chequeDetails.path("formdata").isMissingNode() || !chequeDetails.path("formdata").isArray() || chequeDetails.path("formdata").isEmpty()) {
                log.debug("No formdata found in cheque details");
                return;
            }

            // Extract police station code from case details
            JsonNode policeStationNode = chequeDetails.path("formdata").get(0)
                .path("data")
                .path("policeStationJurisDictionCheque");
                
            if (policeStationNode.isMissingNode()) {
                log.debug("No police station details found in cheque details");
                return;
            }

            String policeStationCode = policeStationNode.path("code").asText();
            if (policeStationCode == null || policeStationCode.isEmpty()) {
                log.debug("No police station code found in cheque details");
                return;
            }

            // Fetch police station master data from MDMS
            Map<String, Map<String, JSONArray>> policeMaster = mdmsUtil.fetchMdmsData(
                requestInfo,
                courtCase.getTenantId(),
                NJDG_MODULE,
                List.of(POLICE_MASTER)
            );

            if (policeMaster == null || policeMaster.isEmpty() || !policeMaster.containsKey(NJDG_MODULE) || 
                !policeMaster.get(NJDG_MODULE).containsKey(POLICE_MASTER)) {
                log.warn("No police master data found in MDMS response");
                return;
            }

            JSONArray policeMasterData = policeMaster.get(NJDG_MODULE).get(POLICE_MASTER);
            if (policeMasterData == null || policeMasterData.isEmpty()) {
                log.warn("Empty police master data in MDMS response");
                return;
            }

            // Find matching police station in MDMS data
            for (Object policeObj : policeMasterData) {
                if (policeObj instanceof Map) {
                    Map<String, Object> policeData = (Map<String, Object>) policeObj;
                    String code = String.valueOf(policeData.get("code"));
                    
                    if (policeStationCode.equals(code)) {
                        // Set the police station details in the record
                        record.setPoliceStCode(String.valueOf(policeData.get("policeStationCode")));
                        record.setPoliceNcode(String.valueOf(policeData.get("nationalCode")));
                        record.setPoliceStation(String.valueOf(policeData.get("name")));
                        log.debug("Successfully set police station details: {}", policeData);
                        return;
                    }
                }
            }
            
            log.warn("No matching police station found in MDMS for code: {}", policeStationCode);
            
        } catch (Exception e) {
            log.error("Error while enriching police station details: ", e);
        }
    }
}
