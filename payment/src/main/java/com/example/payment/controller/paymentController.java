package com.example.payment.controller;

import com.example.payment.dto.CreateOrderRequest;
import com.example.payment.dto.VerifyPaymentRequest;
import com.example.payment.model.PaymentStatus;
import com.example.payment.service.paymentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/payment")
public class paymentController {

    private static final Logger log = LoggerFactory.getLogger(paymentController.class);

    private final paymentService paymentService;

    public paymentController(paymentService paymentService) {
        this.paymentService = paymentService;
    }

    // ────────────────────────────────────────────────────────────────
    // 1. CREATE RAZORPAY ORDER
    // ────────────────────────────────────────────────────────────────

    /**
     * POST /payment/create-order
     * Creates a Razorpay order and returns the razorpay_order_id for frontend checkout.
     */
    @PostMapping("/create-order")
    public ResponseEntity<Map<String, String>> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        log.info("Create order request received: orderId={}, amount={}", request.getOrderId(), request.getAmount());

        String razorpayOrderId = paymentService.createRazorpayOrder(
                request.getOrderId(),
                request.getUserId(),
                request.getAmount()
        );

        return ResponseEntity.ok(Map.of(
                "razorpay_order_id", razorpayOrderId,
                "status", "PENDING"
        ));
    }

    // ────────────────────────────────────────────────────────────────
    // 2. VERIFY PAYMENT (client-side callback)
    // ────────────────────────────────────────────────────────────────

    /**
     * POST /payment/verify
     * Called by the frontend after Razorpay checkout to verify the payment signature.
     * On success, updates the payment status and notifies Order Service.
     */
    @PostMapping("/verify")
    public ResponseEntity<Map<String, String>> verifyPayment(
            @Valid @RequestBody VerifyPaymentRequest request,
            HttpServletRequest httpRequest) {

        log.info("Verify payment request received: razorpayOrderId={}", request.getRazorpayOrderId());

        boolean isValid = paymentService.verifyPaymentSignature(
                request.getRazorpayOrderId(),
                request.getRazorpayPaymentId(),
                request.getRazorpaySignature()
        );

        if (isValid) {
            // Signature valid — update payment to SUCCESS
            String token = httpRequest.getHeader("Authorization");
            paymentService.updatePaymentStatus(
                    request.getRazorpayOrderId(),
                    request.getRazorpayPaymentId(),
                    PaymentStatus.SUCCESS,
                    token
            );
            return ResponseEntity.ok(Map.of("status", "SUCCESS", "message", "Payment verified successfully"));
        } else {
            // Signature invalid — update payment to FAILED
            paymentService.updatePaymentStatus(
                    request.getRazorpayOrderId(),
                    request.getRazorpayPaymentId(),
                    PaymentStatus.FAILED,
                    null
            );
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("status", "FAILED", "message", "Invalid payment signature"));
        }
    }

    // ────────────────────────────────────────────────────────────────
    // 3. WEBHOOK (Razorpay server-to-server — source of truth)
    // ────────────────────────────────────────────────────────────────

    /**
     * POST /payment/webhook
     * Receives Razorpay webhook events.
     * Accepts raw JSON body and reads X-Razorpay-Signature header.
     * Compatible with: npx razorpay-webhook-forwarder --to http://localhost:8085/payment/webhook
     */
    @PostMapping("/webhook")
    public ResponseEntity<String> handleWebhook(
            @RequestBody String payload,
            @RequestHeader("X-Razorpay-Signature") String signature) {

        log.info("Webhook received with signature: {}...", signature.substring(0, Math.min(10, signature.length())));

        try {
            paymentService.handleWebhookEvent(payload, signature);
            return ResponseEntity.ok("Webhook processed successfully");
        } catch (SecurityException e) {
            log.error("Webhook rejected: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid signature");
        } catch (Exception e) {
            log.error("Webhook processing error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Webhook processing failed");
        }
    }

    // ────────────────────────────────────────────────────────────────
    // LEGACY ENDPOINT (backward compatibility)
    // ────────────────────────────────────────────────────────────────

    /**
     * POST /payment/pay
     * @deprecated Use /payment/create-order + /payment/verify flow instead.
     */
    @Deprecated
    @PostMapping("/pay")
    public String pay(@RequestParam Long orderId,
                      @RequestParam Long userId,
                      @RequestParam Double amount,
                      HttpServletRequest request) {

        String token = request.getHeader("Authorization");
        return paymentService.processPayment(orderId, userId, amount, token);
    }
}