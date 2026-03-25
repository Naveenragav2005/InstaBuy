package com.example.payment.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/**
 * Request DTO for creating a Razorpay order.
 */
public class CreateOrderRequest {

    @NotNull(message = "orderId is required")
    private Long orderId;

    @NotNull(message = "userId is required")
    private Long userId;

    @NotNull(message = "amount is required")
    @Positive(message = "amount must be positive")
    private Double amount;

    // --- Getters & Setters ---

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }
}
