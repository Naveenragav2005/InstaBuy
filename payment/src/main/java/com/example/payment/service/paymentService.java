package com.example.payment.service;

import com.example.payment.client.OrderClient;
import com.example.payment.model.PaymentStatus;
import com.example.payment.model.payment;
import com.example.payment.repo.paymentRepo;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

@Service
public class paymentService {

    private static final Logger log = LoggerFactory.getLogger(paymentService.class);

    private final paymentRepo paymentRepo;
    private final OrderClient orderClient;
    private final RazorpayClient razorpayClient;

    @Value("${razorpay.secret}")
    private String razorpaySecret;

    public paymentService(paymentRepo paymentRepo, OrderClient orderClient, RazorpayClient razorpayClient) {
        this.paymentRepo = paymentRepo;
        this.orderClient = orderClient;
        this.razorpayClient = razorpayClient;
    }

    // ────────────────────────────────────────────────────────────────
    // A. CREATE RAZORPAY ORDER
    // ────────────────────────────────────────────────────────────────

    /**
     * Creates a Razorpay order and saves a PENDING payment record.
     *
     * @param orderId application-level order ID
     * @param userId  the user placing the order
     * @param amount  amount in INR (rupees)
     * @return razorpay_order_id to be used by the frontend checkout
     */
    public String createRazorpayOrder(Long orderId, Long userId, Double amount) {
        try {
            // Convert amount from rupees to paise (Razorpay expects paise)
            int amountInPaise = (int) (amount * 100);

            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amountInPaise);
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "order_" + orderId);

            // Create order on Razorpay
            Order razorpayOrder = razorpayClient.orders.create(orderRequest);
            String razorpayOrderId = razorpayOrder.get("id");

            log.info("Razorpay order created: {} for orderId: {}, amount: {} paise",
                    razorpayOrderId, orderId, amountInPaise);

            // Persist payment with PENDING status
            payment payment = new payment();
            payment.setOrderId(orderId);
            payment.setUserId(userId);
            payment.setAmount(amount);
            payment.setStatus(PaymentStatus.PENDING);
            payment.setRazorpayOrderId(razorpayOrderId);
            paymentRepo.save(payment);

