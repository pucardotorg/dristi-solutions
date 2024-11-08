
# Dristi Solutions - Application

This repository contains the Application service - a part of the larger DRISTI project aimed at delivering citizen centric justice. 

---

## Table of Contents

- [Project Overview](#project-overview)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Service Overview

The **Application Service** is a Java Spring Boot service responsible for handling core business logic, data processing, and API endpoints for filing Applications in a court case. Applications are a way of submitting requests to the court on behalf of the litigants. They can be used to submit documents, change hearing dates, respond to requests from the court etc.. 


## Tech Stack (Prerequisites)

- **Java 17**: Language for core service development
- **Spring Boot 3.2.2**: Backend framework
- **PostgreSQL 14**: Database for persistence. Database instance installed locally or in cloud (or Docker for containerized PostgreSQL)
- **Maven**: Dependency management
- **Kafka**: Message queue for event based, async architecture
- **Environment Variables**: Configured in application.properties

## Dependencies

The dependencies can be used from an installed DRISTI instance or by running the services locally. 

- **Case service**: The DRISTI case service. 
- **DIGIT services** : MDMS v2.0, IDGen, Workflow, Order, Filestore

---

## Getting Started

### Clone the Repository

```bash
git clone https://github.com/pucardotorg/dristi-solutions.git
cd dristi-solutions/backend/application
```
### Clone the configs repository
```
git clone https://github.com/pucardotorg/kerala-configs.git
cd kerala-configs/egov-persister
```
Locate the application-persister.yml.

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

Update application.properties:

1. Set up DB URL and credentials for DB access & Flyway
2. Set up Kafka host
```kafka.config.bootstrap_server_config```
2. Set up DRISTI service host URLs (either pointing to an installed DRISTI cloud instance or a port forwarded service or run the service locally)

```
egov.mdms.host
egov.idgen.host
egov.case.host
egov.workflow.host
egov.order.host
egov.filestore.host
```

4. Ensure the configured database and credentials match the application.properties file.

## Build & Run the service

Run PostgreSQL, Kafka, egov-persister. To build and run the application, use the following commands:

```bash
mvn clean install
mvn spring-boot:run
```

The application should now be accessible at `http://localhost:8080`.
---

## API Documentation

This service provides a REST API for managing applications.

- **Endpoints**: Refer to the API specification documentation for a full list of available endpoints, parameters, and response formats.

---

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork this repository.
2. Create a new branch for your feature or bug fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit your changes and push your branch:
   ```bash
   git push origin feature/your-feature-name
   ```
4. Create a pull request describing your changes.

---

## License

This project is licensed under the MIT License.

---

## Acknowledgments

We acknowledge all contributors and any open-source resources that helped shape this project.



Workflow related to Application module:
[ApplicationWorkflowConfigJson](../../docs/application/workflow/workflowConfig.json)

API-specs for application 
[application-api-specs](../../api_specifications/application-api-0.1.0.yaml)
