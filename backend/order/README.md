
# Dristi - Order

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

The **Order Service** is a Java Spring Boot service responsible for handling core business logic and API endpoints for issuing and managing orders in a court case. 


## Tech Stack (Prerequisites)

- **Java 17**: Language for core service development
- **Spring Boot 3.2.2**: For microservices
- **PostgreSQL 14**: Database for persistence. Database instance installed locally or in cloud (or Docker for containerized PostgreSQL)
- **Maven**: Dependency management
- **Kafka**: Message queue for event based, async architecture

## Dependencies

- **Case service**: The DRISTI case service 
- **Application service**: The DRISTI Application service
- **DIGIT services** : MDMS v2.0, Workflow, IDGen, Individual, Persister, Indexer

Note:
1. Except for the Persister/Indexer, all other services can be used from an installed DRISTI instance on the cloud.
2. Dependent services can either be port forwarded and referenced OR can be used directly via URL
3. Persister/Indexer must be set up locally.


---

## Getting Started

### Clone the Repository

```bash
git clone https://github.com/pucardotorg/dristi-solutions.git
cd dristi-solutions/backend/order
```

### Clone the configs repository
```
git clone https://github.com/pucardotorg/kerala-configs.git
cd kerala-configs/egov-persister
```

Locate the order-persister.yml file

### Clone the DIGIT-Core repository
```
https://github.com/egovernments/Digit-Core.git
cd core-services/egov-persister
```
Import the egov-persister project from DIGIT-Core and modify the application.properties with the path to the persister configuration for the service. 

### Database Setup

Run the following commands to set up the database:

```sql
CREATE DATABASE dristi_db;
```

Ensure the configured database and credentials match the application.properties file.

### Configuration

Update application.properties
1. Set up DB URL and credentials for DB access & Flyway
2. Set up Kafka host
```kafka.config.bootstrap_server_config```
2. Set up DIGIT service host URLs (either pointing to an installed DIGIT cloud instance or a portforwarded service or run the service locally)

```
egov.mdms.host
egov.idgen.host
egov.case.host
egov.workflow.host
egov.application.host
egov.individual.host
```

### Build and Run

1. Run Kafka, Postgres and the persister service

2. To build and run the application, use the following commands:

```bash
mvn clean install
mvn spring-boot:run
```

3. Or run via IDE

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