package pucar.strategy.ordertype;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import pucar.strategy.OrderUpdateStrategy;
import pucar.util.CaseUtil;
import pucar.web.models.Order;
import pucar.web.models.OrderRequest;
import pucar.web.models.adiary.CaseDiaryEntry;
import pucar.web.models.courtCase.*;

import java.util.Collections;
import java.util.List;

import static pucar.config.ServiceConstants.*;

@Slf4j
@Component
public class PublishOrderMoveCaseToLongPendingRegister implements OrderUpdateStrategy {

    private final CaseUtil caseUtil;

    @Autowired
    public PublishOrderMoveCaseToLongPendingRegister(CaseUtil caseUtil) {
        this.caseUtil = caseUtil;
    }

    @Override
    public boolean supportsPreProcessing(OrderRequest orderRequest) {
        return false;
    }

    @Override
    public boolean supportsPostProcessing(OrderRequest orderRequest) {
        Order order = orderRequest.getOrder();
        String action = order.getWorkflow().getAction();
        return order.getOrderType() != null && E_SIGN.equalsIgnoreCase(action) && MOVE_CASE_TO_LONG_PENDING_REGISTER.equalsIgnoreCase(order.getOrderType());
    }

    @Override
    public OrderRequest preProcess(OrderRequest orderRequest) {
        return null;
    }

    @Override
    public OrderRequest postProcess(OrderRequest orderRequest) {
        RequestInfo requestInfo = orderRequest.getRequestInfo();

        Order order = orderRequest.getOrder();

        //update the case to long pending register
        CaseListResponse caseListResponse = caseUtil.searchCaseDetails(CaseSearchRequest.builder()
                .criteria(Collections.singletonList(CaseCriteria.builder().filingNumber(order.getFilingNumber()).tenantId(order.getTenantId()).defaultFields(false).build()))
                .requestInfo(requestInfo).build());

        List<CourtCase> cases = caseListResponse.getCriteria().get(0).getResponseList();

        if (cases.isEmpty()) {
            log.info("No cases found : {}", order.getFilingNumber());
            return orderRequest;
        }

        CourtCase courtCase = cases.get(0);

        if (courtCase.getCourtCaseNumber() == null) {
            throw new CustomException(MOVE_CASE_TO_LONG_PENDING_REGISTER_EXCEPTION, "ST Number can not be null for moving case to LPR : " + courtCase.getFilingNumber());
        }

        if (courtCase.getIsLPRCase()) {
            throw new CustomException(MOVE_CASE_TO_LONG_PENDING_REGISTER_EXCEPTION, "Case is already a LPR case : " + courtCase.getFilingNumber());
        }

        if (courtCase.getCourtCaseNumberBackup() != null) {
            throw new CustomException(MOVE_CASE_TO_LONG_PENDING_REGISTER_EXCEPTION, "Case is already move to LPR case once : " + courtCase.getFilingNumber());
        }
        courtCase.setIsLPRCase(true);

        CaseRequest caseRequest = CaseRequest.builder().cases(courtCase).requestInfo(requestInfo).build();
        log.info("Moving case to LPR : {}", courtCase.getFilingNumber());
        caseUtil.updateLprDetailsInCase(caseRequest);
        log.info("Moved case to LPR : {}", courtCase.getFilingNumber());
        return orderRequest;
    }

    @Override
    public boolean supportsCommon(OrderRequest request) {
        return false;
    }

    @Override
    public CaseDiaryEntry execute(OrderRequest request) {
        return null;
    }
}
