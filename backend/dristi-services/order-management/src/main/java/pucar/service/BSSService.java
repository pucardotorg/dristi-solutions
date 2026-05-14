package pucar.service;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import pucar.config.Configuration;
import pucar.factory.OrderFactory;
import pucar.factory.OrderServiceFactoryProvider;
import pucar.util.*;
import pucar.web.models.*;
import pucar.web.models.adiary.BulkDiaryEntryRequest;
import pucar.web.models.adiary.CaseDiaryEntry;
import pucar.web.models.hearing.Hearing;
import pucar.web.models.hearing.HearingCriteria;
import pucar.web.models.hearing.HearingSearchRequest;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.*;

import static pucar.config.ServiceConstants.*;

@Service
@Slf4j
public class BSSService {

    private final XmlRequestGenerator xmlRequestGenerator;
    private final ESignUtil eSignUtil;
    private final FileStoreUtil fileStoreUtil;
    private final CipherUtil cipherUtil;
    private final OrderUtil orderUtil;
    private final Configuration configuration;
    private final OrderServiceFactoryProvider factoryProvider;
    private final ADiaryUtil aDiaryUtil;
    private final HearingUtil hearingUtil;

    @Autowired
    public BSSService(XmlRequestGenerator xmlRequestGenerator, ESignUtil eSignUtil, FileStoreUtil fileStoreUtil, CipherUtil cipherUtil, OrderUtil orderUtil, Configuration configuration, OrderServiceFactoryProvider factoryProvider, ADiaryUtil aDiaryUtil, HearingUtil hearingUtil) {
        this.xmlRequestGenerator = xmlRequestGenerator;
        this.eSignUtil = eSignUtil;
        this.fileStoreUtil = fileStoreUtil;
        this.cipherUtil = cipherUtil;
        this.orderUtil = orderUtil;
        this.configuration = configuration;
        this.factoryProvider = factoryProvider;
        this.aDiaryUtil = aDiaryUtil;
        this.hearingUtil = hearingUtil;
    }

    public List<OrderToSign> createOrderToSignRequest(OrdersToSignRequest request) {

        // get location to sign here from esign
        log.info("creating order to sign request, result= IN_PROGRESS, orderCriteria:{}", request.getCriteria().size());

        List<CoordinateCriteria> coordinateCriteria = new ArrayList<>();

        Map<String, OrdersCriteria> ordersCriteriaMap = new HashMap<>();

        request.getCriteria().forEach(criterion -> {
            CoordinateCriteria criteria = new CoordinateCriteria();
            criteria.setFileStoreId(criterion.getFileStoreId());
            criteria.setPlaceholder(criterion.getPlaceholder());
            criteria.setTenantId(criterion.getTenantId());
            coordinateCriteria.add(criteria);
            ordersCriteriaMap.put(criterion.getFileStoreId(), criterion);
        });

        CoordinateRequest coordinateRequest = CoordinateRequest.builder()
                .requestInfo(request.getRequestInfo())
                .criteria(coordinateCriteria).build();
        List<Coordinate> coordinateForSign = eSignUtil.getCoordinateForSign(coordinateRequest);

        if (coordinateForSign.isEmpty() || coordinateForSign.size() != request.getCriteria().size()) {
            throw new CustomException(COORDINATES_ERROR, "error in co-ordinates");
        }


        List<OrderToSign> orderToSign = new ArrayList<>();
        for (Coordinate coordinate : coordinateForSign) {
            OrderToSign order = new OrderToSign();
            Resource resource = fileStoreUtil.fetchFileStoreObjectById(coordinate.getFileStoreId(), coordinate.getTenantId());
            try {
                String base64Document = cipherUtil.encodePdfToBase64(resource);
                String coord = (int) Math.floor(coordinate.getX()) + "," + (int) Math.floor(coordinate.getY());
                String txnId = UUID.randomUUID().toString();
                String pageNo = String.valueOf(coordinate.getPageNumber());
                ZonedDateTime timestamp = ZonedDateTime.now(ZoneId.of(configuration.getZoneId()));

                String xmlRequest = generateRequest(base64Document, timestamp.toString(), txnId, coord, pageNo);
                String orderNumber = ordersCriteriaMap.get(coordinate.getFileStoreId()).getOrderNumber();  // error handling
                order.setOrderNumber(orderNumber);
                order.setRequest(xmlRequest);

                orderToSign.add(order);
            } catch (Exception e) {
                throw new CustomException(ORDER_SIGN_ERROR, "some thing went wrong while signing");
            }

        }
        log.info("creating order to sign request, result= SUCCESS, orderCriteria:{}", request.getCriteria().size());
        return orderToSign;

    }


