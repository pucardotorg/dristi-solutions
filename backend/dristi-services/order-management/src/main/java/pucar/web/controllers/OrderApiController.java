package pucar.web.controllers;

import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;
import pucar.scheduler.CronJobScheduler;
import pucar.service.OrderService;
import pucar.util.ResponseInfoFactory;
import pucar.web.models.*;

import java.util.List;


@RestController
@RequestMapping("")
public class OrderApiController {

    private final OrderService orderService;
    private final CronJobScheduler cronJobScheduler;

    @Autowired
    public OrderApiController(OrderService orderService, CronJobScheduler cronJobScheduler) {
        this.orderService = orderService;
        this.cronJobScheduler = cronJobScheduler;
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

    @RequestMapping(value = "/v1/getDraftOrder", method = RequestMethod.POST)
    public ResponseEntity<DraftOrderResponse> getDraftOrder(@Parameter(in = ParameterIn.DEFAULT, description = "Check Draft order for hearing Request and RequestInfo", required = true, schema = @Schema()) @Valid @RequestBody HearingDraftOrderRequest request) {
        String hearingNumber = request.getHearingDraftOrder().getHearingNumber();
        String hearingType = request.getHearingDraftOrder().getHearingType();
        String filingNumber = request.getHearingDraftOrder().getFilingNumber();
        String cnrNumber = request.getHearingDraftOrder().getCnrNumber();
        String tenantId = request.getHearingDraftOrder().getTenantId();

        Order order = orderService.createDraftOrder(hearingNumber, hearingType, tenantId, filingNumber, cnrNumber, request.getRequestInfo());
        DraftOrderResponse response = DraftOrderResponse.builder().responseInfo(ResponseInfoFactory.createResponseInfo(request.getRequestInfo(), true))
                .order(order)
                .build();
        return ResponseEntity.accepted().body(response);
    }

    @RequestMapping(value = "/v1/getBotdOrders", method = RequestMethod.POST)
    public ResponseEntity<BotdOrderResponse> getBotdOrders(@Parameter(in = ParameterIn.DEFAULT, description = "Check Botd Order for Order Request and RequestInfo", required = true, schema = @Schema()) @Valid @RequestBody BotdOrderRequest request) {

        String filingNumber = request.getCriteria().getFilingNumber();
        String tenantId = request.getCriteria().getTenantId();
        String orderNumber = request.getCriteria().getOrderNumber();

        BotdOrderListResponse botdOrderListResponse = orderService.getBotdOrders(tenantId, filingNumber, orderNumber, request.getPagination(), request.getRequestInfo());

        BotdOrderResponse response = BotdOrderResponse.builder()
                .responseInfo(ResponseInfoFactory.createResponseInfo(request.getRequestInfo(), true))
                .botdOrderList(botdOrderListResponse.getBotdOrderList())
                .pagination(botdOrderListResponse.getPagination())
                .build();
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PostMapping(value = "/v1/_runCronJob")
    public ResponseEntity<?> runCronJob() {
        cronJobScheduler.sendNotificationForMandatorySubmissionPending();
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @PostMapping(value = "/v1/_runCronJob/third-day")
    public ResponseEntity<?> runCronJobEveryThirdDay() {
        cronJobScheduler.sendNotificationForProcessPaymentPending();
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @RequestMapping(value = "/v2/add-item", method = RequestMethod.POST)
    public ResponseEntity<OrderResponse> addItem(@Parameter(in = ParameterIn.DEFAULT, description = "Details for the new item/order + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody OrderRequest request) {
        Order order = orderService.addItem(request);
        OrderResponse response = OrderResponse.builder()
                .order(order).responseInfo(ResponseInfoFactory.createResponseInfo(request.getRequestInfo(), true)).build();
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

}
