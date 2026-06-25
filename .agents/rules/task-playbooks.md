---
trigger: always_on
---

# Task Playbooks

## Adding a New API

### 1. Define API Specification
- Create or update YAML file in `/api_specifications` directory
- Follow OpenAPI 3.0 standards
- Include proper request/response schemas
- Document all parameters and responses

### 2. Create Model Classes
```java
// Step 1: Create request model
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class NewFeatureRequest {
    @JsonProperty("RequestInfo")
    private RequestInfo requestInfo;
    
    @JsonProperty("newFeature")
    @Valid
    private NewFeature newFeature;
}

// Step 2: Create response model
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class NewFeatureResponse {
    @JsonProperty("ResponseInfo")
    private ResponseInfo responseInfo;
    
    @JsonProperty("newFeature")
    private NewFeature newFeature;
}

// Step 3: Create domain model
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class NewFeature {
    @JsonProperty("id")
    private String id;
    
    @NotNull
    @JsonProperty("tenantId")
    private String tenantId;
    
    // Other properties
    
    @JsonProperty("isActive")
    private Boolean isActive;
    
    @JsonProperty("additionalDetails")
    private JsonNode additionalDetails;
}
```

### 3. Create Database Migration
```sql
-- Create in src/main/resources/db/migration/main/V<timestamp>__<feature>__ddl.sql
CREATE TABLE dristi_new_feature (
    id varchar(64) NOT NULL PRIMARY KEY,
    tenantId varchar(64) NOT NULL,
    -- Other columns
    isActive bool NULL,
    additionalDetails jsonb NULL,
    createdBy varchar(64) NULL,
    lastModifiedBy varchar(64) NULL,
    createdTime int8 NULL,
    lastModifiedTime int8 NULL
);
```

### 4. Implement Repository Layer
```java
// Step 1: Create query builder
@Component
public class NewFeatureQueryBuilder {
    private static final String BASE_QUERY = "SELECT * FROM dristi_new_feature";
    
    public String getNewFeatureSearchQuery(NewFeatureSearchCriteria criteria, List<Object> preparedStmtList) {
        StringBuilder query = new StringBuilder(BASE_QUERY);
        
        query.append(" WHERE tenantId = ?");
        preparedStmtList.add(criteria.getTenantId());
        
        // Add other filters
        
        return query.toString();
    }
}

// Step 2: Create row mapper
@Component
public class NewFeatureRowMapper implements ResultSetExtractor<List<NewFeature>> {
    @Override
    public List<NewFeature> extractData(ResultSet rs) throws SQLException, DataAccessException {
        List<NewFeature> features = new ArrayList<>();
        while (rs.next()) {
            features.add(NewFeature.builder()
                .id(rs.getString("id"))
                .tenantId(rs.getString("tenantId"))
                // Map other fields
                .isActive(rs.getBoolean("isActive"))
                .additionalDetails(getAdditionalDetails(rs))
                .build());
        }
        return features;
    }
    
    private JsonNode getAdditionalDetails(ResultSet rs) throws SQLException {
        try {
            return mapper.readTree(rs.getString("additionalDetails"));
        } catch (Exception e) {
            return null;
        }
    }
}

// Step 3: Create repository
@Repository
public class NewFeatureRepository {
    private final JdbcTemplate jdbcTemplate;
    private final NewFeatureQueryBuilder queryBuilder;
    private final NewFeatureRowMapper rowMapper;
    
    @Autowired
    public NewFeatureRepository(JdbcTemplate jdbcTemplate, NewFeatureQueryBuilder queryBuilder, NewFeatureRowMapper rowMapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.queryBuilder = queryBuilder;
        this.rowMapper = rowMapper;
    }
    
    public List<NewFeature> search(NewFeatureSearchCriteria criteria) {
        List<Object> preparedStmtList = new ArrayList<>();
        String query = queryBuilder.getNewFeatureSearchQuery(criteria, preparedStmtList);
        return jdbcTemplate.query(query, preparedStmtList.toArray(), rowMapper);
    }
    
    public void save(NewFeature newFeature) {
        // Implementation
    }
}
```

