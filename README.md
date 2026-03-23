# Microservices Documentation for InstaBuy

## Overview
InstaBuy is a microservices-based application comprising four main services: Authentication, Inventory, Order, and Payment. This document provides detailed information about each service, including their ports, databases, dependencies, and setup instructions.

---

### 1. Authentication Service
- **Description**: Manages user authentication and authorization.
- **Port**: `8081`
- **Database**: MongoDB
- **Dependencies**:
  - Spring Boot
  - Spring Security
  - JWT (Json Web Token)
- **Setup Instructions**:
  1. Clone the repository.
  2. Navigate to the `authentication-service` directory.
  3. Configure the `application.properties` for MongoDB connection.
  4. Run the service using `mvn spring-boot:run`.

---

### 2. Inventory Service
- **Description**: Handles product inventory management.
- **Port**: `8082`
- **Database**: PostgresSQL
- **Dependencies**:
  - Spring Boot
  - Spring Data JPA
  - PostgreSQL Driver
- **Setup Instructions**:
  1. Clone the repository.
  2. Navigate to the `inventory-service` directory.
  3. Update `application.properties` with database credentials.
  4. Execute `mvn spring-boot:run` to start the service.

---

### 3. Order Service
- **Description**: Processes customer orders and manages order status.
- **Port**: `8083`
- **Database**: MySQL
- **Dependencies**:
  - Spring Boot
  - Spring Data JPA
  - MySQL Driver
- **Setup Instructions**:
  1. Clone the repository.
  2. Navigate to the `order-service` directory.
  3. Configure `application.properties` with MySQL connection details.
  4. Use `mvn spring-boot:run` to launch the service.

---

### 4. Payment Service
- **Description**: Manages payment processing and transaction handling.
- **Port**: `8085`
- **Database**: SQLite
- **Dependencies**:
  - Spring Boot
  - Spring Data JPA
  - SQLite Driver
- **Setup Instructions**:
  1. Clone the repository.
  2. Navigate to the `payment-service` directory.
  3. Set up `application.properties` for SQLite usage.
  4. Start the service using `mvn spring-boot:run`.

---

## Conclusion
Following this guide will help set up the InstaBuy microservices environment efficiently, allowing for seamless interactions between services. If you encounter any issues, please reach out for support!
