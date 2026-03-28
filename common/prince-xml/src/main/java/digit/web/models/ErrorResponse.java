package digit.web.models;

import java.util.Objects;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonCreator;
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
 * ErrorResponse
 */
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2025-08-26T15:59:57.572054539+05:30[Asia/Kolkata]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ErrorResponse   {
        @JsonProperty("error")

                private String error = null;

        @JsonProperty("message")

                private String message = null;

        @JsonProperty("code")

                private String code = null;

        @JsonProperty("fields")

                private List<String> fields = null;


        public ErrorResponse addFieldsItem(String fieldsItem) {
            if (this.fields == null) {
            this.fields = new ArrayList<>();
            }
        this.fields.add(fieldsItem);
        return this;
        }

}
