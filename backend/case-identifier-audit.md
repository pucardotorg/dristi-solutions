# Case Identifier Audit – Backend Services (with Line References)

Reference: https://github.com/pucardotorg/dristi/issues/5461

Identifiers tracked: **cnrNumber**, **cmpNumber**, **courtCaseNumber** (ST number), **filingNumber**

All file paths are relative to: `backend/`

---

## 1. digit-services/egov-indexer

### `cnrNumber`

- `digit-services/egov-indexer/src/main/java/org/egov/infra/indexer/custom/application/Application.java` → lines: **42, 43**
- `digit-services/egov-indexer/src/main/java/org/egov/infra/indexer/custom/courtCase/CaseCriteria.java` → lines: **28, 29**
- `digit-services/egov-indexer/src/main/java/org/egov/infra/indexer/custom/courtCase/CourtCase.java` → lines: **72, 74**
- `digit-services/egov-indexer/src/main/java/org/egov/infra/indexer/custom/hearing/Hearing.java` → lines: **57, 59, 138, 139**
- `digit-services/egov-indexer/src/main/resources/case-indexer.yml` → lines: **32, 71, 72**
- `digit-services/egov-indexer/src/main/resources/hearing-indexer.yml` → lines: **18, 34, 35**

### `cmpNumber`

- `digit-services/egov-indexer/src/main/java/org/egov/infra/indexer/custom/application/Application.java` → lines: **45, 46**
- `digit-services/egov-indexer/src/main/java/org/egov/infra/indexer/custom/courtCase/CourtCase.java` → lines: **76, 77**
- `digit-services/egov-indexer/src/main/java/org/egov/infra/indexer/custom/hearing/Hearing.java` → lines: **50, 51**
- `digit-services/egov-indexer/src/main/resources/case-indexer.yml` → lines: **33, 73, 74**

### `courtCaseNumber`

- `digit-services/egov-indexer/src/main/java/org/egov/infra/indexer/custom/courtCase/CaseCriteria.java` → lines: **37, 38**
- `digit-services/egov-indexer/src/main/java/org/egov/infra/indexer/custom/courtCase/CourtCase.java` → lines: **60, 62**
- `digit-services/egov-indexer/src/main/java/org/egov/infra/indexer/custom/hearing/Hearing.java` → lines: **44, 45**
- `digit-services/egov-indexer/src/main/resources/case-indexer.yml` → lines: **31, 69, 70**

### `filingNumber`

- `digit-services/egov-indexer/src/main/java/org/egov/infra/indexer/custom/application/Application.java` → lines: **39, 40**
- `digit-services/egov-indexer/src/main/java/org/egov/infra/indexer/custom/courtCase/CaseCriteria.java` → lines: **31, 32**
- `digit-services/egov-indexer/src/main/java/org/egov/infra/indexer/custom/courtCase/CourtCase.java` → lines: **53, 55**
- `digit-services/egov-indexer/src/main/java/org/egov/infra/indexer/custom/hearing/Hearing.java` → lines: **53, 55, 133, 134**
- `digit-services/egov-indexer/src/main/resources/application-indexer.yml` → lines: **19, 35, 36, 52**
- `digit-services/egov-indexer/src/main/resources/billing-indexer.yml` → lines: **39**
- `digit-services/egov-indexer/src/main/resources/case-indexer.yml` → lines: **28, 63, 64**
- `digit-services/egov-indexer/src/main/resources/hearing-indexer.yml` → lines: **24, 46, 47, 53**


## 2. digit-services/inbox

### `filingNumber`

- `digit-services/inbox/src/main/java/org/egov/inbox/repository/builder/V2/InboxQueryBuilder.java` → lines: **208, 213**


## 3. dristi-services/ab-diary

### `cnrNumber`

- `dristi-services/ab-diary/src/main/java/digit/web/models/CourtCase.java` → lines: **74, 76**

### `cmpNumber`

- `dristi-services/ab-diary/src/main/java/digit/service/DiaryService.java` → lines: **132, 135, 139**
- `dristi-services/ab-diary/src/main/java/digit/web/models/CourtCase.java` → lines: **78, 79**

### `courtCaseNumber`

- `dristi-services/ab-diary/src/main/java/digit/service/DiaryService.java` → lines: **133, 136**
- `dristi-services/ab-diary/src/main/java/digit/web/models/CourtCase.java` → lines: **62, 64**

### `filingNumber`

- `dristi-services/ab-diary/src/main/java/digit/web/models/CourtCase.java` → lines: **55, 57**


## 4. dristi-services/advocate

### `cnrNumber`

- `dristi-services/advocate/src/main/java/org/pucar/dristi/web/models/SmsTemplateData.java` → lines: **24**

### `cmpNumber`

- `dristi-services/advocate/src/main/java/org/pucar/dristi/service/SmsNotificationService.java` → lines: **93**
- `dristi-services/advocate/src/main/java/org/pucar/dristi/web/models/SmsTemplateData.java` → lines: **28**

### `courtCaseNumber`

- `dristi-services/advocate/src/main/java/org/pucar/dristi/web/models/SmsTemplateData.java` → lines: **18**

### `filingNumber`

- `dristi-services/advocate/src/main/java/org/pucar/dristi/service/SmsNotificationService.java` → lines: **72, 91, 132**
- `dristi-services/advocate/src/main/java/org/pucar/dristi/web/models/SmsTemplateData.java` → lines: **22**


## 5. dristi-services/advocate-office-management

### `cmpNumber`

- `dristi-services/advocate-office-management/src/main/java/digit/web/models/CaseMemberInfo.java` → lines: **27, 28**

### `courtCaseNumber`

- `dristi-services/advocate-office-management/src/main/java/digit/web/models/CaseMemberInfo.java` → lines: **30, 31**

### `filingNumber`

- `dristi-services/advocate-office-management/src/main/java/digit/web/models/CaseMemberInfo.java` → lines: **24, 25**


## 6. dristi-services/analytics

### `cnrNumber`

- `dristi-services/analytics/src/main/java/org/pucar/dristi/config/ServiceConstants.java` → lines: **16, 45, 82, 83, 185**
- `dristi-services/analytics/src/main/java/org/pucar/dristi/util/BillingUtil.java` → lines: **140, 145**
- `dristi-services/analytics/src/main/java/org/pucar/dristi/util/CaseUtil.java` → lines: **45, 53, 54**
- `dristi-services/analytics/src/main/java/org/pucar/dristi/util/HearingUtil.java` → lines: **29, 36**
- `dristi-services/analytics/src/main/java/org/pucar/dristi/util/IndexerUtils.java` → lines: **189, 273, 291, 374, 448, 672, 939, 940, 945, 954, 958, 959, 965, 976, 985, 1002, 1007, 1025, 1027, 1067, 1069, 1104, 1106, 1125, 1127, 1146, 1164, 1167, 1196, 1198, 1215, 1217**
- `dristi-services/analytics/src/main/java/org/pucar/dristi/web/models/CaseCriteria.java` → lines: **29, 30**
- `dristi-services/analytics/src/main/java/org/pucar/dristi/web/models/PendingTask.java` → lines: **58, 60**
- `dristi-services/analytics/src/main/java/org/pucar/dristi/web/models/SmsTemplateData.java` → lines: **24**
- `dristi-services/analytics/src/main/java/org/pucar/dristi/web/models/ctcApplication/CtcApplication.java` → lines: **31, 32**

### `cmpNumber`

- `dristi-services/analytics/src/main/java/org/pucar/dristi/config/ServiceConstants.java` → lines: **85, 87**
- `dristi-services/analytics/src/main/java/org/pucar/dristi/service/SmsNotificationService.java` → lines: **93, 129, 143, 144, 145**
- `dristi-services/analytics/src/main/java/org/pucar/dristi/util/BillingUtil.java` → lines: **84, 95, 96, 147, 153, 154**
- `dristi-services/analytics/src/main/java/org/pucar/dristi/util/CaseOverallStatusUtil.java` → lines: **196, 199, 214, 218**
- `dristi-services/analytics/src/main/java/org/pucar/dristi/util/CaseUtil.java` → lines: **219**
- `dristi-services/analytics/src/main/java/org/pucar/dristi/util/IndexerUtils.java` → lines: **212, 218, 219, 313, 319, 320, 544, 550, 551, 808, 977, 987**
- `dristi-services/analytics/src/main/java/org/pucar/dristi/web/models/SmsTemplateData.java` → lines: **28**

### `courtCaseNumber`

- `dristi-services/analytics/src/main/java/org/pucar/dristi/config/ServiceConstants.java` → lines: **88**
- `dristi-services/analytics/src/main/java/org/pucar/dristi/service/SmsNotificationService.java` → lines: **88, 138, 139, 140**
- `dristi-services/analytics/src/main/java/org/pucar/dristi/util/BillingUtil.java` → lines: **85, 93, 94, 148, 151, 152**
- `dristi-services/analytics/src/main/java/org/pucar/dristi/util/CaseOverallStatusUtil.java` → lines: **195, 199, 214, 219**
- `dristi-services/analytics/src/main/java/org/pucar/dristi/util/CaseUtil.java` → lines: **208**
- `dristi-services/analytics/src/main/java/org/pucar/dristi/util/IndexerUtils.java` → lines: **213, 216, 217, 314, 317, 318, 545, 548, 549**
- `dristi-services/analytics/src/main/java/org/pucar/dristi/web/models/CaseCriteria.java` → lines: **38, 39**
- `dristi-services/analytics/src/main/java/org/pucar/dristi/web/models/SmsTemplateData.java` → lines: **18**

### `filingNumber`

- `dristi-services/analytics/src/main/java/org/pucar/dristi/config/ServiceConstants.java` → lines: **16, 35, 50, 102, 184**
- `dristi-services/analytics/src/main/java/org/pucar/dristi/kafka/consumer/AdvocateOfficeMemberConsumer.java` → lines: **209, 219, 220, 223, 225, 231, 245, 252, 270, 277, 282, 287, 289, 293, 329, 332, 338, 343, 350, 352, 357, 362, 368, 370, 374, 377, 407, 416, 418, 427, 437, 439, 440, 449, 453, 457**
- `dristi-services/analytics/src/main/java/org/pucar/dristi/service/PendingTaskService.java` → lines: **71, 72, 80, 344**
- `dristi-services/analytics/src/main/java/org/pucar/dristi/service/SmsNotificationService.java` → lines: **92, 128, 148**
- `dristi-services/analytics/src/main/java/org/pucar/dristi/util/BillingUtil.java` → lines: **73, 76, 80, 81, 87, 108, 141, 142, 145, 164, 174, 176, 186, 189**
- `dristi-services/analytics/src/main/java/org/pucar/dristi/util/CaseOverallStatusUtil.java` → lines: **99, 107, 110, 117, 124, 126, 131, 134, 136, 138, 143, 147, 153, 167, 168, 169, 170, 177, 181, 186, 192, 193, 199, 214, 216, 224, 227, 244, 247, 252, 267, 287, 288, 297, 306, 339, 342, 351, 364, 366, 369, 374, 381, 402, 403, 406, 433, 453, 458, 479, 482**
- `dristi-services/analytics/src/main/java/org/pucar/dristi/util/CaseUtil.java` → lines: **45, 56, 57, 117**
- `dristi-services/analytics/src/main/java/org/pucar/dristi/util/IndexerUtils.java` → lines: **190, 195, 207, 208, 236, 237, 273, 292, 297, 309, 337, 338, 374, 397, 401, 404, 449, 501, 528, 533, 536, 538, 568, 571, 672, 781, 784, 809, 813, 816, 941, 946, 947, 948, 953, 960, 966, 986, 1000, 1001, 1008, 1019, 1021, 1028, 1061, 1063, 1070, 1098, 1100, 1107, 1119, 1121, 1128, 1147, 1157, 1159, 1168, 1190, 1192, 1199, 1208, 1209, 1211, 1218**
- `dristi-services/analytics/src/main/java/org/pucar/dristi/util/PendingTaskUtil.java` → lines: **39, 46, 55, 62, 113, 120, 125, 132**
- `dristi-services/analytics/src/main/java/org/pucar/dristi/web/models/CaseCriteria.java` → lines: **32, 33**
- `dristi-services/analytics/src/main/java/org/pucar/dristi/web/models/CaseOverallStatus.java` → lines: **23, 24, 48, 49**
- `dristi-services/analytics/src/main/java/org/pucar/dristi/web/models/OfflinePaymentTask.java` → lines: **25, 28**
- `dristi-services/analytics/src/main/java/org/pucar/dristi/web/models/Outcome.java` → lines: **22, 23, 38, 39**
- `dristi-services/analytics/src/main/java/org/pucar/dristi/web/models/PendingTask.java` → lines: **62, 64**
- `dristi-services/analytics/src/main/java/org/pucar/dristi/web/models/SmsTemplateData.java` → lines: **22**
- `dristi-services/analytics/src/main/java/org/pucar/dristi/web/models/ctcApplication/CtcApplication.java` → lines: **27, 29**
- `dristi-services/analytics/src/main/java/org/pucar/dristi/web/models/taskManagement/TaskManagement.java` → lines: **30, 32**
- `dristi-services/analytics/src/main/java/org/pucar/dristi/web/models/taskManagement/TaskSearchCriteria.java` → lines: **47, 48**


## 7. dristi-services/application

### `cnrNumber`

- `dristi-services/application/application-indexer.yml` → lines: **25, 26, 113, 114**
- `dristi-services/application/application-persister.yml` → lines: **16, 23, 74, 80**
- `dristi-services/application/src/main/java/org/pucar/dristi/repository/queryBuilder/ApplicationQueryBuilder.java` → lines: **49, 55, 75**
- `dristi-services/application/src/main/java/org/pucar/dristi/repository/rowMapper/ApplicationRowMapper.java` → lines: **56**
- `dristi-services/application/src/main/java/org/pucar/dristi/web/models/Application.java` → lines: **48, 49**
- `dristi-services/application/src/main/java/org/pucar/dristi/web/models/ApplicationCriteria.java` → lines: **26, 27**
- `dristi-services/application/src/main/java/org/pucar/dristi/web/models/ApplicationExists.java` → lines: **23, 24**
- `dristi-services/application/src/main/java/org/pucar/dristi/web/models/Artifact.java` → lines: **75, 77**
- `dristi-services/application/src/main/java/org/pucar/dristi/web/models/CaseCriteria.java` → lines: **30, 31**
- `dristi-services/application/src/main/java/org/pucar/dristi/web/models/CaseExists.java` → lines: **31, 32**
- `dristi-services/application/src/main/java/org/pucar/dristi/web/models/CourtCase.java` → lines: **30, 31**
- `dristi-services/application/src/main/java/org/pucar/dristi/web/models/OrderExists.java` → lines: **29, 30**

### `cmpNumber`

- `dristi-services/application/src/main/java/org/pucar/dristi/enrichment/ApplicationEnrichment.java` → lines: **114, 115**
- `dristi-services/application/src/main/java/org/pucar/dristi/service/PaymentUpdateService.java` → lines: **176**
- `dristi-services/application/src/main/java/org/pucar/dristi/service/SmsNotificationService.java` → lines: **94, 138, 152, 153, 154**
- `dristi-services/application/src/main/java/org/pucar/dristi/util/SmsNotificationUtil.java` → lines: **79**
- `dristi-services/application/src/main/java/org/pucar/dristi/web/models/Application.java` → lines: **51, 52**
- `dristi-services/application/src/main/java/org/pucar/dristi/web/models/CourtCase.java` → lines: **33, 34**
- `dristi-services/application/src/main/java/org/pucar/dristi/web/models/SmsTemplateData.java` → lines: **28**

### `courtCaseNumber`

- `dristi-services/application/src/main/java/org/pucar/dristi/service/PaymentUpdateService.java` → lines: **175**
- `dristi-services/application/src/main/java/org/pucar/dristi/service/SmsNotificationService.java` → lines: **93, 147, 148, 149**
- `dristi-services/application/src/main/java/org/pucar/dristi/util/SmsNotificationUtil.java` → lines: **78**
- `dristi-services/application/src/main/java/org/pucar/dristi/web/models/CaseCriteria.java` → lines: **39, 40**
- `dristi-services/application/src/main/java/org/pucar/dristi/web/models/CaseExists.java` → lines: **28, 29**
- `dristi-services/application/src/main/java/org/pucar/dristi/web/models/CourtCase.java` → lines: **36, 37**
- `dristi-services/application/src/main/java/org/pucar/dristi/web/models/SmsTemplateData.java` → lines: **18**

