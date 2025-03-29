package pucar.web.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.models.Address;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourtDetails {

    private String courtName;

    private Address courtAddress;

    private String courtId;

    private String phoneNumber;
}
