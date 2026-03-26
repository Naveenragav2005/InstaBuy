package com.example.payment.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

/**
 * Feign client for communicating with the Order Service.
 * Used to update order status after payment confirmation/failure.
 */
@FeignClient(name = "order-service", url = "http://localhost:8082")
public interface OrderClient {

    /**
     * Update order status with user Authorization token.
     * Used during frontend-initiated payment verification flows.
     */
    @PutMapping("/internal/orders/{id}/status")
    String updateStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @RequestHeader("Authorization") String token
    );

    /**
     * Update order status without Authorization token.
     * Used during server-to-server webhook flows where no user JWT is available.
     * This calls the same Order Service endpoint — the Order Service must allow
     * internal (non-authenticated) calls or accept a service token.
     */
    @PutMapping("/internal/orders/{id}/status")
    String updateStatusInternal(
            @PathVariable Long id,
            @RequestParam String status
    );
}