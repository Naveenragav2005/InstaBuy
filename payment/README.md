# Payment Service

This module handles payment creation, payment verification, webhook processing, and order status updates for the InstaBuy system.

It is a Spring Boot service integrated with:

- Razorpay for real payment order creation and signature verification
- MySQL for storing payment records
- Order Service through OpenFeign for updating order status after payment success or failure

## What This Service Does

The payment service is responsible for four core jobs:

1. Create a Razorpay order before checkout starts.
2. Save a local payment record with `PENDING` status.
3. Verify payment completion either from the frontend callback or Razorpay webhook.
4. Notify the Order Service so the order becomes `PAID` or `CANCELLED`.

## High-Level Flow

The normal payment flow is:

1. Frontend calls `POST /payment/create-order`.
2. Payment service creates a Razorpay order and stores a local `payments` row as `PENDING`.
3. Frontend opens Razorpay checkout using the returned `razorpay_order_id`.
4. Razorpay returns `razorpay_payment_id`, `razorpay_order_id`, and `razorpay_signature` to the frontend.
5. Frontend sends those values to `POST /payment/verify`.
6. Payment service validates the signature.
7. If valid, payment becomes `SUCCESS` and Order Service is updated to `PAID`.
8. Razorpay also sends a webhook to `POST /payment/webhook`.
9. Webhook is verified and used as a server-to-server confirmation path.

## Main Points

- The service uses Razorpay instead of mock payment logic for the main flow.
- A payment is first stored as `PENDING`, then updated to `SUCCESS` or `FAILED`.
- Webhook processing is important because it is the trusted server-to-server confirmation path.
- Payment updates are idempotent for successful payments: if a payment is already `SUCCESS`, duplicate success handling is skipped.
- The service updates the Order Service automatically after payment status changes.
- A deprecated `/payment/pay` endpoint still exists for backward compatibility with older code.

## Project Structure

Relevant source files:

- `src/main/java/com/example/payment/PaymentApplication.java`
- `src/main/java/com/example/payment/controller/paymentController.java`
- `src/main/java/com/example/payment/service/paymentService.java`
- `src/main/java/com/example/payment/client/OrderClient.java`
- `src/main/java/com/example/payment/config/RazorpayConfig.java`
- `src/main/java/com/example/payment/model/payment.java`
- `src/main/java/com/example/payment/model/PaymentStatus.java`
- `src/main/java/com/example/payment/repo/paymentRepo.java`
- `src/main/java/com/example/payment/dto/CreateOrderRequest.java`
- `src/main/java/com/example/payment/dto/VerifyPaymentRequest.java`
- `src/main/resources/application.yml`

## Class-by-Class Explanation

### 1. `PaymentApplication`

File: `src/main/java/com/example/payment/PaymentApplication.java`

Purpose:

- Main Spring Boot entry point.
- Starts the payment microservice.
- Enables Feign clients using `@EnableFeignClients`.

Why it matters:

- Without this class, the application would not boot.
- It also enables the `OrderClient` Feign interface to work.

### 2. `paymentController`

File: `src/main/java/com/example/payment/controller/paymentController.java`

Purpose:

- Exposes all payment-related REST APIs under `/payment`.
- Delegates business logic to `paymentService`.

Endpoints inside this controller:

#### `POST /payment/create-order`

What it does:

- Accepts `orderId`, `userId`, and `amount`.
- Calls `paymentService.createRazorpayOrder(...)`.
- Returns:
  - `razorpay_order_id`
  - `status = PENDING`

Why it exists:

- Razorpay checkout requires a Razorpay order to exist before payment begins.

#### `POST /payment/verify`

What it does:

- Accepts Razorpay callback fields:
  - `razorpayOrderId`
  - `razorpayPaymentId`
  - `razorpaySignature`
- Reads the `Authorization` header from the request.
- Calls `paymentService.verifyPaymentSignature(...)`.
- If valid:
  - marks payment as `SUCCESS`
  - updates the related order to `PAID`
- If invalid:
  - marks payment as `FAILED`
  - updates the related order to `CANCELLED`

