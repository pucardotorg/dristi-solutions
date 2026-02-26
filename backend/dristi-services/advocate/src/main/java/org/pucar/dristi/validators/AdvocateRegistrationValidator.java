package org.pucar.dristi.validators;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.repository.AdvocateRepository;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.service.IndividualService;
import org.pucar.dristi.web.models.Advocate;
import org.pucar.dristi.web.models.AdvocateRequest;
import org.pucar.dristi.web.models.AdvocateSearchCriteria;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.util.ObjectUtils;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.regex.Pattern;

import static org.pucar.dristi.config.ServiceConstants.*;

@Component
@Slf4j
public class AdvocateRegistrationValidator {
    private final IndividualService individualService;
    private final AdvocateRepository repository;
    private final Configuration configuration;

    @Autowired
    public AdvocateRegistrationValidator(IndividualService individualService, AdvocateRepository repository,
                                         Configuration configuration) {
        this.individualService = individualService;
        this.repository = repository;
        this.configuration = configuration;
    }

    /**
     * @param advocateRequest  advocate application request
     * @throws CustomException VALIDATION_EXCEPTION -> if tenantId or individualId not present
     * INDIVIDUAL_NOT_FOUND-> if individualId doesn't exist
     */
    public void validateAdvocateRegistration(AdvocateRequest advocateRequest) throws CustomException{
        RequestInfo requestInfo = advocateRequest.getRequestInfo();
         if(requestInfo.getUserInfo() == null)
            throw new CustomException(VALIDATION_EXCEPTION,"User info not found!!!");

        Advocate advocate =  advocateRequest.getAdvocate();
        if(ObjectUtils.isEmpty(advocate.getTenantId()) || ObjectUtils.isEmpty(advocate.getIndividualId())){
            throw new CustomException(ILLEGAL_ARGUMENT_EXCEPTION_CODE,"tenantId and individualId are mandatory for creating advocate");
        }
        //searching individual exist or not
        if(!individualService.searchIndividual(requestInfo,advocate.getIndividualId(), new HashMap<>()))
            throw new CustomException(INDIVIDUAL_NOT_FOUND,"Requested Individual not found or does not exist");

        validateBarRegistrationNumber(advocateRequest);
    }

    public void validateBarRegistrationNumber(AdvocateRequest advocateRequest){

        Advocate advocate = advocateRequest.getAdvocate();
        String barRegistrationNumber = advocate.getBarRegistrationNumber();

        validateBarRegistrationNumberFormat(barRegistrationNumber);

        List<String> barRegistrationNumberParts = List.of(barRegistrationNumber.split("/"));

        BarRegistrationNumberComponents components = parseBarRegistrationNumber(barRegistrationNumberParts);

        validateBarRegistrationNumberUniqueness(advocate.getTenantId(), components, barRegistrationNumber);
    }

    public void validateBarRegistrationNumberFormat(String barRegistrationNumber) {

        if(!Pattern.matches(configuration.getBarRegistrationNumberFormat(), barRegistrationNumber))
            throw new CustomException(ILLEGAL_ARGUMENT_EXCEPTION_CODE,
                    String.format("Bar Registration Number %s is in invalid format", barRegistrationNumber));
    }

    private BarRegistrationNumberComponents parseBarRegistrationNumber(List<String> barRegistrationNumberParts) {
        String stateCode = barRegistrationNumberParts.get(0);
        String serialNumber = barRegistrationNumberParts.get(1);
        String year = barRegistrationNumberParts.get(2);

        String normalizedSerialNumber = serialNumber.replaceAll("^0+", "");
        return new BarRegistrationNumberComponents(stateCode, normalizedSerialNumber, year);
    }

    private void validateBarRegistrationNumberUniqueness(String tenantId, BarRegistrationNumberComponents components, String originalValue) {
        List<String> existingBarRegistrationNumbers = repository.getDistinctBarRegistrationNumbersForTenant(tenantId);

        for(String existingBarRegistrationNumber: existingBarRegistrationNumbers){

            if(!Pattern.matches(configuration.getBarRegistrationNumberFormat(), existingBarRegistrationNumber)){
                log.info("Skipping validation against existing bar registration number {} due to incorrect format", existingBarRegistrationNumber);
                continue;
            }

            List<String> existingBarRegistrationParts = List.of(existingBarRegistrationNumber.split("/"));

            BarRegistrationNumberComponents existingComponents = parseBarRegistrationNumber(existingBarRegistrationParts);


            boolean isStateCodeMatching = components.stateCode().equals(existingComponents.stateCode());
            boolean isNormalizedSerialNumberMatching = components.normalizedSerialNumber().equals(existingComponents.normalizedSerialNumber());
            boolean isYearMatching = components.year().equals(existingComponents.year());
            if(isStateCodeMatching && isNormalizedSerialNumberMatching && isYearMatching){
                throw new CustomException(ILLEGAL_ARGUMENT_EXCEPTION_CODE,
                        String.format("Bar Registration Number %s already exists", originalValue));
            }
        }
    }

    private record BarRegistrationNumberComponents(String stateCode, String normalizedSerialNumber, String year) {}

    /**
     * @param advocate  advocate details
     * @throws CustomException VALIDATION_EXCEPTION -> if application is not present
     */
    public Advocate validateApplicationExistence(Advocate advocate) {
        //checking if application exist or not
        List<AdvocateSearchCriteria> list = repository.getAdvocates(Collections.singletonList(AdvocateSearchCriteria.builder().applicationNumber(advocate.getApplicationNumber()).build()), advocate.getTenantId(), 1,0);
        List<Advocate> existingApplications = list.get(0).getResponseList();
        log.info("Existing Applications :: {}", existingApplications);
        if(existingApplications.isEmpty()) throw new CustomException(VALIDATION_EXCEPTION,"Advocate Application does not exist");
        return existingApplications.get(0);
    }
}
