package org.pucar.dristi.validators;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.jayway.jsonpath.JsonPath;
import com.jayway.jsonpath.spi.json.JacksonJsonNodeJsonProvider;
import com.jayway.jsonpath.spi.mapper.JacksonMappingProvider;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.jetbrains.annotations.Nullable;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.config.MdmsDataConfig;
import org.pucar.dristi.repository.OrderRepository;
import org.pucar.dristi.util.CaseUtil;
import org.pucar.dristi.util.FileStoreUtil;
import org.pucar.dristi.util.MdmsUtil;
import org.pucar.dristi.web.models.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.util.ObjectUtils;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import static org.pucar.dristi.config.ServiceConstants.*;

@Component
@Slf4j
public class OrderRegistrationValidator {
    private OrderRepository repository;

    private CaseUtil caseUtil;
    private FileStoreUtil fileStoreUtil;

    private Configuration configuration;
    private MdmsUtil mdmsUtil;

    public ObjectMapper objectMapper;

    private final MdmsDataConfig mdmsDataConfig;

    @Autowired
    public OrderRegistrationValidator(OrderRepository repository, CaseUtil caseUtil, FileStoreUtil fileStoreUtil, Configuration configuration, MdmsUtil mdmsUtil, ObjectMapper objectMapper, MdmsDataConfig mdmsDataConfig) {
        this.repository = repository;
        this.caseUtil = caseUtil;
        this.fileStoreUtil = fileStoreUtil;
        this.configuration = configuration;
        this.mdmsUtil = mdmsUtil;
        this.objectMapper = objectMapper;
        this.mdmsDataConfig = mdmsDataConfig;
    }

    public void validateOrderRegistration(OrderRequest orderRequest) throws CustomException {
        RequestInfo requestInfo = orderRequest.getRequestInfo();

        if (ObjectUtils.isEmpty(orderRequest.getOrder().getStatuteSection()))
            throw new CustomException(CREATE_ORDER_ERR, "statute and section is mandatory for creating order");

        if (!ADMINISTRATIVE.equalsIgnoreCase(orderRequest.getOrder().getOrderCategory()) && !caseUtil.fetchCaseDetails(requestInfo, orderRequest.getOrder().getCnrNumber(), orderRequest.getOrder().getFilingNumber())) {
            throw new CustomException("INVALID_CASE_DETAILS", "Invalid Case");
        }

        //validate documents
        validateDocuments(orderRequest.getOrder());

        validateMDMSDocumentTypes(orderRequest);

        validateCompositeOrder(orderRequest);
    }

    public void validateCompositeOrder(OrderRequest orderRequest) {

        if (COMPOSITE.equalsIgnoreCase(orderRequest.getOrder().getOrderCategory())) {
            validateAddItem(orderRequest);
        }
    }

    public boolean validateApplicationExistence(OrderRequest orderRequest) {
        //validate documents
        validateDocuments(orderRequest.getOrder());

        Order order = orderRequest.getOrder();

        OrderExists orderExists = new OrderExists();
        orderExists.setFilingNumber(order.getFilingNumber());
        orderExists.setCnrNumber(order.getCnrNumber());
        orderExists.setOrderId(order.getId());
        List<OrderExists> criteriaList = new ArrayList<>();
        criteriaList.add(orderExists);
        List<OrderExists> orderExistsList = repository.checkOrderExists(criteriaList);

        return !orderExistsList.isEmpty() && orderExistsList.get(0).getExists();
    }

    private void validateDocuments(Order order) {
        if (order.getDocuments() != null && !order.getDocuments().isEmpty()) {
            order.getDocuments().forEach(document -> {
                if (document.getFileStore() != null) {
                    if (!fileStoreUtil.doesFileExist(order.getTenantId(), document.getFileStore()))
                        throw new CustomException(INVALID_FILESTORE_ID, INVALID_DOCUMENT_DETAILS);
                } else
                    throw new CustomException(INVALID_FILESTORE_ID, INVALID_DOCUMENT_DETAILS);

            });
        }
    }

    private void validateMDMSDocumentTypes(OrderRequest orderRequest) {
        String mdmsData = mdmsUtil.fetchMdmsData(orderRequest.getRequestInfo(), orderRequest.getOrder().getTenantId(), configuration.getOrderModule(), createMasterDetails());

        Object orderDetails = orderRequest.getOrder().getOrderDetails();

        if (orderDetails != null) {
            // Extract 'documentType' object from 'orderDetails'
            Map<String, Object> orderDetailsMap = objectMapper.convertValue(orderDetails, Map.class);

            if (orderDetailsMap != null) {

                // Extract 'documentType' from 'orderDetails'
                Map<String, Object> documentType = (Map<String, Object>) orderDetailsMap.get("documentType");

                if (documentType != null) {
                    // Extract 'value' from 'documentType'
                    String documentTypeValue = (String) documentType.get("value");

                    List<Map<String, Object>> orderTypeResults = JsonPath.read(mdmsData, configuration.getDocumentTypePath().replace("{}", documentTypeValue));
                    if (orderTypeResults.isEmpty()) {
                        throw new CustomException(MDMS_DATA_NOT_FOUND, "Invalid DocumentType");
                    }
                }
            }
        }
    }

