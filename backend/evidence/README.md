
# Dristi - Evidence

## Table of Contents

- [Project Overview](#service-overview)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Service Overview

The **Evidence Service** is a Java Spring Boot service responsible for handling core business logic and API endpoints for uploading evidence in a court case. Artifacts can be uploaded during the course of the case and only a few will become accepted evidence. Evidence can be of various media types and uploaded in different formats. Currently, only digital evidence is handled.

## Tech Stack (Prerequisites)

- **Java 17**: Language for core service development
- **Spring Boot 3.2.2**: Backend framework
- **PostgreSQL 14**: Database for persistence. Database instance installed locally or in cloud (or Docker for containerized PostgreSQL)
- **Maven**: Dependency management
- **Kafka**: Message queue for event based, async architecture
- **Environment Variables**: Configured in application.properties

## Dependencies

- **Case service**: The DRISTI case service 
- **Order service**: The DRISTI Order service
- **Hearing service**: The DRISTI hearing service
- **DIGIT services** : MDMS v2.0, Workflow, IDGen, Persister, Indexer

Note:
1. Except for the Persister/Indexer, all other services can be used from an installed DRISTI instance on the cloud.
2. Dependent services can either be port forwarded and referenced OR can be used directly via URL
3. Persister/Indexer must be set up locally.

---

## Getting Started

### Clone the Repository

```bash
git clone https://github.com/pucardotorg/dristi-solutions.git
cd dristi-solutions/backend/evidence
```

### Clone the configs repository
```
git clone https://github.com/pucardotorg/kerala-configs.git
cd kerala-configs/egov-persister
```
Locate the evidence-persister.yml file.

### Clone the DIGIT-Core repository

```
https://github.com/egovernments/Digit-Core.git
cd core-services/egov-persister
```

Import the egov-persister project from DIGIT-Core and modify the application.properties egov.persist.yml.repo.path property with the path to the persister configuration files for the service. Use a comma separated list if there are multiple persister files.

### Setup database

Create a database in PostgreSQL

```CREATE DATABASE dristi_evidence_db;```

Ensure the credentials for the database match ones provided in the configuration

### Configuration

Update application.properties:
1. Set up DB URL and credentials for DB access & Flyway
2. Set up Kafka host
```kafka.config.bootstrap_server_config```
3. Set up DIGIT service host URLs (either pointing to an installed DIGIT cloud instance or a portforwarded service or run the service locally)

```
egov.mdms.host
egov.idgen.host
egov.case.host
egov.workflow.host
egov.order.host
egov.application.host
egov.hearing.host
```

### Build and Run

Run PostgreSQL, Kafka, egov-persister. To build and run the application, use the following commands:

```bash
mvn clean install
mvn spring-boot:run
```

Or run via IDE

The application should now be accessible at `http://localhost:8080`.

---

## API Documentation

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