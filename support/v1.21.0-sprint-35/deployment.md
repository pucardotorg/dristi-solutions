# Deployment notes - v1.21.0-sprint-35

## Restarts
need to restart egov-accesscontrol, pdf-service

- egov-accesscontrol → to load the new role-actions (mdms-data/5754-role-action.json5, action 2806 `/egov-pdf/case-summary` for EMPLOYEE + CITIZEN)
- pdf-service → to load the new `case-summary` data/format config from kerala-configs (add both file paths to DATA_CONFIG_URLS / FORMAT_CONFIG_URLS)

## Config changes
- dristi-pdf: add env `DRISTI_ORDER_MANAGEMENT_HOST=http://order-management.egov:8080`
  (#5754 Case Summary PDF now calls order-management `/order-management/v1/getBotdOrders` for BoTD summaries)
