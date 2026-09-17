package org.egov.inbox.web.model;


import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Validated
public class SortOrder {

    @JsonProperty("path")
    private String path;

    @JsonProperty("orderType")
    private String orderType;

    @JsonProperty("isActive")
    private Boolean isActive;

    @JsonProperty("code")
    private String code;

    @JsonProperty("script")
    private String script;

    @JsonProperty("orderPriority")
    private Integer orderPriority;

}
