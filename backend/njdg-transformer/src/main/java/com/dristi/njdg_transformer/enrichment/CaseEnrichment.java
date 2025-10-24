package com.dristi.njdg_transformer.enrichment;

import com.dristi.njdg_transformer.model.AdvocateDetails;
import com.dristi.njdg_transformer.model.NJDGTransformRecord;
import com.dristi.njdg_transformer.model.PartyDetails;
import com.dristi.njdg_transformer.model.PoliceStationDetails;
import com.dristi.njdg_transformer.model.cases.AdvocateMapping;
import com.dristi.njdg_transformer.model.cases.CourtCase;
import com.dristi.njdg_transformer.model.cases.Party;
import com.dristi.njdg_transformer.model.enums.PartyType;
import com.dristi.njdg_transformer.repository.AdvocateRepository;
import com.dristi.njdg_transformer.repository.CaseRepository;
import com.dristi.njdg_transformer.utils.MdmsUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.servlet.http.Part;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static com.dristi.njdg_transformer.config.ServiceConstants.*;

@Component
@Slf4j
@RequiredArgsConstructor
public class CaseEnrichment {
    

    
    private final ObjectMapper objectMapper;
    private final AdvocateRepository advocateRepository;
    private final CaseRepository repository;


    public void enrichPrimaryPartyDetails(CourtCase courtCase, NJDGTransformRecord record, String partyType) {
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

        Party primaryParty = findPrimaryParty(litigants, partyType);
        if (primaryParty == null) {
            log.warn("No primary {} found in court case", partyType);
            return;
        }

        String individualId = primaryParty.getIndividualId();
        if (individualId == null || individualId.isEmpty()) {
            log.warn("Primary {} has no individualId", partyType);
            return;
        }

        String detailsKey = partyType.equalsIgnoreCase(COMPLAINANT_PRIMARY)
                ? "complainantDetails"
                : "respondentDetails";
        String verificationKey = partyType.equalsIgnoreCase(COMPLAINANT_PRIMARY)
                ? "complainantVerification"
                : "respondentVerification";
        String ageKey = partyType.equalsIgnoreCase(COMPLAINANT_PRIMARY)
                ? "complainantAge"
                : "respondentAge";

        JsonNode partyDetails = additionalDetails.path(detailsKey);
        JsonNode formDataArray = partyDetails.path("formdata");

        if (!formDataArray.isArray() || formDataArray.isEmpty()) {
            log.warn("No formdata found for {}", partyType);
            return;
        }
        for (JsonNode formDataNode : formDataArray) {
            JsonNode dataNode = formDataNode.path("data");
            String formIndividualId = dataNode
                    .path(verificationKey)
                    .path("individualDetails")
                    .path("individualId")
                    .asText(null);
            if (individualId.equals(formIndividualId)) {
                String fullName;
                String ageStr;
                String address = null;

                if (partyType.equalsIgnoreCase(COMPLAINANT_PRIMARY)) {
                    // --- Complainant fields ---
                    String firstName = dataNode.path("firstName").asText("").trim();
                    String lastName = dataNode.path("lastName").asText("").trim();
                    fullName = (firstName + " " + lastName).trim();
                    ageStr = dataNode.path(ageKey).asText(null);
                    JsonNode addressNode = dataNode.path("addressDetails");
                    address = extractAddress(addressNode);

                } else {
                    // --- Respondent fields ---
                    String firstName = dataNode.path("respondentFirstName").asText("").trim();
                    String middleName = dataNode.path("respondentMiddleName").asText("").trim();
                    String lastName = dataNode.path("respondentLastName").asText("").trim();
                    fullName = Stream.of(firstName, middleName, lastName)
                            .filter(s -> !s.isEmpty())
                            .collect(Collectors.joining(" "));
                    ageStr = dataNode.path("respondentAge").asText(null);

                    // Respondent has addressDetails as an array
                    JsonNode addressArray = dataNode.path("addressDetails");
                    if (addressArray.isArray() && !addressArray.isEmpty()) {
                        JsonNode innerAddress = addressArray.get(0).path("addressDetails");
                        address = extractAddress(innerAddress);
                    }
                }
                try {
                    int age = (ageStr != null && !ageStr.isEmpty()) ? Integer.parseInt(ageStr) : 0;

                    if (partyType.equalsIgnoreCase(COMPLAINANT_PRIMARY)) {
                        record.setPetName(fullName.isEmpty() ? null : fullName);
                        if (age > 0) record.setPetAge(age);
                        record.setPetAddress(address);
                    } else {
                        record.setResName(fullName.isEmpty() ? null : fullName);
                        if (age > 0) record.setResAge(age);
                        record.setResAddress(address);
                    }
                    log.info("Matched {} with individualId: {}", partyType.toLowerCase(), individualId);
                } catch (NumberFormatException e) {
                    log.warn("Invalid {} age format: {}", partyType.toLowerCase(), ageStr);
                }
                return;
            }
        }
        log.warn("No matching formdata entry found for {} individualId: {}", partyType, individualId);
    }


