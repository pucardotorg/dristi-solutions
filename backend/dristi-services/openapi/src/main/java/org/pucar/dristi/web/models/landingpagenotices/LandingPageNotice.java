package org.pucar.dristi.web.models.landingpagenotices;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

import javax.validation.Valid;

@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
public class LandingPageNotice {

    @JsonProperty("id")
    @Valid
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @JsonProperty("tenantId")
    @Valid
    @NotNull
    private String tenantId;

    @JsonProperty("type")
    @Valid
    private String type;

    @JsonProperty("title")
    @Valid
    @NotNull
    private String title;

    @JsonProperty("language")
    @Valid
    private String language;

    @JsonProperty("validTill")
    @Valid
    private Long validTill;

    @JsonProperty("fileStoreId")
    @Valid
    private String fileStoreId;

    @JsonProperty("noticeNumber")
    @Valid
    private String noticeNumber;

    @JsonProperty("publishedDate")
    @Valid
    @NotNull
    private Long publishedDate;

    @JsonProperty("createdBy")
    @Valid
    private String createdBy;

    @JsonProperty("createdTime")
    @Valid
    private Long createdTime;

    @JsonProperty("lastModifiedBy")
    @Valid
    private String lastModifiedBy;

    @JsonProperty("lastModifiedTime")
    @Valid
    private Long lastModifiedTime;

}