Why it exists:

- This is the frontend-driven confirmation path immediately after checkout.

#### `POST /payment/webhook`

What it does:

- Accepts raw Razorpay webhook payload and `X-Razorpay-Signature`.
- Passes both to `paymentService.handleWebhookEvent(...)`.
- Returns success or error response depending on signature verification and processing result.

Why it exists:

- This is the server-to-server confirmation flow.
- It reduces dependence on only the frontend callback.

#### `POST /payment/pay` (Deprecated)

What it does:

- Calls the old `processPayment(...)` logic.
- Uses random success/failure behavior.

Why it should not be used:

- It is mock logic kept only for backward compatibility.
- The real flow is `create-order -> verify -> webhook`.

### 3. `paymentService`

File: `src/main/java/com/example/payment/service/paymentService.java`

Purpose:

- Contains the main business logic of the payment service.
- Handles Razorpay integration, signature verification, persistence, and Order Service communication.

Dependencies used by this class:

- `paymentRepo` for database access
- `OrderClient` for updating the order status
- `RazorpayClient` for creating Razorpay orders
- `razorpay.secret` from configuration for HMAC verification

Important methods:

#### `createRazorpayOrder(Long orderId, Long userId, Double amount)`

What it does:

- Converts amount from rupees to paise.
- Builds a Razorpay order request with:
  - amount
  - currency = `INR`
  - receipt = `order_<orderId>`
- Calls Razorpay to create the order.
- Saves a local `payment` entity with:
  - `orderId`
  - `userId`
  - `amount`
  - `status = PENDING`
  - `razorpayOrderId`
- Returns the `razorpay_order_id`.

Why it matters:

- This method links the app's internal order with Razorpay's order.
- It initializes the local payment tracking record.

#### `verifyPaymentSignature(String razorpayOrderId, String razorpayPaymentId, String razorpaySignature)`

What it does:

- Generates an HMAC SHA256 signature using:
  - `razorpayOrderId + "|" + razorpayPaymentId`
  - the Razorpay secret key
- Compares the generated signature with the signature sent by Razorpay.

Why it matters:

- It ensures the payment response was not tampered with.
- A valid signature means the callback data is authentic.

#### `updatePaymentStatus(String razorpayOrderId, String razorpayPaymentId, PaymentStatus status, String token)`

What it does:

- Finds the local payment by `razorpayOrderId`.
- If payment is not found, logs and exits.
- If payment is already `SUCCESS`, skips duplicate updates.
- Otherwise:
  - updates `status`
  - saves `razorpayPaymentId`
  - copies the same value into `transactionId`
  - persists the updated record
- Maps payment status to order status:
  - `SUCCESS -> PAID`
  - `FAILED -> CANCELLED`
- Calls Order Service:
  - with JWT token when available
  - without token for internal webhook flow

Why it matters:

- This is the state transition method of the service.
- It keeps both payment and order state in sync.

#### `handleWebhookEvent(String payload, String signature)`

What it does:

- Verifies webhook signature using HMAC SHA256.
- Parses the raw JSON payload.
- Reads the event type.
- Extracts:
  - `razorpayPaymentId`
  - `razorpayOrderId`
- Maps supported events:
  - `payment.captured -> SUCCESS`
  - `payment.failed -> FAILED`
- Calls `updatePaymentStatus(...)`.

Why it matters:

- This is the backend confirmation path from Razorpay.
- It handles payment updates even if the frontend callback is delayed or missed.

#### `processPayment(Long orderId, Long userId, Double amount, String token)` (Deprecated)

What it does:

- Creates a `payment` object using old mock behavior.
- Randomly marks the payment `SUCCESS` or `FAILED`.
- Updates Order Service immediately.

Why it matters:

- Only for backward compatibility.
- Not suitable for real payment systems.

#### `generateHmacSha256(String data, String secret)`

What it does:

- Generates an HMAC SHA256 hash.
- Returns the result as a hexadecimal string.

Why it matters:

- Used for both:
  - frontend payment signature verification
  - webhook signature verification

### 4. `OrderClient`