### 5. Implement Service Layer
```java
@Service
public class NewFeatureService {
    private final NewFeatureRepository repository;
    private final EnrichmentService enrichmentService;
    
    @Autowired
    public NewFeatureService(NewFeatureRepository repository, EnrichmentService enrichmentService) {
        this.repository = repository;
        this.enrichmentService = enrichmentService;
    }
    
    public NewFeature create(NewFeatureRequest request) {
        NewFeature newFeature = request.getNewFeature();
        enrichmentService.enrichNewFeatureOnCreate(newFeature, request.getRequestInfo());
        repository.save(newFeature);
        return newFeature;
    }
    
    public List<NewFeature> search(NewFeatureSearchCriteria criteria) {
        return repository.search(criteria);
    }
}
```

### 6. Implement Controller
```java
@RestController
@RequestMapping("/v1")
public class NewFeatureController {
    private final NewFeatureService service;
    private final ResponseInfoFactory responseInfoFactory;
    
    @Autowired
    public NewFeatureController(NewFeatureService service, ResponseInfoFactory responseInfoFactory) {
        this.service = service;
        this.responseInfoFactory = responseInfoFactory;
    }
    
    @PostMapping("/_create")
    public ResponseEntity<NewFeatureResponse> create(@Valid @RequestBody NewFeatureRequest request) {
        NewFeature newFeature = service.create(request);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(request.getRequestInfo(), true);
        NewFeatureResponse response = NewFeatureResponse.builder()
            .responseInfo(responseInfo)
            .newFeature(newFeature)
            .build();
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
    
    @PostMapping("/_search")
    public ResponseEntity<NewFeatureResponse> search(@Valid @RequestBody NewFeatureSearchRequest request) {
        List<NewFeature> features = service.search(request.getCriteria());
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(request.getRequestInfo(), true);
        NewFeatureResponse response = NewFeatureResponse.builder()
            .responseInfo(responseInfo)
            .newFeatures(features)
            .build();
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}
```

### 7. Add Frontend API Service
```javascript
export const NewFeatureService = {
  create: (data) => {
    return Digit.ApiCall.post("/new-feature/v1/_create", data);
  },
  search: (data) => {
    return Digit.ApiCall.post("/new-feature/v1/_search", data);
  }
};
```

## Adding a New Screen/Module

### 1. Create Module Structure
```
frontend/micro-ui/web/micro-ui-internals/packages/modules/new-module/
├── src/
│   ├── components/
│   │   └── NewComponent.js
│   ├── pages/
│   │   ├── citizen/
│   │   │   └── NewPage.js
│   │   └── employee/
│   │       └── NewPage.js
│   ├── hooks/
│   │   └── useNewFeature.js
│   ├── services/
│   │   └── index.js
│   └── Module.js
├── package.json
```

### 2. Define Module Entry Point
```javascript
// Module.js
import React from "react";
import { CitizenHomeCard, EmployeeHomeCard } from "@egovernments/digit-ui-react-components";

const NewModuleComponent = ({ stateCode, userType, tenants }) => {
  const moduleConfig = {
    label: "MODULE_NEW_MODULE",
    type: userType === "citizen" ? "citizen" : "employee",
    routes: [
      {
        path: userType === "citizen" ? "citizen/new-module" : "employee/new-module",
        component: NewModulePage
      }
    ]
  };
  
  return moduleConfig;
};

const componentsToRegister = {
  NewModuleComponent,
  NewModulePage
};

export const initNewModule = () => {
  Object.entries(componentsToRegister).forEach(([key, value]) => {
    Digit.ComponentRegistryService.setComponent(key, value);
  });
};
```

