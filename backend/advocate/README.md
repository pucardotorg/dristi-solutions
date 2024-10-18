# Advocate Service

## Overview
This module hosts the backend service for managing the advocate and advocate clerk registries within the Dristi platform. It provides APIs to create, update, and search advocate-related & advocate clerk-related data.

## Prerequisites
- **Java** (version 17 or higher)
- **Spring Boot** (3.2.2 is recommended) 
- **Maven** for dependency management and builds
- **PostgreSQL** (v14 or higher) for database management
- **Docker** (optional, for containerized deployments)
- **DIGIT Platform Services** (2.9 LTS): The service relies on core components from the DIGIT platform. Run the dependent components locally or point to a deployed version of the platform

## Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/pucardotorg/dristi-solutions.git
cd dristi-solutions/backend/advocate
```

### 2. Modify application.properties file:

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_user
DB_PASSWORD=your_password
DIGIT_API_URL=https://api.digit.org
```
### 3. Build the project

In the IDE or via commandline as follows:

```mvn clean install```

## API Documentation
The advocate backend offers the following key endpoints:

```
POST /advocate/v1/_create - Register a new advocate
POST /advocate/v1/_update - Update advocate details
POST /advocate/v1/status/_search - Search for advocates by registration status
POST /clerk/v1/_create - Register a new advocate clerk
POST /clerk/v1/status/_search - Search clerks by status
```

Refer to the full API Specification for detailed request and response structures.

## Workflows

1. [advocateregistration-workflowConfig.json](../../docs/Advocate/worfkow/advocateregistration-workflowConfig.json)
2. [advocateclerkregistration-workflowConfig - Copy.json](..%2F..%2Fdocs%2FAdvocate%2Fworfkow%2Fadvocateclerkregistration-workflowConfig%20-%20Copy.json)
