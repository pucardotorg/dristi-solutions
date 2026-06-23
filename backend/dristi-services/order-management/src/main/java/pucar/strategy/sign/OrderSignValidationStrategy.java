package pucar.strategy.sign;

import org.egov.common.contract.request.RequestInfo;
import pucar.web.models.Order;

import java.util.List;

public interface OrderSignValidationStrategy {

    boolean supports(Order order);

    List<String> validate(Order order, RequestInfo requestInfo);
}
