package com.example.payment.repo;

import com.example.payment.model.payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface paymentRepo extends JpaRepository<payment, Long> {

    /**
     * Find payment record by Razorpay order ID (used in webhook and verification flows).
     */
    Optional<payment> findByRazorpayOrderId(String razorpayOrderId);

    /**
     * Find payment record by the application's internal order ID.
     */
    Optional<payment> findByOrderId(Long orderId);
}