    private String generateRequest(String base64Doc, String timeStamp, String txnId, String coordination, String pageNumber) {
        log.info("generating request, result= IN_PROGRESS, timeStamp:{}, txnId:{}, coordination:{}, pageNumber:{}", timeStamp, txnId, coordination, pageNumber);
        Map<String, Object> requestData = new LinkedHashMap<>();

        requestData.put(COMMAND, PKI_NETWORK_SIGN);
        requestData.put(TIME_STAMP, timeStamp);   //enrich this
        requestData.put(TXN, txnId);  //enrich this

        // Certificate section with attributes
        List<Map<String, Object>> certificateAttributes = new ArrayList<>();
        certificateAttributes.add(createAttribute("CN", ""));
        certificateAttributes.add(createAttribute("O", ""));
        certificateAttributes.add(createAttribute("OU", ""));
        certificateAttributes.add(createAttribute("T", ""));
        certificateAttributes.add(createAttribute("E", ""));
        certificateAttributes.add(createAttribute("SN", ""));
        certificateAttributes.add(createAttribute("CA", ""));
        certificateAttributes.add(createAttribute("TC", "SG"));
        certificateAttributes.add(createAttribute("AP", "1"));
        requestData.put(CERTIFICATE, certificateAttributes);

        // File section with attribute
        Map<String, Object> file = new LinkedHashMap<>();
        file.put(ATTRIBUTE, Map.of(NAME, TYPE, VALUE, PDF));
        ;// rn this is hardcode once we support other feature we will dynamically fetch this
        requestData.put(FILE, file);

        // PDF section // enrich this section
        Map<String, Object> pdf = new LinkedHashMap<>();
        pdf.put(PAGE, pageNumber);
        pdf.put(CO_ORDINATES, coordination);
        pdf.put(SIZE, configuration.getEsignSignatureWidth() + "," + configuration.getEsignSignatureHeight());
        pdf.put(DATE_FORMAT, ESIGN_DATE_FORMAT);
        requestData.put(PDF, pdf);

        // Data section  // enrich this section
        requestData.put(DATA, base64Doc);

        // Generate XML
        String xmlRequest = xmlRequestGenerator.createXML("request", requestData);
        log.info("generating request, result= SUCCESS, timeStamp:{}, txnId:{}, coordination:{}, pageNumber:{}", timeStamp, txnId, coordination, pageNumber);

        return xmlRequest;
    }