### 3. Create Page Component
```javascript
// pages/employee/NewPage.js
import React, { useState, useEffect } from "react";
import { 
  Card, 
  Header, 
  Loader, 
  ActionBar, 
  SubmitBar 
} from "@egovernments/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";

const NewPage = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const [isLoading, setIsLoading] = useState(false);
  const tenantId = Digit.ULBService.getCurrentTenantId();
  
  // Fetch data or initialize state
  
  const handleSubmit = async () => {
    // Handle form submission
  };
  
  if (isLoading) return <Loader />;
  
  return (
    <React.Fragment>
      <Header>{t("NEW_PAGE_TITLE")}</Header>
      <Card>
        {/* Page content */}
      </Card>
      <ActionBar>
        <SubmitBar label={t("SUBMIT")} onSubmit={handleSubmit} />
      </ActionBar>
    </React.Fragment>
  );
};

export default NewPage;
```

### 4. Create Custom Hook
```javascript
// hooks/useNewFeature.js
import { useQuery, useMutation } from "react-query";

export const useNewFeatureCreate = () => {
  return useMutation((data) => Digit.NewFeatureService.create(data));
};

export const useNewFeatureSearch = (filters = {}, config = {}) => {
  const client = Digit.ApiCall;
  const tenantId = Digit.ULBService.getCurrentTenantId();
  
  return useQuery(
    ["NEW_FEATURE_SEARCH", filters],
    async () => {
      const requestData = {
        RequestInfo: Digit.RequestInfo,
        criteria: {
          tenantId,
          ...filters
        }
      };
      const response = await client.post("/new-feature/v1/_search", requestData);
      return response.newFeatures || [];
    },
    config
  );
};
```

### 5. Register Module in package.json
```json
{
  "name": "@egovernments/digit-ui-module-new-module",
  "version": "1.0.0",
  "license": "MIT",
  "main": "dist/index.js",
  "module": "dist/index.modern.js",
  "source": "src/Module.js",
  "dependencies": {
    "@egovernments/digit-ui-react-components": "^1.8.2-beta.11",
    "react": "17.0.2",
    "react-dom": "17.0.2",
    "react-hook-form": "6.15.8",
    "react-i18next": "11.16.2",
    "react-query": "3.6.1",
    "react-router-dom": "5.3.0"
  }
}
```

### 6. Update Main package.json
```json
// frontend/micro-ui/web/package.json
{
  "dependencies": {
    // Existing dependencies
    "@egovernments/digit-ui-module-new-module": "1.0.0"
  }
}
```

### 7. Initialize Module in App
```javascript
// src/App.js
import { initNewModule } from "@egovernments/digit-ui-module-new-module";

const App = () => {
  // Initialize all modules
  initNewModule();
  
  return (
    // App component
  );
};
```

## Adding State Management

### 1. Create Redux Slice
```javascript
// Create in frontend/micro-ui/web/micro-ui-internals/packages/libraries/src/redux/slices/newFeatureSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  entities: {},
  loading: false,
  error: null
};

const newFeatureSlice = createSlice({
  name: "newFeature",
  initialState,
  reducers: {
    fetchNewFeatureRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchNewFeatureSuccess: (state, action) => {
      state.loading = false;
      state.entities = action.payload.reduce((acc, item) => {
        acc[item.id] = item;
        return acc;
      }, {});
    },
    fetchNewFeatureFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    // Additional reducers
  }
});

export const {
  fetchNewFeatureRequest,
  fetchNewFeatureSuccess,
  fetchNewFeatureFailure
} = newFeatureSlice.actions;

export default newFeatureSlice.reducer;
```

### 2. Create Thunk Actions
```javascript
// Add to frontend/micro-ui/web/micro-ui-internals/packages/libraries/src/redux/actions/newFeature.js
import {
  fetchNewFeatureRequest,
  fetchNewFeatureSuccess,
  fetchNewFeatureFailure
} from "../slices/newFeatureSlice";

export 