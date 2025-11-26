package com.dristi.njdg_transformer.service;

import com.dristi.njdg_transformer.model.AdvocateDetails;
import com.dristi.njdg_transformer.model.advocate.Advocate;
import com.dristi.njdg_transformer.model.advocate.AdvocateRequest;
import com.dristi.njdg_transformer.producer.Producer;
import com.dristi.njdg_transformer.repository.AdvocateRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class AdvocateService {

    private final AdvocateRepository advocateRepository;
    private final ObjectMapper objectMapper;
    private final Producer producer;

    public AdvocateDetails processAndUpdateAdvocates(AdvocateRequest advocateRequest) {
        Advocate advocate = advocateRequest.getAdvocate();

        // Extract advocate name from additionalDetails
        String advocateName = null;
        if (advocate.getAdditionalDetails() != null) {
            JsonNode additionalDetailsNode = objectMapper.convertValue(advocate.getAdditionalDetails(), JsonNode.class);
            if (additionalDetailsNode.has("username")) {
                advocateName = additionalDetailsNode.get("username").asText();
            }
        }

        AdvocateDetails advocateDetails = AdvocateDetails.builder()
                .advocateId(advocate.getId().toString())
                .barRegNo(advocate.getBarRegistrationNumber())
                .advocateName(advocateName)
                .build();

        List<AdvocateDetails> existingAdvocates = advocateRepository.getAllAdvocates();

        if (existingAdvocates.isEmpty()) {
            // First advocate in the system
            advocateDetails.setAdvocateCode(1);
            producer.push("save-advocate-details", advocateDetails);
            return advocateDetails;
        }

        // Check if bar registration number already exists (duplicate)
        boolean duplicateBarRegNo = existingAdvocates.stream()
                .anyMatch(a -> a.getBarRegNo().equalsIgnoreCase(advocate.getBarRegistrationNumber()));
        if (duplicateBarRegNo) {
            return null;
        }

        // Assign next advocate code
        int nextCode = existingAdvocates.stream()
                .mapToInt(AdvocateDetails::getAdvocateCode)
                .max()
                .orElse(0) + 1;
        advocateDetails.setAdvocateCode(nextCode);

        // Save new advocate
        producer.push("save-advocate-details", advocateDetails);
        return advocateDetails;
    }


}