    public List<Order> updateOrderWithSignDoc(@Valid UpdateSignedOrderRequest request) {

        List<Order> updatedOrder = new ArrayList<>();

        List<CaseDiaryEntry> caseDiaryEntries = new ArrayList<>();
        log.info("updating order with signed doc, result= IN_PROGRESS,signedOrders:{}", request.getSignedOrders().size());

        for (SignedOrder signedOrder : request.getSignedOrders()) {
            String orderNumber = signedOrder.getOrderNumber();
            String signedOrderData = signedOrder.getSignedOrderData();
            String errorMsg = signedOrder.getErrorMsg();
            Boolean isSigned = signedOrder.getSigned();
            String tenantId = signedOrder.getTenantId();
            String orderType = null;

            if (isSigned) {
                //update order with signed doc
                try {

                    OrderCriteria criteria = OrderCriteria.builder()
                            .orderNumber(orderNumber)
                            .tenantId(tenantId).build();
                    OrderSearchRequest searchRequest = OrderSearchRequest.builder()
                            .criteria(criteria).build();

                    OrderListResponse orders = orderUtil.getOrders(searchRequest);

                    if (orders.getList().isEmpty()) {
                        throw new CustomException(EMPTY_ORDERS_ERROR, "empty orders found for the given criteria");
                    }
                    Order order = orders.getList().get(0);
                    orderType = order.getOrderType();

                    OrderFactory orderFactory = factoryProvider.getFactory(order.getOrderCategory());

                    OrderProcessor orderProcessor = orderFactory.createProcessor();

                    String pdfName = COMPOSITE.equalsIgnoreCase(order.getOrderCategory()) ? order.getOrderTitle() + ".pdf" : order.getOrderType() + ".pdf";
                    MultipartFile multipartFile = cipherUtil.decodeBase64ToPdf(signedOrderData, pdfName);
                    String fileStoreId = fileStoreUtil.storeFileInFileStore(multipartFile, tenantId);

                    // fetch order here

                    order.getDocuments().stream()
                            .filter(document -> document.getDocumentType().equals(UNSIGNED))
                            .findFirst()
                            .ifPresent((document) ->
                            {
                                document.setFileStore(fileStoreId);
                                document.setDocumentType(SIGNED);
                                document.setAdditionalDetails(Map.of(NAME, pdfName));
                            });

                    WorkflowObject workflowObject = new WorkflowObject();
                    workflowObject.setAction(E_SIGN);

                    order.setWorkflow(workflowObject);

                    // update order here
                    OrderRequest orderUpdateRequest = OrderRequest.builder()
                            .requestInfo(request.getRequestInfo())
                            .order(order).build();

                    orderProcessor.preProcessOrder(orderUpdateRequest);

                    if (order.getNextHearingDate() != null) {
                        hearingUtil.preProcessScheduleNextHearing(orderUpdateRequest);
                    }
                    OrderResponse response = orderUtil.updateOrder(orderUpdateRequest);
                    if (order.getHearingNumber() != null) {
                        updateHearingSummary(orderUpdateRequest);
                        hearingUtil.updateOpenHearingIndex(order);
                    }
                    List<CaseDiaryEntry> diaryEntries = orderProcessor.processCommonItems(orderUpdateRequest);
                    caseDiaryEntries.addAll(diaryEntries);
                    orderProcessor.postProcessOrder(orderUpdateRequest);
                    updatedOrder.add(response.getOrder());

                } catch (CustomException e) {
                    throw new CustomException(e.getCode(), e.getMessage());
                } catch (Exception e) {
                    log.error("Error while updating order,orderNumber:{},orderType:{}", orderNumber, orderType);
                    log.error("Error : ", e);
                }
            }

        }
        log.info("updating order with signed doc, result= SUCCESS,signedOrders:{}", request.getSignedOrders().size());
        log.info("creating case diary entry for order, result= IN_PROGRESS,caseDiaryEntries:{}", caseDiaryEntries.size());
        // here create bulk diary entry
        aDiaryUtil.createBulkADiaryEntry(BulkDiaryEntryRequest.builder()
                .requestInfo(request.getRequestInfo())
                .caseDiaryList(caseDiaryEntries).build());

        return updatedOrder;

    }

    private void updateHearingSummary(OrderRequest request) {

        Order order = request.getOrder();
        RequestInfo requestInfo = request.getRequestInfo();

        //If attendance is present then attendance and item text will go in hearing summary
        if (order.getAttendance() != null) {
            String hearingNumber = hearingUtil.getHearingNumberFormApplicationAdditionalDetails(order.getAdditionalDetails());
            List<Hearing> hearings = hearingUtil.fetchHearing(HearingSearchRequest.builder().requestInfo(requestInfo)
                    .criteria(HearingCriteria.builder().hearingId(hearingNumber).tenantId(order.getTenantId()).build()).build());
            Hearing hearing = hearings.get(0);
            hearingUtil.updateHearingSummary(request, hearing);
        }
    }

    private Map<String, Object> createAttribute(String name, String value) {
        Map<String, Object> attribute = new LinkedHashMap<>();
        Map<String, String> attrData = new LinkedHashMap<>();
        attrData.put(NAME, name);
        attrData.put(VALUE, value);
        attribute.put(ATTRIBUTE, attrData);
        return attribute;
    }
}
