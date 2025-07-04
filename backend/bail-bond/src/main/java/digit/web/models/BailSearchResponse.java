package digit.web.models;

import java.util.Objects;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonCreator;
import digit.web.models.Bail;
import digit.web.models.ResponseInfo;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.ArrayList;
import java.util.List;

import org.springframework.validation.annotation.Validated;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Data;
import lombok.Builder;

/**
 * BailSearchResponse
 */
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2025-07-01T18:25:48.287360981+05:30[Asia/Kolkata]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class BailSearchResponse {
    @JsonProperty("ResponseInfo")

    @Valid
    private ResponseInfo responseInfo = null;

    @JsonProperty("bails")
    @Valid
    private List<Bail> bails = null;


    public BailSearchResponse addBailsItem(Bail bailsItem) {
        if (this.bails == null) {
            this.bails = new ArrayList<>();
        }
        this.bails.add(bailsItem);
        return this;
    }

}
