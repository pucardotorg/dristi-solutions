package org.egov.transformer.models;

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
public class OrderAndNotification {

    @JsonProperty("type")
    private String type;

    @JsonProperty("id")
    private String id;

    @JsonProperty("parties")
    private List<Object> parties;

    @JsonProperty("status")
    private String status;

    @JsonProperty("date")
    private Long date;

    @JsonProperty("tenantId")
    private String tenantId;

    @JsonProperty("filingNumber")
    private String filingNumber;

    @JsonProperty("courtId")
    private String courtId;

    @JsonProperty("judgeIds")
    private List<String> judgeIds;

    @JsonProperty("description")
    private String description;

    @JsonProperty("comments")
    private String comments;
}
