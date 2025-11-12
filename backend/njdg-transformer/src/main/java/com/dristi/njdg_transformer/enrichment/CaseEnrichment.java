package com.dristi.njdg_transformer.enrichment;

import com.dristi.njdg_transformer.model.*;
import com.dristi.njdg_transformer.model.cases.*;
import com.dristi.njdg_transformer.model.enums.PartyType;
import com.dristi.njdg_transformer.producer.Producer;
import com.dristi.njdg_transformer.repository.AdvocateRepository;
import com.dristi.njdg_transformer.repository.CaseRepository;
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

@Component
@Slf4j
@RequiredArgsConstructor
public class CaseEnrichment {

    private final ObjectMapper objectMapper;
    private final AdvocateRepository advocateRepository;
    private final CaseRepository repository;
    private final JsonUtil jsonUtil;
    private final Producer producer;

    // -------------------- PUBLIC METHODS --------------------

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
        if (primaryParty == null || primaryParty.getIndividualId() == null || primaryParty.getIndividualId().isEmpty()) {
            log.warn("No primary {} with individualId found", partyType);
            return;
        }

        enrichPartyFormData(additionalDetails, record, primaryParty.getIndividualId(), partyType);
    }

    public void enrichAdvocateDetails(CourtCase courtCase, NJDGTransformRecord record, String party) {
        List<String> advocateIds = courtCase.getRepresentatives().stream()
                .map(mapping -> findPrimaryParty(mapping.getRepresenting(), party))
                .filter(Objects::nonNull)
                .map(partyTemp -> getAdvocateId(courtCase, partyTemp.getIndividualId()))
                .collect(Collectors.toList());

        if (advocateIds.isEmpty()) {
            log.warn("No advocate found for {}", party);
            return;
        }

        String primaryAdvocateId = advocateIds.get(0);
        Optional.ofNullable(advocateRepository.getAdvocateDetails(primaryAdvocateId))
                .ifPresentOrElse(advocateDetails -> {
                    setPrimaryAdvocate(record, party, advocateDetails);
                    addExtraAdvocates(courtCase, record, party, advocateIds, primaryAdvocateId);
                }, () -> log.info("No advocate details found for {}", primaryAdvocateId));
    }

    public void enrichPoliceStationDetails(CourtCase courtCase, NJDGTransformRecord record) {
        try {
            JsonNode caseDetails = objectMapper.convertValue(courtCase.getCaseDetails(), JsonNode.class);
            if (caseDetails == null) return;

            JsonNode policeStationNode = caseDetails.path("chequeDetails")
                    .path("formdata").get(0)
                    .path("data")
                    .path("policeStationJurisDictionCheque");

            if (policeStationNode.isMissingNode()) return;

            String policeStationCode = policeStationNode.path("code").asText();
            if (policeStationCode == null || policeStationCode.isEmpty()) return;

            PoliceStationDetails policeDetails = repository.getPoliceStationDetails(policeStationCode);
            if (policeDetails != null) {
                record.setPoliceStCode(policeDetails.getPoliceStationCode());
                record.setPoliceNcode(policeDetails.getNatCode());
                record.setPoliceStation(policeDetails.getStName());
            }
        } catch (Exception e) {
            log.error("Error enriching police station details: {}", e.getMessage());
        }
    }

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
                fullName = buildFullName(dataNode.path("firstName"), dataNode.path("lastName"));
                ageStr = dataNode.path(ageKey).asText(null);
                address = extractAddress(dataNode.path("addressDetails"));
            } else {
                fullName = buildFullName(dataNode.path("respondentFirstName"),
                        dataNode.path("respondentMiddleName"),
                        dataNode.path("respondentLastName"));
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
        return Stream.of(names)
                .map(JsonNode::asText)
                .filter(s -> s != null && !s.trim().isEmpty())
                .collect(Collectors.joining(" "));
    }

    private void setRecordPartyDetails(NJDGTransformRecord record, String partyType, String fullName, int age, String address) {
        if (COMPLAINANT_PRIMARY.equalsIgnoreCase(partyType)) {
            record.setPetName(fullName.isEmpty() ? null : fullName);
            if (age > 0) record.setPetAge(age);
            record.setPetAddress(address);
        } else {
            record.setResName(fullName.isEmpty() ? null : fullName);
            if (age > 0) record.setResAge(age);
            record.setResAddress(address);
        }
    }

    private void setPrimaryAdvocate(NJDGTransformRecord record, String party, AdvocateDetails advocateDetails) {
        if (COMPLAINANT_PRIMARY.equalsIgnoreCase(party)) {
            record.setPetAdvCd(advocateDetails.getAdvocateCode());
            record.setPetAdvBarReg(advocateDetails.getBarRegNo());
            record.setPetAdv(advocateDetails.getAdvocateName());
        } else {
            record.setResAdvCd(advocateDetails.getAdvocateCode());
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
        int srNo = !existingAdvocates.isEmpty() ? existingAdvocates.get(existingAdvocates.size()-1).getSrNo()+1 : 1;

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
                        .srNo(srNo)
                        .build();
                srNo++;
                extraAdvocateDetailsList.add(extraAdvocateDetails);
            }
        }

        if (!extraAdvocateDetailsList.isEmpty()) {
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

            int partyNo = 1;
            for (JsonNode dataNode : formDataArray) {
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
            uniqueId = dataNode.path("data")
                    .path("uniqueId")
                    .asText(null);
        }

        Party primaryParty = findPrimaryParty(courtCase.getLitigants(), partyType);
        if (primaryParty != null && uniqueId.equalsIgnoreCase(primaryParty.getIndividualId())) return null;

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

        Integer age = null;
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
        if (individualId == null || individualId.isEmpty()) individualId = data.path("uniqueId").asText(null);

        if (!fullName.isEmpty()) partyDetails.setPartyName(fullName);
        if (age != null) partyDetails.setPartyAge(age);
        if (address != null && !address.isEmpty()) partyDetails.setPartyAddress(address);
        if (individualId != null && !individualId.isEmpty()) {
            partyDetails.setPartyId(individualId);
            AdvocateDetails advocateDetails = getAdvocateDetailsIfExists(courtCase, individualId);
            if (advocateDetails != null) {
                partyDetails.setAdvCd(advocateDetails.getAdvocateCode());
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

        int partyNo = existingParties.size() + 1;

        // ✅ Filter witnesses based on partyType
        List<WitnessDetails> filteredWitnesses = witnessDetails.stream()
                .filter(w -> matchesPartyType(w.getOwnerType(), partyType))
                .toList();

        for (WitnessDetails w : filteredWitnesses) {

            String uniqueId = w.getUniqueId();
            PartyDetails existing = findExistingParty(existingParties, uniqueId);

            if (existing != null) {
                witnessPartyDetails.add(existing);
                continue;
            }

            String fullName = w.getFirstName()
                    + (w.getMiddleName() != null ? w.getMiddleName() : "")
                    + w.getLastName();

            String address = extractAddress(
                    objectMapper.convertValue(
                            w.getAddressDetails().get(0).getAddressDetails(),
                            JsonNode.class
                    )
            );

            PartyDetails newWitness = PartyDetails.builder()
                    .partyId(uniqueId)
                    .partyName(fullName)
                    .partyAge(Integer.parseInt(w.getWitnessAge()))
                    .partyAddress(address)
                    .partyType(partyType)
                    .cino(courtCase.getCnrNumber())
                    .partyNo(partyNo++)
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

}
