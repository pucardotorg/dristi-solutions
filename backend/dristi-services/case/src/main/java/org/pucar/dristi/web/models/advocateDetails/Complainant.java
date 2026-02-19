package org.pucar.dristi.web.models.advocateDetails;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Complainant {

    private Integer index;

    private String individualId;

    private String firstName;

    private String middleName;

    private String lastName;

    private String mobileNumber;
}

