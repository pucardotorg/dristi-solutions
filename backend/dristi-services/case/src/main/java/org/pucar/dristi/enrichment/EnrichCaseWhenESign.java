package org.pucar.dristi.enrichment;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.pucar.dristi.enrichment.strategy.EnrichmentStrategy;
import org.pucar.dristi.service.IndividualService;
import org.pucar.dristi.util.AdvocateUtil;
import org.pucar.dristi.util.CaseUtil;
import org.pucar.dristi.web.models.Advocate;
import org.pucar.dristi.web.models.CaseRequest;
import org.pucar.dristi.web.models.POAHolder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.pucar.dristi.config.ServiceConstants.E_SIGN;

@Component
@Slf4j
public class EnrichCaseWhenESign implements EnrichmentStrategy {

    private final IndividualService individualService;
    private final AdvocateUtil advocateUtil;

    private final CaseUtil caseUtil;

    @Autowired
    public EnrichCaseWhenESign(IndividualService individualService, AdvocateUtil advocateUtil, CaseUtil caseUtil) {
        this.individualService = individualService;
        this.advocateUtil = advocateUtil;
        this.caseUtil = caseUtil;
    }

    @Override
    public boolean canEnrich(CaseRequest caseRequest) {
        return E_SIGN.equalsIgnoreCase(caseRequest.getCases().getWorkflow().getAction());
    }

    @Override
    public void enrich(CaseRequest caseRequest) {
        log.info("Method=EnrichCaseWhenESign,Result=IN_PROGRESS, CaseId={}", caseRequest.getCases().getId());

        RequestInfo requestInfo = caseRequest.getRequestInfo();
        String individualId = individualService.getIndividualId(requestInfo);
        log.info("Method=EnrichCaseWhenESign,Result=IN_PROGRESS, IndividualId={}", individualId);


        // check if he is poa holder if yes mark this sign as true
        // then check if he is litigant or advocate
        // if he is litigant and dont have poa holders then put his sign as true
        // if he have poa holder then then dont sign litigant
        // if he is advocate then sign advocate as true

        Map<String, List<POAHolder>> litigantPoaMapping = caseUtil.getLitigantPoaMapping(caseRequest.getCases());


        // check if poa signed
        boolean isPoaSigned = Optional.ofNullable(caseRequest.getCases().getPoaHolders())
                .orElse(Collections.emptyList()).stream()
                .filter(poa -> individualId.equals(poa.getIndividualId()))
                .findFirst()
                .map(poa -> {
                    poa.setHasSigned(true);
                    return true;
                })
                .orElse(false);

        log.info("Method=EnrichCaseWhenESign,Result=IN_PROGRESS, PoaSigned={}", isPoaSigned);


        boolean isLitigantSigned = Optional.ofNullable(caseRequest.getCases().getLitigants()).orElse(Collections.emptyList()).stream()
                .filter(party -> individualId.equals(party.getIndividualId()) && litigantPoaMapping.containsKey(party.getIndividualId()) && litigantPoaMapping.get(party.getIndividualId()).isEmpty()

                )
                .findFirst()
                .map(party -> {
                    party.setHasSigned(true);
                    return true;
                })
                .orElse(false);
        log.info("Method=EnrichCaseWhenESign,Result=IN_PROGRESS, LitigantSigned={}", isLitigantSigned);

        if (!isLitigantSigned && !litigantPoaMapping.containsKey(individualId)) {
            log.info("Method=EnrichCaseWhenESign,Result=IN_PROGRESS, checking if advocate signed");

            List<Advocate> advocates = advocateUtil.fetchAdvocatesByIndividualId(requestInfo, individualId);

            List<Advocate> activeAdvocate = advocates.stream()
                    .filter(Advocate::getIsActive)
                    .toList();

            if (!activeAdvocate.isEmpty()) {
                //expecting only one advocate
                String advocateId = activeAdvocate.get(0).getId().toString();

                boolean isAdvocateSigned = Optional.ofNullable(caseRequest.getCases().getRepresentatives())
                        .orElse(Collections.emptyList()).stream()
                        .filter(advocate -> advocateId.equals(advocate.getAdvocateId()))
                        .findFirst()
                        .map(advocate -> {
                            advocate.setHasSigned(true);
                            return true;
                        })
                        .orElse(false);
                log.info("Method=EnrichCaseWhenESign,Result=IN_PROGRESS, AdvocateSigned={}", isAdvocateSigned);
            }


        }
        log.info("Method=EnrichCaseWhenESign,Result=SUCCESS, CaseId={}", caseRequest.getCases().getId());
    }

}
