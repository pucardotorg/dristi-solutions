package org.pucar.dristi.web.controllers;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.RequestInfoWrapper;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.response.ResponseInfo;
import org.pucar.dristi.service.LockService;
import org.pucar.dristi.service.RequestInfoService;
import org.pucar.dristi.service.UserService;
import org.pucar.dristi.util.IndividualUtil;
import org.pucar.dristi.util.ResponseInfoFactory;
import org.pucar.dristi.web.models.lock.LockRequest;
import org.pucar.dristi.web.models.lock.LockResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/openapi/lock")
@Slf4j
public class LockController {

    private final ResponseInfoFactory responseInfoFactory;
    private final UserService userService;
    private final IndividualUtil individualUtil;
    private final LockService lockService;
    private final RequestInfoService requestInfoService;

    public LockController(ResponseInfoFactory responseInfoFactory, UserService userService, IndividualUtil individualUtil, LockService lockService, RequestInfoService requestInfoService) {
        this.responseInfoFactory = responseInfoFactory;
        this.userService = userService;
        this.individualUtil = individualUtil;
        this.lockService = lockService;
        this.requestInfoService = requestInfoService;
    }

    @PostMapping("/v1/_get")
    public ResponseEntity<LockResponse> getLock(@RequestBody RequestInfoWrapper requestInfoWrapper,
                                                @RequestParam(name = "uniqueId") String uniqueId,
                                                @RequestParam(name = "tenantId") String tenantId,
                                                @RequestParam(name = "mobileNumber") String mobileNumber) {
        log.info("api=/v1/_get, status=IN_PROGRESS, uniqueId={}, tenantId={}", uniqueId, tenantId);

        // Enrich user uuid
        requestInfoService.enrichUserUuidInRequestInfo(requestInfoWrapper.getRequestInfo(), mobileNumber);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(requestInfoWrapper.getRequestInfo(), true);
        LockResponse response = lockService.getLock(requestInfoWrapper, uniqueId, tenantId);
        response.setResponseInfo(responseInfo);

        log.info("api=/v1/_get, status=SUCCESS");

        return ResponseEntity.ok(response);

    }

    @PostMapping("/v1/_set")
    public ResponseEntity<LockResponse> setLock(@Valid @RequestBody LockRequest request, @RequestParam String mobileNumber) {

        log.info("api=/v1/_set, status=IN_PROGRESS, request={}", request);

        // Build user uuid
        RequestInfo requestInfo = request.getRequestInfo();
        requestInfoService.enrichUserUuidInRequestInfo(requestInfo, mobileNumber);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(requestInfo, true);
        LockResponse response = lockService.setLock(request);
        response.setResponseInfo(responseInfo);

        log.info("api=/v1/_set, status=SUCCESS");

        return ResponseEntity.ok(response);

    }

    @PostMapping("/v1/_release")
    public ResponseEntity<LockResponse> releaseLock(@RequestBody RequestInfoWrapper requestInfoWrapper,
                                                    @RequestParam(name = "uniqueId") String uniqueId,
                                                    @RequestParam(name = "tenantId") String tenantId,
                                                    @RequestParam(name = "mobileNumber") String mobileNumber) {

        log.info("api=/v1/_release, status=IN_PROGRESS, uniqueId={}, tenantId={}", uniqueId, tenantId);

        // Build user uuid
        requestInfoService.enrichUserUuidInRequestInfo(requestInfoWrapper.getRequestInfo(), mobileNumber);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(requestInfoWrapper.getRequestInfo(), true);
        LockResponse response = lockService.releaseLock(requestInfoWrapper, uniqueId, tenantId);
        response.setResponseInfo(responseInfo);

        log.info("api=/v1/_release, status=SUCCESS");

        return ResponseEntity.ok(response);

    }
}
