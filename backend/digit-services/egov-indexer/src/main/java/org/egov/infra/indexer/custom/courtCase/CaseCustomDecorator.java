package org.egov.infra.indexer.custom.courtCase;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
@Service
@Slf4j
public class CaseCustomDecorator {

    /**
     * Transforms case data by converting long to date format.
     *
     * @param criteriaList
     * @return
     */
    public List<CaseCriteria> transformData(List<CaseCriteria> criteriaList){

        for (CaseCriteria caseCriteria : criteriaList) {
            if (caseCriteria.getResponseList() != null) {
                for (CourtCase courtCase : caseCriteria.getResponseList()) {
                    // Example: update the status to "Closed"
                    SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");

                    if (courtCase.getFilingDate() != null) {
                        Date filingDate = new Date(courtCase.getFilingDate());
                        String filingFormatted = sdf.format(filingDate);
                        courtCase.setFilingDateTime(filingFormatted);
                    }

                    if (courtCase.getRegistrationDate() != null) {
                        Date registrationDate = new Date(courtCase.getRegistrationDate());
                        String registrationDateFormatted = sdf.format(registrationDate);
                        courtCase.setRegistrationDateTime(registrationDateFormatted);
                    }

                    if (courtCase.getJudgementDate() != null) {
                        Date judgementDate = new Date(courtCase.getJudgementDate());
                        String judgementDateFormatted = sdf.format(judgementDate);
                        courtCase.setJudgementDateTime(judgementDateFormatted);
                    }

                }
            }
        }
        return criteriaList;
    }
}
