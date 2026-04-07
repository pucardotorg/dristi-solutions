package com.dristi.njdg_transformer.service;

import com.dristi.njdg_transformer.config.TransformerProperties;
import com.dristi.njdg_transformer.model.AdvocateDetails;
import com.dristi.njdg_transformer.model.advocate.*;
import com.dristi.njdg_transformer.producer.Producer;
import com.dristi.njdg_transformer.repository.AdvocateRepository;
import com.dristi.njdg_transformer.utils.IndividualUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.models.individual.Address;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class AdvocateService {

    private final AdvocateRepository advocateRepository;
    private final ObjectMapper objectMapper;
    private final Producer producer;
    private final IndividualUtil individualUtil;
    private final TransformerProperties properties;

    public AdvocateDetails processAndUpdateAdvocates(AdvocateRequest advocateRequest) {
        Advocate advocate = advocateRequest.getAdvocate();
        String advocateId = advocate.getId().toString();
        
        log.info("Processing advocate request for ID: {}", advocateId);
        
        try {
            // Extract advocate details from multiple sources
            AdvocateDetails advocateDetails = buildAdvocateDetails(advocate);
            
            // Check if advocate already exists
            List<AdvocateDetails> existingAdvocates = advocateRepository.getAllAdvocates();
            AdvocateDetails existingAdvocate = findExistingAdvocate(existingAdvocates, advocateId);
            
            if (existingAdvocate != null) {
                return updateExistingAdvocate(advocateDetails, existingAdvocate);
            } else {
                return createNewAdvocate(advocateDetails);
            }
            
        } catch (Exception e) {
            log.error("Failed to process advocate with ID: {}, error: {}", advocateId, e.getMessage(), e);
            throw e;
        }
    }

    private AdvocateDetails buildAdvocateDetails(Advocate advocate) {
        String advocateId = advocate.getId().toString();
        String individualId = advocate.getIndividualId();
        
        // Initialize advocate data fields
        String advocateName = null;
        String email = null;
        String phone = null;
        String address = null;
        LocalDate dob = null;
        
        // Extract data from Individual service
        if (individualId != null && !individualId.trim().isEmpty()) {
            try {
                IndividualSearchRequest searchRequest = buildIndividualSearchRequest(individualId);
                List<Individual> individuals = individualUtil.getIndividualByIndividualId(searchRequest);
                
                if (individuals != null && !individuals.isEmpty()) {
                    Individual individual = individuals.get(0);
                    
                    if (individual.getName() != null && individual.getName().getGivenName() != null) {
                        advocateName = individual.getName().getGivenName();
                    }
                    
                    if (individual.getEmail() != null && !individual.getEmail().trim().isEmpty()) {
                        email = individual.getEmail();
                    }
                    
                    if (individual.getMobileNumber() != null && !individual.getMobileNumber().trim().isEmpty()) {
                        phone = individual.getMobileNumber();
                    }
                    
                    if (individual.getDateOfBirth() != null) {
                        dob = individual.getDateOfBirth().toInstant()
                                .atZone(ZoneId.of(properties.getApplicationZoneId()))
                                .toLocalDate();
                    }
                    
                    if (individual.getAddress() != null && !individual.getAddress().isEmpty()
                        && individual.getAddress().get(0) != null) {
                        address = extractAddress(individual.getAddress().get(0));
                    }
                    
                    log.info("Successfully extracted data from Individual service for advocate: {}", advocate.getId());
                } else {
                    log.info("No individual data found for individualId: {}", individualId);
                }
                
            } catch (Exception e) {
                log.error("Failed to fetch individual data for individualId: {}, error: {}", individualId, e.getMessage());
            }
        } else {
            log.info("No individualId provided for advocate: {}", advocate.getId());
        }
        
        return AdvocateDetails.builder()
                .advocateId(advocateId)
                .barRegNo(advocate.getBarRegistrationNumber())
                .advocateName(advocateName != null ? advocateName : "")
                .email(email)
                .phone(phone)
                .dob(dob)
                .address(address)
                .build();
    }

    private String extractAddress(Address address) {
        if (address == null) return "";

        List<String> parts = new ArrayList<>();

        addIfPresent(parts, address.getDoorNo());
        addIfPresent(parts, address.getBuildingName());
        addIfPresent(parts, address.getStreet());
        addIfPresent(parts, address.getAddressLine1());
        addIfPresent(parts, address.getAddressLine2());
        addIfPresent(parts, address.getCity());
        addIfPresent(parts, address.getLandmark());

        String base = String.join(", ", parts);

        if (address.getPincode() != null && !address.getPincode().trim().isEmpty()) {
            base = base + " - " + address.getPincode();
        }

        return base;
    }

    private void addIfPresent(List<String> parts, String value) {
        if (value != null && !value.trim().isEmpty()) {
            parts.add(value.trim());
        }
    }


    private IndividualSearchRequest buildIndividualSearchRequest(String individualId) {
        return IndividualSearchRequest.builder()
                .individual(IndividualSearch.builder()
                        .individualId(individualId)
                        .build())
                .build();
    }

    private AdvocateDetails findExistingAdvocate(List<AdvocateDetails> existingAdvocates, String advocateId) {
        return existingAdvocates.stream()
                .filter(a -> a.getAdvocateId().equalsIgnoreCase(advocateId))
                .findFirst()
                .orElse(null);
    }

    private AdvocateDetails updateExistingAdvocate(AdvocateDetails advocateDetails, AdvocateDetails existingAdvocate) {
        advocateDetails.setAdvocateCode(existingAdvocate.getAdvocateCode());
        
        try {
            producer.push("update-advocate-details", advocateDetails);
            log.info("Successfully updated existing advocate - ID: {}, Code: {}", 
                    advocateDetails.getAdvocateId(), advocateDetails.getAdvocateCode());
            return advocateDetails;
        } catch (Exception e) {
            log.error("Failed to update advocate - ID: {}, Code: {}, error: {}", 
                    advocateDetails.getAdvocateId(), advocateDetails.getAdvocateCode(), e.getMessage());
            throw e;
        }
    }

    private AdvocateDetails createNewAdvocate(AdvocateDetails advocateDetails) {
        try {
            producer.push("save-advocate-details", advocateDetails);
            log.info("Successfully created new advocate - ID: {}", advocateDetails.getAdvocateId());
            return advocateDetails;
        } catch (Exception e) {
            log.error("Failed to create new advocate - ID: {}, error: {}",
                    advocateDetails.getAdvocateId(), e.getMessage());
            throw e;
        }
    }

}
