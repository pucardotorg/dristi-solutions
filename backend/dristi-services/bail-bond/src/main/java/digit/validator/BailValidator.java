package digit.validator;

import digit.repository.BailRepository;
import digit.web.models.Bail;
import digit.web.models.BailRequest;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.springframework.stereotype.Component;
import org.springframework.util.ObjectUtils;

import java.util.List;

import static digit.config.ServiceConstants.DELETE_DRAFT;
import static digit.config.ServiceConstants.SAVE_DRAFT;
import static digit.config.ServiceConstants.VALIDATION_EXCEPTION;

@Component
@Slf4j
@AllArgsConstructor
public class BailValidator {

    private final BailRepository repository;

    public void validateBailRegistration(BailRequest bailRequest) throws CustomException {
        log.info("Validating Bail Registration");
        // Validate userInfo and tenantId
        baseValidations(bailRequest.getRequestInfo());

        Bail bail = bailRequest.getBail();
        if(bail.getBailAmount()!=null && bail.getBailAmount()<0){
            throw new CustomException(VALIDATION_EXCEPTION, "Invalid Bail amount");
        }
        if(!(SAVE_DRAFT.equalsIgnoreCase(bail.getWorkflow().getAction()) || DELETE_DRAFT.equalsIgnoreCase(bail.getWorkflow().getAction()))){
            if(ObjectUtils.isEmpty(bail.getLitigantMobileNumber())){
                throw new CustomException(VALIDATION_EXCEPTION, "Litigant mobile number is required for creating bail");
            }
            if(!ObjectUtils.isEmpty(bail.getSureties())){
                bail.getSureties().forEach(surety -> {
                    if(ObjectUtils.isEmpty(surety.getIndex())){
                        throw new CustomException(VALIDATION_EXCEPTION, "Surety index is required for creating bail");
                    }
                    if(ObjectUtils.isEmpty(surety.getName())){
                        throw new CustomException(VALIDATION_EXCEPTION, "Surety name is required for creating bail");
                    }
                    if(ObjectUtils.isEmpty(surety.getMobileNumber())){
                        throw new CustomException(VALIDATION_EXCEPTION, "Surety mobile number is required for creating bail");
                    }
                });
            }
        }
    }

    private void baseValidations(RequestInfo requestInfo){
        if (requestInfo.getUserInfo() == null)
            throw new CustomException(VALIDATION_EXCEPTION, "User info not found");
        if(ObjectUtils.isEmpty(requestInfo.getUserInfo().getTenantId()))
            throw  new CustomException(VALIDATION_EXCEPTION, "Invalid tenant id");
    }


    public Bail validateBailExists(BailRequest bailRequest) throws CustomException {
        log.info("Validating That Bail Exists");
        RequestInfo requestInfo = bailRequest.getRequestInfo();
        Bail bail = bailRequest.getBail();
        List<Bail> existingBails = repository.checkBailExists(requestInfo, bail);
        if(existingBails.isEmpty()){
            throw new CustomException(VALIDATION_EXCEPTION, String.format("Bail with ID '%s' does not exist", bail.getId()));
        }
        return existingBails.get(0);
    }
}
