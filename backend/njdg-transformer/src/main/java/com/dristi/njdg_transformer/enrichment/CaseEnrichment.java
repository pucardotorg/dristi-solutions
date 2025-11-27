package com.dristi.njdg_transformer.enrichment;

import com.dristi.njdg_transformer.model.AdvocateDetails;
import com.dristi.njdg_transformer.model.ExtraAdvocateDetails;
import com.dristi.njdg_transformer.model.NJDGTransformRecord;
import com.dristi.njdg_transformer.model.PartyDetails;
import com.dristi.njdg_transformer.model.PoliceStationDetails;
import com.dristi.njdg_transformer.model.cases.AdvocateMapping;
import com.dristi.njdg_transformer.model.cases.CourtCase;
import com.dristi.njdg_transformer.model.cases.Party;
import com.dristi.njdg_transformer.model.cases.WitnessDetails;
import com.dristi.njdg_transformer.model.enums.PartyType;
import com.dristi.njdg_transformer.producer.Producer;
import com.dristi.njdg_transformer.repository.AdvocateRepository;
import com.dristi.njdg_transformer.repository.CaseRepository;
import com.dristi.njdg_transformer.service.interfaces.PartyEnricher;
import com.dristi.njdg_transformer.utils.JsonUtil;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jetbrains.annotations.Nullable;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static com.dristi.njdg_transformer.config.ServiceConstants.*;

