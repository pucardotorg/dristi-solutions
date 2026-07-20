package pucar.service;


import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import pucar.web.models.OrderRequest;
import pucar.web.models.adiary.CaseDiaryEntry;

import java.util.List;

@Service
@Slf4j
public class IntermediateOrderService implements OrderProcessor {

    private final OrderStrategyExecutor orderStrategyExecutor;
    private final ApplicationValidationService applicationValidationService;

    @Autowired
    public IntermediateOrderService(OrderStrategyExecutor orderStrategyExecutor, ApplicationValidationService applicationValidationService) {
        this.orderStrategyExecutor = orderStrategyExecutor;
        this.applicationValidationService = applicationValidationService;
    }

    @Override
    public void validateOrder(OrderRequest request) {
        applicationValidationService.validate(request.getOrder());
    }

    @Override
    public void preProcessOrder(OrderRequest orderRequest) {
        orderStrategyExecutor.beforePublish(orderRequest);
    }

    @Override
    public void postProcessOrder(OrderRequest orderRequest) {
        orderStrategyExecutor.afterPublish(orderRequest);

    }

    @Override
    public List<CaseDiaryEntry> processCommonItems(OrderRequest orderRequest) {
        return orderStrategyExecutor.commonProcess(orderRequest);

    }
}
