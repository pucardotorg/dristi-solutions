package org.egov.inbox.repository.builder.V2;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;

import java.util.Comparator;

import lombok.extern.slf4j.Slf4j;
import org.egov.inbox.util.ErrorConstants;
import org.egov.inbox.util.MDMSUtil;
import org.egov.inbox.web.model.*;
import org.egov.inbox.web.model.V2.InboxQueryConfiguration;
import org.egov.inbox.web.model.V2.SearchParam;
import org.egov.inbox.web.model.V2.SearchRequest;
import org.egov.inbox.web.model.V2.SortParam;
import org.egov.inbox.web.model.workflow.ProcessInstanceSearchCriteria;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;
import org.springframework.util.ObjectUtils;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.egov.inbox.util.InboxConstants.*;


@Slf4j
@Component
public class InboxQueryBuilder implements QueryBuilderInterface {

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private MDMSUtil mdmsUtil;


    @Override
    public Map<String, Object> getESQuery(InboxRequest inboxRequest, Boolean isPaginationRequired) {

        InboxQueryConfiguration configuration = mdmsUtil.getConfigFromMDMS(inboxRequest.getInbox().getTenantId(), inboxRequest.getInbox().getProcessSearchCriteria().getModuleName());
        InboxSortConfiguration inboxSortConfiguration = mdmsUtil.getSortConfigFromMDMS(inboxRequest.getInbox().getTenantId(), inboxRequest.getInbox().getProcessSearchCriteria().getModuleName());

        Map<String, Object> params = inboxRequest.getInbox().getModuleSearchCriteria();
        Map<String, Object> baseEsQuery = getBaseESQueryBody(inboxRequest, isPaginationRequired);

        if (isPaginationRequired) {
            // Adds sort clause to the inbox ES query only in case pagination is present, else not
            String sortClauseFieldPath = configuration.getSortParam().getPath();
            SortParam.Order sortOrder = inboxRequest.getInbox().getModuleSearchCriteria().containsKey(SORT_ORDER_CONSTANT) ? SortParam.Order.valueOf((String) inboxRequest.getInbox().getModuleSearchCriteria().get(SORT_ORDER_CONSTANT)) : configuration.getSortParam().getOrder();

            if (inboxSortConfiguration != null && inboxSortConfiguration.getSortOrder() != null && !inboxSortConfiguration.getSortOrder().isEmpty()) {
                addSortClauseToBaseQueryUsingConfig(baseEsQuery, inboxSortConfiguration.getSortOrder(), inboxRequest.getInbox().getProcessSearchCriteria().getIsHearingSerialNumberSorting(), inboxRequest.getInbox().getProcessSearchCriteria().getModuleName());
            } else if (configuration.getIndex().equals(ORDER_NOTIFICATION_INDEX) && "Order".equals(params.get("entityType"))) {
                addIndexSort(baseEsQuery, configuration.getIndex());
            } else if (configuration.getIndex().equals(ORDER_NOTIFICATION_INDEX) && !params.containsKey("entityType")) {
                orderNotificationSortClause(baseEsQuery);
            } else if (inboxRequest.getInbox().getSortOrder() != null && !inboxRequest.getInbox().getSortOrder().isEmpty()) {
                List<OrderBy> sortOrders = inboxRequest.getInbox().getSortOrder();

                for (OrderBy orderBy : sortOrders) {
                    String sortField = orderBy.getCode();
                    String sortDirection = orderBy.getOrder().toString(); // Expected to be "ASC" or "DESC"

                    SortParam.Order orderEnum = SortParam.Order.fromValue(sortDirection);
                    if (orderEnum != null && sortField != null && !sortField.isEmpty()) {
                        addSortClauseToBaseQuery(baseEsQuery, sortField, orderEnum);
                    }
                }
            } else {
                addSortClauseToBaseQuery(baseEsQuery, sortClauseFieldPath, sortOrder);
            }

            // Adds source filter only when requesting for inbox items.
            List<String> sourceFilterPathList = configuration.getSourceFilterPathList();
            addSourceFilterToBaseQuery(baseEsQuery, sourceFilterPathList);
        }

        Map<String, Object> innerBoolClause = (HashMap<String, Object>) ((HashMap<String, Object>) baseEsQuery.get(QUERY_KEY)).get(BOOL_KEY);
        List<Object> mustClauseList = (ArrayList<Object>) innerBoolClause.get(MUST_KEY);

        Map<String, String> nameToPathMap = new HashMap<>();
        Map<String, SearchParam.Operator> nameToOperator = new HashMap<>();
        Map<String, String> nameToNestedPath = new HashMap<>();

        configuration.getAllowedSearchCriteria().forEach(searchParam -> {
            nameToPathMap.put(searchParam.getName(), searchParam.getPath());
            nameToOperator.put(searchParam.getName(), searchParam.getOperator());
            if (!ObjectUtils.isEmpty(searchParam.getNestedPath())) {
                nameToNestedPath.put(searchParam.getName(), searchParam.getNestedPath());
            }
        });

        addModuleSearchCriteriaToBaseQuery(params, nameToPathMap, nameToOperator, nameToNestedPath, mustClauseList);
        addProcessSearchCriteriaToBaseQuery(inboxRequest.getInbox().getProcessSearchCriteria(), nameToPathMap, nameToOperator, mustClauseList);

        innerBoolClause.put(MUST_KEY, mustClauseList);

        return baseEsQuery;
    }