            return razorpayOrderId;

        } catch (RazorpayException e) {
            log.error("Failed to create Razorpay order for orderId: {}", orderId, e);
            throw new RuntimeException("Razorpay order creation failed: " + e.getMessage(), e);
        }
    }

    // ────────────────────────────────────────────────────────────────
    // B. VERIFY PAYMENT SIGNATURE (client-side verification)
    // ────────────────────────────────────────────────────────────────

    /**
     * Verifies the payment signature using HMAC SHA256.
     * The expected signature is: HMAC_SHA256(razorpay_order_id + "|" + razorpay_payment_id, secret)
     *
     * @return true if the signature is valid
     */
    public boolean verifyPaymentSignature(String razorpayOrderId, String razorpayPaymentId, String razorpaySignature) {
        try {
            String payload = razorpayOrderId + "|" + razorpayPaymentId;
            String generatedSignature = generateHmacSha256(payload, razorpaySecret);

            boolean isValid = generatedSignature.equals(razorpaySignature);
            if (!isValid) {
                log.warn("Payment signature verification FAILED for razorpayOrderId: {}", razorpayOrderId);
            } else {
                log.info("Payment signature verified successfully for razorpayOrderId: {}", razorpayOrderId);
            }
            return isValid;

        } catch (Exception e) {
            log.error("Error during signature verification for razorpayOrderId: {}", razorpayOrderId, e);
            return false;
        }
    }

    // ────────────────────────────────────────────────────────────────
    // C. UPDATE PAYMENT STATUS (idempotent)
    // ────────────────────────────────────────────────────────────────

    /**
     * Updates the payment status in the database and notifies the Order Service.
     * This method is IDEMPOTENT: if payment is already SUCCESS, it will skip the update.
     *
     * @param razorpayOrderId   the Razorpay order ID
     * @param razorpayPaymentId the Razorpay payment ID
     * @param status            SUCCESS or FAILED
     * @param token             optional JWT token (null for webhook calls)
     */
    public void updatePaymentStatus(String razorpayOrderId, String razorpayPaymentId,
                                    PaymentStatus status, String token) {

        Optional<payment> optionalPayment = paymentRepo.findByRazorpayOrderId(razorpayOrderId);

        if (optionalPayment.isEmpty()) {
            log.warn("No payment found for razorpayOrderId: {}. Ignoring update.", razorpayOrderId);
            return;
        }

        payment payment = optionalPayment.get();

        // IDEMPOTENCY: if payment already marked SUCCESS, do nothing
        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            log.info("Payment already SUCCESS for razorpayOrderId: {}. Skipping duplicate update.", razorpayOrderId);
            return;
        }

        // Update payment record
        payment.setStatus(status);
        payment.setRazorpayPaymentId(razorpayPaymentId);
        payment.setTransactionId(razorpayPaymentId); // also populate legacy field
        paymentRepo.save(payment);

        log.info("Payment status updated to {} for razorpayOrderId: {}, orderId: {}",
                status, razorpayOrderId, payment.getOrderId());

        // Notify Order Service via Feign Client
        // SUCCESS → PAID, FAILED → CANCELLED
        String orderStatus = (status == PaymentStatus.SUCCESS) ? "PAID" : "CANCELLED";

        try {
            if (token != null && !token.isBlank()) {
                // Frontend-initiated flow: use token-based Feign call
                orderClient.updateStatus(payment.getOrderId(), orderStatus, token);
            } else {
                // Webhook-initiated flow: no user JWT available
                orderClient.updateStatusInternal(payment.getOrderId(), orderStatus);
            }
            log.info("Order Service notified: orderId={} → status={}", payment.getOrderId(), orderStatus);
        } catch (Exception e) {
            // Log but don't fail — webhook is source of truth
            log.error("Failed to notify Order Service for orderId: {}. Status: {}",
                    payment.getOrderId(), orderStatus, e);
        }
    }

    // ────────────────────────────────────────────────────────────────
    // D. HANDLE WEBHOOK EVENT
    // ────────────────────────────────────────────────────────────────

    /**
     * Handles incoming Razorpay webhook events.
     * Verifies the webhook signature, parses the payload, and dispatches to updatePaymentStatus.
     *
     * Handled events:
     *   - payment.captured → SUCCESS
     *   - payment.failed   → FAILED
     *
     * @param payload   raw JSON body from Razorpay webhook
     * @param signature value of the X-Razorpay-Signature header
     */
    public void handleWebhookEvent(String payload, String signature) {
        log.info("Received webhook event");

        // Step 1: Verify webhook signature
        String generatedSignature = generateHmacSha256(payload, razorpaySecret);
        if (!generatedSignature.equals(signature)) {
            log.warn("Webhook signature verification FAILED. Rejecting event.");
            throw new SecurityException("Invalid webhook signature");
        }
        log.info("Webhook signature verified successfully");

        // Step 2: Parse payload
        JSONObject json = new JSONObject(payload);
        String event = json.getString("event");
        log.info("Webhook event type: {}", event);

        JSONObject paymentEntity = json.getJSONObject("payload")
                .getJSONObject("payment")
                .getJSONObject("entity");

        String razorpayPaymentId = paymentEntity.getString("id");
        String razorpayOrderId = paymentEntity.getString("order_id");

        log.info("Webhook data: razorpayPaymentId={}, razorpayOrderId={}", razorpayPaymentId, razorpayOrderId);

        // Step 3: Map event to status and update
        switch (event) {
            case "payment.captured":
                updatePaymentStatus(razorpayOrderId, razorpayPaymentId, PaymentStatus.SUCCESS, null);
                break;
            case "payment.failed":
                updatePaymentStatus(razorpayOrderId, razorpayPaymentId, PaymentStatus.FAILED, null);
                break;
            default:
                log.info("Unhandled webhook event: {}. Ignoring.", event);
        }
    }

    // ────────────────────────────────────────────────────────────────
    // LEGACY: keep for backward compatibility
    // ────────────────────────────────────────────────────────────────

    /**
     * @deprecated Use {@link #createRazorpayOrder} + verify + webhook flow instead.
     */
    @Deprecated
    public String processPayment(Long orderId, Long userId, Double amount, String token) {
        log.warn("processPayment() is DEPRECATED. Use Razorpay flow instead.");

        payment payment = new payment();
        payment.setOrderId(orderId);
        payment.setUserId(userId);
        payment.setAmount(amount);
        payment.setStatus(PaymentStatus.PENDING);

        boolean isSuccess = Math.random() > 0.2;

        if (isSuccess) {
            payment.setStatus(PaymentStatus.SUCCESS);
            payment.setTransactionId("TXN" + System.currentTimeMillis());
            orderClient.updateStatus(orderId, "PAID", token);
        } else {
            payment.setStatus(PaymentStatus.FAILED);
            payment.setTransactionId("FAIL" + System.currentTimeMillis());
            orderClient.updateStatus(orderId, "CANCELLED", token);
        }

        paymentRepo.save(payment);
        return payment.getStatus().name();
    }

    // ────────────────────────────────────────────────────────────────
    // UTILITY: HMAC SHA256 signature generation
    // ────────────────────────────────────────────────────────────────

    private String generateHmacSha256(String data, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));

            // Convert to hex string
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();

        } catch (Exception e) {
            log.error("HMAC SHA256 generation failed", e);
            throw new RuntimeException("HMAC SHA256 generation failed", e);
        }
    }
}