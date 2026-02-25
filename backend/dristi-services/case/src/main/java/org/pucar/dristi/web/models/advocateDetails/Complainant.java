package org.pucar.dristi.web.models.advocateDetails;

import lombok.*;
import org.pucar.dristi.web.models.Document;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Complainant {

    // index used when multiple complainants are rendered in UI blocks
    private Integer index;

    // linkage back to the individual/party stored in dristi_case_litigants
    private String individualId;

    private String caseId;

    private String partyType;

    private String organisationID;

    private Boolean isActive;

    private boolean isPartyInPerson;

    private List<Document> documents;

    private Object additionalDetails;

    // personal name fields (optional — populated from litigant.additionalDetails when available)
    private String firstName;

    private String middleName;

    private String lastName;

    private String mobileNumber;

    // convenience full name built from name parts when available
    private String fullName;

}

