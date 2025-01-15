package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.ArrayList;
import java.util.List;

import org.egov.common.contract.response.ResponseInfo;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Data;
import lombok.Builder;

/**
 * CaseDiaryEntryListResponse
 */
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2025-01-15T12:45:29.792404900+05:30[Asia/Kolkata]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CaseDiaryEntryListResponse   {
        @JsonProperty("ResponseInfo")

          @Valid
                private ResponseInfo responseInfo = null;

        @JsonProperty("entries")
          @Valid
                private List<CaseDiaryEntry> entries = null;

        @JsonProperty("pagination")

          @Valid
                private Pagination pagination = null;


        public CaseDiaryEntryListResponse addEntriesItem(CaseDiaryEntry entriesItem) {
            if (this.entries == null) {
            this.entries = new ArrayList<>();
            }
        this.entries.add(entriesItem);
        return this;
        }

}