File: `src/main/java/com/example/payment/client/OrderClient.java`

Purpose:

- Feign client used to call the Order Service.

Methods:

#### `updateStatus(Long id, String status, String token)`

What it does:

- Calls `PUT /admin/orders/{id}/status`.
- Sends `status` as request parameter.
- Sends `Authorization` header.

Use case:

- Frontend verification flow where the user's token is available.

#### `updateStatusInternal(Long id, String status)`

What it does:

- Calls the same Order Service endpoint without `Authorization`.

Use case:

- Webhook flow where no user JWT is available.

Important note:

- This assumes the Order Service accepts internal non-user calls, or is configured to trust service-to-service access.

### 5. `RazorpayConfig`

File: `src/main/java/com/example/payment/config/RazorpayConfig.java`

Purpose:

- Creates the `RazorpayClient` bean used by the service layer.
- Loads Razorpay credentials from application properties.

Main behavior:

- Reads:
  - `razorpay.key`
  - `razorpay.secret`
- Creates and returns `new RazorpayClient(razorpayKey, razorpaySecret)`

Why it matters:

- Centralizes Razorpay client initialization.
- Keeps credentials outside hardcoded business logic.

### 6. `payment`

File: `src/main/java/com/example/payment/model/payment.java`

Purpose:

- JPA entity mapped to the `payments` table.
- Represents one payment attempt or payment transaction record.

Fields:

- `id`: primary key
- `orderId`: internal order ID from the application
- `userId`: user who initiated the payment
- `amount`: payment amount
- `status`: current payment status
- `transactionId`: legacy transaction field
- `razorpayOrderId`: Razorpay order identifier
- `razorpayPaymentId`: Razorpay payment identifier

Why it matters:

- This is the persistent source for payment history and payment state.

### 7. `PaymentStatus`

File: `src/main/java/com/example/payment/model/PaymentStatus.java`

Purpose:

- Enum for payment state values.

Supported values:

- `PENDING`
- `SUCCESS`
- `FAILED`

Why it matters:

- Standardizes valid payment states across controller, service, and database.

### 8. `paymentRepo`

File: `src/main/java/com/example/payment/repo/paymentRepo.java`

Purpose:

- Spring Data JPA repository for the `payment` entity.

Methods:

#### `findByRazorpayOrderId(String razorpayOrderId)`

Use:

- Used during verification and webhook processing.
- Helps the service find the correct local payment record.

#### `findByOrderId(Long orderId)`

Use:

- Allows lookup using the application's internal order ID.
- Useful for internal extension points or future features.

### 9. `CreateOrderRequest`

File: `src/main/java/com/example/payment/dto/CreateOrderRequest.java`

Purpose:

- Request DTO for `POST /payment/create-order`.

Fields:

- `orderId`
- `userId`
- `amount`

Validation:

- `@NotNull` on all fields
- `@Positive` on `amount`

Why it matters:

- Keeps controller input clean and validated before business logic runs.

### 10. `VerifyPaymentRequest`

File: `src/main/java/com/example/payment/dto/VerifyPaymentRequest.java`

Purpose:

- Request DTO for `POST /payment/verify`.

Fields:

- `razorpayOrderId`
- `razorpayPaymentId`
- `razorpaySignature`

Validation:

- `@NotBlank` on all fields

Why it matters:

- Ensures verification requests contain the required Razorpay values.

## API Summary

### `POST /payment/create-order`

Request:

```json
{
  "orderId": 101,
  "userId": 5,
  "amount": 999.0
}
```

Response:

```json
{
  "razorpay_order_id": "order_ABC123",
  "status": "PENDING"
}
```

### `POST /payment/verify`

Request:

```json
{
  "razorpayOrderId": "order_ABC123",
  "razorpayPaymentId": "pay_XYZ456",
  "razorpaySignature": "generated_signature_here"
}
```

Success response:

```json
{
  "status": "SUCCESS",
  "message": "Payment verified successfully"
}
```

Failure response:

```json
{
  "status": "FAILED",
  "message": "Invalid payment signature"
}
```