    private List<String> createMasterDetails() {
        List<String> masterList = new ArrayList<>();
        masterList.add("DocumentType");
        return masterList;
    }

    public void validateAddItem(OrderRequest orderRequest) {
        if (!orderRequest.getOrder().getOrderCategory().equalsIgnoreCase(COMPOSITE)) {
            throw new CustomException(ORDER_UPDATE_EXCEPTION, "orderCategory should be composite");
        }
        if (orderRequest.getOrder().getCompositeItems() == null) {
            throw new CustomException(ORDER_UPDATE_EXCEPTION, "compositeItems is mandatory");
        }

        validateMdmsData(orderRequest);
    }

    private void validateMdmsData(OrderRequest orderRequest) {
        try {
            Map<String, List<Object>> orderTypesMap = extractOrderTypesInMap(orderRequest);
            log.info("OrderType Map key :: {}", orderTypesMap);

            //For non overlapping path null
            mdmsDataConfig.getNonOverlappingOrdersMdmsData().forEach(compositeOrderMdms -> {
                if (compositeOrderMdms.getPath() == null) {
                    AtomicInteger overlappingOrderPathNullCount = new AtomicInteger(0);
                    orderTypesMap.forEach((orderType, value) -> nonOverlappingPathNullValidation(compositeOrderMdms, orderType, overlappingOrderPathNullCount));
                }
            });

            //For non overlapping path not null
            mdmsDataConfig.getNonOverlappingOrdersMdmsData().forEach(compositeOrderMdms -> {
                if (compositeOrderMdms.getPath() != null) {
                    ConcurrentHashMap<String, List<String>> overlappingOrderPathNotNullMap = new ConcurrentHashMap<>();
                    orderTypesMap.forEach((key, value) -> nonOverlappingPathNotNullValidation(key, value, compositeOrderMdms, overlappingOrderPathNotNullMap));
                }
            });


            //For non repeating path null
            mdmsDataConfig.getNonRepeatingOrdersMdmsData().forEach(compositeOrderMdms -> {
                if (compositeOrderMdms.getPath() == null) {
                    orderTypesMap.forEach((orderType, value) -> nonRepeatingPathNullValidation(compositeOrderMdms, orderType, value));
                }
            });


            //For non repeating path not null
            mdmsDataConfig.getNonRepeatingOrdersMdmsData().forEach(compositeOrderMdms -> {
                if (compositeOrderMdms.getPath() != null) {
                    ConcurrentHashMap<String, List<String>> repeatingOrderMapPathNotNull = new ConcurrentHashMap<>();
                    orderTypesMap.forEach((key, value) -> nonRepeatingPathNotNullValidation(key, value, compositeOrderMdms, repeatingOrderMapPathNotNull));
                }
            });

        } catch (
                Exception e) {
            log.error("Validation exception for add item :: {}", e.toString());
            throw new CustomException(ORDER_UPDATE_EXCEPTION, "Validation exception for add item: " + e.getMessage());
        }
    }

    private static void nonOverlappingPathNullValidation(CompositeOrderMdms compositeOrderMdms, String orderType, AtomicInteger overlappingOrderPathNullCount) {
        log.info("Inside nonOverlappingPathNullValidation");

        log.info("Validating non overlapping path null for OrderTypeList :: {} and orderType :: {}", compositeOrderMdms.getOrderTypeList(), orderType);
        log.info("Non Overlapping path null count :: {}", overlappingOrderPathNullCount);

        if (compositeOrderMdms.getOrderTypeList().contains(orderType)) {
            overlappingOrderPathNullCount.getAndIncrement();
            log.info("Non Overlapping path null count :: {}", overlappingOrderPathNullCount);
        }
        if (overlappingOrderPathNullCount.get() == 2) {
            throw new CustomException(ORDER_UPDATE_EXCEPTION, "Overlapping orderTypes are not allowed");
        }
    }

