package digit.config;

import com.jayway.jsonpath.JsonPath;
import digit.util.MdmsUtil;
import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

import static digit.config.ServiceConstants.DATE_FORMAT_D_M_Y;
import static digit.config.ServiceConstants.DATE_FORMAT_Y_M_D;

@Service
@Slf4j
public class MdmsDataConfig {

    private final MdmsUtil mdmsUtil;
    private final Configuration configuration;

    @Getter
    private List<String> courtHolidays = new ArrayList<>();

    @Autowired
    public MdmsDataConfig(MdmsUtil mdmsUtil, Configuration configuration) {
        this.mdmsUtil = mdmsUtil;
        this.configuration = configuration;
    }

    @PostConstruct
    public void loadConfigData(){
        loadCourtNonWorkingDates();
    }

    private void loadCourtNonWorkingDates(){
        try {
            RequestInfo requestInfo = RequestInfo.builder().build();
            courtHolidays.addAll(getCourtNonWorkingDays(requestInfo,configuration.getTenantId()));
        } catch (Exception e) {
            log.error("Error while fetching court non working days");
        }
    }

    private List<String> getCourtNonWorkingDays(RequestInfo requestInfo, String tenantId) {
        String mdmsData = mdmsUtil.fetchMdmsData(requestInfo, tenantId,
                configuration.getScheduleHearingModuleName(), List.of(configuration.getCourtHolidayMasterName()));

        List<String> rawDates = JsonPath.read(mdmsData, "");
        DateTimeFormatter inputFormatter = DateTimeFormatter.ofPattern(DATE_FORMAT_D_M_Y);
        DateTimeFormatter outputFormatter = DateTimeFormatter.ofPattern(DATE_FORMAT_Y_M_D);

        return rawDates.stream()
                .map(date -> {
                    try {
                        return LocalDate.parse(date, inputFormatter).format(outputFormatter);
                    } catch (DateTimeParseException e) {
                        return null;
                    }
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

    }
}
