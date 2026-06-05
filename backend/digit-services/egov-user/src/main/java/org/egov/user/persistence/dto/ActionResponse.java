package org.egov.user.persistence.dto;

import lombok.*;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActionResponse {

    private List<org.egov.user.persistence.dto.Action> actions;

    public List<org.egov.user.domain.model.Action> toDomainActions() {
        if (actions == null) return null;
        return actions.stream()
                .map(org.egov.user.persistence.dto.Action::toDomain)
                .collect(Collectors.toList());
    }
}