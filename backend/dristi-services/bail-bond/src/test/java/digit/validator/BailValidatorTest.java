package digit.validator;

import digit.repository.BailRepository;
import digit.web.models.Bail;
import digit.web.models.BailRequest;
import digit.web.models.Surety;
import digit.web.models.WorkflowObject;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Collections;
import java.util.List;

import static digit.config.ServiceConstants.SAVE_DRAFT;
import static digit.config.ServiceConstants.VALIDATION_EXCEPTION;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class BailValidatorTest {

    private BailRepository bailRepository;
    private BailValidator bailValidator;

    @BeforeEach
    void setup() {
        bailRepository = mock(BailRepository.class);
        bailValidator = new BailValidator(bailRepository);
    }

    private RequestInfo buildValidRequestInfo() {
        RequestInfo reqInfo = new RequestInfo();
        User user = new User();
        user.setTenantId("kl");
        reqInfo.setUserInfo(user);
        return reqInfo;
    }

    private BailRequest buildValidBailRequest(String action) {
        Bail bail = new Bail();
        bail.setId("bail-123");
        bail.setBailAmount(5000.0);
        bail.setLitigantMobileNumber("9999999999");

        WorkflowObject workflowObject = new WorkflowObject();
        workflowObject.setAction(action);
        bail.setWorkflow(workflowObject);

        Surety surety = new Surety();
        surety.setIndex(1);
        surety.setName("John Doe");
        surety.setMobileNumber("8888888888");
        bail.setSureties(List.of(surety));

        BailRequest request = new BailRequest();
        request.setRequestInfo(buildValidRequestInfo());
        request.setBail(bail);

        return request;
    }

    @Test
    void testValidateBailRegistration_Success() {
        BailRequest request = buildValidBailRequest("APPLY");
        assertDoesNotThrow(() -> bailValidator.validateBailRegistration(request));
    }

    @Test
    void testValidateBailRegistration_MissingTenantId() {
        BailRequest request = buildValidBailRequest("APPLY");
        request.getRequestInfo().getUserInfo().setTenantId(null);

        CustomException ex = assertThrows(CustomException.class, () ->
                bailValidator.validateBailRegistration(request));
        assertEquals(VALIDATION_EXCEPTION, ex.getCode());
    }

    @Test
    void testValidateBailRegistration_InvalidBailAmount() {
        BailRequest request = buildValidBailRequest("APPLY");
        request.getBail().setBailAmount(-500.0);

        CustomException ex = assertThrows(CustomException.class, () ->
                bailValidator.validateBailRegistration(request));
        assertEquals("Invalid Bail amount", ex.getMessage());
    }

    @Test
    void testValidateBailRegistration_MissingLitigantMobile() {
        BailRequest request = buildValidBailRequest("APPLY");
        request.getBail().setLitigantMobileNumber(null);

        CustomException ex = assertThrows(CustomException.class, () ->
                bailValidator.validateBailRegistration(request));
        assertEquals("Litigant mobile number is required for creating bail", ex.getMessage());
    }

    @Test
    void testValidateBailRegistration_MissingSuretyDetails() {
        BailRequest request = buildValidBailRequest("APPLY");

        Surety incompleteSurety = new Surety();
        incompleteSurety.setName(null);
        incompleteSurety.setIndex(1);
        incompleteSurety.setMobileNumber(null);

        request.getBail().setSureties(List.of(incompleteSurety));

        CustomException ex = assertThrows(CustomException.class, () ->
                bailValidator.validateBailRegistration(request));
        assertEquals("Surety name is required for creating bail", ex.getMessage());
    }

    @Test
    void testValidateBailRegistration_SaveDraft_AllowsEmptyFields() {
        BailRequest request = buildValidBailRequest(SAVE_DRAFT);
        request.getBail().setLitigantMobileNumber(null);
        request.getBail().setSureties(null);

        assertDoesNotThrow(() -> bailValidator.validateBailRegistration(request));
    }

    @Test
    void testValidateBailExists_BailNotFound() {
        BailRequest request = buildValidBailRequest("APPLY");
        when(bailRepository.checkBailExists(any(), any())).thenReturn(Collections.emptyList());

        CustomException ex = assertThrows(CustomException.class, () ->
                bailValidator.validateBailExists(request));
        assertTrue(ex.getMessage().contains("Bail with ID"));
    }

    @Test
    void testValidateBailExists_BailFound() {
        BailRequest request = buildValidBailRequest("APPLY");
        Bail bail = request.getBail();
        when(bailRepository.checkBailExists(any(), any())).thenReturn(List.of(bail));

        Bail result = bailValidator.validateBailExists(request);
        assertEquals("bail-123", result.getId());
    }
}
