# Project Context

## Product Purpose
- **Mission**: PUCAR (Dristi Solutions) is a digital platform designed to transform the dispute resolution experience for citizens in India
- **Vision**: To go beyond digitizing paper-based processes and transform end-to-end court processes for a digital environment
- **Goal**: Create Digital Courts of the future as a Digital Public Good built on top of the DIGIT platform
- **Impact**: Radically improve access, efficiency, and predictability of the judicial system for its users

## Domain Concepts

### Core Entities
- **Case**: The central entity representing a legal dispute with unique identifiers (caseNumber, cnrNumber, filingNumber)
- **Litigants**: Parties involved in the case (plaintiffs, defendants, etc.)
- **Representatives**: Legal representatives (advocates) for the litigants
- **Hearings**: Court proceedings scheduled for a case
- **Orders**: Judicial decisions or directives issued by the court
- **Evidence**: Documents, testimonies, and exhibits submitted as proof
- **Witnesses**: Individuals providing testimony in a case
- **Tasks**: Workflow items assigned to various stakeholders
- **Applications**: Formal requests submitted to the court (e.g., bail applications)

### Key Registries
- **Case Registry**: Central repository of all case information
- **Witness Registry**: Database of all witnesses and their testimonies
- **Document Registry**: Storage for all case-related documents
- **Court Registry**: Information about courts, benches, and jurisdictions

## User Roles

### External Users
- **Citizens**: General public accessing case information or services
- **Litigants**: Parties directly involved in cases
- **Advocates**: Legal representatives for litigants
- **Witnesses**: Individuals providing testimony

### Internal Users
- **Judges**: Judicial officers presiding over cases
- **Court Staff**: Administrative personnel managing case workflows
- **Registry Officers**: Officials responsible for case registration and management
- **Scrutiny Officers**: Personnel who review case filings for completeness and compliance

## Core Flows

### Case Lifecycle
1. **Case Filing**: Submission of case details and supporting documents
2. **Scrutiny**: Review of case filing for completeness and compliance
3. **Registration**: Official recording of the case in the system
4. **Admission**: Acceptance of the case for hearing
5. **Hearings**: Scheduled court proceedings
6. **Evidence Management**: Submission and review of evidence
7. **Witness Testimony**: Recording of witness statements
8. **Order Issuance**: Creation and publication of judicial orders
9. **Case Disposal**: Final resolution and closure of the case

### Document Management
1. **Document Upload**: Submission of digital documents
2. **Document Verification**: Validation of uploaded documents
3. **Document Retrieval**: Access to case-related documents
4. **E-Signing**: Digital signing of documents and orders

### Notification System
1. **SMS Notifications**: Alerts for case updates, hearing schedules
2. **Email Communications**: Formal communications regarding case status
3. **In-App Notifications**: System alerts for users

## Explicit Non-Goals
- **Not a Case Management System Replacement**: Enhances but doesn't completely replace existing systems
- **Not a Legal Research Platform**: Focuses on case processing, not legal research or precedent analysis
- **Not a Litigation Prediction Tool**: Does not predict case outcomes or provide legal advice
- **Not a Public Records Database**: Access is restricted to authorized users with appropriate permissions
- **Not a General-Purpose Document Management System**: Specialized for court documents only
- **Not a Communication Platform**: While it includes notifications, it's not designed for general communication between parties