    private void addSortClauseToBaseQueryUsingConfig(Map<String, Object> baseEsQuery, List<SortOrder> sortOrder, boolean isHearingSerialNumberSorting, String moduleName) {

        List<Map<String, Object>> sortList = new ArrayList<>();

        if (isHearingSerialNumberSorting && "Hearing Service".equalsIgnoreCase(moduleName)) {
            Map<String, Object> innerSortOrderClause = new HashMap<>();
            innerSortOrderClause.put(ORDER_KEY, "ASC");
            Map<String, Object> outerSortClauseChild = new HashMap<>();
            outerSortClauseChild.put("Data.hearingDetails.serialNumber", innerSortOrderClause);
            sortList.add(outerSortClauseChild);
            baseEsQuery.put(SORT_KEY, sortList);
        } else {
            // Sort by orderPriority ascending
            sortOrder.sort(Comparator.comparing(SortOrder::getOrderPriority, Comparator.nullsLast(Integer::compareTo)));
            for (SortOrder sortOrderItem : sortOrder) {
                if (sortOrderItem.getIsActive()) {
                    String path = sortOrderItem.getPath();
                    SortParam.Order order = SortParam.Order.valueOf(sortOrderItem.getOrderType());
                    String script = sortOrderItem.getScript();
                    if (!ObjectUtils.isEmpty(script)) {
                        sortList.add(getScriptObject(script));
                    } else {
                        sortList.add(addOuterSlotClause(path, order));
                    }
                }

                baseEsQuery.put(SORT_KEY, sortList);
            }
        }
    }

    private Map<String, Object> addOuterSlotClause(String path, SortParam.Order order) {

        Map<String, Object> innerSortOrderClause = new HashMap<>();
        innerSortOrderClause.put(ORDER_KEY, order);
        Map<String, Object> outerSortClauseChild = new HashMap<>();
        outerSortClauseChild.put(path, innerSortOrderClause);

        return outerSortClauseChild;
    }

    private void addIndexSort(Map<String, Object> baseEsQuery, String indexName) {
        baseEsQuery.put(SORT_KEY, sortClauseList(indexName));
    }

    private List<Map<String, Object>> sortClauseList(String indexName) {
        List<Map<String, Object>> outerClauseList = new ArrayList<>();
        String placeHolder = (String) getPlaceHolder(indexName);
        outerClauseList.add(getScriptObject(String.format(TYPE_SORTING_SCRIPT, placeHolder)));
        outerClauseList.add(getScriptObject(String.format(YEAR_SORTING_SCRIPT, placeHolder)));
        outerClauseList.add(getScriptObject(String.format(NUMBER_SORTING_SCRIPT, placeHolder)));
        return outerClauseList;
    }

    private void orderNotificationSortClause(Map<String, Object> baseEsQuery) {
        List<Map<String, Object>> sortList = new ArrayList<>();
        sortList.add(getScriptObject(ORDER_STATUS_PRIORITY_SCRIPT));
        sortList.add(getScriptObject(ORDER_STATUS_TIME_SCRIPT));
        baseEsQuery.put(SORT_KEY, sortList);
    }


