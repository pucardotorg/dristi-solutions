package org.egov.individual.validators;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.models.Error;
import org.egov.common.validator.Validator;
import org.egov.individual.repository.IndividualRepository;
import org.egov.individual.web.models.Individual;
import org.egov.individual.web.models.IndividualBulkRequest;
import org.egov.individual.web.models.IndividualSearch;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.egov.common.utils.CommonUtils.populateErrorDetails;

@Component
@Slf4j
public class SystemUserValidator implements Validator<IndividualBulkRequest, Individual> {

    private final IndividualRepository individualRepository;

    @Autowired
    public SystemUserValidator(IndividualRepository individualRepository) {
        this.individualRepository = individualRepository;
    }

    @Override
    public Map<Individual, List<Error>> validate(IndividualBulkRequest request) {
        log.info("validating system user fields");
        Map<Individual, List<Error>> errorDetailsMap = new HashMap<>();
        List<Individual> individuals = request.getIndividuals();

        if (individuals.isEmpty()) {
            return errorDetailsMap;
        }

        for (Individual individual : individuals) {
            if (!Boolean.TRUE.equals(individual.getIsSystemUser())) {
                continue;
            }

            if (individual.getUserId() == null || individual.getUserUuid() == null) {
                Error error = Error.builder()
                        .errorMessage("UserId and UserUuid are mandatory for a system user")
                        .errorCode("NULL_USERID_OR_USERUUID")
                        .type(Error.ErrorType.NON_RECOVERABLE)
                        .exception(new CustomException("NULL_USERID_OR_USERUUID",
                                "UserId and UserUuid are mandatory for a system user"))
                        .build();
                populateErrorDetails(individual, error, errorDetailsMap);
                continue;
            }

            if (existingIndividualFoundForUser(individual)) {
                Error error = Error.builder()
                        .errorMessage("Individual already exists for the given user")
                        .errorCode("INDIVIDUAL_ALREADY_EXISTS_FOR_USER")
                        .type(Error.ErrorType.NON_RECOVERABLE)
                        .exception(new CustomException("INDIVIDUAL_ALREADY_EXISTS_FOR_USER",
                                "Individual already exists for the given user"))
                        .build();
                populateErrorDetails(individual, error, errorDetailsMap);
            }
        }

        return errorDetailsMap;
    }

    private boolean existingIndividualFoundForUser(Individual individual) {
        IndividualSearch searchByUserUuid = IndividualSearch.builder()
                .userUuid(Collections.singletonList(individual.getUserUuid()))
                .build();
        List<Individual> existingByUserUuid = individualRepository.find(
                searchByUserUuid, 1, 0, individual.getTenantId(), null, false);
        if (!existingByUserUuid.isEmpty()) {
            return true;
        }

        try {
            Long parsedUserId = Long.parseLong(individual.getUserId());
            IndividualSearch searchByUserId = IndividualSearch.builder()
                    .userId(parsedUserId)
                    .build();
            List<Individual> existingByUserId = individualRepository.find(
                    searchByUserId, 1, 0, individual.getTenantId(), null, false);
            return !existingByUserId.isEmpty();
        } catch (NumberFormatException e) {
            log.warn("userId '{}' is not a valid numeric value; skipping userId duplicate check",
                    individual.getUserId());
            return false;
        }
    }
}