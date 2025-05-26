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
import pucar.web.models.Order;
import pucar.web.models.OrderRequest;
import pucar.web.models.OrderResponse;


@RestController
@RequestMapping("")
public class OrderApiController {

    private final OrderService orderService;

    @Autowired
    public OrderApiController(OrderService orderService) {
        this.orderService = orderService;
    }

    @RequestMapping(value = "/v1/_updateOrder", method = RequestMethod.POST)
    public ResponseEntity<OrderResponse> updateOrder(@Parameter(in = ParameterIn.DEFAULT, description = "", required = true, schema = @Schema()) @Valid @RequestBody OrderRequest request) {
        Order order = orderService.updateOrder(request);
        OrderResponse response = OrderResponse.builder()
                .order(order).responseInfo(ResponseInfoFactory.createResponseInfo(request.getRequestInfo(), true)).build();
        return new ResponseEntity<>(response, HttpStatus.OK);
    }


    @RequestMapping(value = "/v1/_createOrder", method = RequestMethod.POST)
    public ResponseEntity<OrderResponse> createOrder(@Parameter(in = ParameterIn.DEFAULT, description = "", required = true, schema = @Schema()) @Valid @RequestBody OrderRequest request) {
        Order order = orderService.createOrder(request);
        OrderResponse response = OrderResponse.builder()
                .order(order).responseInfo(ResponseInfoFactory.createResponseInfo(request.getRequestInfo(), true)).build();
        return new ResponseEntity<>(response, HttpStatus.OK);
    }


}
