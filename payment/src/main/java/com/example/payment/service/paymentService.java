package com.example.payment.service;

import com.example.payment.client.OrderClient;
import com.example.payment.model.PaymentStatus;
import com.example.payment.model.payment;
import com.example.payment.repo.paymentRepo;
import org.springframework.stereotype.Service;

@Service
public class paymentService {

    private final paymentRepo paymentRepo;
    private final OrderClient orderClient;

    public paymentService(paymentRepo paymentRepo, OrderClient orderClient) {
        this.paymentRepo = paymentRepo;
        this.orderClient = orderClient;
    }


    public String processPayment(Long orderId, Long userId, Double amount, String token) {

        payment payment = new payment();
        payment.setOrderId(orderId);
        payment.setUserId(userId);
        payment.setAmount(amount);
        payment.setStatus(PaymentStatus.PENDING);

        // 🔥 SIMULATION LOGIC
        boolean isSuccess = Math.random() > 0.2; // 80% success

        if (isSuccess) {
            payment.setStatus(PaymentStatus.SUCCESS);
            payment.setTransactionId("TXN" + System.currentTimeMillis());

            // call Order Service
            orderClient.updateStatus(orderId, "PAID",token);

        } else {
            payment.setStatus(PaymentStatus.FAILED);
            payment.setTransactionId("FAIL" + System.currentTimeMillis());

            orderClient.updateStatus(orderId, "PAYMENT_FAILED", token);
        }

        paymentRepo.save(payment);

        return payment.getStatus().name();
    }

}