package org.egov.inbox.web.model.V2;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import org.egov.inbox.web.model.Criteria;

import javax.validation.constraints.Max;
import javax.validation.constraints.NotNull;
import java.util.HashMap;
import java.util.List;

@Data
public class IndexSearchCriteria {
    @NotNull
    @JsonProperty("tenantId")
    private String tenantId;

    @NotNull
    @JsonProperty("moduleName")
    private String moduleName;

    @JsonProperty("moduleSearchCriteria")
    private HashMap<String,Object> moduleSearchCriteria;

    @JsonProperty("searchReviewProcess")
    private Criteria searchReviewProcess;

    @JsonProperty("searchViewApplication")
    private Criteria searchViewApplication;

    @JsonProperty("searchDelayCondonationApplication")
    private Criteria searchDelayCondonationApplication;

    @JsonProperty("searchRescheduleHearingsApplication")
    private Criteria searchRescheduleHearingsApplication;

    @JsonProperty("searchNoticeAndSummons")
    private Criteria searchNoticeAndSummons;

    @JsonProperty("searchOtherApplications")
    private Criteria searchOtherApplications;

    @JsonProperty("searchScheduleHearing")
    private Criteria searchScheduleHearing;

    @JsonProperty("searchRegisterCases")
    private Criteria searchRegisterCases;

    @JsonProperty("searchBailBonds")
    private Criteria searchBailBonds;

    @JsonProperty("searchScrutinyCases")
    private Criteria searchScrutinyCases;

    @JsonProperty("searchOfflinePayments")
    private Criteria searchOfflinePayments;

    @JsonProperty("searchRegisterUsers")
    private Criteria searchRegisterUsers;

    @JsonProperty("offset")
    private Integer offset;

    @JsonProperty("limit")
    @Max(value = 300)
    private Integer limit;
}
