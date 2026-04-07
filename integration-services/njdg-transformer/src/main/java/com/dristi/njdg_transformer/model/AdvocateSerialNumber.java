package com.dristi.njdg_transformer.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdvocateSerialNumber {
    private Integer serialNo;
    private UUID advocateId;
    private String barRegNo;
}
