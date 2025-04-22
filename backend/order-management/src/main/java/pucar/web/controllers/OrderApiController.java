package pucar.web.controllers;

import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;
import pucar.service.OrderService;
import pucar.util.ResponseInfoFactory;
import pucar.web.models.BulkUpdateRequest;
import pucar.web.models.BulkUpdateResponse;
import pucar.web.models.Order;

import java.util.List;

@RestController
@RequestMapping("")
public class OrderApiController {

    private final OrderService orderService;

    @Autowired
    public OrderApiController(OrderService orderService) {
        this.orderService = orderService;
    }

    @RequestMapping(value = "/v1/bulk/_update", method = RequestMethod.POST)
    public ResponseEntity<BulkUpdateResponse> bulkOrderUpdate(@Parameter(in = ParameterIn.DEFAULT, description = "", required = true, schema = @Schema()) @Valid @RequestBody BulkUpdateRequest request) {
        List<Order> orders = orderService.updateBulkOrder(request);
        BulkUpdateResponse response = BulkUpdateResponse.builder()
                .orders(orders).responseInfo(ResponseInfoFactory.createResponseInfo(request.getRequestInfo(), true)).build();
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

}
