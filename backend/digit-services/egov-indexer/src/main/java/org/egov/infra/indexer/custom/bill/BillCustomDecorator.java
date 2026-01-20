package org.egov.infra.indexer.custom.bill;

import lombok.extern.slf4j.Slf4j;
import org.egov.infra.indexer.custom.application.Application;
import org.egov.infra.indexer.custom.courtCase.CaseCriteria;
import org.egov.infra.indexer.custom.courtCase.CourtCase;
import org.springframework.stereotype.Service;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;

@Service
@Slf4j
public class BillCustomDecorator {

    /**
     * Transforms data by converting long to date format.
     *
     * @param bills
     * @return
     */
    public List<Bill> transformData(List<Bill> bills){
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
        for (Bill bill : bills) {
            if (bill.getBillDate() != null) {
                Date billDate = new Date(bill.getBillDate());
                String billFormatted = sdf.format(billDate);
                bill.setBillDateTime(billFormatted);
            }
            if (bill.getBillDetails() != null) {
                for (BillDetail billDetail : bill.getBillDetails()) {
                    if (billDetail.getFromPeriod() != null) {
                        Date fromPeriod = new Date(billDetail.getFromPeriod());
                        String fromPeriodFormatted = sdf.format(fromPeriod);
                        billDetail.setFromPeriodDate(fromPeriodFormatted);
                    }

                    if (billDetail.getToPeriod() != null) {
                        Date toPeriod = new Date(billDetail.getToPeriod());
                        String toPeriodFormatted = sdf.format(toPeriod);
                        billDetail.setToPeriodDate(toPeriodFormatted);
                    }
                }
            }
        }
        return bills;
    }
}