/**
 * Refactored CaseEnrichment class implementing PartyEnricher interface
 * Follows Single Responsibility Principle and Interface Segregation Principle
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class CaseEnrichment implements PartyEnricher {

    private final ObjectMapper objectMapper;
    private final AdvocateRepository advocateRepository;
    private final CaseRepository repository;
    private final JsonUtil jsonUtil;
    private final Producer producer;

    // -------------------- PARTY ENRICHER INTERFACE METHODS --------------------

    @Override
    public void enrichPrimaryPartyDetails(CourtCase courtCase, NJDGTransformRecord record, String partyType) {
        log.info("Enriching primary party details for party type: {} in case CNR: {}", 
                 partyType, courtCase.getCnrNumber());
        
        try {
            JsonNode additionalDetails = objectMapper.convertValue(courtCase.getAdditionalDetails(), JsonNode.class);
            if (additionalDetails == null) {
                log.warn("No additional details found in court case CNR: {}", courtCase.getCnrNumber());
                return;
            }

            List<Party> litigants = courtCase.getLitigants();
            if (litigants == null || litigants.isEmpty()) {
                log.warn("No litigants found in court case CNR: {}", courtCase.getCnrNumber());
                return;
            }

            Party primaryParty = findPrimaryParty(litigants, partyType);
            if (primaryParty == null || primaryParty.getIndividualId() == null || primaryParty.getIndividualId().isEmpty()) {
                log.warn("No primary {} with individualId found in case CNR: {}", 
                        partyType, courtCase.getCnrNumber());
                return;
            }

            enrichPartyFormData(additionalDetails, record, primaryParty.getIndividualId(), partyType);
            log.info("Successfully enriched primary party details for party type: {} in case CNR: {}", 
                     partyType, courtCase.getCnrNumber());
            
        } catch (Exception e) {
            log.error("Error enriching primary party details for party type: {} in case CNR: {}: {}", 
                     partyType, courtCase.getCnrNumber(), e.getMessage(), e);
            throw new RuntimeException("Failed to enrich primary party details", e);
        }
    }

    @Override
    public void enrichAdvocateDetails(CourtCase courtCase, NJDGTransformRecord record, String party) {
        log.info("Enriching advocate details for party: {} in case CNR: {}", 
                 party, courtCase.getCnrNumber());
        
        try {
            List<String> advocateIds = courtCase.getRepresentatives() != null ? 
                    courtCase.getRepresentatives().stream()
                            .filter(mapping -> findPrimaryParty(mapping.getRepresenting(), party) != null)
                            .map(AdvocateMapping::getAdvocateId)
                            .filter(Objects::nonNull)
                            .collect(Collectors.toList()) : 
                    Collections.emptyList();

            if (advocateIds.isEmpty()) {
                log.warn("No advocate found for party: {} in case CNR: {}", party, courtCase.getCnrNumber());
                return;
            }

            String primaryAdvocateId = advocateIds.get(0);
            Optional.ofNullable(advocateRepository.getAdvocateDetails(primaryAdvocateId))
                    .ifPresentOrElse(advocateDetails -> {
                        setPrimaryAdvocate(record, party, advocateDetails);
                        addExtraAdvocates(courtCase, record, party, advocateIds, primaryAdvocateId);
                        log.info("Successfully enriched advocate details for party: {} in case CNR: {}", 
                                 party, courtCase.getCnrNumber());
                    }, () -> log.warn("No advocate details found for advocate ID: {} in case CNR: {}", 
                                     primaryAdvocateId, courtCase.getCnrNumber()));
                                     
        } catch (Exception e) {
            log.error("Error enriching advocate details for party: {} in case CNR: {}: {}", 
                     party, courtCase.getCnrNumber(), e.getMessage(), e);
            throw new RuntimeException("Failed to enrich advocate details", e);
        }
    }

    // -------------------- ADDITIONAL PUBLIC METHODS --------------------

    public List<PartyDetails> getComplainantExtraParties(CourtCase courtCase) {
        return getExtraParties(courtCase, COMPLAINANT_PRIMARY, PartyType.PET);
    }

    public List<PartyDetails> getRespondentExtraParties(CourtCase courtCase) {
        return getExtraParties(courtCase, RESPONDENT_PRIMARY, PartyType.RES);
    }

    // -------------------- PRIVATE HELPERS --------------------

    private Party findPrimaryParty(List<Party> litigants, String partyType) {
        return litigants.stream()
                .filter(p -> partyType.equalsIgnoreCase(p.getPartyType()))
                .findFirst()
                .orElse(null);
    }

    private void enrichPartyFormData(JsonNode additionalDetails, NJDGTransformRecord record, String individualId, String partyType) {
        String detailsKey = partyType.equalsIgnoreCase(COMPLAINANT_PRIMARY) ? "complainantDetails" : "respondentDetails";
        String verificationKey = partyType.equalsIgnoreCase(COMPLAINANT_PRIMARY) ? "complainantVerification" : "respondentVerification";
        String ageKey = partyType.equalsIgnoreCase(COMPLAINANT_PRIMARY) ? "complainantAge" : "respondentAge";

        JsonNode formDataArray = additionalDetails.path(detailsKey).path("formdata");
        if (!formDataArray.isArray() || formDataArray.isEmpty()) {
            log.warn("No formdata found for {}", partyType);
            return;
        }
        for (JsonNode formDataNode : formDataArray) {
            JsonNode dataNode = formDataNode.path("data");
            String formIndividualId = dataNode.path(verificationKey)
                    .path("individualDetails")
                    .path("individualId")
                    .asText(null);

            if (!individualId.equals(formIndividualId)) continue;

            String fullName;
            String ageStr;
            String address = null;

            if (COMPLAINANT_PRIMARY.equalsIgnoreCase(partyType)) {
                fullName = buildFullName(dataNode.path("firstName"), dataNode.path("middleName"), dataNode.path("lastName"));
                ageStr = dataNode.path(ageKey).asText(null);
                address = extractAddress(dataNode.path("addressDetails"));
            } else  {
                String firstName = dataNode.path("respondentFirstName").asText("NULL");
                String middleName = dataNode.path("respondentMiddleName").asText("NULL");
                String lastName = dataNode.path("respondentLastName").asText("NULL");
                
                log.debug("Respondent name fields - firstName: {}, middleName: {}, lastName: {}", 
                    firstName, middleName, lastName);
                
                // Check if data is encrypted (contains | separator)
                if (firstName != null && firstName.contains("|")) {
                    log.error("ENCRYPTED DATA DETECTED: Respondent firstName is encrypted: {}. " +
                        "Data should be decrypted before reaching NJDG transformer!", firstName);
                }
                
                fullName = buildFullName(dataNode.path("respondentFirstName"),
                        dataNode.path("respondentMiddleName"),
                        dataNode.path("respondentLastName"));
                        
                log.debug("Respondent fullName result: '{}'", fullName);
                ageStr = dataNode.path("respondentAge").asText(null);
                JsonNode addressArray = dataNode.path("addressDetails");
                if (addressArray.isArray() && !addressArray.isEmpty()) {
                    address = extractAddress(addressArray.get(0).path("addressDetails"));
                }
            }

            try {
                int age = ageStr != null && !ageStr.isEmpty() ? Integer.parseInt(ageStr) : 0;
                setRecordPartyDetails(record, partyType, fullName, age, address);
                log.info("Matched {} with individualId: {}", partyType.toLowerCase(), individualId);
            } catch (NumberFormatException e) {
                log.warn("Invalid {} age format: {}", partyType.toLowerCase(), ageStr);
            }
            return;
        }
        log.warn("No matching formdata entry found for {} individualId: {}", partyType, individualId);
    }

    private String buildFullName(JsonNode... names) {
        String result = Stream.of(names)
                .map(node -> {
                    if (node.isMissingNode() || node.isNull()) {
                        return null;
                    }
                    String text = node.asText();
                    return "null".equals(text) ? null : text;
                })
                .filter(s -> s != null && !s.trim().isEmpty())
                .collect(Collectors.joining(" "));
        
        log.debug("buildFullName result: '{}'", result);
        return result;
    }

    private void setRecordPartyDetails(NJDGTransformRecord record, String partyType, String fullName, int age, String address) {
        if (COMPLAINANT_PRIMARY.equalsIgnoreCase(partyType)) {
            record.setPetName(fullName.isEmpty() ? null : fullName);
            record.setPetAge(age);
            record.setPetAddress(address);
        } else {
            record.setResName(fullName.isEmpty() ? null : fullName);
            record.setResAge(age);
            record.setResAddress(address);
        }
    }

    private void setPrimaryAdvocate(NJDGTransformRecord record, String party, AdvocateDetails advocateDetails) {
        if (COMPLAINANT_PRIMARY.equalsIgnoreCase(party)) {
            record.setPetAdvCd(advocateDetails.getAdvocateCode() != null ? advocateDetails.getAdvocateCode() : 0);
            record.setPetAdvBarReg(advocateDetails.getBarRegNo());
            record.setPetAdv(advocateDetails.getAdvocateName());
        } else if (RESPONDENT_PRIMARY.equalsIgnoreCase(party)) {
            record.setResAdvCd(advocateDetails.getAdvocateCode() != null ? advocateDetails.getAdvocateCode() : 0);
            record.setResAdvBarReg(advocateDetails.getBarRegNo());
            record.setResAdv(advocateDetails.getAdvocateName());
        }
    }

    private void addExtraAdvocates(CourtCase courtCase, NJDGTransformRecord record, String party,
                                   List<String> advocateIds, String primaryAdvocateId) {

        List<ExtraAdvocateDetails> existingAdvocates = repository
                .getExtraAdvocateDetails(courtCase.getCnrNumber(), COMPLAINANT_PRIMARY.equalsIgnoreCase(party) ? 1 : 2)
                .stream()
                .filter(existingAdvocate -> Objects.equals(existingAdvocate.getPartyNo(), 0))
                .toList();

        List<ExtraAdvocateDetails> extraAdvocateDetailsList = new ArrayList<>();
        for (String advocateId : advocateIds) {
            if(primaryAdvocateId.equalsIgnoreCase(advocateId)) continue;
            AdvocateDetails advocateDetail = advocateRepository.getAdvocateDetails(advocateId);
            boolean advocateExists = false;
            for(ExtraAdvocateDetails extraAdvocateDetails : existingAdvocates) {
                if(extraAdvocateDetails.getAdvCode().equals(advocateDetail.getAdvocateCode())) {
                    extraAdvocateDetails.setPartyNo(0);
                    extraAdvocateDetails.setType(COMPLAINANT_PRIMARY.equalsIgnoreCase(party) ? 1 : 2);
                    extraAdvocateDetails.setAdvCode(advocateDetail.getAdvocateCode());
                    extraAdvocateDetails.setAdvName(advocateDetail.getAdvocateName());
                    extraAdvocateDetails.setPetResName(COMPLAINANT_PRIMARY.equalsIgnoreCase(party) ? record.getPetName() : record.getResName());
                    advocateExists = true;
                    extraAdvocateDetailsList.add(extraAdvocateDetails);
                }
            }
            if(!advocateExists) {
                ExtraAdvocateDetails extraAdvocateDetails = ExtraAdvocateDetails.builder()
                        .cino(courtCase.getCnrNumber())
                        .advCode(advocateDetail.getAdvocateCode())
                        .advName(advocateDetail.getAdvocateName())
                        .type(COMPLAINANT_PRIMARY.equalsIgnoreCase(party) ? 1 : 2)
                        .petResName(COMPLAINANT_PRIMARY.equalsIgnoreCase(party) ? record.getPetName() : record.getResName())
                        .partyNo(0)
                        .build();
                extraAdvocateDetailsList.add(extraAdvocateDetails);
            }
        }

        if (!extraAdvocateDetailsList.isEmpty()) {
            for (int i = 0; i < extraAdvocateDetailsList.size(); i++) {
                extraAdvocateDetailsList.get(i).setSrNo(i + 1);
            }
            producer.push("save-extra-advocate-details", extraAdvocateDetailsList);
        }
    }

    private String extractAddress(JsonNode addressNode) {
        if (addressNode == null || addressNode.isMissingNode()) return null;

        List<String> parts = new ArrayList<>();
        addIfNotEmpty(parts, addressNode.path("locality").asText(null));
        addIfNotEmpty(parts, addressNode.path("city").asText(null));
        addIfNotEmpty(parts, addressNode.path("district").asText(null));
        addIfNotEmpty(parts, addressNode.path("state").asText(null));
        addIfNotEmpty(parts, addressNode.path("pincode").asText(null));

        return parts.isEmpty() ? null : String.join(", ", parts);
    }

    private void addIfNotEmpty(List<String> list, String value) {
        if (value != null && !value.trim().isEmpty()) list.add(value);
    }

    private List<PartyDetails> getExtraParties(CourtCase courtCase, String primaryPartyType, PartyType partyTypeEnum) {
        List<PartyDetails> partyDetailsList = new ArrayList<>();
        try {
            JsonNode additionalDetails = objectMapper.convertValue(courtCase.getAdditionalDetails(), JsonNode.class);
            JsonNode formDataArray = additionalDetails.path(primaryPartyType.equalsIgnoreCase(COMPLAINANT_PRIMARY) ? "complainantDetails" : "respondentDetails").path("formdata");

            int partyNo = 2;
            boolean isRespondentType = primaryPartyType.equalsIgnoreCase(RESPONDENT_PRIMARY);
            int startIndex = isRespondentType ? 1 : 0; // Skip first entry for respondent type
            
            for (int i = startIndex; i < formDataArray.size(); i++) {
                JsonNode dataNode = formDataArray.get(i);
                PartyDetails partyDetails = mapExtraPartyDetails(courtCase, dataNode, primaryPartyType, partyNo++, partyTypeEnum);
                if (partyDetails != null) {
                    partyDetailsList.add(partyDetails);
                }
            }
        } catch (Exception e) {
            log.error("Error enriching extra parties: {}", e.getMessage());
        }
        return partyDetailsList;
    }

    private PartyDetails mapExtraPartyDetails(CourtCase courtCase, JsonNode dataNode, String partyType, int partyNo, PartyType partyTypeEnum) {
        String individualIdPath = partyType.equalsIgnoreCase(COMPLAINANT_PRIMARY) ?
                "complainantVerification" : "respondentVerification";
        String uniqueId = dataNode.path("data")
                .path(individualIdPath)
                .path("individualDetails")
                .path("individualId")
                .asText(null);
        if (uniqueId == null || uniqueId.isEmpty()) {
            uniqueId = dataNode.path("uniqueId").asText(null);
        }
        Party primaryParty = findPrimaryParty(courtCase.getLitigants(), partyType);
        if (primaryParty != null && uniqueId.equalsIgnoreCase(primaryParty.getIndividualId())) {
            log.info("Skipping party mapping - uniqueId {} matches primary party {} for case CNR: {}", 
                     uniqueId, partyType, courtCase.getCnrNumber());
            return null;
        }
//        List<PartyDetails> existingParties = repository.getPartyDetails(courtCase.getCnrNumber(), partyTypeEnum);
//        for (PartyDetails pd : existingParties) {
//            if (uniqueId.equalsIgnoreCase(pd.getPartyId())) {
//                PartyDetails updated = partyType.equalsIgnoreCase(COMPLAINANT_PRIMARY) ?
//                        updatePartyDetails(dataNode, pd, courtCase, true) :
//                        updatePartyDetails(dataNode, pd, courtCase, false);
//                updated.setPartyNo(partyNo);
//                return updated;
//            }
//        }

        PartyDetails newParty = updatePartyDetails(dataNode, new PartyDetails(), courtCase, COMPLAINANT_PRIMARY.equalsIgnoreCase(partyType));
        newParty.setPartyNo(partyNo);
        return newParty;
    }

    private PartyDetails updatePartyDetails(JsonNode dataNode, PartyDetails partyDetails, CourtCase courtCase, boolean isComplainant) {
        if (partyDetails == null) partyDetails = new PartyDetails();
        JsonNode data = dataNode.path("data");

        String fullName = isComplainant ?
                buildFullName(data.path("firstName"), data.path("middleName"), data.path("lastName")) :
                buildFullName(data.path("respondentFirstName"), data.path("respondentMiddleName"), data.path("respondentLastName"));

        int age = 0;
        String ageField = isComplainant ? "complainantAge" : "respondentAge";
        if (data.has(ageField)) {
            try {
                age = Integer.parseInt(data.get(ageField).asText());
            } catch (NumberFormatException ignored) {}
        }

        String address = isComplainant ?
                extractAddress(data.path("addressDetails")) :
                extractAddress(data.path("addressDetails").isArray() && !data.path("addressDetails").isEmpty() ?
                        data.path("addressDetails").get(0).path("addressDetails") : null);

        String individualId = data.path(isComplainant ? "complainantVerification" : "respondentVerification")
                .path("individualDetails")
                .path("individualId")
                .asText(null);
        if (individualId == null || individualId.isEmpty()) individualId = dataNode.path("uniqueId").asText(null);

        if (!fullName.isEmpty()) partyDetails.setPartyName(fullName);
        partyDetails.setPartyAge(age);
        if (address != null && !address.isEmpty()) partyDetails.setPartyAddress(address);
        if (individualId != null && !individualId.isEmpty()) {
            partyDetails.setPartyId(individualId);
            AdvocateDetails advocateDetails = getAdvocateDetailsIfExists(courtCase, individualId);
            if (advocateDetails != null) {
                partyDetails.setAdvCd(advocateDetails.getAdvocateCode() != null ? advocateDetails.getAdvocateCode() : 0);
                partyDetails.setAdvName(advocateDetails.getAdvocateName());
            }
        }

        if (courtCase != null && courtCase.getCnrNumber() != null) partyDetails.setCino(courtCase.getCnrNumber());
        partyDetails.setPartyType(isComplainant ? PartyType.PET : PartyType.RES);

        return partyDetails;
    }

    @Nullable
    private AdvocateDetails getAdvocateDetailsIfExists(CourtCase courtCase, String individualId) {
        String advocateId = getAdvocateId(courtCase, individualId);
        if (advocateId == null) return null;
        return advocateRepository.getAdvocateDetails(advocateId);
    }

    @Nullable
    private static String getAdvocateId(CourtCase courtCase, String individualId) {
        for (AdvocateMapping mapping : courtCase.getRepresentatives()) {
            for (Party representing : mapping.getRepresenting()) {
                if (individualId.equalsIgnoreCase(representing.getIndividualId())) return mapping.getAdvocateId();
            }
        }
        return null;
    }


    public List<PartyDetails> getWitnessDetails(CourtCase courtCase, PartyType partyType) {

        List<PartyDetails> witnessPartyDetails = new ArrayList<>();
        List<WitnessDetails> witnessDetails = courtCase.getWitnessDetails();

        if (witnessDetails == null || witnessDetails.isEmpty()) {
            log.info("No witness present:: {}", courtCase.getCnrNumber());
            return witnessPartyDetails;
        }

        // ✅ Get only required existing parties for PET or RES
        List<PartyDetails> existingParties =
                repository.getPartyDetails(courtCase.getCnrNumber(), partyType);

        int partyNo = !existingParties.isEmpty() ? existingParties.get(existingParties.size()-1).getPartyNo() + 1 : 2;

        // ✅ Filter witnesses based on partyType
        List<WitnessDetails> filteredWitnesses = witnessDetails.stream()
                .filter(w -> matchesPartyType(w.getOwnerType(), partyType))
                .toList();

        for (WitnessDetails w : filteredWitnesses) {

            String uniqueId = w.getUniqueId();
            PartyDetails existing = findExistingParty(existingParties, uniqueId);

            String fullName = buildFullName(w.getFirstName(), w.getMiddleName(), w.getLastName());
            if (fullName.isEmpty()) fullName = w.getWitnessDesignation();

            String address = null;
            if (w.getAddressDetails() != null
                    && !w.getAddressDetails().isEmpty()
                    && w.getAddressDetails().get(0) != null
                    && w.getAddressDetails().get(0).getAddressDetails() != null) {

                JsonNode addressNode = objectMapper.convertValue(
                        w.getAddressDetails().get(0).getAddressDetails(),
                        JsonNode.class
                );
                address = extractAddress(addressNode);
            } else {
                log.warn("Witness has no address details. CNR: {}", courtCase.getCnrNumber());
            }

            if (existing != null) {
                existing.setPartyName(fullName);
                existing.setPartyAddress(address);
                existing.setPartyAge(w.getWitnessAge() != null ? Integer.parseInt(w.getWitnessAge()) : 0);
                witnessPartyDetails.add(existing);
                continue;
            }
            PartyDetails newWitness = PartyDetails.builder()
                    .partyId(uniqueId)
                    .partyName(fullName)
                    .partyAge(w.getWitnessAge() != null ? Integer.parseInt(w.getWitnessAge()) : 0)
                    .partyAddress(address)
                    .partyType(partyType)
                    .cino(courtCase.getCnrNumber())
                    .partyNo(partyNo++)
                    .advCd(0)
                    .build();

            witnessPartyDetails.add(newWitness);
        }

        return witnessPartyDetails;
    }

    private boolean matchesPartyType(String ownerType, PartyType partyType) {
        if (partyType == PartyType.PET) {
            return "COMPLAINANT".equalsIgnoreCase(ownerType);
        } else if (partyType == PartyType.RES) {
            return "ACCUSED".equalsIgnoreCase(ownerType);
        }
        return false;
    }

    private PartyDetails findExistingParty(List<PartyDetails> parties, String uniqueId) {
        for (PartyDetails pd : parties) {
            if (pd.getPartyId().equals(uniqueId)) {
                return pd;
            }
        }
        return null;
    }

    /**
     * Builds full name from first, middle, and last name components
     * Handles null values properly to avoid "null" strings in the result
     */
    private String buildFullName(String firstName, String middleName, String lastName) {
        StringBuilder fullName = new StringBuilder();
        
        if (firstName != null && !firstName.trim().isEmpty()) {
            fullName.append(firstName.trim());
        }
        
        if (middleName != null && !middleName.trim().isEmpty()) {
            fullName.append(middleName.trim());
        }
        
        if (lastName != null && !lastName.trim().isEmpty()) {
            fullName.append(lastName.trim());
        }
        
        return fullName.toString().trim();
    }

}
