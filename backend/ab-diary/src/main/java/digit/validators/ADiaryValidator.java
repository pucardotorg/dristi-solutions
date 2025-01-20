package digit.validators;

import digit.repository.DiaryEntryRepository;
import digit.web.models.CaseDiaryEntry;
import digit.web.models.CaseDiaryEntryRequest;
import digit.web.models.CaseDiarySearchCriteria;
import digit.web.models.CaseDiarySearchRequest;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.springframework.stereotype.Component;
import org.springframework.util.ObjectUtils;

import java.util.List;

import static digit.config.ServiceConstants.VALIDATION_EXCEPTION;

@Component
@Slf4j
public class ADiaryValidator {

    private final DiaryEntryRepository diaryEntryRepository;

    public ADiaryValidator(DiaryEntryRepository diaryEntryRepository) {
        this.diaryEntryRepository = diaryEntryRepository;
    }

    public void validateSaveDiaryEntry(CaseDiaryEntryRequest caseDiaryEntryRequest) {

        CaseDiaryEntry caseDiaryEntry = caseDiaryEntryRequest.getDiaryEntry();

        RequestInfo requestInfo = caseDiaryEntryRequest.getRequestInfo();

        if (ObjectUtils.isEmpty(caseDiaryEntry)) {
            throw new CustomException(VALIDATION_EXCEPTION, "case diary entry is mandatory to create an entry");
        }
        if (caseDiaryEntry.getHearingDate() == null) {
            throw new CustomException(VALIDATION_EXCEPTION, "hearing date is mandatory");
        }
        if (requestInfo == null) {
            throw new CustomException(VALIDATION_EXCEPTION, "request Info can not be null");
        }
        if (requestInfo.getUserInfo() == null) {
            throw new CustomException(VALIDATION_EXCEPTION, "user info can not be null");
        }
    }

    public void validateUpdateDiaryEntry(CaseDiaryEntryRequest caseDiaryEntryRequest) {

        CaseDiaryEntry caseDiaryEntry = caseDiaryEntryRequest.getDiaryEntry();

        RequestInfo requestInfo = caseDiaryEntryRequest.getRequestInfo();

        if (ObjectUtils.isEmpty(caseDiaryEntry)) {
            throw new CustomException(VALIDATION_EXCEPTION, "case diary entry is mandatory to update");
        }
        if (caseDiaryEntry.getId() == null) {
            throw new CustomException(VALIDATION_EXCEPTION, "Id is mandatory to update entry");
        }
        if (caseDiaryEntry.getHearingDate() == null) {
            throw new CustomException(VALIDATION_EXCEPTION, "hearing date is mandatory");
        }
        if (requestInfo == null) {
            throw new CustomException(VALIDATION_EXCEPTION, "request info is mandatory");
        }
        if (requestInfo.getUserInfo() == null) {
            throw new CustomException(VALIDATION_EXCEPTION, "User info can not be null");
        }

        validateExistingDiaryEntry(caseDiaryEntry);

    }

    private void validateExistingDiaryEntry(CaseDiaryEntry caseDiaryEntry) {

        CaseDiarySearchCriteria searchCriteria = CaseDiarySearchCriteria.builder().tenantId(caseDiaryEntry.getTenantId())
                .date(caseDiaryEntry.getEntryDate())
                .build();

        CaseDiarySearchRequest caseDiarySearchRequest = CaseDiarySearchRequest.builder().criteria(searchCriteria).build();

        List<CaseDiaryEntry> caseDiaryEntryResponse = diaryEntryRepository.getCaseDiaryEntries(caseDiarySearchRequest);

        if (caseDiaryEntryResponse == null) {
            throw new CustomException(VALIDATION_EXCEPTION, "diary entry does not exists");
        }

        List<CaseDiaryEntry> caseDiaryEntries;

        caseDiaryEntries = caseDiaryEntryResponse.stream()
                .filter(diaryEntry -> diaryEntry.getId().equals(caseDiaryEntry.getId())).toList();

        if (caseDiaryEntries.size() > 1) {
            throw new CustomException(VALIDATION_EXCEPTION, "multiple entries found with same id");
        } else if (caseDiaryEntries.isEmpty()) {
            throw new CustomException(VALIDATION_EXCEPTION, "diary entry does not exits");
        }

    }


}
