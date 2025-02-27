package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;


@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ScheduleHearing {

    @JsonProperty("hearingBookingId")
    private String hearingBookingId;

    @JsonProperty("tenantId")
    private String tenantId;

    @JsonProperty("courtId")
    private String courtId;

    @JsonProperty("judgeIds")
    private List<String> judgeIds;

    @JsonProperty("caseId")
    private String caseId;

    @JsonProperty("hearingType")
    private String hearingType;

    @JsonProperty("title")
    private String title;

    @JsonProperty("description")
    private String description;

    @JsonProperty("status")
    private String status;

    @JsonProperty("hearingDate")
    private long hearingDate;

    @JsonProperty("startTime")
    private long startTime;

    @JsonProperty("endTime")
    private long endTime;


    @JsonProperty("originalHearingDate")
    private long originalHearingDate;

    @JsonProperty("expiryTime")
    private Long expiryTime;
}
