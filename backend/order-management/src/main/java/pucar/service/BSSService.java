package pucar.service;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.Document;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import pucar.util.*;
import pucar.web.models.*;

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

    @Autowired
    public BSSService(XmlRequestGenerator xmlRequestGenerator, ESignUtil eSignUtil, FileStoreUtil fileStoreUtil, CipherUtil cipherUtil, OrderUtil orderUtil) {
        this.xmlRequestGenerator = xmlRequestGenerator;
        this.eSignUtil = eSignUtil;
        this.fileStoreUtil = fileStoreUtil;
        this.cipherUtil = cipherUtil;
        this.orderUtil = orderUtil;
    }

    public List<OrderToSign> createOrderToSignRequest(OrdersToSignRequest request) {

        // get location to sign here from esign

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
            throw new CustomException(); // write msg and code
        }


        List<OrderToSign> orderToSign = new ArrayList<>();
        for (Coordinate coordinate : coordinateForSign) {
            OrderToSign order = new OrderToSign();
            Resource resource = fileStoreUtil.fetchFileStoreObjectById(coordinate.getFileStoreId(), coordinate.getTenantId());
            try {
                String base64Document = cipherUtil.encodePdfToBase64(resource);
                String coord = (int )Math.floor(coordinate.getX()) + "," +(int) Math.floor(coordinate.getY());
                String txnId = UUID.randomUUID().toString();
                String pageNo = String.valueOf(coordinate.getPageNumber());
                ZonedDateTime timestamp = ZonedDateTime.now(ZoneId.of("Asia/Kolkata"));  // read form config

                String xmlRequest = generateRequest(base64Document, timestamp.toString(), txnId, coord, pageNo);
                String orderNumber = ordersCriteriaMap.get(coordinate.getFileStoreId()).getOrderNumber();  // error handling
                order.setOrderNumber(orderNumber);
                order.setRequest(xmlRequest);

                orderToSign.add(order);
            } catch (Exception e) {
                throw new CustomException(); // add msg here
            }

        }
        return orderToSign;

    }


    private String generateRequest(String base64Doc, String timeStamp, String txnId, String coordination, String pageNumber) {
        Map<String, Object> requestData = new LinkedHashMap<>();

        requestData.put("command", "pkiNetworkSign");
        requestData.put("ts", timeStamp);   //enrich this
        requestData.put("txn", txnId);  //enrich this

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
        requestData.put("certificate", certificateAttributes);

        // File section with attribute
        Map<String, Object> file = new LinkedHashMap<>();
        file.put("attribute", Map.of("name", "type", "value", "pdf"));
        ;// rn this is hardcode once we support other feature we will dynamically fetch this
        requestData.put("file", file);

        // PDF section // enrich this section
        Map<String, Object> pdf = new LinkedHashMap<>();
        pdf.put("page", pageNumber);
        pdf.put("cood", coordination);
        pdf.put("size", "200,100");   // check on this
        requestData.put("pdf", pdf);

        // Data section  // enrich this section
        requestData.put("data", base64Doc);

        // Generate XML
        String xmlRequest = xmlRequestGenerator.createXML("request", requestData);

        return xmlRequest;
    }

    public List<Order> updateOrderWithSignDoc(@Valid UpdateSignedOrderRequest request) {

        List<Order> updatedOrder = new ArrayList<>();
        for (SignedOrder signedOrder : request.getSignedOrders()) {
            String orderNumber = signedOrder.getOrderNumber();
            String signedOrderData = signedOrder.getSignedOrderData();
            String errorMsg = signedOrder.getErrorMsg();
            Boolean isSigned = signedOrder.getSigned();
            String tenantId = signedOrder.getTenantId();

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
                        throw new CustomException(); // error msg here
                    }
                    Order order = orders.getList().get(0);

                    String pdfName = COMPOSITE.equalsIgnoreCase(order.getOrderCategory()) ? order.getOrderTitle() + ".pdf" : order.getOrderType() + ".pdf";
                    MultipartFile multipartFile = cipherUtil.decodeBase64ToPdf(signedOrderData, pdfName);
                    String fileStoreId = fileStoreUtil.storeFileInFileStore(multipartFile, tenantId);

                    // fetch order here

                    Document document = Document.builder().build();
                    document.setFileStore(fileStoreId);
                    document.setDocumentType(SIGNED);
                    document.setAdditionalDetails(Map.of("name", pdfName));

                    WorkflowObject workflowObject = new WorkflowObject();
                    workflowObject.setAction(E_SIGN);

                    order.setWorkflow(workflowObject);
                    order.getDocuments().add(document);


                    // update order here
                    OrderRequest orderUpdateRequest = OrderRequest.builder()
                            .requestInfo(request.getRequestInfo())
                            .order(order).build();

                    OrderResponse response = orderUtil.updateOrder(orderUpdateRequest);
                    updatedOrder.add(response.getOrder());

                } catch (Exception e) {
                    throw new CustomException(); // add log here
                }
            }

        }

        return updatedOrder;

    }

    private Map<String, Object> createAttribute(String name, String value) {
        Map<String, Object> attribute = new LinkedHashMap<>();
        Map<String, String> attrData = new LinkedHashMap<>();
        attrData.put("name", name);
        attrData.put("value", value);
        attribute.put("attribute", attrData);
        return attribute;
    }
}
