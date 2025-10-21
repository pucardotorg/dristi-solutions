package org.pucar.dristi.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

import java.util.List;

@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class EPostTrackerSearchCriteria {

    @JsonProperty("processNumber")
    private String processNumber;

    @JsonProperty("trackingNumber")
    private  String trackingNumber;

    @JsonProperty("deliveryStatus")
    private String deliveryStatus;

    @JsonProperty("deliveryStatusList")
    private List<String> deliveryStatusList;

    @JsonProperty("bookingDate")
    private Long bookingDate;

    @JsonProperty("receivedDate")
    private Long receivedDate;

    @JsonProperty("bookingDateStartTime")
    private Long bookingDateStartTime;

    @JsonProperty("bookingDateEndTime")
    private Long bookingDateEndTime;

    @JsonProperty("receivedDateStartTime")
    private Long receivedDateStartTime;

    @JsonProperty("receivedDateEndTime")
    private Long receivedDateEndTime;

    @JsonProperty("postalHub")
    private String postalHub;

    @JsonProperty("speedPostId")
    private String speedPostId;

    @JsonProperty("pagination")
    private Pagination pagination = null;

    @JsonProperty("excelSheetType")
    private ExcelSheetType excelSheetType = null;
}
