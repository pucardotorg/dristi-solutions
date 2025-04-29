package org.egov.infra.indexer.custom.application;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.infra.indexer.custom.pt.Property;
import org.egov.infra.indexer.custom.pt.PropertyDetail;
import org.springframework.stereotype.Service;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Service
@Slf4j
public class ApplicationCustomDecorator {

    /**
     * Transforms data by converting long to date format.
     *
     * @param applications
     * @return
     */
    public List<Application> transformData(List<Application> applications){
        for(Application application: applications) {
            if (application.getCreatedDate() != null) {
                Date date = new Date(application.getCreatedDate());
                SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
                String formatted = sdf.format(date);
                application.setCreatedDateTime(formatted);
            }
        }
        return applications;
    }
}
