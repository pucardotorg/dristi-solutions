package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class POADetails {

    @NotNull
    @JsonProperty("firstName")
    private String firstName;

    @NotNull
    @JsonProperty("middleName")
    private String middleName;

    @NotNull
    @JsonProperty("lastName")
    private String lastName;

    @NotNull
    @JsonProperty("address")
    private Object address;

    @NotNull
    @JsonProperty("mobileNumber")
    private String mobileNumber;

    @NotNull
    @JsonProperty("individualId")
    private String individualId;

    @NotNull
    @JsonProperty("userUuid")
    private String userUuid;

    @NotNull
    @JsonProperty("idDocument")
    private Document idDocument;
}
