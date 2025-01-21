package org.pucar.dristi.enrichment;

import jakarta.validation.Valid;
import org.egov.common.contract.request.RequestInfo;
import org.pucar.dristi.enrichment.strategy.EnrichmentStrategy;
import org.pucar.dristi.service.IndividualService;
import org.pucar.dristi.util.AdvocateUtil;
import org.pucar.dristi.web.models.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import java.util.AbstractMap;


import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.pucar.dristi.config.ServiceConstants.E_SIGN;
import static org.pucar.dristi.config.ServiceConstants.E_SIGN_COMPLETE;

@Component
public class EnrichCaseWhenESign implements EnrichmentStrategy {

    private final IndividualService individualService;
    private final AdvocateUtil advocateUtil;

    @Autowired
    public EnrichCaseWhenESign(IndividualService individualService, AdvocateUtil advocateUtil) {
        this.individualService = individualService;
        this.advocateUtil = advocateUtil;
    }

    @Override
    public boolean canEnrich(CaseRequest caseRequest) {
        return E_SIGN.equalsIgnoreCase(caseRequest.getCases().getWorkflow().getAction());
    }

    @Override
    public void enrich(CaseRequest caseRequest) {
        RequestInfo requestInfo = caseRequest.getRequestInfo();
        String individualId = individualService.getIndividualId(requestInfo);

        boolean isLitigantSigned = caseRequest.getCases().getLitigants().stream()
                .filter(party -> individualId.equals(party.getIndividualId()))
                .findFirst()
                .map(party -> {
                    party.setHasSigned(true);
                    return true;
                })
                .orElse(false);

        if (!isLitigantSigned) {

            List<Advocate> advocates = advocateUtil.fetchAdvocatesByIndividualId(requestInfo, individualId);

            List<Advocate> activeAdvocate = advocates.stream()
                    .filter(Advocate::getIsActive)
                    .toList();

            if (!activeAdvocate.isEmpty()) {
                //expecting only one advocate
                String advocateId = activeAdvocate.get(0).getId().toString();

                boolean isAdvocateSigned = caseRequest.getCases().getRepresentatives().stream()
                        .filter(advocate -> advocateId.equals(advocate.getAdvocateId()))
                        .findFirst()
                        .map(advocate -> {
                            advocate.setHasSigned(true);
                            return true;
                        })
                        .orElse(false);
            }


        }


        boolean isLastSign = isLastSigned(caseRequest.getCases());

        // workflow action set to E-SIGN_COMPLETE
        if (isLastSign)
            caseRequest.getCases().getWorkflow().setAction(E_SIGN_COMPLETE);


    }

    private boolean isLastSigned(@Valid CourtCase cases) {
        // Check if all litigants have signed
        boolean allLitigantsHaveSigned = cases.getLitigants().stream()
                .filter(Party::getIsActive)
                .allMatch(Party::getHasSigned);

        // If any litigant hasn't signed, return false immediately
        if (!allLitigantsHaveSigned) {
            return false;
        }

        // Create a map of litigant IDs to their respective representatives
        Map<UUID, List<AdvocateMapping>> representativesMap = cases.getRepresentatives().stream()
                .filter(AdvocateMapping::getIsActive)
                .flatMap(rep -> rep.getRepresenting().stream()
                        .map(Party::getId)  // Get the ID of each litigant represented by this advocate
                        .filter(Objects::nonNull)  // Ensure no null IDs
                        .map(litigantId -> new AbstractMap.SimpleEntry<>(litigantId, rep)))  // Create entries with litigant ID and the rep
                .collect(Collectors.groupingBy(Map.Entry::getKey, // Group by litigant ID
                        Collectors.mapping(Map.Entry::getValue, Collectors.toList())));


        // Check if each active litigant  has a at least one signed representative
        // Find the list of representatives for the current litigant
        // If no representatives exist, the litigant's signature is enough
        // If representatives exist, at least one must have signed

        return cases.getLitigants().stream()
                .filter(Party::getIsActive)
                .allMatch(litigant -> {
                    UUID litigantId = litigant.getId();

                    // Find the list of representatives for the current litigant
                    List<AdvocateMapping> representatives = representativesMap.get(litigantId);

                    // If no representatives exist, the litigant's signature is enough
                    if (representatives == null || representatives.isEmpty()) {
                        return true;
                    }

                    // If representatives exist, at least one must have signed
                    return representatives.stream().anyMatch(AdvocateMapping::getHasSigned);
                });
    }

}
