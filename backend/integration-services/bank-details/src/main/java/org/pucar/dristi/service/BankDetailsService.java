package org.pucar.dristi.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.BankDetailsRepository;
import org.pucar.dristi.web.models.BankDetails;
import org.pucar.dristi.web.models.BankDetailsSearchCriteria;
import org.pucar.dristi.web.models.BankDetailsSearchRequest;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class BankDetailsService {

    private final BankDetailsRepository bankDetailsRepository;

    public BankDetailsService(BankDetailsRepository bankDetailsRepository) {
        this.bankDetailsRepository = bankDetailsRepository;
    }

    public List<BankDetails> searchBankDetails(BankDetailsSearchRequest request) {

        List<BankDetails> bankDetailsList = new ArrayList<>();

        for(BankDetailsSearchCriteria criteria: request.getCriteria()) {
            String ifsc = criteria.getIfsc();
            JsonNode response = bankDetailsRepository.fetchBankDetails(ifsc);

            if(response == null){
                throw new CustomException("BANK_DETAILS_NOT_FOUND", "Bank details not found for ifsc: " + ifsc);
            }

            BankDetails bankDetails = BankDetails.builder()
                    .name(response.path("BANK").asText())
                    .branch(response.path("BRANCH").asText())
                    .ifsc(response.path("IFSC").asText())
                    .build();

            bankDetailsList.add(bankDetails);
        }

        return bankDetailsList;


    }
}
