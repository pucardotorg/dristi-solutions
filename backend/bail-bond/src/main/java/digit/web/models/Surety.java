package digit.web.models;

import java.util.Objects;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonCreator;
import digit.web.models.Document;
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
 * Surety
 */
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2025-07-10T12:09:26.562015481+05:30[Asia/Kolkata]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Surety   {
        @JsonProperty("id")

                private String id = null;

        @JsonProperty("tenantId")
          @NotNull

                private String tenantId = null;

        @JsonProperty("name")
          @NotNull

                private String name = null;

        @JsonProperty("fatherName")

                private String fatherName = null;

        @JsonProperty("mobileNumber")
          @NotNull

                private String mobileNumber = null;

        @JsonProperty("address")

                private Object address = null;

        @JsonProperty("email")

                private String email = null;

        @JsonProperty("hasSigned")

                private Boolean hasSigned = null;

        @JsonProperty("isApproved")

                private Boolean isApproved = null;

        @JsonProperty("documents")
          @Valid
                private List<Document> documents = null;

        @JsonProperty("isActive")

                private Boolean isActive = null;

        @JsonProperty("additionalDetails")

                private Object additionalDetails = null;


        public Surety addDocumentsItem(Document documentsItem) {
            if (this.documents == null) {
            this.documents = new ArrayList<>();
            }
        this.documents.add(documentsItem);
        return this;
        }

}
