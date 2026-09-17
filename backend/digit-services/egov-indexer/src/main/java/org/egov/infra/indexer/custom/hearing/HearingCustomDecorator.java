package org.egov.infra.indexer.custom.hearing;

import lombok.extern.slf4j.Slf4j;
import org.egov.infra.indexer.custom.application.Application;
import org.springframework.stereotype.Service;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;

@Service
@Slf4j
public class HearingCustomDecorator {

    /**
     * Transforms hearing data by converting long to date format.
     *
     * @param hearings
     * @return
     */
    public List<Hearing> transformData(List<Hearing> hearings){
        for(Hearing hearing: hearings) {
            if (hearing.getStartTime() != null) {
                Date date = new Date(hearing.getStartTime());
                SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
                String formatted = sdf.format(date);
                hearing.setStartDateTime(formatted);
            }
        }
        return hearings;
    }
}