### `filingNumber`

- `dristi-services/application/application-indexer.yml` → lines: **23, 24, 111, 112**
- `dristi-services/application/application-persister.yml` → lines: **12, 16, 22, 71, 74, 79**
- `dristi-services/application/src/main/java/org/pucar/dristi/enrichment/ApplicationEnrichment.java` → lines: **99, 100, 105, 106, 128**
- `dristi-services/application/src/main/java/org/pucar/dristi/repository/ApplicationRepository.java` → lines: **95, 97, 99, 212, 214, 225, 233**
- `dristi-services/application/src/main/java/org/pucar/dristi/repository/queryBuilder/ApplicationQueryBuilder.java` → lines: **49, 54, 73**
- `dristi-services/application/src/main/java/org/pucar/dristi/repository/rowMapper/ApplicationRowMapper.java` → lines: **58**
- `dristi-services/application/src/main/java/org/pucar/dristi/service/ApplicationService.java` → lines: **371, 393**
- `dristi-services/application/src/main/java/org/pucar/dristi/service/PaymentUpdateService.java` → lines: **190**
- `dristi-services/application/src/main/java/org/pucar/dristi/service/SmsNotificationService.java` → lines: **134, 157, 158, 159**
- `dristi-services/application/src/main/java/org/pucar/dristi/util/DemandUtil.java` → lines: **40, 41, 51, 63, 87, 94, 96**
- `dristi-services/application/src/main/java/org/pucar/dristi/util/SmsNotificationUtil.java` → lines: **121**
- `dristi-services/application/src/main/java/org/pucar/dristi/web/models/Application.java` → lines: **45, 46**
- `dristi-services/application/src/main/java/org/pucar/dristi/web/models/ApplicationCriteria.java` → lines: **29, 30**
- `dristi-services/application/src/main/java/org/pucar/dristi/web/models/ApplicationExists.java` → lines: **20, 21**
- `dristi-services/application/src/main/java/org/pucar/dristi/web/models/Artifact.java` → lines: **49, 52**
- `dristi-services/application/src/main/java/org/pucar/dristi/web/models/CaseCriteria.java` → lines: **33, 34**
- `dristi-services/application/src/main/java/org/pucar/dristi/web/models/CaseExists.java` → lines: **34, 35**
- `dristi-services/application/src/main/java/org/pucar/dristi/web/models/CourtCase.java` → lines: **27, 28**
- `dristi-services/application/src/main/java/org/pucar/dristi/web/models/DemandCreateRequest.java` → lines: **28, 29**
- `dristi-services/application/src/main/java/org/pucar/dristi/web/models/OrderExists.java` → lines: **26, 27**


## 8. dristi-services/bail-bond

### `cnrNumber`

- `dristi-services/bail-bond/src/main/java/digit/repository/querybuilder/BailQueryBuilder.java` → lines: **25, 69**
- `dristi-services/bail-bond/src/main/java/digit/repository/rowmapper/BailRowMapper.java` → lines: **59**
- `dristi-services/bail-bond/src/main/java/digit/util/CaseUtil.java` → lines: **74**
- `dristi-services/bail-bond/src/main/java/digit/web/models/Bail.java` → lines: **132, 133**
- `dristi-services/bail-bond/src/main/java/digit/web/models/BailSearchCriteria.java` → lines: **45, 46**
- `dristi-services/bail-bond/src/main/java/digit/web/models/CaseCriteria.java` → lines: **26, 27**
- `dristi-services/bail-bond/src/main/java/digit/web/models/CourtCase.java` → lines: **44, 45**

### `cmpNumber`

- `dristi-services/bail-bond/src/main/java/digit/service/BailService.java` → lines: **252, 259**
- `dristi-services/bail-bond/src/main/java/digit/service/NotificationService.java` → lines: **227, 228, 229, 239**
- `dristi-services/bail-bond/src/main/java/digit/util/CaseUtil.java` → lines: **83**
- `dristi-services/bail-bond/src/main/java/digit/web/models/CourtCase.java` → lines: **47, 48**
- `dristi-services/bail-bond/src/main/java/digit/web/models/SmsTemplateData.java` → lines: **20**

### `courtCaseNumber`

- `dristi-services/bail-bond/src/main/java/digit/service/BailService.java` → lines: **253, 257**
- `dristi-services/bail-bond/src/main/java/digit/service/NotificationService.java` → lines: **216, 222, 223, 224, 238**
- `dristi-services/bail-bond/src/main/java/digit/util/CaseUtil.java` → lines: **81**
- `dristi-services/bail-bond/src/main/java/digit/web/models/CaseCriteria.java` → lines: **35, 36**
- `dristi-services/bail-bond/src/main/java/digit/web/models/CourtCase.java` → lines: **35, 36**
- `dristi-services/bail-bond/src/main/java/digit/web/models/SmsTemplateData.java` → lines: **18**

### `filingNumber`

- `dristi-services/bail-bond/src/main/java/digit/config/ServiceConstants.java` → lines: **137**
- `dristi-services/bail-bond/src/main/java/digit/enrichment/BailRegistrationEnrichment.java` → lines: **70**
- `dristi-services/bail-bond/src/main/java/digit/repository/querybuilder/BailQueryBuilder.java` → lines: **26, 70**
- `dristi-services/bail-bond/src/main/java/digit/repository/rowmapper/BailRowMapper.java` → lines: **60**
- `dristi-services/bail-bond/src/main/java/digit/service/BailService.java` → lines: **127, 243, 256**
- `dristi-services/bail-bond/src/main/java/digit/util/IndexerUtils.java` → lines: **80, 113, 119**
- `dristi-services/bail-bond/src/main/java/digit/web/models/Bail.java` → lines: **135, 136**
- `dristi-services/bail-bond/src/main/java/digit/web/models/BailSearchCriteria.java` → lines: **42, 43**
- `dristi-services/bail-bond/src/main/java/digit/web/models/CaseCriteria.java` → lines: **29, 30**
- `dristi-services/bail-bond/src/main/java/digit/web/models/CourtCase.java` → lines: **32, 33**
- `dristi-services/bail-bond/src/main/java/digit/web/models/SmsTemplateData.java` → lines: **22**


## 9. dristi-services/case

### `cnrNumber`

- `dristi-services/case/case-persister.yml` → lines: **15, 27, 241, 251**
- `dristi-services/case/src/main/java/org/pucar/dristi/annotation/OneOf.java` → lines: **12**
- `dristi-services/case/src/main/java/org/pucar/dristi/enrichment/CaseRegistrationEnrichment.java` → lines: **489, 490**
- `dristi-services/case/src/main/java/org/pucar/dristi/repository/querybuilder/CaseQueryBuilder.java` → lines: **23, 360, 384, 956**
- `dristi-services/case/src/main/java/org/pucar/dristi/repository/querybuilder/CaseSummaryQueryBuilder.java` → lines: **19, 27, 183**
- `dristi-services/case/src/main/java/org/pucar/dristi/repository/querybuilder/OpenApiCaseSummaryQueryBuilder.java` → lines: **20, 26, 102, 184, 193**
- `dristi-services/case/src/main/java/org/pucar/dristi/repository/rowmapper/CaseRowMapper.java` → lines: **62**
- `dristi-services/case/src/main/java/org/pucar/dristi/repository/rowmapper/CaseSearchTextRowMapper.java` → lines: **19**
- `dristi-services/case/src/main/java/org/pucar/dristi/repository/rowmapper/OpenApiCaseSummaryRowMapper.java` → lines: **46**
- `dristi-services/case/src/main/java/org/pucar/dristi/repository/rowmapper/WitnessRowMapper.java` → lines: **51**
- `dristi-services/case/src/main/java/org/pucar/dristi/repository/rowmapper/v2/CaseListSummaryRowMapper.java` → lines: **66**
- `dristi-services/case/src/main/java/org/pucar/dristi/repository/rowmapper/v2/CaseSummarySearchRowMapper.java` → lines: **50**
- `dristi-services/case/src/main/java/org/pucar/dristi/service/CaseService.java` → lines: **408, 1188, 4183, 4222, 6496**
- `dristi-services/case/src/main/java/org/pucar/dristi/util/CaseUtil.java` → lines: **30, 34, 36**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/OpenApiCaseSummary.java` → lines: **23, 27**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/controllers/CaseApiController.java` → lines: **218**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/Artifact.java` → lines: **75, 77**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/CaseCriteria.java` → lines: **31, 32**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/CaseExists.java` → lines: **28, 29**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/CaseSearchCriteria.java` → lines: **18, 32, 33**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/CaseSearchTextItem.java` → lines: **24, 25**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/CourtCase.java` → lines: **74, 76**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/Hearing.java` → lines: **59, 61, 139, 140**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/HearingCriteria.java` → lines: **22, 23**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/OpenApiCaseSummaryRequest.java` → lines: **22, 23**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/OrderCriteria.java` → lines: **21, 22**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/PendingTask.java` → lines: **58, 60**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/SmsTemplateData.java` → lines: **24**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/Witness.java` → lines: **40, 41**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/order/Order.java` → lines: **37, 38**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/task/Task.java` → lines: **53, 54**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/v2/CaseConversionDetails.java` → lines: **24, 25**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/v2/CaseSummaryList.java` → lines: **64, 65**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/v2/CaseSummaryListCriteria.java` → lines: **30, 31**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/v2/CaseSummarySearch.java` → lines: **56, 57**
- `dristi-services/case/witness-indexer.yml` → lines: **23, 24, 62, 63**
- `dristi-services/case/witness-persister.yml` → lines: **20, 48**

### `cmpNumber`

- `dristi-services/case/case-persister.yml` → lines: **15, 24, 241, 252**
- `dristi-services/case/src/main/java/org/pucar/dristi/enrichment/CaseRegistrationEnrichment.java` → lines: **502, 503**
- `dristi-services/case/src/main/java/org/pucar/dristi/repository/querybuilder/AdvocateOfficeCaseMemberQueryBuilder.java` → lines: **41**
- `dristi-services/case/src/main/java/org/pucar/dristi/repository/querybuilder/CaseQueryBuilder.java` → lines: **956**
- `dristi-services/case/src/main/java/org/pucar/dristi/repository/querybuilder/CaseSummaryQueryBuilder.java` → lines: **19**
- `dristi-services/case/src/main/java/org/pucar/dristi/repository/querybuilder/OpenApiCaseSummaryQueryBuilder.java` → lines: **20, 184, 193**
- `dristi-services/case/src/main/java/org/pucar/dristi/repository/rowmapper/CaseMemberInfoRowMapper.java` → lines: **19**
- `dristi-services/case/src/main/java/org/pucar/dristi/repository/rowmapper/CaseRowMapper.java` → lines: **70**
- `dristi-services/case/src/main/java/org/pucar/dristi/repository/rowmapper/CaseSearchTextRowMapper.java` → lines: **16**
- `dristi-services/case/src/main/java/org/pucar/dristi/repository/rowmapper/v2/CaseListSummaryRowMapper.java` → lines: **67**
- `dristi-services/case/src/main/java/org/pucar/dristi/repository/rowmapper/v2/CaseSummarySearchRowMapper.java` → lines: **57**
- `dristi-services/case/src/main/java/org/pucar/dristi/service/CaseService.java` → lines: **780, 1189, 1540, 1663, 4185, 4224, 4619, 4662, 4711**
- `dristi-services/case/src/main/java/org/pucar/dristi/service/NotificationService.java` → lines: **148, 149, 150**
- `dristi-services/case/src/main/java/org/pucar/dristi/service/SmsNotificationService.java` → lines: **117, 162, 163, 176, 177, 178**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/CaseSearchTextItem.java` → lines: **15, 16**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/CourtCase.java` → lines: **78, 79**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/Hearing.java` → lines: **52, 53**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/SmsTemplateData.java` → lines: **28**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/advocateofficemember/CaseMemberInfo.java` → lines: **23, 24**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/v2/CaseSummaryList.java` → lines: **52, 53**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/v2/CaseSummarySearch.java` → lines: **59, 60**

### `courtCaseNumber`

- `dristi-services/case/case-persister.yml` → lines: **15, 28, 241, 253**
- `dristi-services/case/src/main/java/org/pucar/dristi/enrichment/CaseRegistrationEnrichment.java` → lines: **429, 430, 431, 466, 467, 473**
- `dristi-services/case/src/main/java/org/pucar/dristi/repository/querybuilder/AdvocateOfficeCaseMemberQueryBuilder.java` → lines: **42**
- `dristi-services/case/src/main/java/org/pucar/dristi/repository/querybuilder/CaseQueryBuilder.java` → lines: **23, 25, 956**
- `dristi-services/case/src/main/java/org/pucar/dristi/repository/querybuilder/OpenApiCaseSummaryQueryBuilder.java` → lines: **20, 184, 193**
- `dristi-services/case/src/main/java/org/pucar/dristi/repository/rowmapper/CaseMemberInfoRowMapper.java` → lines: **22**
- `dristi-services/case/src/main/java/org/pucar/dristi/repository/rowmapper/CaseRowMapper.java` → lines: **63, 85**
- `dristi-services/case/src/main/java/org/pucar/dristi/repository/rowmapper/CaseSearchTextRowMapper.java` → lines: **18**
- `dristi-services/case/src/main/java/org/pucar/dristi/repository/rowmapper/v2/CaseListSummaryRowMapper.java` → lines: **65**
- `dristi-services/case/src/main/java/org/pucar/dristi/repository/rowmapper/v2/CaseSummarySearchRowMapper.java` → lines: **51**
- `dristi-services/case/src/main/java/org/pucar/dristi/service/CaseService.java` → lines: **408, 781, 1187, 1664, 4182, 4221, 6315, 6317**
- `dristi-services/case/src/main/java/org/pucar/dristi/service/NotificationService.java` → lines: **96, 143, 144, 145**
- `dristi-services/case/src/main/java/org/pucar/dristi/service/SmsNotificationService.java` → lines: **119, 164, 171, 172, 173**
- `dristi-services/case/src/main/java/org/pucar/dristi/validators/CaseRegistrationValidator.java` → lines: **734**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/CaseCriteria.java` → lines: **40, 41**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/CaseExists.java` → lines: **25, 26**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/CaseSearchTextItem.java` → lines: **21, 22**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/CourtCase.java` → lines: **62, 64, 202, 203**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/Hearing.java` → lines: **46, 47**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/SmsTemplateData.java` → lines: **18**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/advocateofficemember/CaseMemberInfo.java` → lines: **26, 27**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/v2/CaseSummaryList.java` → lines: **61, 62**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/v2/CaseSummaryListCriteria.java` → lines: **39, 40**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/v2/CaseSummarySearch.java` → lines: **47, 48**

### `filingNumber`

