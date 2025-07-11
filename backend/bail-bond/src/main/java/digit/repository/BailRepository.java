package digit.repository;

import digit.web.models.Bail;
import digit.web.models.BailSearchCriteria;
import digit.web.models.BailSearchRequest;
import digit.web.models.Pagination;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
@Slf4j
public class BailRepository {

    public List<Bail> checkBailExists(RequestInfo requestInfo, Bail bail) {
        BailSearchCriteria criteria = BailSearchCriteria.builder()
                .bailId(bail.getId())
                .tenantId(bail.getTenantId())
                .build();
        Pagination pagination = Pagination.builder().limit(1.0).offSet(0.0).build();
        BailSearchRequest bailSearchRequest = BailSearchRequest.builder()
                .requestInfo(requestInfo)
                .criteria(criteria)
                .pagination(pagination)
                .build();
        return getBails(bailSearchRequest);
    }

    private List<Bail> getBails(BailSearchRequest bailSearchRequest) {

        // todo implement search
        return null;
    }
}
