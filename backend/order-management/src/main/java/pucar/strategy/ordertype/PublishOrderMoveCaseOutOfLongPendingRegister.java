package pucar.strategy.ordertype;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import pucar.strategy.OrderUpdateStrategy;
import pucar.util.CaseUtil;
import pucar.web.models.Order;
import pucar.web.models.OrderRequest;
import pucar.web.models.adiary.CaseDiaryEntry;
import pucar.web.models.courtCase.CaseCriteria;
import pucar.web.models.courtCase.CaseRequest;
import pucar.web.models.courtCase.CaseSearchRequest;
import pucar.web.models.courtCase.CourtCase;

import java.util.Collections;
import java.util.List;

import static pucar.config.ServiceConstants.E_SIGN;
import static pucar.config.ServiceConstants.MOVE_CASE_OUT_OF_LONG_PENDING_REGISTER;

@Slf4j
@Component
public class PublishOrderMoveCaseOutOfLongPendingRegister implements OrderUpdateStrategy {

    private final CaseUtil caseUtil;

    @Autowired
    public PublishOrderMoveCaseOutOfLongPendingRegister(CaseUtil caseUtil) {
        this.caseUtil = caseUtil;
    }

    @Override
    public boolean supportsPreProcessing(OrderRequest orderRequest) {
        Order order = orderRequest.getOrder();
        String action = order.getWorkflow().getAction();
        return order.getOrderType() != null && E_SIGN.equalsIgnoreCase(action) && MOVE_CASE_OUT_OF_LONG_PENDING_REGISTER.equalsIgnoreCase(order.getOrderType());
    }

    @Override
    public boolean supportsPostProcessing(OrderRequest orderRequest) {
        return false;
    }

    @Override
    public OrderRequest preProcess(OrderRequest orderRequest) {

        RequestInfo requestInfo = orderRequest.getRequestInfo();

        Order order = orderRequest.getOrder();

        //update the case out of long pending register
        List<CourtCase> cases = caseUtil.getCaseDetailsForSingleTonCriteria(CaseSearchRequest.builder()
                .criteria(Collections.singletonList(CaseCriteria.builder().filingNumber(order.getFilingNumber()).tenantId(order.getTenantId()).defaultFields(false).build()))
                .requestInfo(requestInfo).build());

        if (cases.isEmpty()) {
            log.info("No cases found : {}", order.getFilingNumber());
            return orderRequest;
        }

        CourtCase courtCase = cases.get(0);

        if (courtCase.getIsLPRCase()) {
            courtCase.setIsLPRCase(false);
            caseUtil.updateCase(CaseRequest.builder().cases(courtCase).requestInfo(requestInfo).build());
        }

        return orderRequest;
    }

    @Override
    public OrderRequest postProcess(OrderRequest orderRequest) {
        return null;
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