- `dristi-services/case/case-indexer.yml` → lines: **27, 28, 69, 130, 131, 172**
- `dristi-services/case/case-persister.yml` → lines: **12, 15, 23, 238, 241, 248, 482, 485, 493, 627, 629, 632, 640, 647, 649, 652, 660, 668, 670, 680, 694, 710, 712, 721, 732**
- `dristi-services/case/src/main/java/org/pucar/dristi/annotation/OneOf.java` → lines: **12**
- `dristi-services/case/src/main/java/org/pucar/dristi/repository/AdvocateOfficeCaseMemberRepository.java` → lines: **56**
- `dristi-services/case/src/main/java/org/pucar/dristi/repository/CaseRepositoryV2.java` → lines: **712, 718, 832, 833, 841, 843, 850, 853, 854**
- `dristi-services/case/src/main/java/org/pucar/dristi/repository/querybuilder/AdvocateOfficeCaseMemberQueryBuilder.java` → lines: **40**
- `dristi-services/case/src/main/java/org/pucar/dristi/repository/querybuilder/CaseQueryBuilder.java` → lines: **23, 956, 992, 995**
- `dristi-services/case/src/main/java/org/pucar/dristi/repository/querybuilder/CaseSummaryQueryBuilder.java` → lines: **27**
- `dristi-services/case/src/main/java/org/pucar/dristi/repository/querybuilder/OpenApiCaseSummaryQueryBuilder.java` → lines: **26, 184**
- `dristi-services/case/src/main/java/org/pucar/dristi/repository/rowmapper/CaseMemberInfoRowMapper.java` → lines: **18**
- `dristi-services/case/src/main/java/org/pucar/dristi/repository/rowmapper/CaseRowMapper.java` → lines: **60**
- `dristi-services/case/src/main/java/org/pucar/dristi/repository/rowmapper/CaseSearchTextRowMapper.java` → lines: **17**
- `dristi-services/case/src/main/java/org/pucar/dristi/repository/rowmapper/OpenApiCaseSummaryRowMapper.java` → lines: **47**
- `dristi-services/case/src/main/java/org/pucar/dristi/repository/rowmapper/WitnessRowMapper.java` → lines: **50**
- `dristi-services/case/src/main/java/org/pucar/dristi/repository/rowmapper/v2/CaseListSummaryRowMapper.java` → lines: **71**
- `dristi-services/case/src/main/java/org/pucar/dristi/repository/rowmapper/v2/CaseSummarySearchRowMapper.java` → lines: **47**
- `dristi-services/case/src/main/java/org/pucar/dristi/service/CaseService.java` → lines: **408, 779, 1190, 1273, 1274, 1302, 1429, 1430, 1541, 1562, 1563, 1570, 1684, 1686, 1688, 1787, 1789, 1821, 2244, 2405, 2442, 3250, 3575, 3576, 4093, 4095, 4181, 4220, 4620, 4663, 4712, 4775, 4777, 5095, 5694, 5730, 5768, 5821, 5824, 5843, 5878, 5944, 6069, 6071, 6085, 6088, 6339, 6342, 6469, 6481, 6482, 6486, 6495**
- `dristi-services/case/src/main/java/org/pucar/dristi/service/NotificationService.java` → lines: **95, 135, 153, 154, 155**
- `dristi-services/case/src/main/java/org/pucar/dristi/service/PaymentUpdateService.java` → lines: **103, 104, 111, 137**
- `dristi-services/case/src/main/java/org/pucar/dristi/service/SmsNotificationService.java` → lines: **91, 115, 158**
- `dristi-services/case/src/main/java/org/pucar/dristi/validators/CaseRegistrationValidator.java` → lines: **513, 521, 523**
- `dristi-services/case/src/main/java/org/pucar/dristi/validators/EvidenceValidator.java` → lines: **28, 53, 76**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/OpenApiCaseSummary.java` → lines: **29, 33**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/AccessCodeGenerateRequest.java` → lines: **24, 26**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/AddAddressRequest.java` → lines: **32, 33**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/AdvocateCaseInfo.java` → lines: **19, 20**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/Artifact.java` → lines: **49, 52**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/CaseCodeCriteria.java` → lines: **26, 28**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/CaseCriteria.java` → lines: **34, 35**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/CaseExists.java` → lines: **31, 32**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/CaseSearchCriteria.java` → lines: **18, 29, 30**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/CaseSearchTextItem.java` → lines: **18, 19**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/CourtCase.java` → lines: **55, 57**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/DemandCreateRequest.java` → lines: **28, 29**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/EFillingCalculationCriteria.java` → lines: **31, 33**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/EvidenceSearchCriteria.java` → lines: **30, 68, 71, 72**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/Hearing.java` → lines: **55, 57, 134, 135**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/HearingCriteria.java` → lines: **25, 26**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/JoinCaseCriteria.java` → lines: **24, 25**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/JoinCaseDataV2.java` → lines: **28, 30**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/OpenHearing.java` → lines: **20, 21**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/OrderCriteria.java` → lines: **24, 25**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/PendingTask.java` → lines: **62, 64**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/SmsTemplateData.java` → lines: **22**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/Witness.java` → lines: **37, 38**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/advocateofficemember/CaseMemberInfo.java` → lines: **20, 21**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/analytics/CaseOverallStatus.java` → lines: **23, 24, 48, 49**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/analytics/Outcome.java` → lines: **23, 24, 39, 40**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/order/Order.java` → lines: **34, 35**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/task/Task.java` → lines: **47, 48**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/v2/CaseConversionDetails.java` → lines: **21, 22**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/v2/CaseSearchCriteriaV2.java` → lines: **23, 24**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/v2/CaseSummaryList.java` → lines: **40, 41**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/v2/CaseSummaryListCriteria.java` → lines: **33, 34**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/v2/CaseSummarySearch.java` → lines: **41, 42**
- `dristi-services/case/src/main/java/org/pucar/dristi/web/models/v2/CaseSummarySearchCriteria.java` → lines: **25, 26**
- `dristi-services/case/witness-indexer.yml` → lines: **21, 22, 60, 61**
- `dristi-services/case/witness-persister.yml` → lines: **10, 19, 38, 47**


## 10. dristi-services/casemanagement

### `cnrNumber`

- `dristi-services/casemanagement/src/main/java/org/pucar/dristi/service/OrderSearchService.java` → lines: **75, 79, 83, 84**
- `dristi-services/casemanagement/src/main/java/org/pucar/dristi/service/ServiceUrlEntityRequestService.java` → lines: **61, 65**
- `dristi-services/casemanagement/src/main/java/org/pucar/dristi/web/controllers/CasemanagerApiController.java` → lines: **97**
- `dristi-services/casemanagement/src/main/java/org/pucar/dristi/web/models/Application.java` → lines: **49, 51**
- `dristi-services/casemanagement/src/main/java/org/pucar/dristi/web/models/CaseCriteria.java` → lines: **30, 31**
- `dristi-services/casemanagement/src/main/java/org/pucar/dristi/web/models/CaseSummary.java` → lines: **57, 61**
- `dristi-services/casemanagement/src/main/java/org/pucar/dristi/web/models/CourtCase.java` → lines: **69, 71**
- `dristi-services/casemanagement/src/main/java/org/pucar/dristi/web/models/CredentialRequest.java` → lines: **27, 29**
- `dristi-services/casemanagement/src/main/java/org/pucar/dristi/web/models/Hearing.java` → lines: **51, 53, 127, 128**
- `dristi-services/casemanagement/src/main/java/org/pucar/dristi/web/models/Order.java` → lines: **44, 45**
- `dristi-services/casemanagement/src/main/java/org/pucar/dristi/web/models/Task.java` → lines: **51, 52**
- `dristi-services/casemanagement/src/main/java/org/pucar/dristi/web/models/TaskCriteria.java` → lines: **25, 26**
- `dristi-services/casemanagement/src/main/java/org/pucar/dristi/web/models/Witness.java` → lines: **38, 39**
- `dristi-services/casemanagement/src/main/java/org/pucar/dristi/web/models/application/ApplicationCriteria.java` → lines: **20, 21**
- `dristi-services/casemanagement/src/main/java/org/pucar/dristi/web/models/order/Order.java` → lines: **45, 46**
- `dristi-services/casemanagement/src/main/java/org/pucar/dristi/web/models/order/OrderCriteria.java` → lines: **18, 19**
- `dristi-services/casemanagement/src/main/java/org/pucar/dristi/web/models/task/TaskCase.java` → lines: **61, 62**

### `cmpNumber`

- `dristi-services/casemanagement/src/main/java/org/pucar/dristi/service/CaseBundleService.java` → lines: **124, 131, 132**
- `dristi-services/casemanagement/src/main/java/org/pucar/dristi/web/models/task/TaskCase.java` → lines: **64, 65**

### `courtCaseNumber`

- `dristi-services/casemanagement/src/main/java/org/pucar/dristi/service/CaseBundleService.java` → lines: **123, 129, 130**
- `dristi-services/casemanagement/src/main/java/org/pucar/dristi/util/SummonsOrderPdfUtil.java` → lines: **104, 120, 139, 140**
- `dristi-services/casemanagement/src/main/java/org/pucar/dristi/web/models/CaseCriteria.java` → lines: **42, 43**
- `dristi-services/casemanagement/src/main/java/org/pucar/dristi/web/models/CourtCase.java` → lines: **60, 62**
- `dristi-services/casemanagement/src/main/java/org/pucar/dristi/web/models/task/TaskCase.java` → lines: **67, 68**

### `filingNumber`

- `dristi-services/casemanagement/src/main/java/org/pucar/dristi/config/ServiceConstants.java` → lines: **71, 87**
- `dristi-services/casemanagement/src/main/java/org/pucar/dristi/service/CaseBundleIndexBuilderService.java` → lines: **83, 88, 135, 140, 203, 208, 209, 233, 235, 248, 286, 287, 288**
- `dristi-services/casemanagement/src/main/java/org/pucar/dristi/service/CaseBundleService.java` → lines: **125, 133, 134**
- `dristi-services/casemanagement/src/main/java/org/pucar/dristi/service/CaseManagerService.java` → lines: **56, 59, 61, 69, 70, 71, 72, 73, 80, 117, 118, 121, 122, 125, 126, 129, 131, 138, 142, 143, 150, 151, 154, 155**
- `dristi-services/casemanagement/src/main/java/org/pucar/dristi/service/DocPreviewService.java` → lines: **98, 105, 133, 139, 140, 141**
- `dristi-services/casemanagement/src/main/java/org/pucar/dristi/util/ApplicationUtil.java` → lines: **48, 51, 69, 74**
- `dristi-services/casemanagement/src/main/java/org/pucar/dristi/util/CaseUtil.java` → lines: **38, 45**
- `dristi-services/casemanagement/src/main/java/org/pucar/dristi/util/EvidenceUtil.java` → lines: **40, 45, 76, 77, 78, 85, 89**
- `dristi-services/casemanagement/src/main/java/org/pucar/dristi/util/OrderUtil.java` → lines: **38, 44**
- `dristi-services/casemanagement/src/main/java/org/pucar/dristi/web/controllers/CasemanagerApiController.java` → lines: **97**
- `dristi-services/casemanagement/src/main/java/org/pucar/dristi/web/models/Application.java` → lines: **45, 47**
- `dristi-services/casemanagement/src/main/java/org/pucar/dristi/web/models/Artifact.java` → lines: **51, 54**
- `dristi-services/casemanagement/src/main/java/org/pucar/dristi/web/models/CaseCriteria.java` → lines: **33, 34**
- `dristi-services/casemanagement/src/main/java/org/pucar/dristi/web/models/CaseRequest.java` → lines: **31, 33**
- `dristi-services/casemanagement/src/main/java/org/pucar/dristi/web/models/CaseSummary.java` → lines: **46, 50**
- `dristi-services/casemanagement/src/main/java/org/pucar/dristi/web/models/CourtCase.java` → lines: **56, 58**
- `dristi-services/casemanagement/src/main/java/org/pucar/dristi/web/models/EnrichCaseBundlePdfIndexRequest.java` → lines: **25, 28**
- `dristi-services/casemanagement/src/main/java/org/pucar/dristi/web/models/Hearing.java` → lines: **47, 49, 122, 123**
- `dristi-services/casemanagement/src/main/java/org/pucar/dristi/web/models/Order.java` → lines: **41, 42**
- `dristi-services/casemanagement/src/main/java/org/pucar/dristi/web/models/Task.java` → lines: **45, 46**
- `dristi-services/casemanagement/src/main/java/org/pucar/dristi/web/models/TaskCriteria.java` → lines: **49, 50**
- `dristi-services/casemanagement/src/main/java/org/pucar/dristi/web/models/Witness.java` → lines: **35, 36**
- `dristi-services/casemanagement/src/main/java/org/pucar/dristi/web/models/application/ApplicationCriteria.java` → lines: **23, 24**
- `dristi-services/casemanagement/src/main/java/org/pucar/dristi/web/models/docpreview/DocPreviewRequest.java` → lines: **28, 31**
- `dristi-services/casemanagement/src/main/java/org/pucar/dristi/web/models/evidence/EvidenceSearchCriteria.java` → lines: **33, 92, 95, 96**
- `dristi-services/casemanagement/src/main/java/org/pucar/dristi/web/models/order/Order.java` → lines: **42, 43**
- `dristi-services/casemanagement/src/main/java/org/pucar/dristi/web/models/order/OrderCriteria.java` → lines: **21, 22**
- `dristi-services/casemanagement/src/main/java/org/pucar/dristi/web/models/task/TaskCase.java` → lines: **55, 56**
- `dristi-services/casemanagement/src/main/java/org/pucar/dristi/web/models/taskManagement/TaskManagement.java` → lines: **32, 34**
- `dristi-services/casemanagement/src/main/java/org/pucar/dristi/web/models/taskManagement/TaskSearchCriteria.java` → lines: **47, 48**


## 11. dristi-services/ctc

### `cnrNumber`

- `dristi-services/ctc/src/main/java/org/pucar/dristi/repository/rowmapper/CtcApplicationRowMapper.java` → lines: **51**
- `dristi-services/ctc/src/main/java/org/pucar/dristi/web/models/CtcApplication.java` → lines: **45, 47**
- `dristi-services/ctc/src/main/java/org/pucar/dristi/web/models/Order.java` → lines: **46, 47**
- `dristi-services/ctc/src/main/java/org/pucar/dristi/web/models/courtcase/CaseCriteria.java` → lines: **30, 31**
- `dristi-services/ctc/src/main/java/org/pucar/dristi/web/models/courtcase/CaseExists.java` → lines: **24, 25**
- `dristi-services/ctc/src/main/java/org/pucar/dristi/web/models/courtcase/CaseSummaryList.java` → lines: **62, 63**
- `dristi-services/ctc/src/main/java/org/pucar/dristi/web/models/courtcase/CaseSummaryListCriteria.java` → lines: **30, 31**
- `dristi-services/ctc/src/main/java/org/pucar/dristi/web/models/courtcase/CourtCase.java` → lines: **75, 77**

### `cmpNumber`

- `dristi-services/ctc/src/main/java/org/pucar/dristi/enrichment/CtcApplicationEnrichment.java` → lines: **70, 72**
- `dristi-services/ctc/src/main/java/org/pucar/dristi/web/models/SmsTemplateData.java` → lines: **24**
- `dristi-services/ctc/src/main/java/org/pucar/dristi/web/models/courtcase/CaseSummaryList.java` → lines: **50, 51**
- `dristi-services/ctc/src/main/java/org/pucar/dristi/web/models/courtcase/CourtCase.java` → lines: **79, 80**

### `courtCaseNumber`

- `dristi-services/ctc/src/main/java/org/pucar/dristi/web/models/SmsTemplateData.java` → lines: **18**
- `dristi-services/ctc/src/main/java/org/pucar/dristi/web/models/courtcase/CaseCriteria.java` → lines: **42, 43**
- `dristi-services/ctc/src/main/java/org/pucar/dristi/web/models/courtcase/CaseExists.java` → lines: **21, 22**
- `dristi-services/ctc/src/main/java/org/pucar/dristi/web/models/courtcase/CaseSummaryList.java` → lines: **59, 60**
- `dristi-services/ctc/src/main/java/org/pucar/dristi/web/models/courtcase/CaseSummaryListCriteria.java` → lines: **39, 40**
- `dristi-services/ctc/src/main/java/org/pucar/dristi/web/models/courtcase/CourtCase.java` → lines: **63, 65, 203, 204**

### `filingNumber`

- `dristi-services/ctc/ctc-indexer.yml` → lines: **27, 28, 93, 94**
- `dristi-services/ctc/ctc-persister.yml` → lines: **24, 63**
- `dristi-services/ctc/src/main/java/org/pucar/dristi/config/ServiceConstants.java` → lines: **53, 76**
- `dristi-services/ctc/src/main/java/org/pucar/dristi/repository/rowmapper/CtcApplicationRowMapper.java` → lines: **50**
- `dristi-services/ctc/src/main/java/org/pucar/dristi/service/CtcApplicationService.java` → lines: **358, 372, 538, 549, 704, 709, 734, 752**
- `dristi-services/ctc/src/main/java/org/pucar/dristi/service/PaymentUpdateService.java` → lines: **151**
- `dristi-services/ctc/src/main/java/org/pucar/dristi/util/CaseUtil.java` → lines: **89, 95**
- `dristi-services/ctc/src/main/java/org/pucar/dristi/util/EgovPdfUtil.java` → lines: **37, 44**
- `dristi-services/ctc/src/main/java/org/pucar/dristi/util/EtreasuryUtil.java` → lines: **47**
- `dristi-services/ctc/src/main/java/org/pucar/dristi/util/IndexerUtils.java` → lines: **306**
- `dristi-services/ctc/src/main/java/org/pucar/dristi/web/models/CtcApplication.java` → lines: **41, 43**
- `dristi-services/ctc/src/main/java/org/pucar/dristi/web/models/CtcApplicationSearchCriteria.java` → lines: **26, 28**
- `dristi-services/ctc/src/main/java/org/pucar/dristi/web/models/CtcApplicationTracker.java` → lines: **26, 27**
- `dristi-services/ctc/src/main/java/org/pucar/dristi/web/models/DemandCreateRequest.java` → lines: **25, 26**
- `dristi-services/ctc/src/main/java/org/pucar/dristi/web/models/DocToSign.java` → lines: **23, 24**
- `dristi-services/ctc/src/main/java/org/pucar/dristi/web/models/DocsToSignCriteria.java` → lines: **29, 30**
- `dristi-services/ctc/src/main/java/org/pucar/dristi/web/models/DocumentActionItem.java` → lines: **26, 28**
- `dristi-services/ctc/src/main/java/org/pucar/dristi/web/models/IssueCtcDocument.java` → lines: **42, 43**
- `dristi-services/ctc/src/main/java/org/pucar/dristi/web/models/Order.java` → lines: **40, 41**
- `dristi-services/ctc/src/main/java/org/pucar/dristi/web/models/ReviewItem.java` → lines: **20, 22**
- `dristi-services/ctc/src/main/java/org/pucar/dristi/web/models/SignedDoc.java` → lines: **34, 35**
- `dristi-services/ctc/src/main/java/org/pucar/dristi/web/models/SmsTemplateData.java` → lines: **26**
- `dristi-services/ctc/src/main/java/org/pucar/dristi/web/models/ValidateUserInfo.java` → lines: **25, 26**
- `dristi-services/ctc/src/main/java/org/pucar/dristi/web/models/ValidateUserRequest.java` → lines: **21, 23**
- `dristi-services/ctc/src/main/java/org/pucar/dristi/web/models/courtcase/CaseCriteria.java` → lines: **33, 34**
- `dristi-services/ctc/src/main/java/org/pucar/dristi/web/models/courtcase/CaseExists.java` → lines: **27, 28**
- `dristi-services/ctc/src/main/java/org/pucar/dristi/web/models/courtcase/CaseSummaryList.java` → lines: **38, 39**
- `dristi-services/ctc/src/main/java/org/pucar/dristi/web/models/courtcase/CaseSummaryListCriteria.java` → lines: **33, 34**
- `dristi-services/ctc/src/main/java/org/pucar/dristi/web/models/courtcase/CourtCase.java` → lines: **56, 58**


## 12. dristi-services/digitalized-documents

### `cnrNumber`

- `dristi-services/digitalized-documents/src/main/java/digit/web/models/CaseCriteria.java` → lines: **26, 27**

### `cmpNumber`

- `dristi-services/digitalized-documents/src/main/java/digit/service/ExaminationOfAccusedDocumentService.java` → lines: **158, 163, 197, 203**
- `dristi-services/digitalized-documents/src/main/java/digit/service/MediationDocumentService.java` → lines: **360, 365**
- `dristi-services/digitalized-documents/src/main/java/digit/service/NotificationService.java` → lines: **129, 140, 141, 142, 152**
- `dristi-services/digitalized-documents/src/main/java/digit/service/PleaDocumentService.java` → lines: **155, 160, 194, 199**
- `dristi-services/digitalized-documents/src/main/java/digit/web/models/sms/SmsTemplateData.java` → lines: **20**

### `courtCaseNumber`

- `dristi-services/digitalized-documents/src/main/java/digit/service/ExaminationOfAccusedDocumentService.java` → lines: **159, 164, 198, 202**
- `dristi-services/digitalized-documents/src/main/java/digit/service/MediationDocumentService.java` → lines: **361, 366**
- `dristi-services/digitalized-documents/src/main/java/digit/service/NotificationService.java` → lines: **135, 136, 137, 151**
- `dristi-services/digitalized-documents/src/main/java/digit/service/PleaDocumentService.java` → lines: **156, 161, 195, 200**
- `dristi-services/digitalized-documents/src/main/java/digit/web/models/CaseCriteria.java` → lines: **35, 36**
- `dristi-services/digitalized-documents/src/main/java/digit/web/models/sms/SmsTemplateData.java` → lines: **18**

### `filingNumber`

- `dristi-services/digitalized-documents/src/main/java/digit/service/ExaminationOfAccusedDocumentService.java` → lines: **187**
- `dristi-services/digitalized-documents/src/main/java/digit/service/PleaDocumentService.java` → lines: **184**
- `dristi-services/digitalized-documents/src/main/java/digit/util/CaseUtil.java` → lines: **56, 58**
- `dristi-services/digitalized-documents/src/main/java/digit/web/models/CaseCriteria.java` → lines: **29, 30**
- `dristi-services/digitalized-documents/src/main/java/digit/web/models/sms/SmsTemplateData.java` → lines: **22**


## 13. dristi-services/epost-tracker

### `cnrNumber`

- `dristi-services/epost-tracker/src/main/java/org/pucar/dristi/model/Task.java` → lines: **55, 56**

### `filingNumber`

- `dristi-services/epost-tracker/src/main/java/org/pucar/dristi/model/Task.java` → lines: **39, 41**


## 14. dristi-services/evidence

### `cnrNumber`

- `dristi-services/evidence/src/main/java/org/pucar/dristi/config/ServiceConstants.java` → lines: **207**
- `dristi-services/evidence/src/main/java/org/pucar/dristi/service/EvidenceService.java` → lines: **1367**
- `dristi-services/evidence/src/main/java/org/pucar/dristi/util/EsUtil.java` → lines: **63, 123**
- `dristi-services/evidence/src/main/java/org/pucar/dristi/web/models/ApplicationExists.java` → lines: **23, 24**
- `dristi-services/evidence/src/main/java/org/pucar/dristi/web/models/Artifact.java` → lines: **82, 84**
- `dristi-services/evidence/src/main/java/org/pucar/dristi/web/models/CaseCriteria.java` → lines: **34, 35**
- `dristi-services/evidence/src/main/java/org/pucar/dristi/web/models/CaseExists.java` → lines: **31, 32**
- `dristi-services/evidence/src/main/java/org/pucar/dristi/web/models/CourtCase.java` → lines: **59, 60**
- `dristi-services/evidence/src/main/java/org/pucar/dristi/web/models/Hearing.java` → lines: **51, 53, 131, 132**
- `dristi-services/evidence/src/main/java/org/pucar/dristi/web/models/HearingCriteria.java` → lines: **19, 20**
- `dristi-services/evidence/src/main/java/org/pucar/dristi/web/models/HearingExists.java` → lines: **31, 33**
- `dristi-services/evidence/src/main/java/org/pucar/dristi/web/models/OpenArtifact.java` → lines: **85, 87**
- `dristi-services/evidence/src/main/java/org/pucar/dristi/web/models/OrderExists.java` → lines: **29, 30**

### `cmpNumber`

- `dristi-services/evidence/src/main/java/org/pucar/dristi/service/EvidenceService.java` → lines: **712, 912, 919, 953, 958, 1231, 1238, 1250, 1253, 1254**
- `dristi-services/evidence/src/main/java/org/pucar/dristi/service/SmsNotificationService.java` → lines: **93, 136, 150, 151, 152**
- `dristi-services/evidence/src/main/java/org/pucar/dristi/web/models/CourtCase.java` → lines: **62, 63**
- `dristi-services/evidence/src/main/java/org/pucar/dristi/web/models/Hearing.java` → lines: **44, 45**
- `dristi-services/evidence/src/main/java/org/pucar/dristi/web/models/SmsTemplateData.java` → lines: **22**

### `courtCaseNumber`

- `dristi-services/evidence/src/main/java/org/pucar/dristi/service/EvidenceService.java` → lines: **711, 913, 917, 954, 958, 1232, 1238, 1250, 1251, 1252**
- `dristi-services/evidence/src/main/java/org/pucar/dristi/service/SmsNotificationService.java` → lines: **92, 145, 146, 147**
- `dristi-services/evidence/src/main/java/org/pucar/dristi/web/models/CaseCriteria.java` → lines: **43, 44**
- `dristi-services/evidence/src/main/java/org/pucar/dristi/web/models/CaseExists.java` → lines: **28, 29**
- `dristi-services/evidence/src/main/java/org/pucar/dristi/web/models/CourtCase.java` → lines: **50, 51**
- `dristi-services/evidence/src/main/java/org/pucar/dristi/web/models/Hearing.java` → lines: **38, 39**
- `dristi-services/evidence/src/main/java/org/pucar/dristi/web/models/SmsTemplateData.java` → lines: **18**

### `filingNumber`

- `dristi-services/evidence/evidence-indexer.yml` → lines: **15, 31, 32, 91, 107, 108**
- `dristi-services/evidence/evidence-persister.yml` → lines: **10, 20, 61, 70**
- `dristi-services/evidence/evidencewithoutworkflow-indexer.yml` → lines: **15, 31, 32, 80, 96, 97**
- `dristi-services/evidence/evidencewithoutworkflow-persister.yml` → lines: **10, 20, 61, 70**
- `dristi-services/evidence/src/main/java/org/pucar/dristi/config/ServiceConstants.java` → lines: **98, 197**
- `dristi-services/evidence/src/main/java/org/pucar/dristi/enrichment/EvidenceEnrichment.java` → lines: **104, 177, 178**
- `dristi-services/evidence/src/main/java/org/pucar/dristi/repository/querybuilder/EvidenceQueryBuilder.java` → lines: **20, 45, 73, 92, 155, 165, 166, 172, 182, 183, 283, 285**
- `dristi-services/evidence/src/main/java/org/pucar/dristi/repository/rowmapper/EvidenceRowMapper.java` → lines: **56**
- `dristi-services/evidence/src/main/java/org/pucar/dristi/service/EvidenceService.java` → lines: **159, 170, 173, 193, 272, 278, 284, 286, 291, 297, 299, 306, 313, 323, 326, 331, 605, 607, 613, 714, 790, 903, 916, 943, 963, 1181, 1187, 1198, 1201, 1222, 1238, 1245, 1250, 1256, 1298, 1302, 1327, 1357**
- `dristi-services/evidence/src/main/java/org/pucar/dristi/service/EvidenceStatusUpdateService.java` → lines: **51, 54**
- `dristi-services/evidence/src/main/java/org/pucar/dristi/service/SmsNotificationService.java` → lines: **97, 132, 138, 155, 156, 157**
- `dristi-services/evidence/src/main/java/org/pucar/dristi/util/CaseUtil.java` → lines: **113, 119**
- `dristi-services/evidence/src/main/java/org/pucar/dristi/util/EsUtil.java` → lines: **52, 113**
- `dristi-services/evidence/src/main/java/org/pucar/dristi/web/models/ApplicationExists.java` → lines: **20, 21**
- `dristi-services/evidence/src/main/java/org/pucar/dristi/web/models/Artifact.java` → lines: **50, 53**
- `dristi-services/evidence/src/main/java/org/pucar/dristi/web/models/CaseCriteria.java` → lines: **37, 38**
- `dristi-services/evidence/src/main/java/org/pucar/dristi/web/models/CaseExists.java` → lines: **34, 35**
- `dristi-services/evidence/src/main/java/org/pucar/dristi/web/models/CourtCase.java` → lines: **44, 45**
- `dristi-services/evidence/src/main/java/org/pucar/dristi/web/models/EmailTemplateData.java` → lines: **14**
- `dristi-services/evidence/src/main/java/org/pucar/dristi/web/models/EvidenceSearchCriteria.java` → lines: **34, 84, 87, 88**
- `dristi-services/evidence/src/main/java/org/pucar/dristi/web/models/Hearing.java` → lines: **47, 49, 126, 127**
- `dristi-services/evidence/src/main/java/org/pucar/dristi/web/models/HearingCriteria.java` → lines: **22, 23**
- `dristi-services/evidence/src/main/java/org/pucar/dristi/web/models/HearingExists.java` → lines: **27, 29**
- `dristi-services/evidence/src/main/java/org/pucar/dristi/web/models/OpenArtifact.java` → lines: **44, 47**
- `dristi-services/evidence/src/main/java/org/pucar/dristi/web/models/OrderExists.java` → lines: **26, 27**
- `dristi-services/evidence/src/main/java/org/pucar/dristi/web/models/SmsTemplateData.java` → lines: **24**


## 15. dristi-services/hearing

### `cnrNumber`

- `dristi-services/hearing/hearing-persister.yml` → lines: **14, 23**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/kafka/consumer/HearingUpdateConsumer.java` → lines: **97, 100, 128**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/repository/querybuilder/HearingQueryBuilder.java` → lines: **39, 52**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/repository/rowmapper/HearingRowMapper.java` → lines: **75**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/service/HearingService.java` → lines: **336, 930, 952**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/util/OrderUtil.java` → lines: **302, 315, 329, 330, 331, 334, 337, 340, 386, 391, 392, 393**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/util/PendingTaskUtil.java` → lines: **131, 140**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/validator/HearingRegistrationValidator.java` → lines: **77, 124, 168, 170**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/web/models/ApplicationExists.java` → lines: **23, 24**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/web/models/CaseCriteria.java` → lines: **30, 31**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/web/models/CaseExists.java` → lines: **24, 25**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/web/models/Hearing.java` → lines: **58, 60, 140, 141**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/web/models/HearingCriteria.java` → lines: **22, 23**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/web/models/HearingExists.java` → lines: **31, 33**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/web/models/cases/CourtCase.java` → lines: **61, 62**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/web/models/orders/Order.java` → lines: **44, 45**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/web/models/orders/OrderCriteria.java` → lines: **20, 21**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/web/models/pendingtask/PendingTask.java` → lines: **53, 55**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/web/models/tasks/Task.java` → lines: **42, 43**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/web/models/tasks/TaskCriteria.java` → lines: **18, 19**

