package org.pucar.dristi.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

/**
 * AdditionalFields
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AdditionalFields {

    @JsonProperty("schema")
    private String schema = null;

    @JsonProperty("version")
    private Integer version = null;

    @JsonProperty("fields")
    private List<Field> fields = null;


    public AdditionalFields addFieldsItem(Field fieldsItem) {
        if (this.fields == null) {
            this.fields = new ArrayList<>();
        }
        this.fields.add(fieldsItem);
        return this;
    }

}
