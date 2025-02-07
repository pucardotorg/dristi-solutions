package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.UUID;

import org.springframework.validation.annotation.Validated;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Data;
import lombok.Builder;

/**
 * this entity is only for use by get API to return a list of items. it is not stored in DB, but is filled by getting data from DB. This will mostly be used for to get A diary activities based on date range for a specific judge
 */
@Schema(description = "this entity is only for use by get API to return a list of items. it is not stored in DB, but is filled by getting data from DB. This will mostly be used for to get A diary activities based on date range for a specific judge")
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2025-02-06T19:48:22.119509827+05:30[Asia/Kolkata]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CaseDiaryActivityListItem {
    @JsonProperty("Id")
    @Valid
    private UUID id = null;

    @JsonProperty("tenantId")
    private String tenantId = null;

    @JsonProperty("date")
    private Long date = null;


}