### `cmpNumber`

- `dristi-services/hearing/src/main/java/org/pucar/dristi/repository/rowmapper/HearingRowMapper.java` → lines: **73**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/scheduling/CronJobScheduler.java` → lines: **174, 185, 215, 220**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/service/HearingService.java` → lines: **470, 825, 828, 829**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/service/SmsNotificationService.java` → lines: **96, 138, 153, 154, 155**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/web/models/Hearing.java` → lines: **51, 52**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/web/models/SmsTemplateData.java` → lines: **22**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/web/models/cases/CourtCase.java` → lines: **64, 65**

### `courtCaseNumber`

- `dristi-services/hearing/src/main/java/org/pucar/dristi/repository/rowmapper/HearingRowMapper.java` → lines: **71**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/scheduling/CronJobScheduler.java` → lines: **175, 186, 216, 221**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/service/HearingService.java` → lines: **469, 824, 826, 827**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/service/SmsNotificationService.java` → lines: **95, 136, 148, 149, 150**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/service/WitnessDepositionPdfService.java` → lines: **93, 111, 113, 131, 138, 151, 174**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/web/models/CaseCriteria.java` → lines: **39, 40**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/web/models/CaseExists.java` → lines: **21, 22**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/web/models/Hearing.java` → lines: **45, 46**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/web/models/SmsTemplateData.java` → lines: **18**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/web/models/cases/CourtCase.java` → lines: **52, 53, 180, 181**

### `filingNumber`

- `dristi-services/hearing/hearing-persister.yml` → lines: **14, 20**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/config/ServiceConstants.java` → lines: **103**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/kafka/consumer/HearingUpdateConsumer.java` → lines: **94, 100, 114, 118, 128, 147, 148, 153, 158, 167, 169, 183, 192, 199, 210, 224, 226**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/repository/HearingRepository.java` → lines: **127**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/repository/querybuilder/HearingQueryBuilder.java` → lines: **43, 56**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/repository/rowmapper/HearingRowMapper.java` → lines: **76**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/scheduling/CronJobScheduler.java` → lines: **176, 177, 193, 248, 251, 253, 335, 337, 343, 349, 351**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/service/HearingService.java` → lines: **337, 489, 815, 817, 820, 831, 839, 841, 851, 854, 867, 877, 930, 932, 951**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/service/WitnessDepositionPdfService.java` → lines: **67, 91, 92, 93, 127, 136, 172**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/util/EsUtil.java` → lines: **41, 68**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/util/OrderUtil.java` → lines: **125, 253, 287, 291, 299, 300, 302, 315, 324, 329, 330, 331, 334, 337, 340, 345, 353, 364, 372, 377, 386, 391, 392, 393, 399, 444**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/util/PendingTaskUtil.java` → lines: **130, 138**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/validator/HearingRegistrationValidator.java` → lines: **77, 124, 163, 165**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/web/models/ApplicationExists.java` → lines: **20, 21**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/web/models/CaseCriteria.java` → lines: **33, 34**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/web/models/CaseExists.java` → lines: **27, 28**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/web/models/Hearing.java` → lines: **54, 56, 135, 136**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/web/models/HearingCriteria.java` → lines: **25, 26**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/web/models/HearingExists.java` → lines: **27, 29**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/web/models/OpenHearing.java` → lines: **21, 22**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/web/models/ScheduleHearing.java` → lines: **35, 36**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/web/models/WitnessDeposition.java` → lines: **27, 28**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/web/models/cases/CourtCase.java` → lines: **46, 47**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/web/models/cases/Outcome.java` → lines: **22, 23, 35, 36**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/web/models/orders/Order.java` → lines: **41, 42**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/web/models/orders/OrderCriteria.java` → lines: **23, 24**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/web/models/pendingtask/PendingTask.java` → lines: **57, 59**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/web/models/taskManagement/TaskManagement.java` → lines: **31, 33**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/web/models/taskManagement/TaskSearchCriteria.java` → lines: **47, 48**
- `dristi-services/hearing/src/main/java/org/pucar/dristi/web/models/tasks/Task.java` → lines: **35, 37**


## 16. dristi-services/hearing-management

### `cnrNumber`

- `dristi-services/hearing-management/src/main/java/digit/web/models/Hearing.java` → lines: **59, 61, 139, 140**
- `dristi-services/hearing-management/src/main/java/digit/web/models/HearingCriteria.java` → lines: **22, 23**

### `cmpNumber`

- `dristi-services/hearing-management/src/main/java/digit/web/models/Hearing.java` → lines: **52, 53**

### `courtCaseNumber`

- `dristi-services/hearing-management/src/main/java/digit/web/models/Hearing.java` → lines: **46, 47**

### `filingNumber`

- `dristi-services/hearing-management/src/main/java/digit/web/models/Hearing.java` → lines: **55, 57, 134, 135**
- `dristi-services/hearing-management/src/main/java/digit/web/models/HearingCriteria.java` → lines: **25, 26**


## 17. dristi-services/ocr-service

### `filingNumber`

- `dristi-services/ocr-service/ocr-persister.yml` → lines: **12, 19**
- `dristi-services/ocr-service/src/main/java/org/pucar/dristi/repository/OcrRepository.java` → lines: **28, 31**
- `dristi-services/ocr-service/src/main/java/org/pucar/dristi/service/Service.java` → lines: **133, 135**
- `dristi-services/ocr-service/src/main/java/org/pucar/dristi/web/model/Ocr.java` → lines: **24, 26**
- `dristi-services/ocr-service/src/main/java/org/pucar/dristi/web/model/OcrRequest.java` → lines: **20**
- `dristi-services/ocr-service/src/main/java/org/pucar/dristi/web/model/OcrSearchRequest.java` → lines: **11**


## 18. dristi-services/openapi

### `cnrNumber`

- `dristi-services/openapi/src/main/java/org/pucar/dristi/service/OpenApiService.java` → lines: **102, 109, 331, 332, 333, 336**
- `dristi-services/openapi/src/main/java/org/pucar/dristi/web/controllers/OpenapiApiController.java` → lines: **72, 73, 74**
- `dristi-services/openapi/src/main/java/org/pucar/dristi/web/models/CaseSearchTextItem.java` → lines: **24, 25**
- `dristi-services/openapi/src/main/java/org/pucar/dristi/web/models/CaseSummary.java` → lines: **32, 36**
- `dristi-services/openapi/src/main/java/org/pucar/dristi/web/models/CnrNumberCriteria.java` → lines: **17, 19**
- `dristi-services/openapi/src/main/java/org/pucar/dristi/web/models/Hearing.java` → lines: **60, 62, 128, 129**
- `dristi-services/openapi/src/main/java/org/pucar/dristi/web/models/HearingCriteria.java` → lines: **22, 23**
- `dristi-services/openapi/src/main/java/org/pucar/dristi/web/models/LandingPageCase.java` → lines: **52, 53**
- `dristi-services/openapi/src/main/java/org/pucar/dristi/web/models/OpenApiCaseSummaryRequest.java` → lines: **25, 26**
- `dristi-services/openapi/src/main/java/org/pucar/dristi/web/models/OrderCriteria.java` → lines: **17, 18**
- `dristi-services/openapi/src/main/java/org/pucar/dristi/web/models/OrderDetailsSearchResponse.java` → lines: **40, 41**
- `dristi-services/openapi/src/main/java/org/pucar/dristi/web/models/SearchCaseCriteria.java` → lines: **31, 33**
- `dristi-services/openapi/src/main/java/org/pucar/dristi/web/models/bailbond/Bail.java` → lines: **135, 136**
- `dristi-services/openapi/src/main/java/org/pucar/dristi/web/models/bailbond/BailSearchCriteria.java` → lines: **39, 40**
- `dristi-services/openapi/src/main/java/org/pucar/dristi/web/models/cases/CaseCriteria.java` → lines: **35, 36**
- `dristi-services/openapi/src/main/java/org/pucar/dristi/web/models/cases/CourtCase.java` → lines: **76, 78**
- `dristi-services/openapi/src/main/java/org/pucar/dristi/web/models/courtcase/CaseCriteria.java` → lines: **30, 31**
- `dristi-services/openapi/src/main/java/org/pucar/dristi/web/models/courtcase/CourtCase.java` → lines: **58, 59**
- `dristi-services/openapi/src/main/java/org/pucar/dristi/web/models/order/Order.java` → lines: **47, 48**
- `dristi-services/openapi/src/main/java/org/pucar/dristi/web/models/order/OrderCriteria.java` → lines: **17, 18**
- `dristi-services/openapi/src/main/java/org/pucar/dristi/web/models/witnessdeposition/Artifact.java` → lines: **80, 82**

### `cmpNumber`

- `dristi-services/openapi/src/main/java/org/pucar/dristi/service/OpenApiService.java` → lines: **319**
- `dristi-services/openapi/src/main/java/org/pucar/dristi/web/models/CaseSearchTextItem.java` → lines: **15, 16**
- `dristi-services/openapi/src/main/java/org/pucar/dristi/web/models/Hearing.java` → lines: **53, 54**
- `dristi-services/openapi/src/main/java/org/pucar/dristi/web/models/LandingPageCase.java` → lines: **19, 20**
- `dristi-services/openapi/src/main/java/org/pucar/dristi/web/models/cases/CourtCase.java` → lines: **80, 81**
- `dristi-services/openapi/src/main/java/org/pucar/dristi/web/models/courtcase/CourtCase.java` → lines: **61, 62**

### `courtCaseNumber`

- `dristi-services/openapi/src/main/java/org/pucar/dristi/web/controllers/OpenapiApiController.java` → lines: **79, 85**
- `dristi-services/openapi/src/main/java/org/pucar/dristi/web/models/CaseSearchTextItem.java` → lines: **21, 22**
- `dristi-services/openapi/src/main/java/org/pucar/dristi/web/models/Hearing.java` → lines: **47, 48**
- `dristi-services/openapi/src/main/java/org/pucar/dristi/web/models/cases/CaseCriteria.java` → lines: **44, 45**
- `dristi-services/openapi/src/main/java/org/pucar/dristi/web/models/cases/CourtCase.java` → lines: **64, 66, 197, 198**
- `dristi-services/openapi/src/main/java/org/pucar/dristi/web/models/courtcase/CaseCriteria.java` → lines: **39, 40**
- `dristi-services/openapi/src/main/java/org/pucar/dristi/web/models/courtcase/CourtCase.java` → lines: **49, 50, 177, 178**

### `filingNumber`

- `dristi-services/openapi/src/main/java/org/pucar/dristi/service/OpenApiService.java` → lines: **173, 175, 288, 289, 290, 291, 294, 295, 296, 297, 298, 483, 842, 895**
- `dristi-services/openapi/src/main/java/org/pucar/dristi/util/CaseUtil.java` → lines: **37, 43**
- `dristi-services/openapi/src/main/java/org/pucar/dristi/web/models/CaseSearchTextItem.java` → lines: **18, 19**
- `dristi-services/openapi/src/main/java/org/pucar/dristi/web/models/CaseSummary.java` → lines: **38, 42**
- `dristi-services/openapi/src/main/java/org/pucar/dristi/web/models/Hearing.java` → lines: **56, 58, 123, 124**
- `dristi-services/openapi/src/main/java/org/pucar/dristi/web/models/HearingCriteria.java` → lines: **25, 26**
- `dristi-services/openapi/src/main/java/org/pucar/dristi/web/models/LandingPageCase.java` → lines: **49, 50**
- `dristi-services/openapi/src/main/java/org/pucar/dristi/web/models/OpenApiOrdersTaskIRequest.java` → lines: **17, 19**
- `dristi-services/openapi/src/main/java/org/pucar/dristi/web/models/OpenHearing.java` → lines: **21, 22**
- `dristi-services/openapi/src/main/java/org/pucar/dristi/web/models/OrderCriteria.java` → lines: **20, 21**
- `dristi-services/openapi/src/main/java/org/pucar/dristi/web/models/OrderDetailsSearch.java` → lines: **18, 19**
- `dristi-services/openapi/src/main/java/org/pucar/dristi/web/models/OrderDetailsSearchResponse.java` → lines: **34, 35**
- `dristi-services/openapi/src/main/java/org/pucar/dristi/web/models/SearchCaseCriteria.java` → lines: **23, 25**
- `dristi-services/openapi/src/main/java/org/pucar/dristi/web/models/address/AddAddressRequest.java` → lines: **32, 33**
- `dristi-services/openapi/src/main/java/org/pucar/dristi/web/models/bailbond/Bail.java` → lines: **138, 139**
- `dristi-services/openapi/src/main/java/org/pucar/dristi/web/models/bailbond/BailSearchCriteria.java` → lines: **36, 37**
- `dristi-services/openapi/src/main/java/org/pucar/dristi/web/models/bailbond/OpenApiBailResponse.java` → lines: **52, 53**
- `dristi-services/openapi/src/main/java/org/pucar/dristi/web/models/cases/CaseCriteria.java` → lines: **38, 39**
- `dristi-services/openapi/src/main/java/org/pucar/dristi/web/models/cases/CourtCase.java` → lines: **57, 59**
- `dristi-services/openapi/src/main/java/org/pucar/dristi/web/models/courtcase/CaseCriteria.java` → lines: **33, 34**
- `dristi-services/openapi/src/main/java/org/pucar/dristi/web/models/courtcase/CourtCase.java` → lines: **43, 44**
- `dristi-services/openapi/src/main/java/org/pucar/dristi/web/models/offline_payments/OfflinePaymentTask.java` → lines: **24, 27**
- `dristi-services/openapi/src/main/java/org/pucar/dristi/web/models/order/Order.java` → lines: **41, 42**
- `dristi-services/openapi/src/main/java/org/pucar/dristi/web/models/order/OrderCriteria.java` → lines: **20, 21**
- `dristi-services/openapi/src/main/java/org/pucar/dristi/web/models/task_management/TaskManagement.java` → lines: **25, 27**
- `dristi-services/openapi/src/main/java/org/pucar/dristi/web/models/task_management/TaskSearchCriteria.java` → lines: **41, 42**
- `dristi-services/openapi/src/main/java/org/pucar/dristi/web/models/witnessdeposition/Artifact.java` → lines: **51, 54**
- `dristi-services/openapi/src/main/java/org/pucar/dristi/web/models/witnessdeposition/EvidenceSearchCriteria.java` → lines: **57, 58**


## 19. dristi-services/order

### `cnrNumber`

- `dristi-services/order/order-indexer.yml` → lines: **33, 34, 100, 101**
- `dristi-services/order/order-persister.yml` → lines: **29, 109**
- `dristi-services/order/src/main/java/org/pucar/dristi/repository/querybuilder/OrderQueryBuilder.java` → lines: **50, 55, 57, 58, 105**
- `dristi-services/order/src/main/java/org/pucar/dristi/repository/rowmapper/OrderRowMapper.java` → lines: **62**
- `dristi-services/order/src/main/java/org/pucar/dristi/util/CaseUtil.java` → lines: **40, 47**
- `dristi-services/order/src/main/java/org/pucar/dristi/web/models/CaseCriteria.java` → lines: **29, 30**
- `dristi-services/order/src/main/java/org/pucar/dristi/web/models/CaseExists.java` → lines: **24, 25**
- `dristi-services/order/src/main/java/org/pucar/dristi/web/models/CourtCase.java` → lines: **72, 74**
- `dristi-services/order/src/main/java/org/pucar/dristi/web/models/Hearing.java` → lines: **50, 52, 132, 133**
- `dristi-services/order/src/main/java/org/pucar/dristi/web/models/HearingCriteria.java` → lines: **19, 20**
- `dristi-services/order/src/main/java/org/pucar/dristi/web/models/Order.java` → lines: **45, 46**
- `dristi-services/order/src/main/java/org/pucar/dristi/web/models/OrderCriteria.java` → lines: **18, 19**
- `dristi-services/order/src/main/java/org/pucar/dristi/web/models/OrderExists.java` → lines: **29, 30**

### `cmpNumber`

- `dristi-services/order/src/main/java/org/pucar/dristi/service/OrderRegistrationService.java` → lines: **372**
- `dristi-services/order/src/main/java/org/pucar/dristi/service/SmsNotificationService.java` → lines: **167, 212, 224, 225, 226**
- `dristi-services/order/src/main/java/org/pucar/dristi/web/models/CourtCase.java` → lines: **76, 77**
- `dristi-services/order/src/main/java/org/pucar/dristi/web/models/Hearing.java` → lines: **43, 44**
- `dristi-services/order/src/main/java/org/pucar/dristi/web/models/SmsTemplateData.java` → lines: **24**

### `courtCaseNumber`

- `dristi-services/order/src/main/java/org/pucar/dristi/service/OrderRegistrationService.java` → lines: **371**
- `dristi-services/order/src/main/java/org/pucar/dristi/service/SmsNotificationService.java` → lines: **166, 219, 220, 221**
- `dristi-services/order/src/main/java/org/pucar/dristi/web/models/CaseCriteria.java` → lines: **38, 39**
- `dristi-services/order/src/main/java/org/pucar/dristi/web/models/CaseExists.java` → lines: **21, 22**
- `dristi-services/order/src/main/java/org/pucar/dristi/web/models/CourtCase.java` → lines: **60, 62**
- `dristi-services/order/src/main/java/org/pucar/dristi/web/models/Hearing.java` → lines: **37, 38**
- `dristi-services/order/src/main/java/org/pucar/dristi/web/models/SmsTemplateData.java` → lines: **18**

### `filingNumber`

- `dristi-services/order/order-indexer.yml` → lines: **25, 26, 94, 95**
- `dristi-services/order/order-persister.yml` → lines: **12, 21, 92, 99**
- `dristi-services/order/src/main/java/org/pucar/dristi/enrichment/OrderRegistrationEnrichment.java` → lines: **111**
- `dristi-services/order/src/main/java/org/pucar/dristi/repository/querybuilder/OrderQueryBuilder.java` → lines: **50, 62, 64, 65, 106**
- `dristi-services/order/src/main/java/org/pucar/dristi/repository/rowmapper/OrderRowMapper.java` → lines: **71**
- `dristi-services/order/src/main/java/org/pucar/dristi/service/OrderRegistrationService.java` → lines: **284, 375**
- `dristi-services/order/src/main/java/org/pucar/dristi/service/SmsNotificationService.java` → lines: **78, 85, 172, 207, 229, 230, 231**
- `dristi-services/order/src/main/java/org/pucar/dristi/util/CaseUtil.java` → lines: **40, 48**
- `dristi-services/order/src/main/java/org/pucar/dristi/web/models/CaseCriteria.java` → lines: **32, 33**
- `dristi-services/order/src/main/java/org/pucar/dristi/web/models/CaseExists.java` → lines: **27, 28**
- `dristi-services/order/src/main/java/org/pucar/dristi/web/models/CourtCase.java` → lines: **56, 58**
- `dristi-services/order/src/main/java/org/pucar/dristi/web/models/Hearing.java` → lines: **46, 48, 127, 128**
- `dristi-services/order/src/main/java/org/pucar/dristi/web/models/HearingCriteria.java` → lines: **22, 23**
- `dristi-services/order/src/main/java/org/pucar/dristi/web/models/Order.java` → lines: **39, 40**
- `dristi-services/order/src/main/java/org/pucar/dristi/web/models/OrderCriteria.java` → lines: **21, 22**
- `dristi-services/order/src/main/java/org/pucar/dristi/web/models/OrderDetailsDTO.java` → lines: **26, 28**
- `dristi-services/order/src/main/java/org/pucar/dristi/web/models/OrderExists.java` → lines: **26, 27**
- `dristi-services/order/src/main/java/org/pucar/dristi/web/models/SmsTemplateData.java` → lines: **26**


## 20. dristi-services/order-management

### `cnrNumber`

- `dristi-services/order-management/src/main/java/pucar/service/OrderService.java` → lines: **153, 155, 156, 184, 274**
- `dristi-services/order-management/src/main/java/pucar/strategy/ordertype/PublishOrderAdmitCase.java` → lines: **106**
- `dristi-services/order-management/src/main/java/pucar/strategy/ordertype/PublishOrderApprovalRejectionLitigantDetailsChange.java` → lines: **94**
- `dristi-services/order-management/src/main/java/pucar/strategy/ordertype/PublishOrderAttachment.java` → lines: **161**
- `dristi-services/order-management/src/main/java/pucar/strategy/ordertype/PublishOrderInitiatingReschedulingOfHearingDate.java` → lines: **183**
- `dristi-services/order-management/src/main/java/pucar/strategy/ordertype/PublishOrderMandatorySumissionResponses.java` → lines: **108**
- `dristi-services/order-management/src/main/java/pucar/strategy/ordertype/PublishOrderNotice.java` → lines: **179, 259, 319**
- `dristi-services/order-management/src/main/java/pucar/strategy/ordertype/PublishOrderProclamation.java` → lines: **161**
- `dristi-services/order-management/src/main/java/pucar/strategy/ordertype/PublishOrderSetBailTerms.java` → lines: **130**
- `dristi-services/order-management/src/main/java/pucar/strategy/ordertype/PublishOrderSummons.java` → lines: **154, 254**
- `dristi-services/order-management/src/main/java/pucar/strategy/ordertype/PublishOrderWarrant.java` → lines: **167**
- `dristi-services/order-management/src/main/java/pucar/util/HearingUtil.java` → lines: **278, 313**
- `dristi-services/order-management/src/main/java/pucar/util/PendingTaskUtil.java` → lines: **170, 179**
- `dristi-services/order-management/src/main/java/pucar/util/TaskUtil.java` → lines: **142**
- `dristi-services/order-management/src/main/java/pucar/web/controllers/OrderApiController.java` → lines: **58, 61**
- `dristi-services/order-management/src/main/java/pucar/web/models/HearingDraftOrder.java` → lines: **16, 17**
- `dristi-services/order-management/src/main/java/pucar/web/models/Order.java` → lines: **45, 46**
- `dristi-services/order-management/src/main/java/pucar/web/models/OrderCriteria.java` → lines: **18, 19**
- `dristi-services/order-management/src/main/java/pucar/web/models/OrderExists.java` → lines: **23, 24**
- `dristi-services/order-management/src/main/java/pucar/web/models/application/Application.java` → lines: **41, 42**
- `dristi-services/order-management/src/main/java/pucar/web/models/application/ApplicationCriteria.java` → lines: **20, 21**
- `dristi-services/order-management/src/main/java/pucar/web/models/application/ApplicationExists.java` → lines: **17, 18**
- `dristi-services/order-management/src/main/java/pucar/web/models/courtCase/CaseCriteria.java` → lines: **30, 31**
- `dristi-services/order-management/src/main/java/pucar/web/models/courtCase/CaseExists.java` → lines: **20, 21**
- `dristi-services/order-management/src/main/java/pucar/web/models/courtCase/CourtCase.java` → lines: **60, 61**
- `dristi-services/order-management/src/main/java/pucar/web/models/hearing/Hearing.java` → lines: **52, 54, 132, 133**
- `dristi-services/order-management/src/main/java/pucar/web/models/hearing/HearingCriteria.java` → lines: **19, 20**
- `dristi-services/order-management/src/main/java/pucar/web/models/pendingtask/PendingTask.java` → lines: **53, 55**
- `dristi-services/order-management/src/main/java/pucar/web/models/task/Task.java` → lines: **42, 43**
- `dristi-services/order-management/src/main/java/pucar/web/models/task/TaskCriteria.java` → lines: **18, 19**

### `cmpNumber`

- `dristi-services/order-management/src/main/java/pucar/service/SmsNotificationService.java` → lines: **96, 136, 151, 152, 153**
- `dristi-services/order-management/src/main/java/pucar/strategy/ordertype/PublishOrderAttachment.java` → lines: **187**
- `dristi-services/order-management/src/main/java/pucar/strategy/ordertype/PublishOrderNotice.java` → lines: **278, 341**
- `dristi-services/order-management/src/main/java/pucar/strategy/ordertype/PublishOrderProclamation.java` → lines: **187**
- `dristi-services/order-management/src/main/java/pucar/strategy/ordertype/PublishOrderSummons.java` → lines: **176, 273**
- `dristi-services/order-management/src/main/java/pucar/strategy/ordertype/PublishOrderWarrant.java` → lines: **193**
- `dristi-services/order-management/src/main/java/pucar/util/HearingUtil.java` → lines: **280, 315**
- `dristi-services/order-management/src/main/java/pucar/web/models/SMSTemplateData.java` → lines: **18**
- `dristi-services/order-management/src/main/java/pucar/web/models/application/Application.java` → lines: **44, 45**
- `dristi-services/order-management/src/main/java/pucar/web/models/courtCase/CourtCase.java` → lines: **63, 64**
- `dristi-services/order-management/src/main/java/pucar/web/models/hearing/Hearing.java` → lines: **45, 46**

### `courtCaseNumber`

- `dristi-services/order-management/src/main/java/pucar/service/SmsNotificationService.java` → lines: **94, 135, 146, 147, 148**
- `dristi-services/order-management/src/main/java/pucar/strategy/ordertype/PublishOrderAttachment.java` → lines: **186**
- `dristi-services/order-management/src/main/java/pucar/strategy/ordertype/PublishOrderNotice.java` → lines: **277, 340**
- `dristi-services/order-management/src/main/java/pucar/strategy/ordertype/PublishOrderProclamation.java` → lines: **186**
- `dristi-services/order-management/src/main/java/pucar/strategy/ordertype/PublishOrderSummons.java` → lines: **175, 272**
- `dristi-services/order-management/src/main/java/pucar/strategy/ordertype/PublishOrderWarrant.java` → lines: **192**
- `dristi-services/order-management/src/main/java/pucar/util/HearingUtil.java` → lines: **279, 314**
- `dristi-services/order-management/src/main/java/pucar/web/models/SMSTemplateData.java` → lines: **19**
- `dristi-services/order-management/src/main/java/pucar/web/models/courtCase/CaseCriteria.java` → lines: **39, 40**
- `dristi-services/order-management/src/main/java/pucar/web/models/courtCase/CaseExists.java` → lines: **17, 18**
- `dristi-services/order-management/src/main/java/pucar/web/models/courtCase/CourtCase.java` → lines: **51, 52, 184, 185**
- `dristi-services/order-management/src/main/java/pucar/web/models/hearing/Hearing.java` → lines: **39, 40**

### `filingNumber`

- `dristi-services/order-management/src/main/java/pucar/scheduler/CronJobScheduler.java` → lines: **315, 316, 319, 332**
- `dristi-services/order-management/src/main/java/pucar/service/OrderService.java` → lines: **74, 153, 156, 160, 183, 210, 212, 264, 274, 276**
- `dristi-services/order-management/src/main/java/pucar/strategy/common/DeleteOrder.java` → lines: **71**
- `dristi-services/order-management/src/main/java/pucar/strategy/common/PublishOrder.java` → lines: **93, 127, 149**
- `dristi-services/order-management/src/main/java/pucar/strategy/ordertype/PublishAcceptRescheduleRequest.java` → lines: **101**
- `dristi-services/order-management/src/main/java/pucar/strategy/ordertype/PublishMiscellaneousProcess.java` → lines: **77**
- `dristi-services/order-management/src/main/java/pucar/strategy/ordertype/PublishOrderAdmitCase.java` → lines: **80, 107**
- `dristi-services/order-management/src/main/java/pucar/strategy/ordertype/PublishOrderApprovalRejectionLitigantDetailsChange.java` → lines: **66, 91**
- `dristi-services/order-management/src/main/java/pucar/strategy/ordertype/PublishOrderAttachment.java` → lines: **82, 162**
- `dristi-services/order-management/src/main/java/pucar/strategy/ordertype/PublishOrderDismissCase.java` → lines: **68, 82**
- `dristi-services/order-management/src/main/java/pucar/strategy/ordertype/PublishOrderExtensionOfDocumentSubmissionDate.java` → lines: **65, 67**
- `dristi-services/order-management/src/main/java/pucar/strategy/ordertype/PublishOrderInitiatingReschedulingOfHearingDate.java` → lines: **143, 145, 184**
- `dristi-services/order-management/src/main/java/pucar/strategy/ordertype/PublishOrderMandatorySumissionResponses.java` → lines: **73, 109**
- `dristi-services/order-management/src/main/java/pucar/strategy/ordertype/PublishOrderMoveCaseOutOfLongPendingRegister.java` → lines: **56**
- `dristi-services/order-management/src/main/java/pucar/strategy/ordertype/PublishOrderMoveCaseToLongPendingRegister.java` → lines: **56**
- `dristi-services/order-management/src/main/java/pucar/strategy/ordertype/PublishOrderNotice.java` → lines: **99, 171, 182, 260, 320**
- `dristi-services/order-management/src/main/java/pucar/strategy/ordertype/PublishOrderProclamation.java` → lines: **82, 162**
- `dristi-services/order-management/src/main/java/pucar/strategy/ordertype/PublishOrderScheduleOfHearingDate.java` → lines: **68, 94, 107**
- `dristi-services/order-management/src/main/java/pucar/strategy/ordertype/PublishOrderSchedulingNextHearing.java` → lines: **64, 94**
- `dristi-services/order-management/src/main/java/pucar/strategy/ordertype/PublishOrderSetBailTerms.java` → lines: **72, 131**
- `dristi-services/order-management/src/main/java/pucar/strategy/ordertype/PublishOrderSummons.java` → lines: **95, 155, 255**
- `dristi-services/order-management/src/main/java/pucar/strategy/ordertype/PublishOrderWarrant.java` → lines: **82, 168**
- `dristi-services/order-management/src/main/java/pucar/util/HearingUtil.java` → lines: **277, 312, 476**
- `dristi-services/order-management/src/main/java/pucar/util/PendingTaskUtil.java` → lines: **169, 177**
- `dristi-services/order-management/src/main/java/pucar/util/TaskManagementUtil.java` → lines: **95**
- `dristi-services/order-management/src/main/java/pucar/util/TaskUtil.java` → lines: **141**
- `dristi-services/order-management/src/main/java/pucar/web/controllers/OrderApiController.java` → lines: **57, 61, 71, 75**
- `dristi-services/order-management/src/main/java/pucar/web/models/BotdOrderSummary.java` → lines: **38, 39**
- `dristi-services/order-management/src/main/java/pucar/web/models/HearingDraftOrder.java` → lines: **13, 14**
- `dristi-services/order-management/src/main/java/pucar/web/models/Order.java` → lines: **42, 43**
- `dristi-services/order-management/src/main/java/pucar/web/models/OrderCriteria.java` → lines: **21, 22**
- `dristi-services/order-management/src/main/java/pucar/web/models/OrderExists.java` → lines: **20, 21**
- `dristi-services/order-management/src/main/java/pucar/web/models/application/Application.java` → lines: **38, 39**
- `dristi-services/order-management/src/main/java/pucar/web/models/application/ApplicationCriteria.java` → lines: **23, 24**
- `dristi-services/order-management/src/main/java/pucar/web/models/application/ApplicationExists.java` → lines: **14, 15**
- `dristi-services/order-management/src/main/java/pucar/web/models/courtCase/CaseCriteria.java` → lines: **33, 34**
- `dristi-services/order-management/src/main/java/pucar/web/models/courtCase/CaseExists.java` → lines: **23, 24**
- `dristi-services/order-management/src/main/java/pucar/web/models/courtCase/CourtCase.java` → lines: **45, 46**
- `dristi-services/order-management/src/main/java/pucar/web/models/hearing/Hearing.java` → lines: **48, 50, 127, 128**
- `dristi-services/order-management/src/main/java/pucar/web/models/hearing/HearingCriteria.java` → lines: **22, 23**
- `dristi-services/order-management/src/main/java/pucar/web/models/inbox/OpenHearing.java` → lines: **22, 23**
- `dristi-services/order-management/src/main/java/pucar/web/models/pendingtask/PendingTask.java` → lines: **57, 59**
- `dristi-services/order-management/src/main/java/pucar/web/models/task/Task.java` → lines: **35, 37**
- `dristi-services/order-management/src/main/java/pucar/web/models/taskManagement/TaskManagement.java` → lines: **32, 34**
- `dristi-services/order-management/src/main/java/pucar/web/models/taskManagement/TaskSearchCriteria.java` → lines: **48, 49**


## 21. dristi-services/payment-calculator-svc

### `cnrNumber`

- `dristi-services/payment-calculator-svc/src/main/java/drishti/payment/calculator/web/models/CaseCriteria.java` → lines: **30, 31**

### `courtCaseNumber`

- `dristi-services/payment-calculator-svc/src/main/java/drishti/payment/calculator/web/models/CaseCriteria.java` → lines: **39, 40**

### `filingNumber`

- `dristi-services/payment-calculator-svc/src/main/java/drishti/payment/calculator/util/CaseUtil.java` → lines: **56, 58, 101**
- `dristi-services/payment-calculator-svc/src/main/java/drishti/payment/calculator/web/models/CaseCriteria.java` → lines: **33, 34**
- `dristi-services/payment-calculator-svc/src/main/java/drishti/payment/calculator/web/models/EFillingCalculationCriteria.java` → lines: **32, 34**
- `dristi-services/payment-calculator-svc/src/main/java/drishti/payment/calculator/web/models/JoinCaseCalculationCriteria.java` → lines: **18, 19**
- `dristi-services/payment-calculator-svc/src/main/java/drishti/payment/calculator/web/models/JoinCaseCriteria.java` → lines: **24, 25**


## 22. dristi-services/scheduler-svc

### `cnrNumber`

- `dristi-services/scheduler-svc/src/main/java/digit/web/models/ApplicationCriteria.java` → lines: **29, 30**
- `dristi-services/scheduler-svc/src/main/java/digit/web/models/CauseList.java` → lines: **51, 52**
- `dristi-services/scheduler-svc/src/main/java/digit/web/models/PendingTask.java` → lines: **40, 41**
- `dristi-services/scheduler-svc/src/main/java/digit/web/models/hearing/Hearing.java` → lines: **56, 57, 122, 123**
- `dristi-services/scheduler-svc/src/main/java/digit/web/models/hearing/HearingSearchCriteria.java` → lines: **24, 25**

### `cmpNumber`

- `dristi-services/scheduler-svc/causelist-persister.yml` → lines: **39**
- `dristi-services/scheduler-svc/src/main/java/digit/service/CauseListService.java` → lines: **693**
- `dristi-services/scheduler-svc/src/main/java/digit/service/SmsNotificationService.java` → lines: **88, 125**
- `dristi-services/scheduler-svc/src/main/java/digit/service/hearing/HearingProcessor.java` → lines: **131, 133**
- `dristi-services/scheduler-svc/src/main/java/digit/web/models/SmsTemplateData.java` → lines: **22**
- `dristi-services/scheduler-svc/src/main/java/digit/web/models/hearing/Hearing.java` → lines: **50, 51**

### `courtCaseNumber`

- `dristi-services/scheduler-svc/src/main/java/digit/service/CauseListService.java` → lines: **692**
- `dristi-services/scheduler-svc/src/main/java/digit/service/SmsNotificationService.java` → lines: **87, 125**
- `dristi-services/scheduler-svc/src/main/java/digit/service/hearing/HearingProcessor.java` → lines: **130**
- `dristi-services/scheduler-svc/src/main/java/digit/web/models/SmsTemplateData.java` → lines: **18**
- `dristi-services/scheduler-svc/src/main/java/digit/web/models/hearing/Hearing.java` → lines: **44, 45**

### `filingNumber`

- `dristi-services/scheduler-svc/causelist-persister.yml` → lines: **17**
- `dristi-services/scheduler-svc/src/main/java/digit/service/CauseListService.java` → lines: **492, 518, 520, 589, 605, 611, 646, 671, 674**
- `dristi-services/scheduler-svc/src/main/java/digit/service/ReScheduleHearingService.java` → lines: **89**
- `dristi-services/scheduler-svc/src/main/java/digit/service/hearing/HearingProcessor.java` → lines: **117, 132, 133**
- `dristi-services/scheduler-svc/src/main/java/digit/util/PendingTaskUtil.java` → lines: **81**
- `dristi-services/scheduler-svc/src/main/java/digit/web/models/ApplicationCriteria.java` → lines: **32, 33**
- `dristi-services/scheduler-svc/src/main/java/digit/web/models/CauseList.java` → lines: **48, 49**
- `dristi-services/scheduler-svc/src/main/java/digit/web/models/OpenHearing.java` → lines: **21, 22**
- `dristi-services/scheduler-svc/src/main/java/digit/web/models/PendingTask.java` → lines: **43, 44**
- `dristi-services/scheduler-svc/src/main/java/digit/web/models/cases/CaseCriteria.java` → lines: **21, 22**
- `dristi-services/scheduler-svc/src/main/java/digit/web/models/hearing/Hearing.java` → lines: **53, 54, 117, 118**
- `dristi-services/scheduler-svc/src/main/java/digit/web/models/hearing/HearingSearchCriteria.java` → lines: **27, 28**


## 23. dristi-services/task

### `cnrNumber`

- `dristi-services/task/src/main/java/org/pucar/dristi/repository/querybuilder/TaskCaseQueryBuilder.java` → lines: **39**
- `dristi-services/task/src/main/java/org/pucar/dristi/repository/querybuilder/TaskQueryBuilder.java` → lines: **67, 71, 88, 128**
- `dristi-services/task/src/main/java/org/pucar/dristi/repository/rowmapper/TaskCaseRowMapper.java` → lines: **64**
- `dristi-services/task/src/main/java/org/pucar/dristi/repository/rowmapper/TaskRowMapper.java` → lines: **62**
- `dristi-services/task/src/main/java/org/pucar/dristi/service/PaymentUpdateService.java` → lines: **684**
- `dristi-services/task/src/main/java/org/pucar/dristi/util/CaseUtil.java` → lines: **45, 57, 58**
- `dristi-services/task/src/main/java/org/pucar/dristi/util/PendingTaskUtil.java` → lines: **134, 143**
- `dristi-services/task/src/main/java/org/pucar/dristi/validators/TaskRegistrationValidator.java` → lines: **106**
- `dristi-services/task/src/main/java/org/pucar/dristi/web/models/CaseCriteria.java` → lines: **29, 30**
- `dristi-services/task/src/main/java/org/pucar/dristi/web/models/CaseExists.java` → lines: **24, 25**
- `dristi-services/task/src/main/java/org/pucar/dristi/web/models/CourtCase.java` → lines: **76, 78**
- `dristi-services/task/src/main/java/org/pucar/dristi/web/models/OrderExists.java` → lines: **29, 30**
- `dristi-services/task/src/main/java/org/pucar/dristi/web/models/Task.java` → lines: **57, 58**
- `dristi-services/task/src/main/java/org/pucar/dristi/web/models/TaskCase.java` → lines: **59, 60**
- `dristi-services/task/src/main/java/org/pucar/dristi/web/models/TaskCriteria.java` → lines: **27, 28**
- `dristi-services/task/src/main/java/org/pucar/dristi/web/models/TaskExists.java` → lines: **33, 34**
- `dristi-services/task/src/main/java/org/pucar/dristi/web/models/order/Order.java` → lines: **45, 46**
- `dristi-services/task/src/main/java/org/pucar/dristi/web/models/order/OrderCriteria.java` → lines: **19, 20**
- `dristi-services/task/src/main/java/org/pucar/dristi/web/models/pendingtask/PendingTask.java` → lines: **53, 55**
- `dristi-services/task/task-persister.yml` → lines: **15, 22, 75, 82**

### `cmpNumber`

- `dristi-services/task/src/main/java/org/pucar/dristi/repository/querybuilder/TaskCaseQueryBuilder.java` → lines: **25, 172**
- `dristi-services/task/src/main/java/org/pucar/dristi/repository/rowmapper/TaskCaseRowMapper.java` → lines: **65**
- `dristi-services/task/src/main/java/org/pucar/dristi/service/SmsNotificationService.java` → lines: **85, 124, 136, 137, 138**
- `dristi-services/task/src/main/java/org/pucar/dristi/service/TaskService.java` → lines: **560, 600, 601**
- `dristi-services/task/src/main/java/org/pucar/dristi/web/models/CourtCase.java` → lines: **80, 81**
- `dristi-services/task/src/main/java/org/pucar/dristi/web/models/SmsTemplateData.java` → lines: **28**
- `dristi-services/task/src/main/java/org/pucar/dristi/web/models/TaskCase.java` → lines: **62, 63**

### `courtCaseNumber`

- `dristi-services/task/src/main/java/org/pucar/dristi/repository/querybuilder/TaskCaseQueryBuilder.java` → lines: **25, 173**
- `dristi-services/task/src/main/java/org/pucar/dristi/repository/rowmapper/TaskCaseRowMapper.java` → lines: **66**
- `dristi-services/task/src/main/java/org/pucar/dristi/service/SmsNotificationService.java` → lines: **84, 122, 131, 132, 133**
- `dristi-services/task/src/main/java/org/pucar/dristi/service/TaskService.java` → lines: **559, 599, 601**
- `dristi-services/task/src/main/java/org/pucar/dristi/web/models/CaseCriteria.java` → lines: **38, 39**
- `dristi-services/task/src/main/java/org/pucar/dristi/web/models/CaseExists.java` → lines: **21, 22**
- `dristi-services/task/src/main/java/org/pucar/dristi/web/models/CourtCase.java` → lines: **64, 66**
- `dristi-services/task/src/main/java/org/pucar/dristi/web/models/SmsTemplateData.java` → lines: **18**
- `dristi-services/task/src/main/java/org/pucar/dristi/web/models/TaskCase.java` → lines: **65, 66**

### `filingNumber`

- `dristi-services/task/src/main/java/org/pucar/dristi/config/ServiceConstants.java` → lines: **160**
- `dristi-services/task/src/main/java/org/pucar/dristi/kafka/ApplicationUpdateConsumer.java` → lines: **49, 55**
- `dristi-services/task/src/main/java/org/pucar/dristi/repository/querybuilder/TaskQueryBuilder.java` → lines: **67, 72, 95, 133**
- `dristi-services/task/src/main/java/org/pucar/dristi/repository/rowmapper/TaskCaseRowMapper.java` → lines: **62**
- `dristi-services/task/src/main/java/org/pucar/dristi/repository/rowmapper/TaskRowMapper.java` → lines: **57**
- `dristi-services/task/src/main/java/org/pucar/dristi/service/PaymentUpdateService.java` → lines: **392, 405, 685**
- `dristi-services/task/src/main/java/org/pucar/dristi/service/TaskService.java` → lines: **875, 878, 954, 955, 980**
- `dristi-services/task/src/main/java/org/pucar/dristi/util/CaseUtil.java` → lines: **45, 60, 61, 86, 92**
- `dristi-services/task/src/main/java/org/pucar/dristi/util/EtreasuryUtil.java` → lines: **47**
- `dristi-services/task/src/main/java/org/pucar/dristi/util/PendingTaskUtil.java` → lines: **133, 141**
- `dristi-services/task/src/main/java/org/pucar/dristi/web/models/CaseCriteria.java` → lines: **32, 33**
- `dristi-services/task/src/main/java/org/pucar/dristi/web/models/CaseExists.java` → lines: **27, 28**
- `dristi-services/task/src/main/java/org/pucar/dristi/web/models/CourtCase.java` → lines: **57, 59**
- `dristi-services/task/src/main/java/org/pucar/dristi/web/models/DemandCreateRequest.java` → lines: **25, 26**
- `dristi-services/task/src/main/java/org/pucar/dristi/web/models/OrderExists.java` → lines: **26, 27**
- `dristi-services/task/src/main/java/org/pucar/dristi/web/models/Task.java` → lines: **41, 43**
- `dristi-services/task/src/main/java/org/pucar/dristi/web/models/TaskCase.java` → lines: **53, 54**
- `dristi-services/task/src/main/java/org/pucar/dristi/web/models/TaskCriteria.java` → lines: **51, 52**
- `dristi-services/task/src/main/java/org/pucar/dristi/web/models/TaskDetailsDTO.java` → lines: **26, 28**
- `dristi-services/task/src/main/java/org/pucar/dristi/web/models/TaskExists.java` → lines: **30, 31**
- `dristi-services/task/src/main/java/org/pucar/dristi/web/models/order/Order.java` → lines: **39, 40**
- `dristi-services/task/src/main/java/org/pucar/dristi/web/models/order/OrderCriteria.java` → lines: **22, 23**
- `dristi-services/task/src/main/java/org/pucar/dristi/web/models/pendingtask/PendingTask.java` → lines: **57, 59**
- `dristi-services/task/task-indexer.yml` → lines: **27, 28, 120, 121**
- `dristi-services/task/task-persister.yml` → lines: **11, 15, 21, 75, 81**


## 24. dristi-services/task-management

### `cnrNumber`

- `dristi-services/task-management/src/main/java/digit/service/PaymentUpdateService.java` → lines: **512**
- `dristi-services/task-management/src/main/java/digit/service/TaskCreationService.java` → lines: **917, 1214**
- `dristi-services/task-management/src/main/java/digit/util/PendingTaskUtil.java` → lines: **215, 224**
- `dristi-services/task-management/src/main/java/digit/util/TaskUtil.java` → lines: **105**
- `dristi-services/task-management/src/main/java/digit/web/models/CaseCriteria.java` → lines: **31, 32**
- `dristi-services/task-management/src/main/java/digit/web/models/Task.java` → lines: **56, 57**
- `dristi-services/task-management/src/main/java/digit/web/models/cases/CourtCase.java` → lines: **75, 77**
- `dristi-services/task-management/src/main/java/digit/web/models/order/Order.java` → lines: **45, 46**
- `dristi-services/task-management/src/main/java/digit/web/models/order/OrderCriteria.java` → lines: **21, 22**
- `dristi-services/task-management/src/main/java/digit/web/models/pendingtask/PendingTask.java` → lines: **53, 55**

### `cmpNumber`

- `dristi-services/task-management/src/main/java/digit/service/SmsNotificationService.java` → lines: **96, 133, 145, 146, 147**
- `dristi-services/task-management/src/main/java/digit/service/TaskCreationService.java` → lines: **1264**
- `dristi-services/task-management/src/main/java/digit/web/models/SMSTemplateData.java` → lines: **16**
- `dristi-services/task-management/src/main/java/digit/web/models/cases/CourtCase.java` → lines: **79, 80**

### `courtCaseNumber`

- `dristi-services/task-management/src/main/java/digit/service/SmsNotificationService.java` → lines: **95, 140, 141, 142**
- `dristi-services/task-management/src/main/java/digit/service/TaskCreationService.java` → lines: **1265**
- `dristi-services/task-management/src/main/java/digit/web/models/CaseCriteria.java` → lines: **40, 41**
- `dristi-services/task-management/src/main/java/digit/web/models/SMSTemplateData.java` → lines: **17**
- `dristi-services/task-management/src/main/java/digit/web/models/cases/CourtCase.java` → lines: **63, 65, 200, 201**

### `filingNumber`

- `dristi-services/task-management/src/main/java/digit/enrichment/TaskManagementEnrichment.java` → lines: **50, 51, 55**
- `dristi-services/task-management/src/main/java/digit/kafka/Consumer.java` → lines: **188, 189, 194, 198, 199, 204, 207**
- `dristi-services/task-management/src/main/java/digit/repository/rowmapper/TaskManagementRowMapper.java` → lines: **51**
- `dristi-services/task-management/src/main/java/digit/service/DemandService.java` → lines: **136, 143, 280**
- `dristi-services/task-management/src/main/java/digit/service/PaymentUpdateService.java` → lines: **86, 93, 183, 184, 189, 193, 194, 199, 202, 265, 268, 511**
- `dristi-services/task-management/src/main/java/digit/service/TaskCreationService.java` → lines: **162, 163, 168, 172, 173, 178, 181, 916, 1215**
- `dristi-services/task-management/src/main/java/digit/util/CaseUtil.java` → lines: **54, 60**
- `dristi-services/task-management/src/main/java/digit/util/PendingTaskUtil.java` → lines: **214, 222**
- `dristi-services/task-management/src/main/java/digit/util/TaskUtil.java` → lines: **104**
- `dristi-services/task-management/src/main/java/digit/web/models/CaseCriteria.java` → lines: **34, 35**
- `dristi-services/task-management/src/main/java/digit/web/models/DemandCreateRequest.java` → lines: **26, 27**
- `dristi-services/task-management/src/main/java/digit/web/models/Task.java` → lines: **40, 42**
- `dristi-services/task-management/src/main/java/digit/web/models/TaskManagement.java` → lines: **32, 34**
- `dristi-services/task-management/src/main/java/digit/web/models/TaskSearchCriteria.java` → lines: **51, 52**
- `dristi-services/task-management/src/main/java/digit/web/models/cases/CourtCase.java` → lines: **56, 58**
- `dristi-services/task-management/src/main/java/digit/web/models/demand/OfflinePaymentTask.java` → lines: **25, 28**
- `dristi-services/task-management/src/main/java/digit/web/models/order/Order.java` → lines: **42, 43**
- `dristi-services/task-management/src/main/java/digit/web/models/order/OrderCriteria.java` → lines: **24, 25**
- `dristi-services/task-management/src/main/java/digit/web/models/pendingtask/PendingTask.java` → lines: **57, 59**
- `dristi-services/task-management/task-management-persister.yml` → lines: **12, 20, 44, 49**


## 25. dristi-services/transformer

### `cnrNumber`

- `dristi-services/transformer/src/main/java/org/egov/transformer/models/Application.java` → lines: **53, 55**
- `dristi-services/transformer/src/main/java/org/egov/transformer/models/Artifact.java` → lines: **86, 88**
- `dristi-services/transformer/src/main/java/org/egov/transformer/models/CaseCriteria.java` → lines: **31, 32**
- `dristi-services/transformer/src/main/java/org/egov/transformer/models/CaseSearch.java` → lines: **45, 46**
- `dristi-services/transformer/src/main/java/org/egov/transformer/models/CourtCase.java` → lines: **80, 82**
- `dristi-services/transformer/src/main/java/org/egov/transformer/models/Hearing.java` → lines: **62, 64, 147, 148**
- `dristi-services/transformer/src/main/java/org/egov/transformer/models/HearingCriteria.java` → lines: **26, 27**
- `dristi-services/transformer/src/main/java/org/egov/transformer/models/Order.java` → lines: **47, 48**
- `dristi-services/transformer/src/main/java/org/egov/transformer/models/Task.java` → lines: **53, 54**
- `dristi-services/transformer/src/main/java/org/egov/transformer/repository/DBRepository.java` → lines: **22, 26**

### `cmpNumber`

- `dristi-services/transformer/src/main/java/org/egov/transformer/consumer/CaseConsumer.java` → lines: **364, 373**
- `dristi-services/transformer/src/main/java/org/egov/transformer/models/BailUpdateRequest.java` → lines: **26, 27**
- `dristi-services/transformer/src/main/java/org/egov/transformer/models/CaseReferenceNumberUpdateRequest.java` → lines: **24, 25**
- `dristi-services/transformer/src/main/java/org/egov/transformer/models/CaseSearch.java` → lines: **39, 40**
- `dristi-services/transformer/src/main/java/org/egov/transformer/models/CourtCase.java` → lines: **72, 73**
- `dristi-services/transformer/src/main/java/org/egov/transformer/models/Hearing.java` → lines: **55, 56**
- `dristi-services/transformer/src/main/java/org/egov/transformer/service/CaseService.java` → lines: **153, 155, 156, 206, 208**
- `dristi-services/transformer/src/main/java/org/egov/transformer/service/DigitalizedDocumentService.java` → lines: **61, 64**

### `courtCaseNumber`

- `dristi-services/transformer/src/main/java/org/egov/transformer/consumer/CaseConsumer.java` → lines: **365, 374**
- `dristi-services/transformer/src/main/java/org/egov/transformer/models/BailUpdateRequest.java` → lines: **29, 30**
- `dristi-services/transformer/src/main/java/org/egov/transformer/models/CaseCriteria.java` → lines: **40, 41**
- `dristi-services/transformer/src/main/java/org/egov/transformer/models/CaseReferenceNumberUpdateRequest.java` → lines: **27, 28**
- `dristi-services/transformer/src/main/java/org/egov/transformer/models/CourtCase.java` → lines: **68, 70**
- `dristi-services/transformer/src/main/java/org/egov/transformer/models/Hearing.java` → lines: **49, 50**
- `dristi-services/transformer/src/main/java/org/egov/transformer/service/HearingService.java` → lines: **274, 275, 276**

### `filingNumber`

- `dristi-services/transformer/src/main/java/org/egov/transformer/config/ServiceConstants.java` → lines: **8, 10, 15, 20**
- `dristi-services/transformer/src/main/java/org/egov/transformer/consumer/CaseConsumer.java` → lines: **341, 357, 363, 372, 382, 421, 422**
- `dristi-services/transformer/src/main/java/org/egov/transformer/consumer/EvidenceConsumer.java` → lines: **62, 74, 78, 103**
- `dristi-services/transformer/src/main/java/org/egov/transformer/consumer/HearingConsumer.java` → lines: **111, 113, 114, 116**
- `dristi-services/transformer/src/main/java/org/egov/transformer/event/impl/NotificationImpl.java` → lines: **53**
- `dristi-services/transformer/src/main/java/org/egov/transformer/event/impl/OrderImpl.java` → lines: **69**
- `dristi-services/transformer/src/main/java/org/egov/transformer/models/Application.java` → lines: **49, 51**
- `dristi-services/transformer/src/main/java/org/egov/transformer/models/Artifact.java` → lines: **45, 48**
- `dristi-services/transformer/src/main/java/org/egov/transformer/models/BailUpdateRequest.java` → lines: **23, 24**
- `dristi-services/transformer/src/main/java/org/egov/transformer/models/CaseCriteria.java` → lines: **34, 35**
- `dristi-services/transformer/src/main/java/org/egov/transformer/models/CaseOverallStatus.java` → lines: **20, 21**
- `dristi-services/transformer/src/main/java/org/egov/transformer/models/CaseReferenceNumberUpdateRequest.java` → lines: **21, 22**
- `dristi-services/transformer/src/main/java/org/egov/transformer/models/CaseSearch.java` → lines: **22, 24**
- `dristi-services/transformer/src/main/java/org/egov/transformer/models/CourtCase.java` → lines: **61, 63**
- `dristi-services/transformer/src/main/java/org/egov/transformer/models/Hearing.java` → lines: **58, 60, 142, 143**
- `dristi-services/transformer/src/main/java/org/egov/transformer/models/HearingCriteria.java` → lines: **29, 30**
- `dristi-services/transformer/src/main/java/org/egov/transformer/models/OpenHearing.java` → lines: **20, 21**
- `dristi-services/transformer/src/main/java/org/egov/transformer/models/Order.java` → lines: **44, 45**
- `dristi-services/transformer/src/main/java/org/egov/transformer/models/OrderAndNotification.java` → lines: **43, 44**
- `dristi-services/transformer/src/main/java/org/egov/transformer/models/Outcome.java` → lines: **20, 21**
- `dristi-services/transformer/src/main/java/org/egov/transformer/models/Task.java` → lines: **47, 48**
- `dristi-services/transformer/src/main/java/org/egov/transformer/repository/DBRepository.java` → lines: **22, 26, 28, 34, 38, 42, 46, 47, 48, 49, 50, 53, 55, 56, 59, 61, 62, 65, 67, 68, 71, 73, 74, 77, 82, 86, 89**
- `dristi-services/transformer/src/main/java/org/egov/transformer/service/CaseService.java` → lines: **105, 111, 167, 190, 191**
- `dristi-services/transformer/src/main/java/org/egov/transformer/service/DigitalizedDocumentService.java` → lines: **57, 60, 72**
- `dristi-services/transformer/src/main/java/org/egov/transformer/util/InboxUtil.java` → lines: **166, 171**


## 26. integration-services/icops_integration-kerala

### `cnrNumber`

- `integration-services/icops_integration-kerala/src/main/java/com/egov/icops_integrationkerala/model/Task.java` → lines: **50, 51**

### `filingNumber`

- `integration-services/icops_integration-kerala/src/main/java/com/egov/icops_integrationkerala/model/Task.java` → lines: **44, 45**


## 27. integration-services/njdg-transformer

### `cnrNumber`

- `integration-services/njdg-transformer/src/main/java/com/dristi/njdg_transformer/consumer/CaseConsumer.java` → lines: **67, 69, 148, 150, 180, 182, 211, 213**
- `integration-services/njdg-transformer/src/main/java/com/dristi/njdg_transformer/controller/NJDGController.java` → lines: **201, 206, 207, 220, 225, 226**
- `integration-services/njdg-transformer/src/main/java/com/dristi/njdg_transformer/model/cases/CaseConversionDetails.java` → lines: **24, 25**
- `integration-services/njdg-transformer/src/main/java/com/dristi/njdg_transformer/model/cases/CaseCriteria.java` → lines: **30, 31**
- `integration-services/njdg-transformer/src/main/java/com/dristi/njdg_transformer/model/cases/CourtCase.java` → lines: **82, 84**
- `integration-services/njdg-transformer/src/main/java/com/dristi/njdg_transformer/model/hearing/Hearing.java` → lines: **58, 60, 146, 147**
- `integration-services/njdg-transformer/src/main/java/com/dristi/njdg_transformer/model/hearing/HearingCriteria.java` → lines: **22, 23**
- `integration-services/njdg-transformer/src/main/java/com/dristi/njdg_transformer/model/order/Order.java` → lines: **46, 47**
- `integration-services/njdg-transformer/src/main/java/com/dristi/njdg_transformer/model/order/OrderCriteria.java` → lines: **21, 22**
- `integration-services/njdg-transformer/src/main/java/com/dristi/njdg_transformer/repository/CaseRepository.java` → lines: **333, 336**
- `integration-services/njdg-transformer/src/main/java/com/dristi/njdg_transformer/repository/querybuilder/CaseQueryBuilder.java` → lines: **72, 74, 76**
- `integration-services/njdg-transformer/src/main/java/com/dristi/njdg_transformer/service/impl/NJDGCaseTransformerImpl.java` → lines: **111, 159, 161, 166, 168, 175, 387, 389, 394, 396, 403, 408, 410, 415, 417, 424**

### `cmpNumber`

- `integration-services/njdg-transformer/src/main/java/com/dristi/njdg_transformer/model/cases/CourtCase.java` → lines: **74, 75**
- `integration-services/njdg-transformer/src/main/java/com/dristi/njdg_transformer/model/hearing/Hearing.java` → lines: **51, 52**
- `integration-services/njdg-transformer/src/main/java/com/dristi/njdg_transformer/service/impl/NJDGCaseTransformerImpl.java` → lines: **86, 97, 99, 105, 106, 109, 110, 111**

### `courtCaseNumber`

- `integration-services/njdg-transformer/src/main/java/com/dristi/njdg_transformer/model/cases/CaseCriteria.java` → lines: **39, 40**
- `integration-services/njdg-transformer/src/main/java/com/dristi/njdg_transformer/model/cases/CourtCase.java` → lines: **70, 72, 187, 188**
- `integration-services/njdg-transformer/src/main/java/com/dristi/njdg_transformer/model/hearing/Hearing.java` → lines: **45, 46**
- `integration-services/njdg-transformer/src/main/java/com/dristi/njdg_transformer/service/impl/NJDGCaseTransformerImpl.java` → lines: **86, 97**

### `filingNumber`

- `integration-services/njdg-transformer/src/main/java/com/dristi/njdg_transformer/consumer/CaseConsumer.java` → lines: **51, 56, 59, 62, 67, 69, 71, 74, 75, 78, 79, 92, 95, 116, 120, 122, 143, 148, 150, 152, 155, 163, 170, 172, 174, 180, 182, 184, 187, 188, 195, 202, 204, 206, 211, 213, 215, 218, 219, 226, 233, 235**
- `integration-services/njdg-transformer/src/main/java/com/dristi/njdg_transformer/controller/NJDGController.java` → lines: **203, 206, 207, 221, 225, 226**
- `integration-services/njdg-transformer/src/main/java/com/dristi/njdg_transformer/model/cases/CaseConversionDetails.java` → lines: **21, 22**
- `integration-services/njdg-transformer/src/main/java/com/dristi/njdg_transformer/model/cases/CaseCriteria.java` → lines: **33, 34**
- `integration-services/njdg-transformer/src/main/java/com/dristi/njdg_transformer/model/cases/CaseOverallStatus.java` → lines: **20, 21, 36, 37**
- `integration-services/njdg-transformer/src/main/java/com/dristi/njdg_transformer/model/cases/CourtCase.java` → lines: **63, 65**
- `integration-services/njdg-transformer/src/main/java/com/dristi/njdg_transformer/model/cases/Outcome.java` → lines: **20, 21, 33, 34**
- `integration-services/njdg-transformer/src/main/java/com/dristi/njdg_transformer/model/hearing/Hearing.java` → lines: **54, 56, 141, 142**
- `integration-services/njdg-transformer/src/main/java/com/dristi/njdg_transformer/model/hearing/HearingCriteria.java` → lines: **25, 26**
- `integration-services/njdg-transformer/src/main/java/com/dristi/njdg_transformer/model/order/Order.java` → lines: **40, 41**
- `integration-services/njdg-transformer/src/main/java/com/dristi/njdg_transformer/model/order/OrderCriteria.java` → lines: **24, 25**
- `integration-services/njdg-transformer/src/main/java/com/dristi/njdg_transformer/service/OrderNotificationService.java` → lines: **51, 107**
- `integration-services/njdg-transformer/src/main/java/com/dristi/njdg_transformer/service/OrderService.java` → lines: **314, 317**
- `integration-services/njdg-transformer/src/main/java/com/dristi/njdg_transformer/service/impl/NJDGCaseTransformerImpl.java` → lines: **180, 182, 188, 192, 195, 200, 203, 260**
- `integration-services/njdg-transformer/src/main/java/com/dristi/njdg_transformer/utils/NumberExtractor.java` → lines: **19, 22, 23, 29, 31, 37, 41, 45**


## 28. integration-services/summons-svc

### `cnrNumber`

- `integration-services/summons-svc/src/main/java/digit/service/DemandService.java` → lines: **287, 292**
- `integration-services/summons-svc/src/main/java/digit/util/PdfServiceUtil.java` → lines: **324**
- `integration-services/summons-svc/src/main/java/digit/web/models/Artifact.java` → lines: **77, 79**
- `integration-services/summons-svc/src/main/java/digit/web/models/CaseCriteria.java` → lines: **29, 30**
- `integration-services/summons-svc/src/main/java/digit/web/models/DemandAdditionalDetails.java` → lines: **19, 20**
- `integration-services/summons-svc/src/main/java/digit/web/models/SummonsPdf.java` → lines: **19, 20**
- `integration-services/summons-svc/src/main/java/digit/web/models/Task.java` → lines: **53, 54**
- `integration-services/summons-svc/src/main/java/digit/web/models/TaskCriteria.java` → lines: **21, 22**
- `integration-services/summons-svc/src/main/java/digit/web/models/orders/Order.java` → lines: **42, 43**
- `integration-services/summons-svc/src/main/java/digit/web/models/orders/OrderCriteria.java` → lines: **20, 21**

### `cmpNumber`

- `integration-services/summons-svc/src/main/java/digit/util/PdfServiceUtil.java` → lines: **212, 213**
- `integration-services/summons-svc/src/main/java/digit/web/models/SummonsPdf.java` → lines: **22, 23**

### `courtCaseNumber`

- `integration-services/summons-svc/src/main/java/digit/util/PdfServiceUtil.java` → lines: **211, 215**
- `integration-services/summons-svc/src/main/java/digit/web/models/CaseCriteria.java` → lines: **38, 39**
- `integration-services/summons-svc/src/main/java/digit/web/models/SummonsPdf.java` → lines: **88, 89**

### `filingNumber`

- `integration-services/summons-svc/src/main/java/digit/service/DemandService.java` → lines: **130, 286, 291, 427**
- `integration-services/summons-svc/src/main/java/digit/service/SummonsService.java` → lines: **264, 303**
- `integration-services/summons-svc/src/main/java/digit/util/PdfServiceUtil.java` → lines: **100, 306, 325, 328, 329, 351**
- `integration-services/summons-svc/src/main/java/digit/web/models/Artifact.java` → lines: **48, 51**
- `integration-services/summons-svc/src/main/java/digit/web/models/CaseCriteria.java` → lines: **32, 33**
- `integration-services/summons-svc/src/main/java/digit/web/models/DemandAdditionalDetails.java` → lines: **16, 17**
- `integration-services/summons-svc/src/main/java/digit/web/models/DemandCreateRequest.java` → lines: **25, 26**
- `integration-services/summons-svc/src/main/java/digit/web/models/MiscellaneuosDetails.java` → lines: **59, 60**
- `integration-services/summons-svc/src/main/java/digit/web/models/SummonsPdf.java` → lines: **25, 26**
- `integration-services/summons-svc/src/main/java/digit/web/models/Task.java` → lines: **47, 48**
- `integration-services/summons-svc/src/main/java/digit/web/models/orders/Order.java` → lines: **39, 40**
- `integration-services/summons-svc/src/main/java/digit/web/models/orders/OrderCriteria.java` → lines: **23, 24**


## 29. integration-services/treasury-backend

### `cnrNumber`

- `integration-services/treasury-backend/src/main/java/org/egov/eTreasury/model/CaseCriteria.java` → lines: **29, 30**
- `integration-services/treasury-backend/src/main/java/org/egov/eTreasury/model/CourtCase.java` → lines: **61, 62**
- `integration-services/treasury-backend/src/main/java/org/egov/eTreasury/service/PaymentService.java` → lines: **671**

### `cmpNumber`

- `integration-services/treasury-backend/src/main/java/org/egov/eTreasury/model/CourtCase.java` → lines: **64, 65**
- `integration-services/treasury-backend/src/main/java/org/egov/eTreasury/model/SMSTemplateData.java` → lines: **16**
- `integration-services/treasury-backend/src/main/java/org/egov/eTreasury/service/PaymentService.java` → lines: **477**
- `integration-services/treasury-backend/src/main/java/org/egov/eTreasury/service/SMSNotificationService.java` → lines: **129, 138, 150, 151, 152**

### `courtCaseNumber`

- `integration-services/treasury-backend/src/main/java/org/egov/eTreasury/model/CaseCriteria.java` → lines: **38, 39**
- `integration-services/treasury-backend/src/main/java/org/egov/eTreasury/model/CourtCase.java` → lines: **52, 53**
- `integration-services/treasury-backend/src/main/java/org/egov/eTreasury/model/SMSTemplateData.java` → lines: **15**
- `integration-services/treasury-backend/src/main/java/org/egov/eTreasury/service/PaymentService.java` → lines: **478**
- `integration-services/treasury-backend/src/main/java/org/egov/eTreasury/service/SMSNotificationService.java` → lines: **128, 145, 146, 147**

### `filingNumber`

- `integration-services/treasury-backend/src/main/java/org/egov/eTreasury/enrichment/TreasuryEnrichment.java` → lines: **169, 171**
- `integration-services/treasury-backend/src/main/java/org/egov/eTreasury/model/CaseCriteria.java` → lines: **32, 33**
- `integration-services/treasury-backend/src/main/java/org/egov/eTreasury/model/CourtCase.java` → lines: **46, 47**
- `integration-services/treasury-backend/src/main/java/org/egov/eTreasury/model/SMSTemplateData.java` → lines: **17**
- `integration-services/treasury-backend/src/main/java/org/egov/eTreasury/model/demand/DemandCreateRequest.java` → lines: **26, 27**
- `integration-services/treasury-backend/src/main/java/org/egov/eTreasury/service/PaymentService.java` → lines: **433, 434, 439, 445, 447, 474, 476, 549, 670**
- `integration-services/treasury-backend/src/main/java/org/egov/eTreasury/service/SMSNotificationService.java` → lines: **155, 156, 157**


---

## IMPACT SUMMARY

| Identifier | Total Lines Found | # Services |
|---|---|---|
| **cnrNumber** | 644 | 26 |
| **cmpNumber** | 311 | 24 |
| **courtCaseNumber** | 371 | 25 |
| **filingNumber** | 1595 | 29 |
