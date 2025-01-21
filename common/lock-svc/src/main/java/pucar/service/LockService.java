package pucar.service;

import org.egov.common.contract.request.RequestInfo;
import org.springframework.stereotype.Service;
import pucar.web.models.Lock;

@Service
public interface LockService {

    Lock setLock(RequestInfo requestInfo, Lock lockDetails);

    Lock getLock(String uniqueId, String tenantId);

    Boolean releaseLock(RequestInfo requestInfo, String uniqueId, String tenantId);


}