    private Party findPrimaryParty(List<Party> litigants, String partyType) {
        return litigants.stream().filter(party -> partyType.equalsIgnoreCase(party.getPartyType())).findFirst().orElse(null);
    }

    public List<PartyDetails> enrichExtraPartyDetails(CourtCase courtCase, String partyType) {
        List<PartyDetails> extraParties = new ArrayList<>();
        List<PartyDetails> existingParties = repository.getPartyDetails(courtCase.getCnrNumber(),
                partyType.equalsIgnoreCase(COMPLAINANT_PRIMARY) ? PartyType.PET : PartyType.RES);

        JsonNode additionalDetails = objectMapper.convertValue(courtCase.getAdditionalDetails(), JsonNode.class);
        if (additionalDetails == null) {
            log.warn("No additional details found in court case");
            return extraParties;
        }

        List<Party> litigants = courtCase.getLitigants();
        if (litigants == null || litigants.isEmpty()) {
            log.warn("No litigants found in court case");
            return extraParties;
        }

        // Identify the primary party so we can skip it
        Party primaryParty = findPrimaryParty(litigants, partyType);
        String primaryIndividualId = primaryParty != null ? primaryParty.getIndividualId() : null;

        String detailsKey = partyType.equalsIgnoreCase(COMPLAINANT_PRIMARY)
                ? "complainantDetails"
                : "respondentDetails";
        String verificationKey = partyType.equalsIgnoreCase(COMPLAINANT_PRIMARY)
                ? "complainantVerification"
                : "respondentVerification";

        JsonNode partyDetails = additionalDetails.path(detailsKey);
        JsonNode formDataArray = partyDetails.path("formdata");

        if (!formDataArray.isArray() || formDataArray.isEmpty()) {
            log.warn("No formdata found for {}", partyType);
            return extraParties;
        }

        // 🔹 Collect existing individualIds for duplicate check
        Set<String> existingIndividualIds = existingParties.stream()
                .map(PartyDetails::getPartyId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Integer partyId = 1;
        for (JsonNode formDataNode : formDataArray) {
            JsonNode dataNode = formDataNode.path("data");

            String formIndividualId = dataNode
                    .path(verificationKey)
                    .path("individualDetails")
                    .path("individualId")
                    .asText(null);

            // ✅ Skip the primary party
            if (primaryIndividualId != null && primaryIndividualId.equals(formIndividualId)) {
                continue;
            }

            // ✅ Skip if already exists in existingParties
            if (formIndividualId != null && existingIndividualIds.contains(formIndividualId)) {
                log.debug("Skipping {} with existing individualId: {}", partyType.toLowerCase(), formIndividualId);
                continue;
            }

            // ✅ Extract name, age, and address differently for complainant/respondent
            String fullName = "";
            String ageStr = "";
            String address = null;

            if (partyType.equalsIgnoreCase(COMPLAINANT_PRIMARY)) {
                // --- Complainant Extra Fields ---
                String firstName = dataNode.path("firstName").asText("").trim();
                String lastName = dataNode.path("lastName").asText("").trim();
                fullName = (firstName + " " + lastName).trim();
                ageStr = dataNode.path("complainantAge").asText(null);

                JsonNode addressNode = dataNode.path("addressDetails");
                address = extractAddress(addressNode);

            } else if(partyType.equalsIgnoreCase(RESPONDENT_PRIMARY)) {
                // --- Respondent Extra Fields ---
                String firstName = dataNode.path("respondentFirstName").asText("").trim();
                String middleName = dataNode.path("respondentMiddleName").asText("").trim();
                String lastName = dataNode.path("respondentLastName").asText("").trim();

                fullName = Stream.of(firstName, middleName, lastName)
                        .filter(s -> !s.isEmpty())
                        .collect(Collectors.joining(" "));

                ageStr = dataNode.path("respondentAge").asText(null);

                JsonNode addressArray = dataNode.path("addressDetails");
                if (addressArray.isArray() && !addressArray.isEmpty()) {
                    JsonNode innerAddress = addressArray.get(0).path("addressDetails");
                    address = extractAddress(innerAddress);
                }
            }

            Integer age = null;
            try {
                if (ageStr != null && !ageStr.isEmpty()) {
                    age = Integer.parseInt(ageStr);
                }
            } catch (NumberFormatException e) {
                log.warn("Invalid {} age format: {}", partyType.toLowerCase(), ageStr);
            }
            // Build PartyDetails entry
            PartyDetails details = PartyDetails.builder()
                    .id(partyId)
                    .cino(courtCase.getCnrNumber())
                    .partyNo(partyId)
                    .partyType(partyType.equalsIgnoreCase(COMPLAINANT_PRIMARY)
                            ? PartyType.PET
                            : PartyType.RES)
                    .partyName(fullName.isEmpty() ? null : fullName)
                    .partyAddress(address)
                    .partyAge(age)
                    .partyId(formIndividualId)
                    .build();

            extraParties.add(details);
            existingIndividualIds.add(formIndividualId);
            partyId++;
            log.debug("Added extra {} with individualId: {}", partyType.toLowerCase(), formIndividualId);
        }

        if (extraParties.isEmpty()) {
            log.info("No extra {} found for case {}", partyType, courtCase.getCnrNumber());
        } else {
            log.info("Added {} extra {}(s) for case {}", extraParties.size(), partyType, courtCase.getCnrNumber());
        }
        return extraParties;
    }

    public void enrichAdvocateDetails(CourtCase courtCase, NJDGTransformRecord record, String party) {
        List<AdvocateMapping> advocateMappings = courtCase.getRepresentatives();

        String advocateId = null;
        for(AdvocateMapping advocateMapping : advocateMappings) {
            Party litigant = findPrimaryParty(advocateMapping.getRepresenting(), party);
            if(litigant == null) {
                continue;
            }
            advocateId = advocateMapping.getAdvocateId();
        }
        if(advocateId == null){
            log.warn("No Advocate found for {}", party);
            return;
        }
        AdvocateDetails advocateDetails = advocateRepository.getAdvocateDetails(advocateId);

        if(advocateDetails == null) {
            log.info("No Advocate details found for {}", advocateId);
            return;
        }
        if(COMPLAINANT_PRIMARY.equalsIgnoreCase(party)){
            record.setPetAdvCd(advocateDetails.getAdvocateCode());
            record.setPetAdvBarReg(advocateDetails.getBarRegNo());
            record.setPetAdv(advocateDetails.getAdvocateName());
        } else if(RESPONDENT_PRIMARY.equalsIgnoreCase(party)) {
            record.setResAdvCd(advocateDetails.getAdvocateCode());
            record.setResAdvBarReg(advocateDetails.getBarRegNo());
            record.setResAdv(advocateDetails.getAdvocateName());
        }
    }


//    public void enrichPartyDetails(CourtCase courtCase, NJDGTransformRecord record) {
//        try {
//            JsonNode additionalDetails = objectMapper.convertValue(courtCase.getAdditionalDetails(), JsonNode.class);
//            if (additionalDetails == null) {
//                log.warn("No additional details found in court case");
//                return;
//            }
//
//            List<Party> litigants = courtCase.getLitigants();
//            if (litigants == null || litigants.isEmpty()) {
//                log.warn("No litigants found in court case");
//                return;
//            }
//
//            JsonNode complainantDetails = additionalDetails.path("complainantDetails");
//            if (!complainantDetails.isMissingNode()) {
//                JsonNode formData = complainantDetails.path("formdata").path(0).path("data");
//                if (!formData.isMissingNode()) {
//                    String individualId = formData.path("complainantVerification").path("individualDetails").path("individualId").asText(null);
//
//                    Party complainantLitigant = findLitigantByIndividualId(litigants, individualId);
//
//                    if (complainantLitigant != null) {
//                        String firstName = formData.path("firstName").asText("").trim();
//                        String lastName = formData.path("lastName").asText("").trim();
//                        String petName = (firstName + " " + lastName).trim();
//
//                        String petAge = formData.path("complainantAge").asText(null);
//                        JsonNode addressNode = formData.path("addressDetails");
//                        String address = extractAddress(addressNode);
//                        record.setPetName(petName.isEmpty() ? null : petName);
//                        record.setPetAge(petAge);
//                        record.setPetAddress(address);
//                        log.debug("Matched petitioner with individualId: {}", individualId);
//                    } else {
//                        log.warn("No matching litigant found for complainant with individualId: {}", individualId);
//                    }
//                }
//            }
//
//            JsonNode respondentDetails = additionalDetails.path("respondentDetails");
//            if (!respondentDetails.isMissingNode()) {
//                JsonNode formData = respondentDetails.path("formdata").path(0);
//                if (!formData.isMissingNode()) {
//                    String uniqueId = formData.path("uniqueId").asText(null);
//
//                    Party respondentLitigant = findLitigantByUniqueId(litigants, uniqueId);
//                    if (respondentLitigant != null) {
//                        String firstName = formData.path("respondentFirstName").asText("").trim();
//                        String lastName = formData.path("respondentLastName").asText("").trim();
//                        String resName = (firstName + " " + lastName).trim();
//
//                        String resAge = formData.path("respondentAge").asText(null);
//
//                        record.setResName(resName.isEmpty() ? null : resName);
//                        record.setResAge(resAge);
//
//                        JsonNode addressNode = formData.path("addressDetails").path(0).path("addressDetails");
//                        String address = extractAddress(addressNode);
//                        record.setResAddress(address);
//
//                        log.debug("Matched respondent with uniqueId: {}", uniqueId);
//                    } else {
//                        log.warn("No matching litigant found for respondent with uniqueId: {}", uniqueId);
//                    }
//                }
//            }
//        } catch (Exception e) {
//            log.error("Error while enriching party details for case: " + courtCase.getId(), e);
//        }
//    }
//
//    /**
//     * Helper method to find a litigant by individualId
//     */
//    private Party findLitigantByIndividualId(List<Party> litigants, String individualId) {
//        if (individualId == null || litigants == null) {
//            return null;
//        }
//        return litigants.stream()
//                .filter(litigant -> individualId.equals(litigant.getIndividualId()) && COMPLAINANT_PRIMARY.equalsIgnoreCase(litigant.getPartyType()))
//                .findFirst()
//                .orElse(null);
//    }
//
//    /**
//     * Helper method to find a litigant by uniqueId from additionalDetails
//     */
//
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

    public void enrichPoliceStationDetails(CourtCase courtCase, NJDGTransformRecord record) {
        try {
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
            PoliceStationDetails policeStationDetails = repository.getPoliceStationDetails(policeStationCode);
            if(policeStationDetails == null) {
                log.debug("Police details not found in data for code:: {}", policeStationCode);
                return;
            }
            record.setPoliceStCode(policeStationDetails.getPoliceStationCode());
            record.setPoliceNcode(policeStationDetails.getNatCode());
            record.setPoliceStation(policeStationDetails.getStName());
        } catch (Exception e) {
            log.error("Error while enriching police station details: ", e.getMessage());
        }
    }
}
//
//    public void enrichAdvocateDetails(CourtCase courtCase, NJDGTransformRecord record) {
//        try {
//            if (courtCase.getRepresentatives() == null || courtCase.getRepresentatives().isEmpty()) {
//                log.info("No representatives found in the court case");
//                return;
//            }
//
//            for (AdvocateMapping advocateMapping : courtCase.getRepresentatives()) {
//                if (advocateMapping.getIsActive() == null || !advocateMapping.getIsActive()) {
//                    continue;
//                }
//
//                String advocateUuid = advocateMapping.getAdvocateId();
//                String advocateName = null;
//
//                if (advocateMapping.getAdditionalDetails() != null) {
//                    JsonNode additionalDetails = objectMapper.valueToTree(advocateMapping.getAdditionalDetails());
//                    advocateName = additionalDetails.path("advocateName").asText(null);
//                }
//                AdvocateSerialNumber advocateInfo = getAdvDetails(advocateUuid);
//                if (advocateInfo != null &&8 advocateMapping.getRepresenting() != null && !advocateMapping.getRepresenting().isEmpty()) {
//                    for (Party party : advocateMapping.getRepresenting()) {
//                        String partyType = party.getPartyType();
//
//                        // Check if this is a complainant or respondent
//                        if (partyType != null) {
//                            if (COMPLAINANT_PRIMARY.equalsIgnoreCase(partyType)) {
//                                record.setPetAdv(advocateName);
//                                record.setPetAdvCd(advocateInfo.getSerialNo().toString());
//                                record.setPetAdvBarReg(advocateInfo.getBarRegNo());
//                            } else if (RESPONDENT_PRIMARY.equalsIgnoreCase(partyType)) {
//                                record.setResAdv(advocateName);
//                                record.setResAdvCd(advocateInfo.getSerialNo().toString());
//                                record.setResAdvBarReg(advocateInfo.getBarRegNo());
//                            }
//                        }
//                    }
//                }
//            }
//            log.debug("Successfully enriched advocate details for case: {}", courtCase.getId());
//        } catch (Exception e) {
//            log.error("Error while enriching advocate details for case: " + courtCase.getId(), e);
//        }
//    }
//
//    /**
//     * Helper method to get bar registration number for an advocate
//     */
//    private AdvocateSerialNumber getAdvDetails(String advocateUuid) {
//        try {
//            return repository.findAdvocateSerialNumber(advocateUuid);
//        } catch (Exception e) {
//            log.error("Error fetching bar registration number for advocate: " + advocateUuid, e);
//            return null;
//        }
//    }
//
//
//    public void enrichExtraParties(CourtCase courtCase, NJDGTransformRecord record) {
//        try {
//            JsonNode caseDetails = objectMapper.convertValue(courtCase.getAdditionalDetails(), JsonNode.class);
//            if (caseDetails == null) {
//                log.warn("No case details found for case: {}", courtCase.getCaseNumber());
//                return;
//            }
//
//            // Process complainants (pet_extra_party)
//            JsonNode complainantDetails = caseDetails.path("complainantDetails");
//            if (complainantDetails != null && !complainantDetails.isMissingNode()) {
//                List<JsonNode> petExtraParties = processPartyDetails(complainantDetails, "complainant");
//                if (petExtraParties != null && !petExtraParties.isEmpty()) {
//                    record.setPetExtraParty(petExtraParties);
//                }
//            }
//
//            // Process respondents (res_extra_party)
//            JsonNode respondentDetails = caseDetails.path("respondentDetails");
//            if (respondentDetails != null && !respondentDetails.isMissingNode()) {
//                List<JsonNode> resExtraParties = processPartyDetails(respondentDetails, "respondent");
//                if (resExtraParties != null && !resExtraParties.isEmpty()) {
//                    record.setResExtraParty(resExtraParties);
//                }
//            }
//        } catch (Exception e) {
//            log.error("Error while enriching extra parties for case: {}", courtCase.getCaseNumber(), e);
//        }
//    }
//
//    private List<JsonNode> processPartyDetails(JsonNode partyDetails, String partyType) {
//        List<JsonNode> extraParties = new ArrayList<>();
//
//        try {
//            JsonNode formDataArray = partyDetails.path("formdata");
//            if (formDataArray.isArray() && formDataArray.size() > 1) {
//                // Skip the first party (primary) and process the rest
//                for (int i = 1; i < formDataArray.size(); i++) {
//                    JsonNode partyNode = formDataArray.get(i);
//                    if (partyNode != null && !partyNode.isNull()) {
//                        JsonNode dataNode = partyNode.path("data");
//                        if (!dataNode.isMissingNode()) {
//                            String partyName = "";
//                            String partyAddress = "";
//                            String partyAge = "";
//                            String partyNo = String.valueOf(i); // 1-based index
//
//                            // Extract name based on party type
//                            if ("complainant".equals(partyType)) {
//                                partyName = dataNode.path("firstName").asText("");
//                                String middleName = dataNode.path("middleName").asText("");
//                                String lastName = dataNode.path("lastName").asText("");
//
//                                // Construct full name
//                                StringBuilder nameBuilder = new StringBuilder(partyName);
//                                if (!middleName.isEmpty()) {
//                                    nameBuilder.append(" ").append(middleName);
//                                }
//                                if (!lastName.isEmpty()) {
//                                    nameBuilder.append(" ").append(lastName);
//                                }
//                                partyName = nameBuilder.toString().trim();
//
//                                // Get age for complainant
//                                partyAge = dataNode.path("complainantAge").asText("");
//
//                                // Get address for complainant
//                                JsonNode addressNode = dataNode.path("addressDetails");
//                                partyAddress = extractAddress(addressNode);
//                            } else {
//                                // For respondents
//                                partyName = dataNode.path("respondentFirstName").asText("");
//
//                                // Get address for respondent
//                                JsonNode addressArray = dataNode.path("addressDetails");
//                                if (addressArray.isArray() && !addressArray.isEmpty()) {
//                                    JsonNode addressNode = addressArray.get(0).path("addressDetails");
//                                    partyAddress = extractAddress(addressNode);
//                                }
//                            }
//
//                            // Create party object
//                            ObjectNode party = objectMapper.createObjectNode();
//                            party.put("party_name", partyName);
//                            party.put("party_no", partyNo);
//                            party.put("party_address", partyAddress);
//                            if (!partyAge.isEmpty()) {
//                                party.put("party_age", partyAge);
//                            }
//
//                            extraParties.add(party);
//                        }
//                    }
//                }
//            }
//        } catch (Exception e) {
//            log.error("Error processing {} details", partyType, e);
//        }
//        return extraParties.isEmpty() ? null : extraParties;
//    }
//
//    public void enrichStatuteSection(RequestInfo requestInfo, CourtCase courtCase, NJDGTransformRecord record) {
//        List<StatuteSection> statutesAndSections = courtCase.getStatutesAndSections();
//        if (statutesAndSections == null || statutesAndSections.isEmpty()) {
//            return;
//        }
//
//        // Fetch MDMS data for act master
//        Map<String, Map<String, JSONArray>> mdmsData = mdmsUtil.fetchMdmsData(
//            requestInfo,
//            courtCase.getTenantId(),
//            NJDG_MODULE,
//            List.of(ACT_MASTER)
//        );
//
//        if (mdmsData == null || mdmsData.isEmpty() || !mdmsData.containsKey(NJDG_MODULE)) {
//            log.warn("No MDMS data found for module: {}", NJDG_MODULE);
//            return;
//        }
//
//        JSONArray actMasterData = mdmsData.get(NJDG_MODULE).get(ACT_MASTER);
//        if (actMasterData == null || actMasterData.isEmpty()) {
//            log.warn("No act master data found in MDMS response");
//            return;
//        }
//
//        List<JsonNode> actNodes = new ArrayList<>();
//        ObjectMapper mapper = new ObjectMapper();
//
//        for (StatuteSection statuteSection : statutesAndSections) {
//            if (statuteSection.getStatute() == null ||
//                statuteSection.getSections() == null ||
//                statuteSection.getSections().isEmpty()) {
//                continue;
//            }
//
//            for (Object actObj : actMasterData) {
//                if (actObj instanceof Map) {
//                    Map<String, Object> actData = (Map<String, Object>) actObj;
//                    String code = (String) actData.get("code");
//
//                    if (statuteSection.getStatute().equals(code)) {
//                        ObjectNode actNode = mapper.createObjectNode();
//                        actNode.put("act_code", code);
//                        actNode.put("act_name", actData.get("name").toString());
//
//                        // Get the first section from the list
//                        String section = statuteSection.getSections().get(0);
//                        actNode.put("act_section", section);
//
//                        actNodes.add(actNode);
//                        break; // Found matching act, move to next statute section
//                    }
//                }
//            }
//        }
//
//        // Set the act nodes in the record if any were found
//        if (!actNodes.isEmpty()) {
//            record.setAct(actNodes);
//        }
//    }
//
//    /**
//     * Enriches the record with police station details by matching the police station code from case details
//     * with the MDMS police station master data.
//     *
//     * @param requestInfo The request info containing user and auth details
//     * @param courtCase The court case containing additional details
//     * @param record The NJDG record to be enriched with police station details
//     */
//    public void enrichPoliceStationDetails(RequestInfo requestInfo, CourtCase courtCase, NJDGTransformRecord record) {
//        try {
//            // Get police station details from case additional details
//            JsonNode caseDetails = objectMapper.convertValue(courtCase.getCaseDetails(), JsonNode.class);
//            if (caseDetails == null || caseDetails.path("chequeDetails").isMissingNode()) {
//                log.debug("No cheque details found in case additional details");
//                return;
//            }
//
//            JsonNode chequeDetails = caseDetails.path("chequeDetails");
//            if (chequeDetails.path("formdata").isMissingNode() || !chequeDetails.path("formdata").isArray() || chequeDetails.path("formdata").isEmpty()) {
//                log.debug("No formdata found in cheque details");
//                return;
//            }
//
//            // Extract police station code from case details
//            JsonNode policeStationNode = chequeDetails.path("formdata").get(0)
//                .path("data")
//                .path("policeStationJurisDictionCheque");
//
//            if (policeStationNode.isMissingNode()) {
//                log.debug("No police station details found in cheque details");
//                return;
//            }
//
//            String policeStationCode = policeStationNode.path("code").asText();
//            if (policeStationCode == null || policeStationCode.isEmpty()) {
//                log.debug("No police station code found in cheque details");
//                return;
//            }
//
//            // Fetch police station master data from MDMS
//            Map<String, Map<String, JSONArray>> policeMaster = mdmsUtil.fetchMdmsData(
//                requestInfo,
//                courtCase.getTenantId(),
//                NJDG_MODULE,
//                List.of(POLICE_MASTER)
//            );
//
//            if (policeMaster == null || policeMaster.isEmpty() || !policeMaster.containsKey(NJDG_MODULE) ||
//                !policeMaster.get(NJDG_MODULE).containsKey(POLICE_MASTER)) {
//                log.warn("No police master data found in MDMS response");
//                return;
//            }
//
//            JSONArray policeMasterData = policeMaster.get(NJDG_MODULE).get(POLICE_MASTER);
//            if (policeMasterData == null || policeMasterData.isEmpty()) {
//                log.warn("Empty police master data in MDMS response");
//                return;
//            }
//
//            // Find matching police station in MDMS data
//            for (Object policeObj : policeMasterData) {
//                if (policeObj instanceof Map) {
//                    Map<String, Object> policeData = (Map<String, Object>) policeObj;
//                    String code = String.valueOf(policeData.get("code"));
//
//                    if (policeStationCode.equals(code)) {
//                        // Set the police station details in the record
//                        record.setPoliceStCode(String.valueOf(policeData.get("policeStationCode")));
//                        record.setPoliceNcode(String.valueOf(policeData.get("nationalCode")));
//                        record.setPoliceStation(String.valueOf(policeData.get("name")));
//                        log.debug("Successfully set police station details: {}", policeData);
//                        return;
//                    }
//                }
//            }
//
//            log.warn("No matching police station found in MDMS for code: {}", policeStationCode);
//
//        } catch (Exception e) {
//            log.error("Error while enriching police station details: ", e);
//        }
//    }

