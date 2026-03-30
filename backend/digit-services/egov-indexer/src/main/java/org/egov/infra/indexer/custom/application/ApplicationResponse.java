package org.egov.infra.indexer.custom.application;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.response.ResponseInfo;
import org.springframework.validation.annotation.Validated;

import java.util.ArrayList;
import java.util.List;

/**
 * This object holds information about the aapplication List response
 */
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-04-18T11:12:15.132164900+05:30[Asia/Calcutta]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ApplicationResponse   {
    @JsonProperty("ResponseInfo")

    @Valid
    private ResponseInfo responseInfo = null;

    @JsonProperty("TotalCount")

    private Integer totalCount = null;

    @JsonProperty("applicationList")
    @Valid
    private List<Application> applicationList = null;


    public ApplicationResponse addApplicationListItem(Application applicationItem) {
        if (this.applicationList == null) {
            this.applicationList = new ArrayList<>();
        }
        this.applicationList.add(applicationItem);
        return this;
    }

}

