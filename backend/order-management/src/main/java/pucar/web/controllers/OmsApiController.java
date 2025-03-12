package pucar.web.controllers;


import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import pucar.service.BSSService;
import pucar.util.ResponseInfoFactory;
import pucar.web.models.OrderToSign;
import pucar.web.models.OrdersToSignRequest;
import pucar.web.models.OrdersToSignResponse;
import pucar.web.models.UpdateSignedOrderRequest;

import java.util.List;

@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2025-03-11T12:54:13.550043793+05:30[Asia/Kolkata]")
@Controller
@RequestMapping("")
public class OmsApiController {

    private final BSSService bssService;

    @Autowired
    public OmsApiController(BSSService bssService) {
        this.bssService = bssService;
    }


    @RequestMapping(value = "/v1/_getOrdersToSign", method = RequestMethod.POST)
    public ResponseEntity<OrdersToSignResponse> getOrdersToSign(@Parameter(in = ParameterIn.DEFAULT, description = "", required = true, schema = @Schema()) @Valid @RequestBody OrdersToSignRequest request) {

        List<OrderToSign> orderToSignRequest = bssService.createOrderToSignRequest(request);
        OrdersToSignResponse response = OrdersToSignResponse.builder()
                .responseInfo(ResponseInfoFactory.createResponseInfo(request.getRequestInfo(), true)).orderList(orderToSignRequest).build();

        return new ResponseEntity<>(response, HttpStatus.OK);

    }

    @RequestMapping(value = "/v1/_updateSignedOrders", method = RequestMethod.POST)
    public ResponseEntity<Void> updateSignedOrders(@Parameter(in = ParameterIn.DEFAULT, description = "", required = true, schema = @Schema()) @Valid @RequestBody UpdateSignedOrderRequest request) {

        bssService.updateOrderWithSignDoc(request);
        return new ResponseEntity<>(HttpStatus.NOT_IMPLEMENTED);
    }

}
