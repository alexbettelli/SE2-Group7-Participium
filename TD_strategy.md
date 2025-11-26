# Technical Debt Management Strategy

## 1. Introduction and Quality Objectives

This document formalizes the strategy for proactively and reactively managing Technical Debt (TD) within the project. Our primary goal is to **sustain architectural integrity, ensure long-term stability, and maximize system maintainability.**

---

### 1.1 Quality Objectives and Strategic Focus

Our strategic commitment is to maintain a **minimum acceptable quality threshold of Rating B** across all key development metrics (Maintainability and Reliability).

* **Maintainability:** our strategy focuses on **preserving a high standard** by enforcing architectural consistency.
* **Reliability:** this metric requires our primary focus and immediate attention to reduce risks of bugs and system instability. Our goal is to reduce these risks to **achieve a minimum Rating B**. 

This objective ensures a dedicated effort is made to elevate any metric below the standard while preserving the existing structural integrity of the codebase.

---

## 2. Prevention: Architectural Integrity and Quality Gates

Prevention is our first line of defense against the accumulation of unintentional TD.


### 2.1 Dual-Server Architecture and Data Management (React/Express)

The project is structured around a **Client-Server** architecture utilizing a **dual development/deployment environment**: **React** for the Frontend (Client) and **Express** for the Backend (Server). Architectural Technical Debt management focuses on maintaining a clear separation of roles between these two environments and enforcing a strictly controlled data flow.

* **Server-Side Validation (Security Mandate):** All incoming data sent from the Client (React) to the Server (Express) **must** undergo rigorous **Server-Side Validation** within the Express API endpoint logic. The omission of server-side validation is considered critical security TD and must be prevented in every PR.
* **Data Handling (Mappers):** We enforce the **Separation of Concerns** principle in data access by utilizing **Mappers**. Their function is to take *raw data* from the database (e.g., SQL rows) and transform them into well-defined **Models (objects)** that are then used and transmitted to the Client for frontend processing. This ensures the Client only interacts with consistent and filtered data structures.
* **Backend Logical Separation:** Complex business logic and data access operations must be isolated from the core HTTP request handling functions (routing/parsing), even if the classic MVC pattern is not used.
* **Review Mandate:** Any violation of these architectural standards (e.g., missing server-side validation, or incorrect data mapping logic) is considered architectural TD and **must be rejected** during the mandatory code review process.



### 2.2 Continuous Integration and Code Review

All code changes are subjected to mandatory peer review and automated checks before being merged.
* **Peer Review:** Every Pull Request (PR) requires approval from at least one team member other than the author.
* **SonarQube Integration:** **SonarQube Server** is integrated into our pipeline via GitHub Actions. Analysis is performed **automatically** whenever changes are introduced into the `main` branch.
* **Quality Gate Decision:** Team members reviewing the code must assess SonarQube results for the PR and decide on the necessary action:
    * **Immediate Fix:** For critical reliability.
    * **Technical Debt Task Creation:** For less urgent, but structural, maintainability issues.
    * **Justified Acceptance:** If the issue is determined to be a false positive.

---

## 3. Remediation and Workflow

We acknowledge that some TD is inevitable and must be addressed systematically by allocating time within each sprint.


### 3.1 Workflow and Task Management

* **Sprint Allocation:** Dedicated time is allocated during each sprint planning session to address prioritized Technical Debt, starting from Sprint 3.
* **Task Tracking:** A specific task labeled as 'Code Review' is created to track and manage identified TD items.
* **Ownership:** Technical Debt is ideally resolved by the **original implementer** of the code. If unavailable, the task is reassigned to another team member familiar with the relevant code area.
---

## 4. Testing Strategy (Enabling Safe Refactoring)

A robust testing suite is crucial for ensuring system stability and enabling safe, extensive refactoring, especially in areas with lower Reliability ratings.

### 4.1 Backend Unit and Integration Testing

* **Tooling:** We use **Vitest** for Unit Testing, heavily relying on mocking dependencies (e.g., Repositories) for fast, deterministic results.
* **Coverage Goal:** We target **80-100%** code coverage for critical business logic, ensuring that refactoring efforts do not introduce regression bugs.

### 4.2 End-to-End (E2E) Testing

* **Validation:** Critical user flows (e.g., Registration, Login, Report Submission) are verified using **Vitest** and **Supertest** to ensure that the fully integrated system functions correctly.

---

## 5. Knowledge Debt Mitigation

Lack of documentation is treated as "Knowledge Debt" and is mitigated through the following standards:
* **API Documentation:** We maintain an up-to-date **Swagger/OpenAPI** definition (`swagger.yaml`) that accurately reflects the current state of backend endpoints.
* **Code Documentation:** Complex algorithms or non-obvious design choices **must** include inline comments explaining the rationale (the "why") behind the implementation.

---

## 6. Strategy Review

The entire Technical Debt management strategy will be reviewed and discussed during every sprint **retrospective** to ensure its continuous effectiveness and adaptation to project needs.