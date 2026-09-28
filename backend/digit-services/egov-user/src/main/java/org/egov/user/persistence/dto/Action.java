package org.egov.user.persistence.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Action {
    private String name;
    private String url;
    private String displayName;
    private Integer orderNumber;
    private String parentModule;
    private String queryParams;
    private String serviceCode;

    public org.egov.user.domain.model.Action toDomain() {
        return org.egov.user.domain.model.Action.builder()
                .name(name)
                .url(url)
                .displayName(displayName)
                .orderNumber(orderNumber)
                .parentModule(parentModule)
                .queryParams(queryParams)
                .serviceCode(serviceCode)
                .build();
    }
}