    private static void nonOverlappingPathNotNullValidation(String orderType, List<Object> orderSchemaList, CompositeOrderMdms compositeOrderMdms, ConcurrentHashMap<String, List<String>> overlappingOrderCountPathNotNullMap) {
        log.info("Inside nonOverlappingPathNotNullValidation");

        log.info("OrderTypeList Mdms :: {}", compositeOrderMdms.getOrderTypeList());
        log.info("OrderType :: {}", orderType);
        log.info("OrderSchemaList :: {}", orderSchemaList);

        for (String orderTypeMdms : compositeOrderMdms.getOrderTypeList()) {
            if (orderTypeMdms.equalsIgnoreCase(orderType)) {

                for (Object orderSchema : orderSchemaList) {

                    String pathValue = extractPathValue(compositeOrderMdms, orderSchema);
                    if (!overlappingOrderCountPathNotNullMap.containsKey(pathValue))
                        overlappingOrderCountPathNotNullMap.put(pathValue, compositeOrderMdms.getOrderTypeList());

                    else if (overlappingOrderCountPathNotNullMap.get(pathValue).contains(orderType)) {
                        throw new CustomException(ORDER_UPDATE_EXCEPTION, "Overlapping orderTypes are not allowed for same Application Number");
                    }
                }
            }
        }
    }

    private static void nonRepeatingPathNullValidation(CompositeOrderMdms compositeOrderMdms, String orderType, List<Object> orderSchemaList) {
        log.info("Inside nonRepeatingPathNullValidation");

        log.info("Validating non repeating path null for OrderTypeMdms :: {} and orderType :: {}", compositeOrderMdms.getOrderType(), orderType);
        log.info("Validating non repeating path null for orderType :: {} and orderSchemaList :: {}", orderType, orderSchemaList);

        if (compositeOrderMdms.getOrderType().equalsIgnoreCase(orderType)) {
            if (orderSchemaList.size() > 1)
                throw new CustomException(ORDER_UPDATE_EXCEPTION, "Repeating orderTypes are not allowed");
        }
    }

    private static void nonRepeatingPathNotNullValidation(String orderType, List<Object> orderSchemaList, CompositeOrderMdms compositeOrderMdms, ConcurrentHashMap<String, List<String>> repeatingOrderCountMapPathNotNull) {
        log.info("Inside nonRepeatingPathNotNullValidation");

        log.info("OrderTypeList Mdms :: {}", compositeOrderMdms.getOrderTypeList());
        log.info("OrderType :: {}", orderType);
        log.info("OrderSchemaList :: {}", orderSchemaList);

        if (compositeOrderMdms.getOrderType().equalsIgnoreCase(orderType)) {
            for (Object orderSchema : orderSchemaList) {
                log.info("orderSchema :: {}", orderSchema);
                String pathValue = extractPathValue(compositeOrderMdms, orderSchema);

                // Ensure the list is initialized before checking contains()
                repeatingOrderCountMapPathNotNull.computeIfAbsent(orderType, k -> new ArrayList<>());

                List<String> existingValues = repeatingOrderCountMapPathNotNull.get(orderType);

                if (existingValues.contains(pathValue)) {
                    throw new CustomException(ORDER_UPDATE_EXCEPTION, "Repeating orderTypes are not allowed for same Application Number");
                } else {
                    existingValues.add(pathValue);
                    log.info("Existing values :: {}", existingValues);
                }
            }
        }
    }

    private static String extractPathValue(CompositeOrderMdms compositeOrderMdms, Object orderSchema) {
        com.jayway.jsonpath.Configuration conf = com.jayway.jsonpath.Configuration.builder()
                .jsonProvider(new JacksonJsonNodeJsonProvider())
                .mappingProvider(new JacksonMappingProvider())
                .build();
        return JsonPath.using(conf).parse(orderSchema).read(compositeOrderMdms.getPath(), String.class);
    }

    private Map<String, List<Object>> extractOrderTypesInMap(OrderRequest orderRequest) {
        try {
            Map<String, List<Object>> listMap = new HashMap<>();

            if (orderRequest.getOrder().getCompositeItems() != null) {
                Object compositeOrderItem = orderRequest.getOrder().getCompositeItems();
                ArrayNode arrayNode = objectMapper.convertValue(compositeOrderItem, ArrayNode.class);

                if (arrayNode != null && !arrayNode.isEmpty()) {
                    for (int i = 0; i < arrayNode.size(); i++) {
                        ObjectNode itemNode = (ObjectNode) arrayNode.get(i);
                        if (itemNode.has("orderType")) {
                            String orderType = itemNode.get("orderType").asText();
                            Object orderSchema = itemNode.get("orderSchema");
                            listMap.computeIfAbsent(orderType, k -> new ArrayList<>());
                            listMap.get(orderType).add(orderSchema);
                        } else {
                            throw new CustomException(ENRICHMENT_EXCEPTION, "orderType is mandatory");
                        }
                    }
                }
            }
            return listMap;
        } catch (Exception e) {
            log.error("Error enriching composite order item id add item :: {}", e.toString());
            throw new CustomException(ENRICHMENT_EXCEPTION, "Error in order enrichment service during add item: " + e.getMessage());
        }
    }

}