### `POST /payment/webhook`

Headers:

- `X-Razorpay-Signature: <signature>`

Body:

- Raw JSON sent by Razorpay webhook system

Purpose:

- Backend event processing for payment capture/failure.

### `POST /payment/pay`

Status:

- Deprecated

Purpose:

- Old mock flow only

## Database Behavior

The service stores payments in the `payments` table.

Typical lifecycle:

1. A row is created with `PENDING` during `create-order`.
2. The same row is updated to `SUCCESS` or `FAILED` during verification or webhook processing.
3. `razorpayPaymentId` is saved once Razorpay confirms the payment.

## Configuration

File: `src/main/resources/application.yml`

Current configuration includes:

- Server port: `8085`
- Spring application name: `payment`
- MySQL database connection
- JPA auto update mode
- Razorpay credentials from environment variables

Important properties:

```yaml
server:
  port: 8085

razorpay:
  key: ${RAZORPAY_KEY}
  secret: ${RAZORPAY_SECRET}
```

## Environment Variables

Set these before starting the service:

### PowerShell

```powershell
$env:RAZORPAY_KEY="your_key"
$env:RAZORPAY_SECRET="your_secret"
```

### Command Prompt

```cmd
set RAZORPAY_KEY=your_key
set RAZORPAY_SECRET=your_secret
```

## Dependencies Used

From `pom.xml`, the main dependencies are:

- `spring-boot-starter-web`
- `spring-boot-starter-data-jpa`
- `spring-boot-starter-validation`
- `spring-cloud-starter-openfeign`
- `razorpay-java`
- `mysql-connector-j`

Why these matter:

- Web handles REST APIs.
- JPA handles database persistence.
- Validation checks request DTOs.
- Feign connects to Order Service.
- Razorpay SDK creates payment orders.
- MySQL stores payment data.

## How the Service Works Internally

### Create order stage

- Controller receives order details.
- Service creates Razorpay order.
- Service stores local payment as `PENDING`.
- Controller returns Razorpay order ID to frontend.

### Verify stage

- Frontend sends Razorpay callback details.
- Service rebuilds the expected HMAC signature.
- If signatures match:
  - payment becomes `SUCCESS`
  - order becomes `PAID`
- If signatures do not match:
  - payment becomes `FAILED`
  - order becomes `CANCELLED`

### Webhook stage

- Razorpay sends event directly to backend.
- Service verifies webhook signature.
- Service reads event type.
- Service updates the payment record.
- Service updates the order record.

## Design Strengths

- Uses real payment gateway order creation
- Separates controller and business logic cleanly
- Uses DTO validation
- Uses enum-based payment states
- Supports webhook verification
- Includes duplicate-success protection
- Syncs payment state with order state automatically

## Current Limitations and Notes

- Class names like `paymentService`, `paymentController`, `paymentRepo`, and `payment` do not follow standard Java naming conventions. Standard names would be `PaymentService`, `PaymentController`, `PaymentRepository`, and `Payment`.
- `OrderClient` currently uses a fixed URL: `http://localhost:8082`. This is fine for local development but should usually be externalized.
- The deprecated `/payment/pay` method still contains random mock logic and should not be used in production flows.
- `transactionId` is maintained as a legacy field and currently mirrors `razorpayPaymentId`.
- Webhook handling currently supports only:
  - `payment.captured`
  - `payment.failed`

## Recommended Main Takeaways

- `paymentController` handles incoming HTTP requests.
- `paymentService` contains the real payment workflow and security logic.
- `paymentRepo` stores and retrieves payment records.
- `OrderClient` updates order state after payment changes.
- `RazorpayConfig` creates the Razorpay SDK client.
- `payment` and `PaymentStatus` define the database model and allowed states.
- `CreateOrderRequest` and `VerifyPaymentRequest` validate API input.

## Run the Service

From the `payment` directory:

```powershell
./mvnw spring-boot:run
```

Or on Windows:

```powershell
.\mvnw.cmd spring-boot:run
```

Make sure MySQL is running and the `paymentdb` database is available before startup.
