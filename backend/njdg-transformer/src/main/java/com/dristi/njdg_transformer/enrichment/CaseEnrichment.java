package com.dristi.njdg_transformer.enrichment;

import com.dristi.njdg_transformer.model.AdvocateDetails;
import com.dristi.njdg_transformer.model.NJDGTransformRecord;
import com.dristi.njdg_transformer.model.PartyDetails;
import com.dristi.njdg_transformer.model.PoliceStationDetails;
import com.dristi.njdg_transformer.model.cases.*;
import com.dristi.njdg_transformer.model.enums.PartyType;
import com.dristi.njdg_transformer.repository.AdvocateRepository;
import com.dristi.njdg_transformer.repository.CaseRepository;
import com.dristi.njdg_transformer.utils.JsonUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jetbrains.annotations.Nullable;
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
    private final JsonUtil jsonUtil;


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

    public List<PartyDetails> enrichWitnessDetails(CourtCase courtCase, String partyType) {
        String ownerType = COMPLAINANT_PRIMARY.equalsIgnoreCase(partyType) ? "COMPLAINANT" : "ACCUSED";
        List<PartyDetails> existingParties = repository.getPartyDetails(courtCase.getCnrNumber(),
                partyType.equalsIgnoreCase(COMPLAINANT_PRIMARY) ? PartyType.PET : PartyType.RES);

        // 🔹 Collect existing individualIds for duplicate check
        Set<String> existingPartyIds = existingParties.stream()
                .map(PartyDetails::getPartyId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Integer id = existingParties.size()+1;
        List<WitnessDetails> witnessDetails = courtCase.getWitnessDetails();
        List<PartyDetails> partyDetails = new ArrayList<>();
        for(WitnessDetails witnessDetail : witnessDetails){
            if(ownerType.equalsIgnoreCase(witnessDetail.getOwnerType()) && !existingPartyIds.contains(witnessDetail.getUniqueId())) {
                String firstName = witnessDetail.getFirstName() != null ? witnessDetail.getFirstName() : "";
                String middleName = witnessDetail.getMiddleName() != null ? witnessDetail.getMiddleName() : "";
                String lastName = witnessDetail.getLastName() != null ? witnessDetail.getLastName() : "";
                String fullName = Stream.of(firstName, middleName, lastName)
                        .filter(s -> !s.isEmpty())
                        .collect(Collectors.joining(" "));
                AddressDetails addressDetails = witnessDetail.getAddressDetails().get(0).getAddressDetails();
                JsonNode addressNode = objectMapper.convertValue(addressDetails, JsonNode.class);
                String address = extractAddress(addressNode);
                Integer age = witnessDetail.getWitnessAge()!= null ? Integer.valueOf(witnessDetail.getWitnessAge()) : null;
                PartyDetails details = PartyDetails.builder()
                        .id(id)
                        .cino(courtCase.getCnrNumber())
                        .partyNo(id)
                        .partyType(partyType.equalsIgnoreCase(COMPLAINANT_PRIMARY)
                                ? PartyType.PET
                                : PartyType.RES)
                        .partyName(fullName.isEmpty() ? null : fullName)
                        .partyAddress(address)
                        .partyAge(age)
                        .partyId(witnessDetail.getUniqueId())
                        .build();
                partyDetails.add(details);
                id++;
            }
        }
        return partyDetails;
    }

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

    public List<PartyDetails> enrichComplainantExtraParties(CourtCase courtCase) {
        try {
            JsonNode formDataNode = jsonUtil.getNestedValue(courtCase.getAdditionalDetails(), List.of("complainantDetails", "formdata"), JsonNode.class);
            List<PartyDetails> partyDetailsList = new ArrayList<>();
            for(JsonNode dataNode : formDataNode) {
                String individualId = jsonUtil.getNestedValue(dataNode, List.of("data", "complainantVerification", "individualDetails", "individualId"), String.class);
                if(individualId == null || individualId.isEmpty()) {
                    log.debug("No individualId found in complainantDetails");
                    continue;
                }
                //checking if the current node is primary party
                Party primaryParty = findPrimaryParty(courtCase.getLitigants(), COMPLAINANT_PRIMARY);
                if(primaryParty != null && individualId.equalsIgnoreCase(primaryParty.getIndividualId())) {
                    continue;
                }

                //get existing parties from db to update if already exists
                List<PartyDetails> partyDetails = repository.getPartyDetails(courtCase.getCnrNumber(), PartyType.PET);
                for(PartyDetails partyDetail : partyDetails) {
                    if(individualId.equalsIgnoreCase(partyDetail.getPartyId())){
                        partyDetail = updateExtraPartyDetails(dataNode, partyDetail, courtCase);
                        partyDetailsList.add(partyDetail);
                    }
                }
                PartyDetails extraPartyDetails = updateExtraPartyDetails(dataNode, new PartyDetails(), courtCase);
                partyDetailsList.add(extraPartyDetails);
            }
            return partyDetailsList;
        } catch (Exception e) {
            log.error("Error Enriching extra party details:: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    private PartyDetails updateExtraPartyDetails(JsonNode dataNode, PartyDetails partyDetails, CourtCase courtCase) {
        if (dataNode == null || partyDetails == null) return partyDetails;
        JsonNode data = dataNode.path("data");

        String firstName = data.path("firstName").asText("");
        String middleName = data.path("middleName").asText("");
        String lastName = data.path("lastName").asText("");

        String fullName = String.join(" ",
                firstName,
                middleName == null ? "" : middleName,
                lastName == null ? "" : lastName
        ).trim();

        Integer age = null;
        if (data.has("complainantAge")) {
            try {
                age = Integer.parseInt(data.get("complainantAge").asText());
            } catch (NumberFormatException ignored) {}
        }


        String completeAddress = extractAddress(data.path("addressDetails"));

        String individualId = data.path("complainantVerification")
                .path("individualDetails")
                .path("individualId")
                .asText(null);
        if (!fullName.isEmpty()) {
            partyDetails.setPartyName(fullName);
        }

        if (age != null) {
            partyDetails.setPartyAge(age);
        }

        if (completeAddress != null && !completeAddress.isEmpty()) {
            partyDetails.setPartyAddress(completeAddress);
        }
        if (individualId != null && !individualId.isEmpty()) {
            partyDetails.setPartyId(individualId);
            AdvocateDetails advocateDetails = getAdvocateDetailsIfExists(courtCase, individualId);
            if(advocateDetails != null) {
                partyDetails.setAdvCd(advocateDetails.getAdvocateCode());
                partyDetails.setAdvName(advocateDetails.getAdvocateName());
            }
        }
        if (courtCase != null && courtCase.getCnrNumber() != null) {
            partyDetails.setCino(courtCase.getCnrNumber());
        }
        return partyDetails;
    }

    public List<PartyDetails> enrichRespondentExtraParties(CourtCase courtCase) {
        try {
            List<PartyDetails> partyDetailsList = new ArrayList<>();
            JsonNode formDataNode = jsonUtil.getNestedValue(courtCase.getAdditionalDetails(), List.of("respondentDetails", "formdata"), JsonNode.class);
            for(JsonNode dataNode: formDataNode) {
                String uniqueId = jsonUtil.getNestedValue(dataNode, List.of("data", "respondentVerification", "individualDetails", "individualId"), String.class);
                if(uniqueId == null) {
                    uniqueId = jsonUtil.getNestedValue(dataNode, List.of("uniqueId"), String.class);
                }
                if(uniqueId == null) {
                    log.debug("No individualId found in respondentDetails");
                    continue;
                }

                Party primaryParty = findPrimaryParty(courtCase.getLitigants(), RESPONDENT_PRIMARY);
                if(primaryParty != null && uniqueId.equalsIgnoreCase(primaryParty.getIndividualId())) {
                    continue;
                }

                List<PartyDetails> partyDetails = repository.getPartyDetails(courtCase.getCnrNumber(), PartyType.RES);
                for(PartyDetails partyDetail : partyDetails) {
                    if(uniqueId.equalsIgnoreCase(partyDetail.getPartyId())) {
                        partyDetail = updateRespondentExtraPartyDetails(dataNode, partyDetail, courtCase);
                        partyDetailsList.add(partyDetail);
                    }
                }
                PartyDetails extraPartyDetails = updateRespondentExtraPartyDetails(dataNode, new PartyDetails(), courtCase);
                partyDetailsList.add(extraPartyDetails);
            }
            return partyDetailsList;
        } catch (Exception e) {
            log.error("Error processing extra parties:: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    private PartyDetails updateRespondentExtraPartyDetails(JsonNode dataNode, PartyDetails partyDetails, CourtCase courtCase) {
        if (dataNode == null) return partyDetails;
        if (partyDetails == null) {
            partyDetails = new PartyDetails(); // fresh insert
        }

        JsonNode data = dataNode.path("data");

        String respondentFirstName = data.path("respondentFirstName").asText("");
        String respondentMiddleName = data.path("respondentMiddleName").asText("");
        String respondentLastName = data.path("respondentLastName").asText("");

        String respondentName = String.join(" ",
                respondentFirstName,
                respondentMiddleName == null ? "" : respondentMiddleName,
                respondentLastName == null ? "" : respondentLastName
        ).trim();

        String uniqueId = data.path("respondentVerification")
                .path("individualDetails")
                .path("individualId")
                .asText(null);
        if(uniqueId == null || uniqueId.isEmpty()) {
            uniqueId = data.path("uniqueId").asText(null);
        }
        if(uniqueId == null || uniqueId.isEmpty()) {
            log.debug("No individualId found in respondentDetails");
            return partyDetails;
        }

        JsonNode addressArray = data.path("addressDetails");
        String address = null;

        if (addressArray.isArray() && !addressArray.isEmpty()) {
            JsonNode addressObject = addressArray.get(0).path("addressDetails");
            address = extractAddress(addressObject);
        }

        if (!respondentName.isEmpty()) {
            partyDetails.setPartyName(respondentName);
        }

        if (address != null && !address.isEmpty()) {
            partyDetails.setPartyAddress(address);
        }

        partyDetails.setPartyId(uniqueId);
        AdvocateDetails advocateDetails = getAdvocateDetailsIfExists(courtCase, uniqueId);
        if(advocateDetails != null) {
            partyDetails.setAdvCd(advocateDetails.getAdvocateCode());
            partyDetails.setAdvName(advocateDetails.getAdvocateName());
        }

        if (courtCase != null && courtCase.getCnrNumber() != null) {
            partyDetails.setCino(courtCase.getCnrNumber());
        }

        return partyDetails;
    }

    private AdvocateDetails getAdvocateDetailsIfExists(CourtCase courtCase, String individualId) {
        String advocateId =  getAdvocateId(courtCase, individualId);
        if(advocateId == null) {
            log.info("No advocates present for the litigant:: {}", individualId);
            return null;
        }
        AdvocateDetails advocateDetails = advocateRepository.getAdvocateDetails(advocateId);
        if(advocateDetails == null) {
            log.info("No Advocate details found for {}", advocateId);
            return null;
        }
        return advocateDetails;
    }

    @Nullable
    private static String getAdvocateId(CourtCase courtCase, String individualId) {
        for(AdvocateMapping advocateMapping : courtCase.getRepresentatives()) {
            for(Party representing: advocateMapping.getRepresenting()) {
                if(individualId.equalsIgnoreCase(representing.getIndividualId())) {
                    return advocateMapping.getAdvocateId();
                }
            }
        }
        return null;
    }

}

