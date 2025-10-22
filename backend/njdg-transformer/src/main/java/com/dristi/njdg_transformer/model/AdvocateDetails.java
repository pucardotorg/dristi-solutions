package com.dristi.njdg_transformer.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdvocateDetails {

    private String advocateName;

    private Integer advocateCode;

    private String barRegNo;

    private String advocateId;

}
