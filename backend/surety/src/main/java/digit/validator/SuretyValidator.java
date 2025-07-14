package digit.validator;

import digit.repository.SuretyRepository;
import digit.util.FileStoreUtil;
import digit.web.models.Surety;
import digit.web.models.SuretyRequest;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.util.ObjectUtils;

import static digit.config.ServiceConstants.*;

@Component
public class SuretyValidator {

    private final SuretyRepository repository;
    private final FileStoreUtil fileStoreUtil;

    @Autowired
    public SuretyValidator(SuretyRepository repository, FileStoreUtil fileStoreUtil) {
        this.repository = repository;
        this.fileStoreUtil = fileStoreUtil;
    }

    public void validateSurety(SuretyRequest suretyRequest) throws CustomException {
        Surety surety = suretyRequest.getSurety();

        //validate documents
        validateDocuments(surety);
    }

    public void validateSuretyOnUpdate(SuretyRequest suretyRequest) {
        //validate documents
        validateDocuments(suretyRequest.getSurety());

        if(ObjectUtils.isEmpty(suretyRequest.getSurety().getId())){
            throw new CustomException(VALIDATION_ERR, "id is mandatory for updating surety");
        }
    }

    private void validateDocuments(Surety surety){
        if (surety.getDocuments() != null && !surety.getDocuments().isEmpty()) {
            surety.getDocuments().forEach(document -> {
                if (document.getFileStore() != null) {
                    if (!fileStoreUtil.doesFileExist(surety.getTenantId(), document.getFileStore()))
                        throw new CustomException(INVALID_FILESTORE_ID, INVALID_DOCUMENT_DETAILS);
                } else
                    throw new CustomException(INVALID_FILESTORE_ID, INVALID_DOCUMENT_DETAILS);

            });
        }
    }
}
