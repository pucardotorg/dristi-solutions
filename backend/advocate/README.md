# Advocate service

This service handles the registration of new advocates and advocate clerks in the system. Advocates and clerks are created in the user and individual registries with linkages.

## Tech Stack

- Java 17 JDK or JVM installed locally
- Maven 
- Java Spring Boot 3.2.2
- Kafka 3.6+ running locally
- PostgreSQL 14+ locally installed & running or deployed in the cloud

## Dependencies

Below are the DRISTI services that this service depends on:
- MDMS v2.0
- Workflow
- IDGen
- Notification (SMS)
- Individual
- User

## Getting started

### Clone the repository
```
git clone https://github.com/pucardotorg/dristi-solutions.git
cd dristi-solutions/backend/advocate
```

### Clone the configs repository
```
git clone https://github.com/pucardotorg/kerala-configs.git
cd kerala-configs/egov-persister
```
Locate the advocate-persister.yml and advocate-clerk-persister.yml files.

### Clone the DIGIT-Core repository

```
https://github.com/egovernments/Digit-Core.git
cd core-services/egov-persister
```

Import the egov-persister project from DIGIT-Core and modify the application.properties egov.persist.yml.repo.path property with the path to the persister configuration files for the service. Use a comma separated list if there are multiple persister files.

### Setup database

Create a database in PostgreSQL

```CREATE DATABASE dristi_db;```

## Configuration
In application.properties:

1. Tweak the database configuration and Flyway configuration sections to reflect the DB name, username and password.
2. Enter the Kafka host URL
3. Enter the dependent service host URLs:
- egov.individual.host
- egov.mdms.host
- egov.user.host
- egov.idgen.host
- egov.workflow.host

## Build the service

Build the service using maven.

```
mvn clean install
mvn spring-boot:run
```

## Running the service
Run PostgreSQL, Kafka, egov-persister. Run the service via IDE or from the command line

## API specifications

## Workflows related to advocate module

1. [advocateregistration-workflowConfig.json](../../docs/Advocate/worfkow/advocateregistration-workflowConfig.json)
2. [advocateclerkregistration-workflowConfig - Copy.json](..%2F..%2Fdocs%2FAdvocate%2Fworfkow%2Fadvocateclerkregistration-workflowConfig%20-%20Copy.json)
