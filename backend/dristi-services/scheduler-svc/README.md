# Scheduler Service 
version: 1.0.0

## Description
This service is designed to manage the **Judge Calendar** by efficiently tracking **hearings**,
**judges' leaves**, **court holidays**, and **reschedule requests**. It also automates 
the generation of the **cause-list** and handles **opt-out details** for rescheduled hearings,
providing a streamlined solution for judicial scheduling and management.

---

### Technologies Used
- **Spring Boot** (version 3.2.2)
- **JDBC** for database connectivity and transactions**
- **Flyway** for database migrations
- **PostgreSQL** as the database
- **Maven** build tool
- **Swagger** 

---

## Getting Started

### Prerequisites
Ensure you have the following installed:
- [JDK 17+](https://adoptium.net/)
- [Maven](https://maven.apache.org/) (version 3.8.1)
- [Docker](https://www.docker.com/) (if using containerized databases or kafka)

### Installation & Setup

1.  Clone the repository: `git clone https://github.com/pucardotorg/dristi-solutions.git`
2.  Navigate to the project directory: `cd /backend/scheduler-svc`
3.  Configure database and flyway properties in application.properties
4.  Configure kafka properties in application.properties
5.  Required service: **user service**
6.  Configure **user service, mdms service, advocate service, hearing service, pdf service, application service, analytics service**
7.  Run persister service locally and pass the persister files in persister application.properties
8.  Build the project: `mvn clean install`
9.  Run the application: `mvn spring-boot:run`
10. Access the Swagger UI: `http://localhost:8080/swagger-ui.html`