    private Object getPlaceHolder(String indexName) {
        if (indexName.equals(OPEN_HEARING_INDEX)) {
            return "hearingDetails.caseNumber";
        } else {
            return "orderNotification.caseSTNumber";
        }
    }

    private Map<String, Object> getScriptObject(String scriptType) {
        try {
            return (Map<String, Object>) objectMapper.readValue(scriptType, Object.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    }

    public Map<String, Object> getESQueryForSimpleSearch(SearchRequest searchRequest, Boolean isPaginationRequired, Boolean isGroupByFilingNumber) {

        InboxQueryConfiguration configuration = mdmsUtil.getConfigFromMDMS(searchRequest.getIndexSearchCriteria().getTenantId(), searchRequest.getIndexSearchCriteria().getModuleName());
        Map<String, Object> params = searchRequest.getIndexSearchCriteria().getModuleSearchCriteria();
        Map<String, Object> baseEsQuery = getBaseESQueryBody(searchRequest, isPaginationRequired);

        if (isPaginationRequired) {
            // Adds sort clause to the inbox ES query only in case pagination is present, else not
            String sortClauseFieldPath = configuration.getSortParam().getPath();
            SortParam.Order sortOrder = searchRequest.getIndexSearchCriteria().getModuleSearchCriteria().containsKey(SORT_ORDER_CONSTANT) ? SortParam.Order.valueOf((String) searchRequest.getIndexSearchCriteria().getModuleSearchCriteria().get(SORT_ORDER_CONSTANT)) : configuration.getSortParam().getOrder();
            addSortClauseToBaseQuery(baseEsQuery, sortClauseFieldPath, sortOrder);

            // Adds source filter only when requesting for inbox items.
            List<String> sourceFilterPathList = configuration.getSourceFilterPathList();
            addSourceFilterToBaseQuery(baseEsQuery, sourceFilterPathList);
        }

        if (isGroupByFilingNumber) {
            Map<String, Object> collapseClause = new HashMap<>();
            collapseClause.put("field", "Data.filingNumber.keyword");

            baseEsQuery.put("collapse", collapseClause);

            Map<String, Object> cardinalityAgg = new HashMap<>();
            cardinalityAgg.put("field", "Data.filingNumber.keyword");

            Map<String, Object> uniqueFilingNumbersAgg = new HashMap<>();
            uniqueFilingNumbersAgg.put("cardinality", cardinalityAgg);

            Map<String, Object> aggs = new HashMap<>();
            aggs.put("unique_filing_numbers", uniqueFilingNumbersAgg);

            baseEsQuery.put("aggs", aggs);
        }

        Map<String, Object> innerBoolClause = (HashMap<String, Object>) ((HashMap<String, Object>) baseEsQuery.get(QUERY_KEY)).get(BOOL_KEY);
        List<Object> mustClauseList = (ArrayList<Object>) innerBoolClause.get(MUST_KEY);

        Map<String, String> nameToPathMap = new HashMap<>();
        Map<String, SearchParam.Operator> nameToOperator = new HashMap<>();
        Map<String, String> nameToNestedPath = new HashMap<>();

        configuration.getAllowedSearchCriteria().forEach(searchParam -> {
            nameToPathMap.put(searchParam.getName(), searchParam.getPath());
            nameToOperator.put(searchParam.getName(), searchParam.getOperator());
            if (!ObjectUtils.isEmpty(searchParam.getNestedPath())) {
                nameToNestedPath.put(searchParam.getName(), searchParam.getNestedPath());
            }
        });

        addModuleSearchCriteriaToBaseQuery(params, nameToPathMap, nameToOperator, nameToNestedPath, mustClauseList);

        innerBoolClause.put(MUST_KEY, mustClauseList);

        return baseEsQuery;
    }

    private void addSourceFilterToBaseQuery
            (Map<String, Object> baseEsQuery, List<String> sourceFilterPathList) {
        if (!CollectionUtils.isEmpty(sourceFilterPathList))
            baseEsQuery.put(SOURCE_KEY, sourceFilterPathList);
    }

    private void addSortClauseToBaseQuery(Map<String, Object> baseEsQuery, String
            sortClauseFieldPath, SortParam.Order sortOrder) {
        List<Map> sortClause = new ArrayList<>();
        Map<String, Object> innerSortOrderClause = new HashMap<>();
        innerSortOrderClause.put(ORDER_KEY, sortOrder);
        Map<String, Map> outerSortClauseChild = new HashMap<>();
        outerSortClauseChild.put(sortClauseFieldPath, innerSortOrderClause);
        sortClause.add(outerSortClauseChild);
        baseEsQuery.put(SORT_KEY, sortClause);
    }

    private void addProcessSearchCriteriaToBaseQuery(ProcessInstanceSearchCriteria
                                                             processSearchCriteria, Map<String, String> nameToPathMap, Map<String, SearchParam.Operator> nameToOperator, List<Object> mustClauseList) {
        if (!ObjectUtils.isEmpty(processSearchCriteria.getTenantId())) {
            String key = "tenantId";
            Map<String, Object> mustClauseChild = null;
            Map<String, Object> params = new HashMap<>();
            params.put(key, processSearchCriteria.getTenantId());
            mustClauseChild = (Map<String, Object>) prepareMustClauseChild(params, key, nameToPathMap, nameToOperator);
            if (CollectionUtils.isEmpty(mustClauseChild)) {
                log.info("Error occurred while preparing filter for must clause. Filter for key " + key + " will not be added.");
            } else {
                mustClauseList.add(mustClauseChild);
            }
        }

        if (!ObjectUtils.isEmpty(processSearchCriteria.getStatus())) {
            String key = "status";
            Map<String, Object> mustClauseChild = null;
            Map<String, Object> params = new HashMap<>();
            params.put(key, processSearchCriteria.getStatus());
            mustClauseChild = (Map<String, Object>) prepareMustClauseChild(params, key, nameToPathMap, nameToOperator);
            if (CollectionUtils.isEmpty(mustClauseChild)) {
                log.info("Error occurred while preparing filter for must clause. Filter for key " + key + " will not be added.");
            } else {
                mustClauseList.add(mustClauseChild);
            }
        }

        if (!ObjectUtils.isEmpty(processSearchCriteria.getAssignee())) {
            String key = "assignee";
            Map<String, Object> mustClauseChild = null;
            Map<String, Object> params = new HashMap<>();
            params.put(key, processSearchCriteria.getAssignee());
            mustClauseChild = (Map<String, Object>) prepareMustClauseChild(params, key, nameToPathMap, nameToOperator);
            if (CollectionUtils.isEmpty(mustClauseChild)) {
                log.info("Error occurred while preparing filter for must clause. Filter for key " + key + " will not be added.");
            } else {
                mustClauseList.add(mustClauseChild);
            }
        }

        if (!ObjectUtils.isEmpty(processSearchCriteria.getFromDate())) {
            String key = "fromDate";
            Map<String, Object> mustClauseChild = null;
            Map<String, Object> params = new HashMap<>();
            params.put(key, processSearchCriteria.getFromDate());
            mustClauseChild = (Map<String, Object>) prepareMustClauseChild(params, key, nameToPathMap, nameToOperator);
            if (CollectionUtils.isEmpty(mustClauseChild)) {
                log.info("Error occurred while preparing filter for must clause. Filter for key " + key + " will not be added.");
            } else {
                mustClauseList.add(mustClauseChild);
            }
        }

        if (!ObjectUtils.isEmpty(processSearchCriteria.getToDate())) {
            String key = "toDate";
            Map<String, Object> mustClauseChild = null;
            Map<String, Object> params = new HashMap<>();
            params.put(key, processSearchCriteria.getToDate());
            mustClauseChild = (Map<String, Object>) prepareMustClauseChild(params, key, nameToPathMap, nameToOperator);
            if (CollectionUtils.isEmpty(mustClauseChild)) {
                log.info("Error occurred while preparing filter for must clause. Filter for key " + key + " will not be added.");
            } else {
                mustClauseList.add(mustClauseChild);
            }
        }

    }


    private void addModuleSearchCriteriaToBaseQuery
            (Map<String, Object> params, Map<String, String> nameToPathMap,
             Map<String, SearchParam.Operator> nameToOperator, Map<String, String> nameToNestedPath, List<Object> mustClauseList) {

        // Group nested params by their nestedPath
        Map<String, List<String>> nestedPathToKeys = new HashMap<>();
        List<String> nonNestedKeys = new ArrayList<>();

        params.keySet().forEach(key -> {
            if (!(key.equals(SORT_ORDER_CONSTANT) || key.equals(SORT_BY_CONSTANT))) {
                String nestedPath = nameToNestedPath.get(key);
                if (!ObjectUtils.isEmpty(nestedPath)) {
                    nestedPathToKeys.computeIfAbsent(nestedPath, k -> new ArrayList<>()).add(key);
                } else {
                    nonNestedKeys.add(key);
                }
            }
        });

        // Process non-nested params as before
        nonNestedKeys.forEach(key -> {
            SearchParam.Operator operator = nameToOperator.get(key);
            if (operator != null && operator.equals(SearchParam.Operator.WILDCARD)) {
                List<Map<String, Object>> mustClauseChild = null;

                mustClauseChild = (List<Map<String, Object>>) prepareMustClauseWildCardChild(params, key,
                        nameToPathMap, nameToOperator);

                if (CollectionUtils.isEmpty(mustClauseChild)) {
                    log.info("Error occurred while preparing filter for must clause. Filter for key " + key
                            + " will not be added.");
                } else {
                    mustClauseList.addAll(mustClauseChild);
                }
            } else {

                Map<String, Object> mustClauseChild = null;
                mustClauseChild = (Map<String, Object>) prepareMustClauseChild(params, key, nameToPathMap,
                        nameToOperator);
                if (CollectionUtils.isEmpty(mustClauseChild)) {
                    log.info("Error occurred while preparing filter for must clause. Filter for key " + key
                            + " will not be added.");
                } else {
                    mustClauseList.add(mustClauseChild);
                }

            }
        });

        // Process nested params - group by nestedPath and build nested queries
        nestedPathToKeys.forEach((nestedPath, keys) -> {
            Map<String, Object> nestedQuery = buildNestedQuery(nestedPath, keys, params, nameToPathMap, nameToOperator);
            if (!CollectionUtils.isEmpty(nestedQuery)) {
                mustClauseList.add(nestedQuery);
            }
        });
    }

    private Map<String, Object> buildNestedQuery(String nestedPath, List<String> keys,
                                                  Map<String, Object> params,
                                                  Map<String, String> nameToPathMap,
                                                  Map<String, SearchParam.Operator> nameToOperator) {
        List<Object> nestedMustClauses = new ArrayList<>();

        keys.forEach(key -> {
            Map<String, Object> clause = (Map<String, Object>) prepareMustClauseChild(params, key, nameToPathMap, nameToOperator);
            if (!CollectionUtils.isEmpty(clause)) {
                nestedMustClauses.add(clause);
            }
        });

        if (CollectionUtils.isEmpty(nestedMustClauses)) {
            return null;
        }

        // Build nested query structure
        Map<String, Object> nestedBoolMust = new HashMap<>();
        nestedBoolMust.put(MUST_KEY, nestedMustClauses);

        Map<String, Object> nestedBool = new HashMap<>();
        nestedBool.put(BOOL_KEY, nestedBoolMust);

        Map<String, Object> nestedInner = new HashMap<>();
        nestedInner.put("path", nestedPath);
        nestedInner.put(QUERY_KEY, nestedBool);

        Map<String, Object> nestedQuery = new HashMap<>();
        nestedQuery.put("nested", nestedInner);

        return nestedQuery;
    }

    @Override
    public Map<String, Object> getStatusCountQuery(InboxRequest inboxRequest) {
        Map<String, Object> baseEsQuery = getBaseESQueryBody(inboxRequest, Boolean.FALSE);
        appendStatusCountAggsNode(baseEsQuery);
        return baseEsQuery;
    }

    @Override
    public Map<String, Object> getNearingSlaCountQuery(InboxRequest inboxRequest, Long businessServiceSla) {
        Map<String, Object> baseEsQuery = getESQuery(inboxRequest, Boolean.FALSE);
        Long currenTimeInMillis = System.currentTimeMillis();
        Long lteParam = currenTimeInMillis;
        Long slotLimit = businessServiceSla - 40 * (businessServiceSla / 100);
        Long gteParam = currenTimeInMillis - slotLimit;

        appendNearingSlaCountClause(baseEsQuery, gteParam, lteParam);
        return baseEsQuery;
    }

    private void appendNearingSlaCountClause(Map<String, Object> baseEsQuery, Long gteParam, Long lteParam) {
        List mustClause = JsonPath.read(baseEsQuery, "$.query.bool.must");
        Map<String, Object> rangeObject = new HashMap<>();
        Map<String, Object> rangeClause = new HashMap<>();
        rangeClause.put("gte", gteParam);
        rangeClause.put("lte", lteParam);
        rangeObject.put("Data.auditDetails.lastModifiedTime", rangeClause);
        HashMap<String, Object> rangeMap = new HashMap<>();
        rangeMap.put("range", rangeObject);
        mustClause.add(rangeMap);
    }

    private void appendStatusCountAggsNode(Map<String, Object> baseEsQuery) {
        Map<String, Object> aggsNode = new HashMap<>();
        aggsNode.put("statusCount", new HashMap<>());
        Map<String, Object> statusCountNode = (Map<String, Object>) aggsNode.get("statusCount");
        statusCountNode.put("terms", new HashMap<>());
        Map<String, Object> innerTermsQuery = (Map<String, Object>) statusCountNode.get("terms");
        innerTermsQuery.put("field", "Data.currentProcessInstance.state.uuid.keyword");
        baseEsQuery.put("aggs", aggsNode);
    }

    private Map<String, Object> getBaseESQueryBody(InboxRequest inboxRequest, Boolean isPaginationRequired) {
        Map<String, Object> baseEsQuery = new HashMap<>();
        Map<String, Object> boolQuery = new HashMap<>();
        Map<String, Object> mustClause = new HashMap<>();

        // Prepare bool query
        boolQuery.put("bool", new HashMap<>());
        Map<String, Object> innerBoolBody = (Map<String, Object>) boolQuery.get("bool");
        innerBoolBody.put("must", new ArrayList<>());

        // Prepare base ES query
        if (isPaginationRequired) {
            baseEsQuery.put("from", inboxRequest.getInbox().getOffset());
            baseEsQuery.put("size", inboxRequest.getInbox().getLimit());
        }
        baseEsQuery.put("query", boolQuery);

        return baseEsQuery;
    }

    private Map<String, Object> getBaseESQueryBody(SearchRequest searchRequest, Boolean isPaginationRequired) {
        Map<String, Object> baseEsQuery = new HashMap<>();
        Map<String, Object> boolQuery = new HashMap<>();

        // Prepare bool query
        boolQuery.put("bool", new HashMap<>());
        Map<String, Object> innerBoolBody = (Map<String, Object>) boolQuery.get("bool");
        innerBoolBody.put("must", new ArrayList<>());

        // Prepare base ES query
        if (isPaginationRequired) {
            baseEsQuery.put("from", searchRequest.getIndexSearchCriteria().getOffset());
            baseEsQuery.put("size", searchRequest.getIndexSearchCriteria().getLimit());
        }
        baseEsQuery.put("query", boolQuery);

        return baseEsQuery;
    }

    private Object prepareMustClauseChild(Map<String, Object> params, String
            key, Map<String, String> nameToPathMap,
                                          Map<String, SearchParam.Operator> nameToOperatorMap) {

        SearchParam.Operator operator = nameToOperatorMap.get(key);
        if (operator == null || operator.equals(SearchParam.Operator.EQUAL)) {
            Object value = params.get(key);

            // Handle null or empty values
            if (isNullOrEmpty(value)) {
                return createNotExistsQuery(key, nameToPathMap);
            }

            // Add terms clause in case the search criteria has a list of values
            if (value instanceof List) {
                Map<String, Object> termsClause = new HashMap<>();
                termsClause.put("terms", new HashMap<>());
                Map<String, Object> innerTermsClause = (Map<String, Object>) termsClause.get("terms");
                innerTermsClause.put(addDataPathToSearchParamKey(key, nameToPathMap), value);
                return termsClause;
            }
            // Add term clause in case the search criteria has a single value
            else {
                Map<String, Object> termClause = new HashMap<>();
                termClause.put("term", new HashMap<>());
                Map<String, Object> innerTermClause = (Map<String, Object>) termClause.get("term");
                innerTermClause.put(addDataPathToSearchParamKey(key, nameToPathMap), value);
                return termClause;
            }
        } else if (operator.equals(SearchParam.Operator.LTE) || operator.equals(SearchParam.Operator.GTE)) {
            Map<String, Object> rangeClause = new HashMap<>();
            rangeClause.put("range", new HashMap<>());
            Map<String, Object> innerTermClause = (Map<String, Object>) rangeClause.get("range");
            Map<String, Object> comparatorMap = new HashMap<>();

            if (operator.equals(SearchParam.Operator.LTE)) {
                comparatorMap.put("lte", params.get(key));
            } else if (operator.equals(SearchParam.Operator.GTE)) {
                comparatorMap.put("gte", params.get(key));
            }
            innerTermClause.put(addDataPathToSearchParamKey(key, nameToPathMap), comparatorMap);
            return rangeClause;
        } else
            throw new CustomException(ErrorConstants.INVALID_OPERATOR_DATA, " Unsupported Operator : " + operator);
    }

    // Helper method to check if value is null or empty
    private boolean isNullOrEmpty(Object value) {
        if (value == null) {
            return true;
        }
        if (value instanceof List) {
            return ((List<?>) value).isEmpty();
        }
        return false;
    }

    // Helper method to create not exists query
    private Map<String, Object> createNotExistsQuery(String key, Map<String, String> nameToPathMap) {
        Map<String, Object> boolClause = new HashMap<>();
        boolClause.put("bool", new HashMap<>());
        Map<String, Object> boolInner = (Map<String, Object>) boolClause.get("bool");

        Map<String, Object> existsClause = new HashMap<>();
        Map<String, Object> existsInner = new HashMap<>();
        String path = addDataPathToSearchParamKey(key, nameToPathMap);
        if (path.endsWith(".keyword")) path = path.substring(0, path.length() - ".keyword".length());
        existsInner.put("field", path);
        existsClause.put("exists", existsInner);

        List<Object> mustNot = new ArrayList<>();
        mustNot.add(existsClause);
        boolInner.put("must_not", mustNot);
        return boolClause;
    }

    private List<Map<String, Object>> prepareMustClauseWildCardChild(Map<String, Object> params, String key,
                                                                     Map<String, String> nameToPathMap, Map<String, SearchParam.Operator> nameToOperatorMap) {
        // Add wildcard clause in case the search criteria has a list of values
        Object value = params.get(key);
        List<Map<String, Object>> wildcardClauses = new ArrayList<>();
        if (value instanceof List) {
            List<Object> values = (List<Object>) value;
            for (Object item : values) {
                wildcardClauses.add(createWildcardClause(item, key, nameToPathMap));
            }
            return wildcardClauses;
        } else {
            wildcardClauses.add(createWildcardClause(value, key, nameToPathMap));
            return wildcardClauses;
        }
    }

    /**
     * Creates a wildcard clause for Elasticsearch query with case-insensitive matching
     */
    private Map<String, Object> createWildcardClause(Object value, String key, Map<String, String> nameToPathMap) {
        Map<String, Object> wildcardClause = new HashMap<>();
        Map<String, Object> wildcardContent = new HashMap<>();
        Map<String, Object> wildcardInnerMap = new HashMap<>();
        wildcardContent.put("value", "*" + (value != null ? value.toString().toLowerCase() : "") + "*");
        wildcardContent.put("case_insensitive", true);
        wildcardInnerMap.put(addDataPathToSearchParamKey(key, nameToPathMap), wildcardContent);
        wildcardClause.put("wildcard", wildcardInnerMap);
        return wildcardClause;
    }

    private String addDataPathToSearchParamKey(String key, Map<String, String> nameToPathMap) {

        String path = nameToPathMap.get(key);

        if (StringUtils.isEmpty(path))
            path = "Data." + key + ".keyword";

        return path;
    }

}
